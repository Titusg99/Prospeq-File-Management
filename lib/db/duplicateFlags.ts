/**
 * Duplicate flag database operations
 */

import { getDb } from './index';
import { nanoid } from 'nanoid';
import type { DuplicateFlag } from '@/types';

/**
 * Create a duplicate flag group
 */
export function createDuplicateFlag(data: Omit<DuplicateFlag, 'id'>): DuplicateFlag {
  const db = getDb();
  const id = nanoid();

  db.prepare(
    `
    INSERT INTO duplicate_flags (
      id, run_id, workspace_id, group_id, file_ids, basis, severity, detected_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.runId || null,
    data.workspaceId,
    data.groupId,
    JSON.stringify(data.fileIds),
    data.basis,
    data.severity,
    data.detectedAt
  );

  return {
    ...data,
    id,
  };
}

/**
 * Get duplicate flags for a workspace
 */
export function getDuplicateFlags(workspaceId: string, runId?: string): DuplicateFlag[] {
  const db = getDb();
  let query = 'SELECT * FROM duplicate_flags WHERE workspace_id = ?';
  const params: any[] = [workspaceId];

  if (runId) {
    query += ' AND run_id = ?';
    params.push(runId);
  }

  query += ' ORDER BY detected_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((row) => ({
    id: row.id,
    runId: row.run_id || undefined,
    workspaceId: row.workspace_id,
    groupId: row.group_id,
    fileIds: JSON.parse(row.file_ids),
    basis: row.basis as 'md5' | 'name+size' | 'name+mimetype',
    severity: row.severity as 'exact' | 'probable',
    detectedAt: row.detected_at,
  }));
}

/**
 * Detect duplicates from file list
 */
export function detectDuplicates(
  files: Array<{ id: string; name: string; mimeType: string; size?: string; md5Checksum?: string }>,
  runId: string,
  workspaceId: string
): DuplicateFlag[] {
  const flags: DuplicateFlag[] = [];
  const processedGroups = new Set<string>();

  // Group 1: Exact duplicates by MD5
  const md5Groups = new Map<string, string[]>();
  for (const file of files) {
    if (file.md5Checksum) {
      if (!md5Groups.has(file.md5Checksum)) {
        md5Groups.set(file.md5Checksum, []);
      }
      md5Groups.get(file.md5Checksum)!.push(file.id);
    }
  }

  for (const [md5, fileIds] of md5Groups.entries()) {
    if (fileIds.length > 1 && !processedGroups.has(md5)) {
      processedGroups.add(md5);
      const groupId = nanoid();
      flags.push(createDuplicateFlag({
        runId,
        workspaceId,
        groupId,
        fileIds,
        basis: 'md5',
        severity: 'exact',
        detectedAt: Date.now(),
      }));
    }
  }

  // Group 2: Probable duplicates by name + size
  const nameSizeGroups = new Map<string, string[]>();
  for (const file of files) {
    const key = `${file.name.toLowerCase()}|${file.size || ''}`;
    if (!nameSizeGroups.has(key)) {
      nameSizeGroups.set(key, []);
    }
    nameSizeGroups.get(key)!.push(file.id);
  }

  for (const [key, fileIds] of nameSizeGroups.entries()) {
    if (fileIds.length > 1 && !processedGroups.has(key)) {
      processedGroups.add(key);
      const groupId = nanoid();
      flags.push(createDuplicateFlag({
        runId,
        workspaceId,
        groupId,
        fileIds,
        basis: 'name+size',
        severity: 'probable',
        detectedAt: Date.now(),
      }));
    }
  }

  // Group 3: Probable duplicates by name + mimeType
  const nameMimeGroups = new Map<string, string[]>();
  for (const file of files) {
    const key = `${file.name.toLowerCase()}|${file.mimeType}`;
    if (!nameMimeGroups.has(key)) {
      nameMimeGroups.set(key, []);
    }
    nameMimeGroups.get(key)!.push(file.id);
  }

  for (const [key, fileIds] of nameMimeGroups.entries()) {
    if (fileIds.length > 1 && !processedGroups.has(key)) {
      processedGroups.add(key);
      const groupId = nanoid();
      flags.push(createDuplicateFlag({
        runId,
        workspaceId,
        groupId,
        fileIds,
        basis: 'name+mimetype',
        severity: 'probable',
        detectedAt: Date.now(),
      }));
    }
  }

  return flags;
}

