/**
 * Promote operation: Archive original + swap CLEAN into place
 */

import { createDriveClient } from './client';
import { DriveAPIError } from '@/lib/utils/errors';
import { logInfo, logError } from '@/lib/utils/logging';
import { createFolder } from './copy';

export interface PromoteOptions {
  workspaceId: string;
  originalFileId: string;
  cleanFileId: string;
  archiveParentId?: string;
  driveId?: string;
}

/**
 * Promote: Move original to __OLD__/Archive, move CLEAN into place
 */
export async function promote(options: PromoteOptions): Promise<void> {
  const client = createDriveClient({ workspaceId: options.workspaceId });
  const drive = client.getDrive();

  try {
    // Get original file info
    const originalFile = await client.request(() =>
      drive.files.get({
        fileId: options.originalFileId,
        fields: 'id, name, parents',
        supportsAllDrives: true,
      })
    );

    if (!originalFile.data.parents || originalFile.data.parents.length === 0) {
      throw new DriveAPIError('Original file has no parent folder');
    }

    const originalParentId = originalFile.data.parents[0];

    // Get or create __OLD__ folder in original parent
    const oldFolderId = await getOrCreateOldFolder(
      options.workspaceId,
      originalParentId,
      options.driveId
    );

    // Get or create Archive subfolder
    const archiveFolderId = await getOrCreateArchiveFolder(
      options.workspaceId,
      oldFolderId,
      options.driveId
    );

    // Get original folder name for archive naming
    const originalName = originalFile.data.name || 'Original';
    const dateStr = new Date().toISOString().split('T')[0];
    const archivedName = `${originalName}__OLD__${dateStr}`;

    // Rename and move original to archive
    await client.request(() =>
      drive.files.update({
        fileId: options.originalFileId,
        requestBody: {
          name: archivedName,
        },
        addParents: archiveFolderId,
        removeParents: originalParentId,
        supportsAllDrives: true,
      })
    );

    // Get clean file info
    const cleanFile = await client.request(() =>
      drive.files.get({
        fileId: options.cleanFileId,
        fields: 'id, name, parents',
        supportsAllDrives: true,
      })
    );

    if (!cleanFile.data.parents || cleanFile.data.parents.length === 0) {
      throw new DriveAPIError('Clean file has no parent folder');
    }

    const cleanParentId = cleanFile.data.parents[0];
    const originalNameWithoutClean = originalName.replace(/__CLEAN__.*$/, '');

    // Rename CLEAN to original name and move to original location
    await client.request(() =>
      drive.files.update({
        fileId: options.cleanFileId,
        requestBody: {
          name: originalNameWithoutClean,
        },
        addParents: originalParentId,
        removeParents: cleanParentId,
        supportsAllDrives: true,
      })
    );

    logInfo('Promote completed', {
      workspaceId: options.workspaceId,
      originalFileId: options.originalFileId,
      cleanFileId: options.cleanFileId,
      archiveFolderId,
      originalParentId,
    });
  } catch (error) {
    logError('Failed to promote', {
      workspaceId: options.workspaceId,
      originalFileId: options.originalFileId,
      cleanFileId: options.cleanFileId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DriveAPIError(
      `Failed to promote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Get or create __OLD__ folder
 */
async function getOrCreateOldFolder(
  workspaceId: string,
  parentId: string,
  driveId?: string
): Promise<string> {
  const client = createDriveClient({ workspaceId });
  const drive = client.getDrive();

  // Try to find existing __OLD__ folder
  const params: any = {
    q: `'${parentId}' in parents and name='__OLD__' and trashed=false and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };

  if (driveId) {
    params.corpora = 'drive';
    params.driveId = driveId;
  }

  const result = await client.request(() => drive.files.list(params));

  if (result.data.files && result.data.files.length > 0) {
    return result.data.files[0].id || '';
  }

  // Create __OLD__ folder
  const folder = await createFolder(workspaceId, parentId, '__OLD__', driveId);
  return folder.id;
}

/**
 * Get or create Archive subfolder
 */
async function getOrCreateArchiveFolder(
  workspaceId: string,
  parentId: string,
  driveId?: string
): Promise<string> {
  const client = createDriveClient({ workspaceId });
  const drive = client.getDrive();

  // Try to find existing Archive folder
  const params: any = {
    q: `'${parentId}' in parents and name='Archive' and trashed=false and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };

  if (driveId) {
    params.corpora = 'drive';
    params.driveId = driveId;
  }

  const result = await client.request(() => drive.files.list(params));

  if (result.data.files && result.data.files.length > 0) {
    return result.data.files[0].id || '';
  }

  // Create Archive folder
  const folder = await createFolder(workspaceId, parentId, 'Archive', driveId);
  return folder.id;
}

