/**
 * Authenticated Google Drive API client
 */

import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { DriveAPIError, isRetryableError } from '@/lib/utils/errors';
import { logError, logWarn } from '@/lib/utils/logging';
import type { DriveFile } from '@/types';

export interface DriveClientOptions {
  workspaceId: string;
}

/**
 * Get OAuth2 client for a workspace
 */
function getOAuth2Client(workspaceId: string): google.auth.OAuth2Client {
  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new DriveAPIError('GOOGLE_CLIENT_ID environment variable is not set');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new DriveAPIError('GOOGLE_CLIENT_SECRET environment variable is not set');
  }
  if (!process.env.NEXTAUTH_URL) {
    throw new DriveAPIError('NEXTAUTH_URL environment variable is not set');
  }

  const db = getDb();
  const workspace = db
    .prepare('SELECT access_token, refresh_token FROM workspaces WHERE id = ?')
    .get(workspaceId) as { access_token: string | null; refresh_token: string | null } | undefined;

  if (!workspace) {
    throw new DriveAPIError(`Workspace ${workspaceId} not found`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL
  );

  // Only set credentials if tokens exist
  if (workspace.access_token || workspace.refresh_token) {
    oauth2Client.setCredentials({
      access_token: workspace.access_token || undefined,
      refresh_token: workspace.refresh_token || undefined,
    });
  } else {
    throw new DriveAPIError(`Workspace ${workspaceId} has no valid tokens. Please re-authenticate.`);
  }

  // Auto-refresh token
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token || tokens.access_token) {
      try {
        const db = getDb();
        const updates: string[] = [];
        const values: unknown[] = [];

        if (tokens.refresh_token) {
          updates.push('refresh_token = ?');
          values.push(tokens.refresh_token);
        }
        if (tokens.access_token) {
          updates.push('access_token = ?');
          values.push(tokens.access_token);
        }

        if (updates.length > 0) {
          updates.push('updated_at = ?');
          values.push(Date.now());
          values.push(workspaceId);

          db.prepare(
            `UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?`
          ).run(...values);
        }
      } catch (error) {
        logError('Failed to update tokens in database', {
          workspaceId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't throw - token refresh should not fail the request
      }
    }
  });

  return oauth2Client;
}

/**
 * Create authenticated Drive API client
 */
export function createDriveClient(options: DriveClientOptions) {
  const oauth2Client = getOAuth2Client(options.workspaceId);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  /**
   * Execute Drive API request with retry logic
   */
  async function executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    let lastError: unknown;
    let delay = 1000; // Start with 1 second

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!isRetryableError(error) || attempt === retries - 1) {
          throw error;
        }

        logWarn(`Drive API request failed, retrying... (attempt ${attempt + 1}/${retries})`, {
          error: error instanceof Error ? error.message : String(error),
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 4000); // Max 4 seconds
      }
    }

    throw lastError;
  }

  return {
    /**
     * Get Drive API instance
     */
    getDrive() {
      return drive;
    },

    /**
     * Get OAuth2 client
     */
    getAuth() {
      return oauth2Client;
    },

    /**
     * Execute request with automatic retry
     */
    async request<T>(operation: () => Promise<T>): Promise<T> {
      try {
        return await executeWithRetry(operation);
      } catch (error) {
        logError('Drive API request failed', {
          workspaceId: options.workspaceId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new DriveAPIError(
          error instanceof Error ? error.message : 'Unknown Drive API error',
          error
        );
      }
    },
  };
}

