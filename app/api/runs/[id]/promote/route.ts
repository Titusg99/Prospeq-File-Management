/**
 * Promote operation - Archive original + swap CLEAN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { jobRunner } from '@/lib/jobs/runner';
import { getRun } from '@/lib/db/runs';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/runs/[id]/promote - Execute promotion
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

    const run = getRun(params.id);
    const workspaceId = (session as any).workspaceId;

    if (run.workspaceId !== workspaceId) {
      throw new UnauthorizedError('Run does not belong to your workspace');
    }

    if (!run.links?.cleanFolderId) {
      throw new ValidationError('Run must have a cleanFolderId in links');
    }

    if (!run.links.originalFolderId) {
      throw new ValidationError('Run must have an originalFolderId in links');
    }

    const body = await req.json();
    const { driveId } = body;

    // Start PROMOTE job
    const promoteJobId = await jobRunner.startJob('PROMOTE', workspaceId, run.templateId, {
      originalFileIds: [run.links.originalFolderId],
      cleanFileIds: [run.links.cleanFolderId],
      driveId,
    });

    logInfo('Started promotion', {
      runId: params.id,
      promoteJobId,
      originalFolderId: run.links.originalFolderId,
      cleanFolderId: run.links.cleanFolderId,
    });

    return NextResponse.json({ jobId: promoteJobId }, { status: 201 });
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

