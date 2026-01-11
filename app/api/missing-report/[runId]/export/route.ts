/**
 * Export missing report as text
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { formatMissingReportAsText, generateMissingReportFilename } from '@/lib/template/missingReportExport';
import { getDuplicateFlags } from '@/lib/db/duplicateFlags';
import { getRun } from '@/lib/db/runs';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';

/**
 * GET /api/missing-report/[runId]/export - Export missing report as text
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const run = getRun(params.runId);
    const workspaceId = (session as any).workspaceId;

    if (run.workspaceId !== workspaceId) {
      throw new UnauthorizedError('Run does not belong to your workspace');
    }

    // This should ideally fetch the missing items from a stored report
    // For now, return a placeholder response
    // TODO: Store missing report results in run metadata or separate table

    const companyName = run.companyName || 'Unknown Company';
    const date = new Date().toLocaleDateString();
    
    const duplicateFlags = getDuplicateFlags(workspaceId, params.runId);

    const text = formatMissingReportAsText({
      companyName,
      date,
      missingItems: [], // TODO: Load from stored report
      duplicateFlags,
    });

    const filename = generateMissingReportFilename(companyName, new Date());

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
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

