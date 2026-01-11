/**
 * Run by ID API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getRun } from '@/lib/db/runs';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * GET /api/runs/[id] - Get run by ID
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

    const run = getRun(params.id);

    logInfo('Retrieved run', { runId: params.id });

    return NextResponse.json({ run });
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

