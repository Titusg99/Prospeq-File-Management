/**
 * Get plan items for a run
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getPlanItems } from '@/lib/db/planItems';
import { getRun } from '@/lib/db/runs';
import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors';

/**
 * GET /api/runs/[id]/plan - Get plan items for review
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
    const workspaceId = (session as any).workspaceId;

    if (run.workspaceId !== workspaceId) {
      throw new UnauthorizedError('Run does not belong to your workspace');
    }

    const planItems = getPlanItems(params.id);

    return NextResponse.json({ planItems });
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

