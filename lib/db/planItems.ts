/**
 * PlanItem database operations
 */

import { getDb } from './index';
import { nanoid } from 'nanoid';
import type { PlanItem } from '@/types';

/**
 * Create a plan item
 */
export function createPlanItem(data: Omit<PlanItem, 'id' | 'createdAt'>): PlanItem {
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO plan_items (
      id, run_id, file_id, file_name, mime_type, source_path, target_path,
      proposed_folder_key, final_folder_key, confidence, router_type,
      decision, needs_approval, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.runId,
    data.fileId,
    data.fileName,
    data.mimeType || null,
    data.sourcePath,
    data.targetPath,
    data.proposedFolderKey || null,
    data.finalFolderKey || null,
    data.confidence,
    data.routerType,
    data.decision || 'approved',
    data.needsApproval ? 1 : 0,
    now
  );

  return {
    ...data,
    id,
    createdAt: now,
  };
}

/**
 * Get plan items for a run
 */
export function getPlanItems(runId: string): PlanItem[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM plan_items WHERE run_id = ? ORDER BY created_at')
    .all(runId) as any[];

  return rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    fileId: row.file_id,
    fileName: row.file_name,
    mimeType: row.mime_type || undefined,
    sourcePath: row.source_path,
    targetPath: row.target_path,
    proposedFolderKey: row.proposed_folder_key || undefined,
    finalFolderKey: row.final_folder_key || undefined,
    confidence: row.confidence,
    routerType: row.router_type as 'keyword' | 'llm' | 'other',
    decision: row.decision as 'approved' | 'overridden' | 'excluded',
    needsApproval: Boolean(row.needs_approval),
    createdAt: row.created_at,
  }));
}

/**
 * Update plan item decision
 */
export function updatePlanItemDecision(
  id: string,
  decision: 'approved' | 'overridden' | 'excluded',
  finalFolderKey?: string
): void {
  const db = getDb();
  db.prepare(
    `
    UPDATE plan_items
    SET decision = ?, final_folder_key = ?
    WHERE id = ?
  `
  ).run(decision, finalFolderKey || null, id);
}

/**
 * Bulk update plan items
 */
export function bulkUpdatePlanItems(
  updates: Array<{ id: string; decision: 'approved' | 'overridden' | 'excluded'; finalFolderKey?: string }>
): void {
  const db = getDb();
  const stmt = db.prepare(
    `
    UPDATE plan_items
    SET decision = ?, final_folder_key = ?
    WHERE id = ?
  `
  );

  const transaction = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.decision, item.finalFolderKey || null, item.id);
    }
  });

  transaction(updates);
}

