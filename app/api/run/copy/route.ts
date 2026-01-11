/**
 * Run copy operation API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { jobRunner } from '@/lib/jobs/runner';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/run/copy - Start copy job
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
    const { planId, targetFolderId, driveId, templateId } = body;

    if (!planId) {
      throw new ValidationError('planId is required');
    }

    if (!targetFolderId) {
      throw new ValidationError('targetFolderId is required');
    }

    if (!templateId) {
      throw new ValidationError('templateId is required');
    }

    const jobId = await jobRunner.startJob('COPY', workspaceId, templateId, {
      planId,
      targetFolderId,
      driveId,
    });

    logInfo('Started copy job', { jobId, workspaceId, templateId, planId });

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

