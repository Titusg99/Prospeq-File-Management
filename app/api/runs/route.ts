/**
 * Runs API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/drive/auth';
import { getDb } from '@/lib/db';
import { UnauthorizedError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * GET /api/runs - List runs for current user's workspace
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const workspaceId = (session as any).workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ runs: [] });
    }

    const db = getDb();
    const runs = db
      .prepare('SELECT * FROM runs WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100')
      .all(workspaceId) as any[];

    logInfo('Listed runs', { workspaceId, count: runs.length });

    return NextResponse.json({
      runs: runs.map((r) => ({
        id: r.id,
        workspaceId: r.workspace_id,
        templateId: r.template_id,
        type: r.type,
        status: r.status,
        progress: r.progress,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        errorMessage: r.error_message,
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof UnauthorizedError ? 401 : 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/runs - Create run (stub)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    // TODO: Implement run creation
    return NextResponse.json(
      { error: 'Not implemented', message: 'Run creation not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof UnauthorizedError ? 401 : 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

