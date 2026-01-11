/**
 * Template CRUD operations
 */

import { getDb } from '@/lib/db';
import { nanoid } from 'nanoid';
import { NotFoundError } from '@/lib/utils/errors';
import { resolvePath } from './tree';
import type { TemplateData, FolderTreeNode, RoutingRule } from './types';
import type { Template } from '@/types';

/**
 * Create a new template
 */
export function createTemplate(
  workspaceId: string,
  name: string,
  data: TemplateData
): Template {
  const db = getDb();
  const id = nanoid();
  const now = Date.now();

  // Ensure all paths are resolved
  resolvePath(data.folderTree);

  const template: Template = {
    id,
    workspaceId,
    name,
    version: 1,
    folderTree: data.folderTree,
    routingRules: data.routingRules,
    status: 'draft',
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `
    INSERT INTO templates (id, workspace_id, name, version, folder_tree, routing_rules, is_published, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    workspaceId,
    name,
    template.version,
    JSON.stringify(data.folderTree),
    JSON.stringify(data.routingRules),
    0,
    'draft',
    now,
    now
  );

  return template;
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM templates WHERE id = ?')
    .get(id) as any;

  if (!row) {
    throw new NotFoundError('Template', id);
  }

  const folderTree = JSON.parse(row.folder_tree);
  const routingRules = JSON.parse(row.routing_rules);

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    version: row.version,
    folderTree,
    routingRules,
    status: (row.status || (row.is_published ? 'published' : 'draft')) as 'draft' | 'published',
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update template
 */
export function updateTemplate(id: string, updates: Partial<TemplateData>): Template {
  const existing = getTemplate(id);
  const db = getDb();
  const now = Date.now();

  const folderTree = updates.folderTree || existing.folderTree;
  const routingRules = updates.routingRules || existing.routingRules;

  // Ensure paths are resolved
  resolvePath(folderTree);

  const template: Template = {
    ...existing,
    folderTree,
    routingRules,
    updatedAt: now,
  };

  db.prepare(
    `
    UPDATE templates
    SET folder_tree = ?, routing_rules = ?, updated_at = ?
    WHERE id = ?
  `
  ).run(JSON.stringify(folderTree), JSON.stringify(routingRules), now, id);

  return template;
}

/**
 * Delete template
 */
export function deleteTemplate(id: string): void {
  const db = getDb();
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new NotFoundError('Template', id);
  }
}

/**
 * Duplicate template
 */
export function duplicateTemplate(id: string, newName: string): Template {
  const existing = getTemplate(id);
  const db = getDb();
  const newId = nanoid();
  const now = Date.now();

  const template: Template = {
    id: newId,
    workspaceId: existing.workspaceId,
    name: newName,
    version: 1,
    folderTree: JSON.parse(JSON.stringify(existing.folderTree)), // Deep clone
    routingRules: JSON.parse(JSON.stringify(existing.routingRules)), // Deep clone
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `
    INSERT INTO templates (id, workspace_id, name, version, folder_tree, routing_rules, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    newId,
    template.workspaceId,
    newName,
    template.version,
    JSON.stringify(template.folderTree),
    JSON.stringify(template.routingRules),
    0,
    now,
    now
  );

  return template;
}

/**
 * List templates for workspace
 */
export function listTemplates(workspaceId: string): Template[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM templates WHERE workspace_id = ? ORDER BY created_at DESC')
    .all(workspaceId) as any[];

  return rows.map((row) => {
    const folderTree = JSON.parse(row.folder_tree);
    const routingRules = JSON.parse(row.routing_rules);
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      version: row.version,
      folderTree,
      routingRules,
      status: (row.status || (row.is_published ? 'published' : 'draft')) as 'draft' | 'published',
      isPublished: Boolean(row.is_published),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

