/**
 * Run promote operation API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { jobRunner } from '@/lib/jobs/runner';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/run/promote - Start promote job
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
    const { originalFileIds, cleanFileIds, driveId } = body;

    if (!originalFileIds || !Array.isArray(originalFileIds)) {
      throw new ValidationError('originalFileIds array is required');
    }

    if (!cleanFileIds || !Array.isArray(cleanFileIds)) {
      throw new ValidationError('cleanFileIds array is required');
    }

    if (originalFileIds.length !== cleanFileIds.length) {
      throw new ValidationError('originalFileIds and cleanFileIds must have the same length');
    }

    const jobId = await jobRunner.startJob('PROMOTE', workspaceId, undefined, {
      originalFileIds,
      cleanFileIds,
      driveId,
    });

    logInfo('Started promote job', { jobId, workspaceId, fileCount: originalFileIds.length });

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

