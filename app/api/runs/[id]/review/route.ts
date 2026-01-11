/**
 * Review plan - Update plan item decisions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { bulkUpdatePlanItems, getPlanItems } from '@/lib/db/planItems';
import { getRun } from '@/lib/db/runs';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * POST /api/runs/[id]/review - Update plan review decisions
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

    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      throw new ValidationError('updates must be an array');
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id) {
        throw new ValidationError('Each update must have an id');
      }
      if (!['approved', 'overridden', 'excluded'].includes(update.decision)) {
        throw new ValidationError('decision must be approved, overridden, or excluded');
      }
      if (update.decision === 'overridden' && !update.finalFolderKey) {
        throw new ValidationError('overridden decision requires finalFolderKey');
      }
    }

    bulkUpdatePlanItems(updates);

    logInfo('Plan review updated', {
      runId: params.id,
      updateCount: updates.length,
    });

    const planItems = getPlanItems(params.id);

    return NextResponse.json({ planItems });
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

