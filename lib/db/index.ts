/**
 * Database connection and initialization
 * Handles case where better-sqlite3 isn't compiled yet
 */

import path from 'path';
import fs from 'fs';

let Database: any = null;
let dbInstance: any = null;
let dbModule: any = null;

// Lazy load better-sqlite3 - only load when actually needed
async function loadDatabaseModule() {
  if (dbModule) {
    return dbModule;
  }
  
  try {
    dbModule = await import('better-sqlite3');
    Database = dbModule.default;
    return dbModule;
  } catch (error) {
    // Database not available - that's okay
    dbModule = null;
    Database = null;
    return null;
  }
}

export function getDb(): any {
  // This is a synchronous function, but better-sqlite3 might not be available
  // For now, we'll throw if not available - callers should handle it
  if (!Database) {
    // Try to load synchronously as fallback (won't work if it's not compiled)
    try {
      const sqlite3 = require('better-sqlite3');
      Database = sqlite3;
    } catch (error) {
      throw new Error('Database not available - better-sqlite3 is not compiled');
    }
  }

  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || './data/db.sqlite';
  const dbDir = path.dirname(dbPath);

  // Ensure data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Open database connection
  dbInstance = new Database(dbPath);
  
  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');

  // Check if database is new (no schema_migrations table)
  const tableExists = dbInstance
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
    )
    .get();

  if (!tableExists) {
    // New database - create base schema
    try {
      const { schemaSQL } = require('./schema');
      dbInstance.exec(schemaSQL);
    } catch (schemaError) {
      console.warn('Could not load schema:', schemaError);
    }
  }

  // Run migrations
  try {
    const { runMigrations } = require('./migrations');
    runMigrations(dbInstance);
  } catch (migrationError) {
    console.warn('Could not run migrations:', migrationError);
  }

  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (error) {
      // Ignore close errors
    }
    dbInstance = null;
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    closeDb();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    closeDb();
    process.exit(0);
  });
}
