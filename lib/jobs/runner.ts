/**
 * Job runner (single-process, event-based)
 */

import { getDb } from '@/lib/db';
import { nanoid } from 'nanoid';
import { logInfo, logError } from '@/lib/utils/logging';
import { createPlanItem } from '@/lib/db/planItems';
import { JobEventEmitter } from './events';
import type { Job, JobType, JobStatus, JobProgress, ScanJobData, PlanJobData, CopyJobData, PromoteJobData } from './types';

export class JobRunner {
  private emitter = new JobEventEmitter();
  private runningJobs = new Map<string, Promise<void>>();

  /**
   * Get event emitter for job events
   */
  getEmitter(): JobEventEmitter {
    return this.emitter;
  }

  /**
   * Create and start a job
   */
  async startJob<T extends JobType>(
    type: T,
    workspaceId: string,
    templateId: string | undefined,
    data: T extends 'SCAN' ? ScanJobData : T extends 'PLAN' ? PlanJobData : T extends 'COPY' ? CopyJobData : PromoteJobData
  ): Promise<string> {
    const jobId = nanoid();
    const db = getDb();

    // Extract mode and company info from data if available
    const mode = (data as any).mode || (type === 'SCAN' || type === 'PLAN' ? 'cleanup' : undefined);
    const companyFolderId = (data as any).folderId || (data as any).companyFolderId;
    const companyName = (data as any).companyName;

    // Get existing run if this is a continuation (e.g., PLAN after SCAN)
    let existingRun: any = null;
    if (type === 'PLAN' || type === 'COPY') {
      // Try to find related SCAN run by workspace and recent timestamp
      const recentScan = db.prepare(
        'SELECT * FROM runs WHERE workspace_id = ? AND type = ? ORDER BY started_at DESC LIMIT 1'
      ).get(workspaceId, 'SCAN') as any;
      if (recentScan) {
        existingRun = recentScan;
      }
    }

    const finalCompanyFolderId = companyFolderId || existingRun?.company_folder_id;
    const finalCompanyName = companyName || existingRun?.company_name;

    // Create job record
    db.prepare(
      `
      INSERT INTO runs (id, workspace_id, template_id, company_folder_id, company_name, mode, type, status, progress, started_at, links)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      jobId,
      workspaceId,
      templateId || null,
      finalCompanyFolderId || null,
      finalCompanyName || null,
      mode || null,
      type,
      'pending',
      0,
      Date.now(),
      existingRun?.links || null
    );

    // Start job execution
    const jobPromise = this.executeJob(jobId, type, workspaceId, templateId, data);
    this.runningJobs.set(jobId, jobPromise);

    // Clean up when done
    jobPromise.finally(() => {
      this.runningJobs.delete(jobId);
    });

    return jobId;
  }

  /**
   * Execute a job
   */
  private async executeJob<T extends JobType>(
    jobId: string,
    type: T,
    workspaceId: string,
    templateId: string | undefined,
    data: any
  ): Promise<void> {
    const db = getDb();

    try {
      // Update status to running
      db.prepare('UPDATE runs SET status = ?, started_at = ? WHERE id = ?').run(
        'running',
        Date.now(),
        jobId
      );

      this.emitProgress(jobId, 0, 'running', 'Starting job...');

      // Execute job based on type
      switch (type) {
        case 'SCAN':
          await this.executeScanJob(jobId, workspaceId, data as ScanJobData);
          break;
        case 'PLAN':
          await this.executePlanJob(jobId, workspaceId, templateId!, data as PlanJobData);
          break;
        case 'COPY':
          await this.executeCopyJob(jobId, workspaceId, templateId!, data as CopyJobData);
          break;
        case 'PROMOTE':
          await this.executePromoteJob(jobId, workspaceId, data as PromoteJobData);
          break;
        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      // Mark as completed
      db.prepare(
        'UPDATE runs SET status = ?, progress = ?, completed_at = ? WHERE id = ?'
      ).run('completed', 100, Date.now(), jobId);

      this.emitProgress(jobId, 100, 'completed', 'Job completed');
      this.emitter.emitCompleted(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('Job failed', { jobId, type, error: errorMessage });

      db.prepare(
        'UPDATE runs SET status = ?, error_message = ?, completed_at = ? WHERE id = ?'
      ).run('failed', errorMessage, Date.now(), jobId);

      this.emitProgress(jobId, 0, 'failed', errorMessage);
      this.emitter.emitFailed(jobId, error instanceof Error ? error : new Error(errorMessage));
    }
  }

  /**
   * Execute SCAN job
   */
  private async executeScanJob(jobId: string, workspaceId: string, data: ScanJobData): Promise<void> {
    logInfo('Executing SCAN job', { jobId, workspaceId, data });
    
    try {
      const { listFolderRecursive } = await import('@/lib/drive/listing');
      const { getDb } = await import('@/lib/db');
      const { updateRun } = await import('@/lib/db/runs');
      const db = getDb();

      // Get workspace to find driveId
      const workspace = db.prepare('SELECT drive_id FROM workspaces WHERE id = ?').get(workspaceId) as any;
      const driveId = workspace?.drive_id || undefined;

      this.emitProgress(jobId, 10, 'running', 'Starting scan...');

      // Recursively list all files and folders
      const result = await listFolderRecursive({
        workspaceId,
        folderId: data.folderId,
        driveId,
      });

      this.emitProgress(jobId, 50, 'running', `Found ${result.files.length} files, ${result.folders.length} folders`);

      // Extract company name from folder if possible
      // Store scan results (could be stored in a separate scan_results table or in run metadata)
      // For now, we'll just log the counts

      // Update run with company info if available
      const companyName = data.companyName || 'Unknown';
      updateRun(jobId, {
        companyFolderId: data.folderId,
        companyName,
        links: {
          originalFolderId: data.folderId,
        },
      });

      // Detect duplicates
      const { detectDuplicates } = await import('@/lib/db/duplicateFlags');
      const duplicateFlags = detectDuplicates(
        result.files.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: f.size,
          md5Checksum: f.md5Checksum,
        })),
        jobId,
        workspaceId
      );

      this.emitProgress(jobId, 90, 'running', `Scan complete. Found ${duplicateFlags.length} duplicate groups`);

      logInfo('Scan completed', {
        jobId,
        fileCount: result.files.length,
        folderCount: result.folders.length,
        duplicateGroups: duplicateFlags.length,
      });

      this.emitProgress(jobId, 100, 'running', 'Scan complete');
    } catch (error) {
      logError('Scan job failed', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute PLAN job
   */
  private async executePlanJob(jobId: string, workspaceId: string, templateId: string, data: PlanJobData): Promise<void> {
    logInfo('Executing PLAN job', { jobId, workspaceId, templateId, data });
    
    try {
      const { getTemplate } = await import('@/lib/template/crud');
      const { generatePlan } = await import('@/lib/planner/plan');
      const { listFolderRecursive } = await import('@/lib/drive/listing');
      const { getRun, updateRun } = await import('@/lib/db/runs');
      const run = getRun(jobId);

      if (!run.companyFolderId) {
        throw new Error('Run must have companyFolderId for PLAN job');
      }

      this.emitProgress(jobId, 10, 'running', 'Loading template...');
      const template = getTemplate(templateId);

      this.emitProgress(jobId, 20, 'running', 'Scanning files...');
      const db = getDb();
      const workspace = db.prepare('SELECT drive_id FROM workspaces WHERE id = ?').get(workspaceId) as any;
      const driveId = workspace?.drive_id || undefined;

      // Get files from the scan (in a real implementation, we'd load from the scan results)
      // For now, we'll re-scan or use the fileIds from data
      const scanResult = await listFolderRecursive({
        workspaceId,
        folderId: run.companyFolderId,
        driveId,
      });

      const filesToPlan = data.fileIds
        ? scanResult.files.filter((f) => data.fileIds.includes(f.id))
        : scanResult.files;

      this.emitProgress(jobId, 40, 'running', `Generating routing plan for ${filesToPlan.length} files...`);

      // Generate plan
      const decisions = await generatePlan({
        files: filesToPlan,
        template,
        approvalThreshold: 0.7,
      });

      this.emitProgress(jobId, 80, 'running', 'Storing plan items...');

      // Store plan items
      for (const decision of decisions) {
        createPlanItem({
          runId: jobId,
          fileId: decision.fileId,
          fileName: decision.fileName,
          mimeType: filesToPlan.find((f) => f.id === decision.fileId)?.mimeType,
          sourcePath: decision.sourcePath,
          targetPath: decision.targetPath,
          proposedFolderKey: decision.proposedFolderKey,
          confidence: decision.confidence,
          routerType: decision.routerType,
          decision: 'approved', // Default to approved, user can change in review
          needsApproval: decision.needsApproval || false,
          reason: decision.reason,
        });
      }

      const needsApprovalCount = decisions.filter((d) => d.needsApproval).length;

      logInfo('Plan generated', {
        jobId,
        totalFiles: decisions.length,
        needsApproval: needsApprovalCount,
      });

      this.emitProgress(jobId, 100, 'running', `Plan complete. ${needsApprovalCount} items need review`);
    } catch (error) {
      logError('Plan job failed', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute COPY job - Build CLEAN structure
   */
  private async executeCopyJob(jobId: string, workspaceId: string, templateId: string, data: CopyJobData): Promise<void> {
    logInfo('Executing COPY job', { jobId, workspaceId, templateId, data });
    
    try {
      const { getTemplate } = await import('@/lib/template/crud');
      const { getPlanItems } = await import('@/lib/db/planItems');
      const { getRun, updateRun } = await import('@/lib/db/runs');
      const { createFolder, copyFile } = await import('@/lib/drive/copy');
      const { findNodeByKey, getAllPaths } = await import('@/lib/template/tree');
      const { logEvent } = await import('@/lib/utils/logging');

      const run = getRun(jobId);
      if (!run.companyFolderId) {
        throw new Error('Run must have companyFolderId');
      }

      this.emitProgress(jobId, 5, 'running', 'Loading template and plan...');
      const template = getTemplate(templateId);
      const planItems = getPlanItems(data.planId).filter((item) => item.decision === 'approved' || item.decision === 'overridden');

      this.emitProgress(jobId, 10, 'running', 'Creating CLEAN folder structure...');

      const db = getDb();
      const workspace = db.prepare('SELECT drive_id FROM workspaces WHERE id = ?').get(workspaceId) as any;
      const driveId = workspace?.drive_id || data.driveId;
      const companyName = run.companyName || 'Company';

      // Create CLEAN folder: CompanyName__CLEAN__YYYY-MM-DD
      const dateStr = new Date().toISOString().split('T')[0];
      const cleanFolderName = `${companyName}__CLEAN__${dateStr}`;
      
      const cleanRootFolder = await createFolder(
        workspaceId,
        data.targetFolderId,
        cleanFolderName,
        driveId
      );

      this.emitProgress(jobId, 20, 'running', 'Building folder tree...');

      // Create folder tree structure
      const folderMap = new Map<string, string>(); // folderKey -> folderId
      
      async function createFolderTree(node: typeof template.folderTree, parentId: string) {
        const folder = await createFolder(workspaceId, parentId, node.name, driveId);
        folderMap.set(node.key, folder.id);
        
        if (node.children) {
          for (const child of node.children) {
            await createFolderTree(child, folder.id);
          }
        }
      }

      // Create all folders in template
      if (template.folderTree.children) {
        for (const child of template.folderTree.children) {
          await createFolderTree(child, cleanRootFolder.id);
        }
      }

      this.emitProgress(jobId, 40, 'running', `Copying ${planItems.length} files...`);

      // Copy files according to plan
      let copiedCount = 0;
      for (const planItem of planItems) {
        const targetFolderKey = planItem.finalFolderKey || planItem.proposedFolderKey;
        if (!targetFolderKey) {
          logEvent({
            level: 'warn',
            action: 'COPY',
            message: `No target folder for file: ${planItem.fileName}`,
            fileId: planItem.fileId,
            runId: jobId,
            workspaceId,
          });
          continue;
        }

        const targetFolderId = folderMap.get(targetFolderKey);
        if (!targetFolderId) {
          logEvent({
            level: 'error',
            action: 'COPY',
            message: `Target folder not found: ${targetFolderKey}`,
            fileId: planItem.fileId,
            runId: jobId,
            workspaceId,
          });
          continue;
        }

        try {
          await copyFile({
            workspaceId,
            fileId: planItem.fileId,
            targetParentId: targetFolderId,
          });

          logEvent({
            level: 'info',
            action: 'COPY',
            message: `Copied file: ${planItem.fileName}`,
            fileId: planItem.fileId,
            fromPath: planItem.sourcePath,
            toPath: planItem.targetPath,
            runId: jobId,
            workspaceId,
          });

          copiedCount++;
          
          if (copiedCount % 10 === 0) {
            const progress = 40 + Math.floor((copiedCount / planItems.length) * 50);
            this.emitProgress(jobId, progress, 'running', `Copied ${copiedCount}/${planItems.length} files...`);
          }
        } catch (error) {
          logEvent({
            level: 'error',
            action: 'COPY',
            message: `Failed to copy file: ${planItem.fileName}`,
            fileId: planItem.fileId,
            runId: jobId,
            workspaceId,
            metadata: { error: error instanceof Error ? error.message : String(error) },
          });
          // Continue with other files
        }
      }

      // Update run links
      updateRun(jobId, {
        links: {
          ...run.links,
          cleanFolderId: cleanRootFolder.id,
        },
      });

      logInfo('CLEAN build completed', {
        jobId,
        copiedFiles: copiedCount,
        totalFiles: planItems.length,
        cleanFolderId: cleanRootFolder.id,
      });

      this.emitProgress(jobId, 100, 'running', `CLEAN build complete. Copied ${copiedCount} files.`);
    } catch (error) {
      logError('COPY job failed', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute PROMOTE job - Archive original + swap CLEAN
   */
  private async executePromoteJob(jobId: string, workspaceId: string, data: PromoteJobData): Promise<void> {
    logInfo('Executing PROMOTE job', { jobId, workspaceId, data });
    
    try {
      const { promote } = await import('@/lib/drive/promote');
      const { getRun, updateRun } = await import('@/lib/db/runs');
      const { logEvent } = await import('@/lib/utils/logging');

      if (data.originalFileIds.length !== data.cleanFileIds.length) {
        throw new Error('originalFileIds and cleanFileIds must have the same length');
      }

      const run = getRun(jobId);
      if (!run.links?.originalFolderId || !run.links?.cleanFolderId) {
        throw new Error('Run must have originalFolderId and cleanFolderId in links');
      }

      this.emitProgress(jobId, 10, 'running', 'Starting promotion...');

      // For folder promotion, we promote the root folders
      // Note: promote() function handles single file/folder pairs
      // For multiple files, we'd need to handle each pair or modify promote to handle folders
      
      // Since we're promoting folders (original root -> clean root), we use the folder IDs
      await promote({
        workspaceId,
        originalFileId: run.links.originalFolderId,
        cleanFileId: run.links.cleanFolderId,
        driveId: data.driveId,
      });

      logEvent({
        level: 'info',
        action: 'PROMOTE',
        message: 'Promoted company folder',
        fromPath: `Original: ${run.links.originalFolderId}`,
        toPath: `CLEAN: ${run.links.cleanFolderId}`,
        runId: jobId,
        workspaceId,
      });

      // Update run links with final IDs
      updateRun(jobId, {
        links: {
          ...run.links,
          promotedFolderId: run.links.cleanFolderId,
          archivedFolderId: run.links.originalFolderId,
        },
      });

      logInfo('Promotion completed', {
        jobId,
        originalFolderId: run.links.originalFolderId,
        cleanFolderId: run.links.cleanFolderId,
      });

      this.emitProgress(jobId, 100, 'running', 'Promotion complete');
    } catch (error) {
      logError('PROMOTE job failed', {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Emit progress update
   */
  private emitProgress(
    jobId: string,
    progress: number,
    status: JobStatus,
    message?: string,
    metadata?: Record<string, unknown>
  ): void {
    const progressData: JobProgress = {
      jobId,
      progress,
      status,
      message,
      metadata,
    };

    this.emitter.emitProgress(progressData);

    // Update database
    const db = getDb();
    db.prepare('UPDATE runs SET progress = ?, status = ? WHERE id = ?').run(
      progress,
      status,
      jobId
    );
  }

  /**
   * Get job status
   */
  getJob(jobId: string): import('@/types').Run | null {
    const { getRun } = require('@/lib/db/runs');
    try {
      return getRun(jobId);
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const jobRunner = new JobRunner();

