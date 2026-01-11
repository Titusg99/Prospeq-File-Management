/**
 * Google Drive folder listing utilities
 */

import { createDriveClient } from './client';
import type { DriveFile, DriveFolder } from '@/types';

export interface ListFolderOptions {
  workspaceId: string;
  folderId: string;
  driveId?: string;
  includeTrashed?: boolean;
}

export interface ListFolderResult {
  files: DriveFile[];
  folders: DriveFolder[];
  nextPageToken?: string;
}

/**
 * List children of a folder
 */
export async function listFolder(
  options: ListFolderOptions
): Promise<ListFolderResult> {
  const client = createDriveClient({ workspaceId: options.workspaceId });
  const drive = client.getDrive();

  // Build query
  const queryParts = [`'${options.folderId}' in parents`];
  if (!options.includeTrashed) {
    queryParts.push('trashed=false');
  }
  const query = queryParts.join(' and ');

  // Build request parameters
  const params: any = {
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, parents, modifiedTime, size, webViewLink, md5Checksum)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };

  // Add Shared Drive parameters if driveId is provided
  if (options.driveId) {
    params.corpora = 'drive';
    params.driveId = options.driveId;
  }

  const response = await client.request(() =>
    drive.files.list(params)
  );

  const files: DriveFile[] = [];
  const folders: DriveFolder[] = [];

  if (response.data.files) {
    for (const file of response.data.files) {
      const driveFile: DriveFile = {
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        parents: file.parents,
        modifiedTime: file.modifiedTime || undefined,
        size: file.size || undefined,
        webViewLink: file.webViewLink || undefined,
        md5Checksum: file.md5Checksum || undefined,
      };

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        folders.push(driveFile as DriveFolder);
      } else {
        files.push(driveFile);
      }
    }
  }

  return {
    files,
    folders,
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Recursively list all files in a folder tree
 */
export async function listFolderRecursive(
  options: ListFolderOptions,
  maxDepth = 10
): Promise<{ files: DriveFile[]; folders: DriveFolder[] }> {
  const allFiles: DriveFile[] = [];
  const allFolders: DriveFolder[] = [];

  async function traverse(folderId: string, depth: number, path: string): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    const result = await listFolder({
      ...options,
      folderId,
    });

    // Add folders and files from this level
    for (const folder of result.folders) {
      allFolders.push({ ...folder, path: `${path}/${folder.name}` });
    }
    for (const file of result.files) {
      allFiles.push({ ...file, path: `${path}/${file.name}` });
    }

    // Recursively traverse subfolders
    for (const folder of result.folders) {
      await traverse(folder.id, depth + 1, `${path}/${folder.name}`);
    }

    // Handle pagination
    if (result.nextPageToken) {
      // TODO: Implement pagination for recursive listing
      console.warn('Pagination not yet implemented for recursive listing');
    }
  }

  await traverse(options.folderId, 0, '');

  return { files: allFiles, folders: allFolders };
}

