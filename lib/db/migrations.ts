/**
 * Database migrations with version tracking
 */

import Database from 'better-sqlite3';
import { schemaSQL } from './schema';

const MIGRATION_VERSION_TABLE = 'schema_migrations';
const CURRENT_SCHEMA_VERSION = 2;

export interface Migration {
  version: number;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

/**
 * Get current schema version
 */
function getCurrentVersion(db: Database.Database): number {
  try {
    const result = db
      .prepare(`SELECT version FROM ${MIGRATION_VERSION_TABLE} ORDER BY version DESC LIMIT 1`)
      .get() as { version: number } | undefined;
    return result?.version || 0;
  } catch {
    // Table doesn't exist, return 0
    return 0;
  }
}

/**
 * Set schema version
 */
function setVersion(db: Database.Database, version: number): void {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${MIGRATION_VERSION_TABLE} (version, applied_at) VALUES (?, ?)`
  );
  stmt.run(version, Date.now());
}

/**
 * Migration 1: Initial schema
 */
const migration1: Migration = {
  version: 1,
  up: (db: Database.Database) => {
    db.exec(schemaSQL);
  },
};

/**
 * Migration 2: Enhanced schema with new fields
 */
const migration2: Migration = {
  version: 2,
  up: (db: Database.Database) => {
    // Add new workspace fields
    try {
      db.exec(`
        ALTER TABLE workspaces ADD COLUMN clean_build_root_folder_id TEXT;
        ALTER TABLE workspaces ADD COLUMN archive_root_folder_id TEXT;
        ALTER TABLE workspaces ADD COLUMN active_template_id TEXT;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Enhance runs table
    try {
      db.exec(`
        ALTER TABLE runs ADD COLUMN company_folder_id TEXT;
        ALTER TABLE runs ADD COLUMN company_name TEXT;
        ALTER TABLE runs ADD COLUMN mode TEXT;
        ALTER TABLE runs ADD COLUMN links TEXT;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Enhance plan_items table
    try {
      db.exec(`
        ALTER TABLE plan_items ADD COLUMN mime_type TEXT;
        ALTER TABLE plan_items ADD COLUMN proposed_folder_key TEXT;
        ALTER TABLE plan_items ADD COLUMN decision TEXT DEFAULT 'approved';
        ALTER TABLE plan_items ADD COLUMN final_folder_key TEXT;
        ALTER TABLE plan_items ADD COLUMN needs_approval BOOLEAN DEFAULT 0;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Restructure duplicate_flags (create new structure)
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS duplicate_flags_v2 (
          id TEXT PRIMARY KEY,
          run_id TEXT,
          workspace_id TEXT NOT NULL,
          group_id TEXT NOT NULL,
          file_ids TEXT NOT NULL,
          basis TEXT NOT NULL,
          severity TEXT NOT NULL,
          detected_at INTEGER NOT NULL,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
          FOREIGN KEY (run_id) REFERENCES runs(id)
        );
      `);

      // Migrate existing data if any
      const existingFlags = db.prepare('SELECT * FROM duplicate_flags').all() as any[];
      if (existingFlags.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO duplicate_flags_v2 (id, workspace_id, group_id, file_ids, basis, severity, detected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const { nanoid } = require('nanoid');
        for (const flag of existingFlags) {
          const groupId = nanoid();
          insertStmt.run(
            flag.id,
            flag.workspace_id,
            groupId,
            JSON.stringify([flag.file_id, flag.duplicate_of]),
            'name+mimetype',
            'exact',
            flag.detected_at || Date.now()
          );
        }
      }

      // Drop old table and rename new one
      db.exec(`DROP TABLE IF EXISTS duplicate_flags`);
      db.exec(`ALTER TABLE duplicate_flags_v2 RENAME TO duplicate_flags`);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column') && !e.message?.includes('already exists')) throw e;
    }

    // Update templates
    try {
      db.exec(`
        ALTER TABLE templates ADD COLUMN status TEXT DEFAULT 'draft';
      `);

      // Migrate is_published to status
      db.exec(`
        UPDATE templates SET status = CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END WHERE status IS NULL;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Update expected_items
    try {
      db.exec(`
        ALTER TABLE expected_items ADD COLUMN folder_key TEXT;
        ALTER TABLE expected_items ADD COLUMN name TEXT;
        ALTER TABLE expected_items ADD COLUMN evidence TEXT;
      `);

      // Migrate folder_path to folder_key (for now, just copy path as key)
      db.exec(`
        UPDATE expected_items SET folder_key = folder_path WHERE folder_key IS NULL;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Enhance log_events
    try {
      db.exec(`
        ALTER TABLE log_events ADD COLUMN action TEXT;
        ALTER TABLE log_events ADD COLUMN file_id TEXT;
        ALTER TABLE log_events ADD COLUMN from_path TEXT;
        ALTER TABLE log_events ADD COLUMN to_path TEXT;
      `);
    } catch (e: any) {
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Update indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_duplicate_flags_run_id ON duplicate_flags(run_id);
      CREATE INDEX IF NOT EXISTS idx_duplicate_flags_group_id ON duplicate_flags(group_id);
      CREATE INDEX IF NOT EXISTS idx_plan_items_needs_approval ON plan_items(needs_approval);
      CREATE INDEX IF NOT EXISTS idx_plan_items_decision ON plan_items(decision);
      CREATE INDEX IF NOT EXISTS idx_expected_items_folder_key ON expected_items(folder_key);
    `);
  },
};

/**
 * All migrations in order
 */
const migrations: Migration[] = [migration1, migration2];

/**
 * Run all pending migrations
 */
export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_VERSION_TABLE} (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const currentVersion = getCurrentVersion(db);
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    // Run initial schema if version 0
    if (currentVersion === 0) {
      migration1.up(db);
      setVersion(db, 1);
    }
    return;
  }

  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}...`);
    migration.up(db);
    setVersion(db, migration.version);
  }

  console.log(`Migrations complete. Schema version: ${CURRENT_SCHEMA_VERSION}`);
}
