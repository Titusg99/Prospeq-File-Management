/**
 * Generate missing report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { generateMissingReport } from '@/lib/template/missingReport';
import { getTemplate } from '@/lib/template/crud';
import { getDb } from '@/lib/db';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/missing-report - Generate missing report
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const workspaceId = (session as any).workspaceId;
    if (!workspaceId) {
      throw new UnauthorizedError('No workspace found');
    }

    const body = await req.json();
    const { templateId, companyFolderId, driveId } = body;

    if (!templateId) {
      throw new ValidationError('templateId is required');
    }

    if (!companyFolderId) {
      throw new ValidationError('companyFolderId is required');
    }

    const template = getTemplate(templateId);

    // Get expected items for template
    const db = getDb();
    const expectedItems = db
      .prepare('SELECT * FROM expected_items WHERE template_id = ?')
      .all(templateId) as any[];

    const expectedItemsParsed = expectedItems.map((row) => ({
      id: row.id,
      templateId: row.template_id,
      folderPath: row.folder_path,
      folderKey: row.folder_key || row.folder_path,
      name: row.name || row.folder_path,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
      mimeTypes: row.mime_types ? JSON.parse(row.mime_types) : undefined,
      recencyDays: row.recency_days || undefined,
      priority: row.priority as 'Essential' | 'Important' | 'Nice-to-have',
      searchScope: row.search_scope as 'folderOnly' | 'subtree',
      evidence: row.evidence ? JSON.parse(row.evidence) : undefined,
      createdAt: row.created_at,
    }));

    const missingItems = await generateMissingReport({
      workspaceId,
      expectedItems: expectedItemsParsed,
      companyFolderId,
      driveId,
    });

    logInfo('Generated missing report', {
      templateId,
      companyFolderId,
      itemCount: missingItems.length,
      missingCount: missingItems.filter((item) => item.missing).length,
    });

    return NextResponse.json({ missingItems });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof UnauthorizedError ? 401 : error instanceof ValidationError ? 400 : 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

