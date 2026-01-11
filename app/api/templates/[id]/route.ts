/**
 * Template by ID API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { getTemplate, updateTemplate, deleteTemplate } from '@/lib/template/crud';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';

/**
 * GET /api/templates/[id] - Get template by ID
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

    const template = getTemplate(params.id);
    logInfo('Retrieved template', { templateId: params.id });

    return NextResponse.json({ template });
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

/**
 * PUT /api/templates/[id] - Update template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const body = await req.json();
    const { folderTree, routingRules } = body;

    const updates: any = {};
    if (folderTree !== undefined) updates.folderTree = folderTree;
    if (routingRules !== undefined) updates.routingRules = routingRules;

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No updates provided');
    }

    const template = updateTemplate(params.id, updates);
    logInfo('Updated template', { templateId: params.id });

    return NextResponse.json({ template });
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

/**
 * DELETE /api/templates/[id] - Delete template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    deleteTemplate(params.id);
    logInfo('Deleted template', { templateId: params.id });

    return NextResponse.json({ success: true });
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

