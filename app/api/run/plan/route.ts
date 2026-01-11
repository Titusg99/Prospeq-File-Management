/**
 * Run plan operation API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { jobRunner } from '@/lib/jobs/runner';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/run/plan - Start plan job
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
    const { fileIds, templateId } = body;

    if (!fileIds || !Array.isArray(fileIds)) {
      throw new ValidationError('fileIds array is required');
    }

    if (!templateId) {
      throw new ValidationError('templateId is required');
    }

    const jobId = await jobRunner.startJob('PLAN', workspaceId, templateId, {
      fileIds,
      templateId,
    });

    logInfo('Started plan job', { jobId, workspaceId, templateId, fileCount: fileIds.length });

    return NextResponse.json({ jobId }, { status: 201 });
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

