/**
 * Workspaces API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getDb } from '@/lib/db';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * GET /api/workspaces - List workspaces for current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const db = getDb();
    const workspaces = db
      .prepare('SELECT id, name, drive_id, folder_id, created_at, updated_at FROM workspaces WHERE user_id = ?')
      .all(session.user.email) as any[];

    logInfo('Listed workspaces', { userId: session.user.email, count: workspaces.length });

    return NextResponse.json({
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        driveId: w.drive_id,
        folderId: w.folder_id,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
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
 * POST /api/workspaces - Create workspace (stub)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const body = await req.json();
    const { name, driveId, folderId } = body;

    if (!name) {
      throw new ValidationError('Name is required');
    }

    // TODO: Implement workspace creation
    return NextResponse.json(
      { error: 'Not implemented', message: 'Workspace creation not yet implemented' },
      { status: 501 }
    );
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

