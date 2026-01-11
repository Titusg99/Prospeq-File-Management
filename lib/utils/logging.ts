/**
 * Logging utilities
 */

import { getDb } from '@/lib/db';
import { nanoid } from 'nanoid';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEventData {
  runId?: string;
  workspaceId?: string;
  level: LogLevel;
  action?: 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE' | 'ERROR';
  message: string;
  fileId?: string;
  fromPath?: string;
  toPath?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an event to the database
 */
export function logEvent(data: LogEventData): void {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO log_events (id, run_id, workspace_id, level, action, message, file_id, from_path, to_path, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = nanoid();
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
    const timestamp = Date.now();

    stmt.run(
      id,
      data.runId || null,
      data.workspaceId || null,
      data.level,
      data.action || null,
      data.message,
      data.fileId || null,
      data.fromPath || null,
      data.toPath || null,
      metadataJson,
      timestamp
    );
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log event:', error);
  }
}

/**
 * Log info level event
 */
export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  logEvent({ level: 'info', message, metadata });
  console.log(`[INFO] ${message}`, metadata || '');
}

/**
 * Log warning level event
 */
export function logWarn(message: string, metadata?: Record<string, unknown>): void {
  logEvent({ level: 'warn', message, metadata });
  console.warn(`[WARN] ${message}`, metadata || '');
}

/**
 * Log error level event
 */
export function logError(message: string, metadata?: Record<string, unknown>): void {
  logEvent({ level: 'error', message, metadata });
  console.error(`[ERROR] ${message}`, metadata || '');
}

