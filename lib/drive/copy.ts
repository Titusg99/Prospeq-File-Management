/**
 * Google Drive file/folder copy operations
 */

import { createDriveClient } from './client';
import { DriveAPIError } from '@/lib/utils/errors';
import { logInfo, logError } from '@/lib/utils/logging';
import type { DriveFile, DriveFolder } from '@/types';

export interface CopyFileOptions {
  workspaceId: string;
  fileId: string;
  targetParentId: string;
  newName?: string;
}

export interface CopyFolderOptions {
  workspaceId: string;
  folderId: string;
  targetParentId: string;
  newName?: string;
  driveId?: string;
}

/**
 * Copy a file to a new location
 */
export async function copyFile(options: CopyFileOptions): Promise<DriveFile> {
  const client = createDriveClient({ workspaceId: options.workspaceId });
  const drive = client.getDrive();

  try {
    const response = await client.request(() =>
      drive.files.copy({
        fileId: options.fileId,
        requestBody: {
          name: options.newName,
          parents: [options.targetParentId],
        },
        supportsAllDrives: true,
      })
    );

    const copiedFile: DriveFile = {
      id: response.data.id || '',
      name: response.data.name || '',
      mimeType: response.data.mimeType || '',
      parents: response.data.parents,
      modifiedTime: response.data.modifiedTime || undefined,
      size: response.data.size || undefined,
      webViewLink: response.data.webViewLink || undefined,
    };

    logInfo('File copied', {
      workspaceId: options.workspaceId,
      fileId: options.fileId,
      newFileId: copiedFile.id,
      targetParentId: options.targetParentId,
    });

    return copiedFile;
  } catch (error) {
    logError('Failed to copy file', {
      workspaceId: options.workspaceId,
      fileId: options.fileId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DriveAPIError(
      `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Create a folder
 */
export async function createFolder(
  workspaceId: string,
  parentId: string,
  name: string,
  driveId?: string
): Promise<DriveFolder> {
  const client = createDriveClient({ workspaceId });
  const drive = client.getDrive();

  const params: any = {
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    supportsAllDrives: true,
  };

  // Note: driveId is not a requestBody parameter, it's used in queries
  // For folder creation in Shared Drives, the folder is created in the parent's drive

  try {
    const response = await client.request(() => drive.files.create(params));

    const folder: DriveFolder = {
      id: response.data.id || '',
      name: response.data.name || name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: response.data.parents,
      modifiedTime: response.data.modifiedTime || undefined,
      webViewLink: response.data.webViewLink || undefined,
    };

    logInfo('Folder created', {
      workspaceId,
      folderId: folder.id,
      parentId,
      name,
    });

    return folder;
  } catch (error) {
    logError('Failed to create folder', {
      workspaceId,
      parentId,
      name,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DriveAPIError(
      `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Recursively copy a folder and its contents
 */
export async function copyFolderRecursive(
  options: CopyFolderOptions
): Promise<DriveFolder> {
  const client = createDriveClient({ workspaceId: options.workspaceId });

  // Get source folder info
  const drive = client.getDrive();
  const sourceFolder = await client.request(() =>
    drive.files.get({
      fileId: options.folderId,
      fields: 'id, name, mimeType',
      supportsAllDrives: true,
    })
  );

  if (sourceFolder.data.mimeType !== 'application/vnd.google-apps.folder') {
    throw new DriveAPIError('Source is not a folder');
  }

  // Create target folder
  const targetFolder = await createFolder(
    options.workspaceId,
    options.targetParentId,
    options.newName || sourceFolder.data.name || 'Untitled',
    options.driveId
  );

  // List source folder contents
  const { listFolder } = await import('./listing');
  const contents = await listFolder({
    workspaceId: options.workspaceId,
    folderId: options.folderId,
    driveId: options.driveId,
  });

  // Copy all files
  for (const file of contents.files) {
    await copyFile({
      workspaceId: options.workspaceId,
      fileId: file.id,
      targetParentId: targetFolder.id,
    });
  }

  // Recursively copy subfolders
  for (const folder of contents.folders) {
    try {
      await copyFolderRecursive({
        workspaceId: options.workspaceId,
        folderId: folder.id,
        targetParentId: targetFolder.id,
        driveId: options.driveId,
      });
    } catch (error) {
      logError('Failed to copy subfolder', {
        workspaceId: options.workspaceId,
        folderId: folder.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with other folders
    }
  }

  return targetFolder;
}

