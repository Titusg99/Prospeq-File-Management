/**
 * Run scan operation API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/drive/auth';
import { jobRunner } from '@/lib/jobs/runner';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/run/scan - Start scan job
 */
export async function POST(req: NextRequest) {
  try {
    // NextAuth v5: Use auth() instead of getServerSession()
    const session = await auth();
    
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const workspaceId = (session as any).workspaceId;
    if (!workspaceId) {
      throw new UnauthorizedError('No workspace found');
    }

    const body = await req.json();
    const { folderId, driveId, companyName } = body;

    if (!folderId) {
      throw new ValidationError('folderId is required');
    }

    const jobId = await jobRunner.startJob('SCAN', workspaceId, undefined, {
      folderId,
      driveId,
      companyName,
    });

    logInfo('Started scan job', { jobId, workspaceId, folderId });

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

