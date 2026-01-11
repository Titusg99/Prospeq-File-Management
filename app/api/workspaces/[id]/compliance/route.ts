/**
 * Get template compliance status for a workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getDb } from '@/lib/db';
import { getTemplate } from '@/lib/template/crud';
import { listFolder } from '@/lib/drive/listing';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';

/**
 * GET /api/workspaces/[id]/compliance - Get template compliance status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const db = getDb();
    const workspace = db
      .prepare('SELECT * FROM workspaces WHERE id = ?')
      .get(params.id) as any;

    if (!workspace) {
      throw new NotFoundError('Workspace', params.id);
    }

    if (workspace.user_id !== session.user.email) {
      throw new UnauthorizedError('Workspace does not belong to you');
    }

    const companyFolderId = req.nextUrl.searchParams.get('companyFolderId');
    const driveId = workspace.drive_id || undefined;

    if (!companyFolderId) {
      return NextResponse.json({
        compliance: [],
        message: 'companyFolderId query parameter is required',
      });
    }

    if (!workspace.active_template_id) {
      return NextResponse.json({
        compliance: [],
        message: 'No active template set for workspace',
      });
    }

    const template = getTemplate(workspace.active_template_id);

    // Check compliance for each folder in template
    const compliance: Array<{
      folderKey: string;
      folderPath: string;
      status: 'exists' | 'empty' | 'missing';
      fileCount?: number;
    }> = [];

    async function checkFolderCompliance(node: typeof template.folderTree, basePath = '') {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
      
      try {
        const result = await listFolder({
          workspaceId: params.id,
          folderId: companyFolderId,
          driveId,
          includeTrashed: false,
        });

        // Try to find folder by name
        const matchingFolder = result.folders.find((f) => f.name === node.name);
        
        if (matchingFolder) {
          // Check if folder has files
          const folderContents = await listFolder({
            workspaceId: params.id,
            folderId: matchingFolder.id,
            driveId,
          });
          
          compliance.push({
            folderKey: node.key,
            folderPath: fullPath,
            status: folderContents.files.length > 0 ? 'exists' : 'empty',
            fileCount: folderContents.files.length,
          });
        } else {
          compliance.push({
            folderKey: node.key,
            folderPath: fullPath,
            status: 'missing',
          });
        }
      } catch (error) {
        compliance.push({
          folderKey: node.key,
          folderPath: fullPath,
          status: 'missing',
        });
      }

      if (node.children) {
        for (const child of node.children) {
          await checkFolderCompliance(child, fullPath);
        }
      }
    }

    await checkFolderCompliance(template.folderTree);

    return NextResponse.json({ compliance });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof UnauthorizedError ? 401 : error instanceof NotFoundError ? 404 : 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

