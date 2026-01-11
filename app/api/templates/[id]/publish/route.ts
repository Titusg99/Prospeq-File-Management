/**
 * Publish template version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getTemplate, updateTemplate } from '@/lib/template/crud';
import { getDb } from '@/lib/db';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/templates/[id]/publish - Publish template version
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const template = getTemplate(params.id);

    // Validate template has required structure
    if (!template.folderTree || !template.folderTree.children || template.folderTree.children.length === 0) {
      throw new ValidationError('Template must have a folder tree structure');
    }

    // Update status to published
    const db = getDb();
    db.prepare(
      `
      UPDATE templates
      SET status = ?, is_published = 1, updated_at = ?
      WHERE id = ?
    `
    ).run('published', Date.now(), params.id);

    logInfo('Template published', {
      templateId: params.id,
      name: template.name,
    });

    const updated = getTemplate(params.id);

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof UnauthorizedError ? 401 : error instanceof NotFoundError ? 404 : error instanceof ValidationError ? 400 : 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

