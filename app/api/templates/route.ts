/**
 * Templates API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/drive/auth';
import { listTemplates, createTemplate } from '@/lib/template/crud';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { logInfo } from '@/lib/utils/logging';
import { createRootNode } from '@/lib/template/tree';

/**
 * GET /api/templates - List templates for current user's workspace
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError('Not authenticated');
    }

    const workspaceId = (session as any).workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ templates: [] });
    }

    const templates = listTemplates(workspaceId);
    logInfo('Listed templates', { workspaceId, count: templates.length });

    return NextResponse.json({ templates });
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
 * POST /api/templates - Create template
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
    const { name, folderTree, routingRules } = body;

    if (!name) {
      throw new ValidationError('Name is required');
    }

    const template = createTemplate(workspaceId, name, {
      folderTree: folderTree || createRootNode(),
      routingRules: routingRules || [],
    });

    logInfo('Created template', { templateId: template.id, name });

    return NextResponse.json({ template }, { status: 201 });
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

