/**
 * Run database operations
 */

import { getDb } from './index';
import { nanoid } from 'nanoid';
import type { RunLinks } from '@/types';
import { NotFoundError } from '@/lib/utils/errors';

interface RunRow {
  id: string;
  workspace_id: string;
  template_id: string | null;
  company_folder_id: string | null;
  company_name: string | null;
  mode: string | null;
  type: string;
  status: string;
  progress: number;
  started_at: number | null;
  completed_at: number | null;
  error_message: string | null;
  links: string | null;
}

/**
 * Create a run
 */
export function createRun(data: {
  workspaceId: string;
  templateId?: string;
  companyFolderId?: string;
  companyName?: string;
  mode?: 'cleanup' | 'ingest';
  type: 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  startedAt?: number;
  links?: RunLinks;
}): string {
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  db.prepare(
    `
    INSERT INTO runs (
      id, workspace_id, template_id, company_folder_id, company_name,
      mode, type, status, progress, started_at, links
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.workspaceId,
    data.templateId || null,
    data.companyFolderId || null,
    data.companyName || null,
    data.mode || null,
    data.type,
    data.status,
    data.progress || 0,
    data.startedAt || now,
    data.links ? JSON.stringify(data.links) : null
  );

  return id;
}

/**
 * Get run by ID
 */
export function getRun(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as RunRow | undefined;

  if (!row) {
    throw new NotFoundError('Run', id);
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    templateId: row.template_id || undefined,
    companyFolderId: row.company_folder_id || undefined,
    companyName: row.company_name || undefined,
    mode: row.mode as 'cleanup' | 'ingest' | undefined,
    type: row.type as 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE',
    status: row.status as 'pending' | 'running' | 'completed' | 'failed',
    progress: row.progress || 0,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    errorMessage: row.error_message || undefined,
    links: row.links ? JSON.parse(row.links) as RunLinks : undefined,
  };
}

/**
 * Update run
 */
export function updateRun(id: string, updates: {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  completedAt?: number;
  errorMessage?: string;
  links?: RunLinks;
  companyFolderId?: string;
  companyName?: string;
}): void {
  const existing = getRun(id);
  const db = getDb();

  const status = updates.status !== undefined ? updates.status : existing.status;
  const progress = updates.progress !== undefined ? updates.progress : existing.progress;
  const completedAt = updates.completedAt !== undefined ? updates.completedAt : existing.completedAt;
  const errorMessage = updates.errorMessage !== undefined ? updates.errorMessage : existing.errorMessage;
  const links = updates.links !== undefined ? updates.links : existing.links;
  const companyFolderId = updates.companyFolderId !== undefined ? updates.companyFolderId : existing.companyFolderId;
  const companyName = updates.companyName !== undefined ? updates.companyName : existing.companyName;

  db.prepare(
    `
    UPDATE runs
    SET status = ?, progress = ?, completed_at = ?, error_message = ?, links = ?, company_folder_id = ?, company_name = ?
    WHERE id = ?
  `
  ).run(
    status,
    progress,
    completedAt || null,
    errorMessage || null,
    links ? JSON.stringify(links) : null,
    companyFolderId || null,
    companyName || null,
    id
  );
}

