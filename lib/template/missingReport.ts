/**
 * Missing items report engine
 */

import type { ExpectedItem } from '@/types';
import { listFolder, listFolderRecursive } from '@/lib/drive/listing';
import type { DriveFile } from '@/types';

export interface MissingItem {
  expectedItemId: string;
  name: string;
  folderPath: string;
  folderKey: string;
  priority: 'Essential' | 'Important' | 'Nice-to-have';
  missing: boolean;
  evidence?: {
    foundFiles: string[];
    matchedKeywords: string[];
    matchedMimeTypes: string[];
  };
  reason?: string;
}

export interface MissingReportOptions {
  workspaceId: string;
  expectedItems: ExpectedItem[];
  companyFolderId: string; // Root folder to search in
  driveId?: string;
}

/**
 * Generate missing items report
 */
export async function generateMissingReport(
  options: MissingReportOptions
): Promise<MissingItem[]> {
  const results: MissingItem[] = [];

  for (const expectedItem of options.expectedItems) {
    // Resolve folderKey to actual folder path in company folder
    // For now, we'll search in the company root folderId
    // TODO: In a real implementation, we'd navigate to the specific folder by path/key
    
    // Determine search scope
    const searchInSubtree = expectedItem.searchScope === 'subtree';

    // Get files to search
    let filesToSearch: DriveFile[];
    
    // TODO: Resolve folderKey to actual Drive folder ID
    // For now, search in the company root folder
    // In full implementation, we'd navigate to the specific template folder by path/key
    
    if (searchInSubtree) {
      const result = await listFolderRecursive({
        workspaceId: options.workspaceId,
        folderId: options.companyFolderId,
        driveId: options.driveId,
      });
      filesToSearch = result.files;
    } else {
      // For folderOnly, we'd need to find the specific folder by path/key
      // For now, search in root
      const result = await listFolder({
        workspaceId: options.workspaceId,
        folderId: options.companyFolderId,
        driveId: options.driveId,
      });
      filesToSearch = result.files;
    }

    // Use evidence object if available, otherwise fall back to legacy fields
    const evidenceData = expectedItem.evidence || {
      keywords: expectedItem.keywords,
      requiredMimeTypes: expectedItem.mimeTypes,
      matchScope: expectedItem.searchScope,
      recencyDays: expectedItem.recencyDays,
    };

    // Check for evidence
    const evidence = checkEvidence(filesToSearch, evidenceData);

    // Check recency if specified
    let isRecent = true;
    if (evidenceData.recencyDays && evidence.foundFiles.length > 0) {
      const cutoffDate = Date.now() - evidenceData.recencyDays * 24 * 60 * 60 * 1000;
      isRecent = evidence.foundFiles.some((fileName) => {
        const file = filesToSearch.find((f) => f.name === fileName);
        if (!file || !file.modifiedTime) return false;
        const modified = new Date(file.modifiedTime).getTime();
        return modified >= cutoffDate;
      });
    }

    const isMissing = !evidence.foundFiles.length || !isRecent;

    results.push({
      expectedItemId: expectedItem.id,
      name: expectedItem.name || expectedItem.folderPath,
      folderPath: expectedItem.folderPath,
      folderKey: expectedItem.folderKey || expectedItem.folderPath,
      priority: expectedItem.priority,
      missing: isMissing,
      evidence: isMissing ? undefined : evidence,
      reason: isMissing ? 'Evidence not found' : undefined,
    });
  }

  return results;
}

/**
 * Check if files match expected item evidence
 */
function checkEvidence(
  files: DriveFile[],
  evidenceData: { keywords?: string[]; requiredMimeTypes?: string[] }
): {
  foundFiles: string[];
  matchedKeywords: string[];
  matchedMimeTypes: string[];
} {
  const foundFiles: string[] = [];
  const matchedKeywords: string[] = [];
  const matchedMimeTypes: string[] = [];

  for (const file of files) {
    let matches = false;

    // Check keywords
    if (evidenceData.keywords && evidenceData.keywords.length > 0) {
      const fileNameLower = file.name.toLowerCase();
      const matched = evidenceData.keywords.some((keyword) =>
        fileNameLower.includes(keyword.toLowerCase())
      );
      if (matched) {
        matches = true;
        matchedKeywords.push(...evidenceData.keywords.filter((k) =>
          fileNameLower.includes(k.toLowerCase())
        ));
      }
    }

    // Check mime types
    if (evidenceData.requiredMimeTypes && evidenceData.requiredMimeTypes.length > 0) {
      const matched = evidenceData.requiredMimeTypes.some(
        (mimeType) => file.mimeType === mimeType || file.mimeType.startsWith(`${mimeType}/`)
      );
      if (matched) {
        matches = true;
        matchedMimeTypes.push(file.mimeType);
      }
    }

    // If no specific criteria, any file counts as evidence
    if (
      (!evidenceData.keywords || evidenceData.keywords.length === 0) &&
      (!evidenceData.requiredMimeTypes || evidenceData.requiredMimeTypes.length === 0)
    ) {
      matches = true;
    }

    if (matches) {
      foundFiles.push(file.name);
    }
  }

  return {
    foundFiles: [...new Set(foundFiles)],
    matchedKeywords: [...new Set(matchedKeywords)],
    matchedMimeTypes: [...new Set(matchedMimeTypes)],
  };
}

