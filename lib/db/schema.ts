/**
 * Database schema SQL statements (base schema)
 * Migrations handle schema updates - this is the base for new databases
 */

export const schemaSQL = `
-- Schema migrations tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

-- Workspaces (connected Google Drive accounts)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  drive_id TEXT,
  folder_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  clean_build_root_folder_id TEXT,
  archive_root_folder_id TEXT,
  active_template_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Templates (folder structure + routing rules)
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  folder_tree TEXT NOT NULL,
  routing_rules TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- ExpectedItems (what should exist in folders)
CREATE TABLE IF NOT EXISTS expected_items (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  folder_key TEXT,
  name TEXT,
  keywords TEXT,
  mime_types TEXT,
  recency_days INTEGER,
  priority TEXT NOT NULL,
  search_scope TEXT NOT NULL,
  evidence TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Runs (execution instances)
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  template_id TEXT,
  company_folder_id TEXT,
  company_name TEXT,
  mode TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  started_at INTEGER,
  completed_at INTEGER,
  error_message TEXT,
  links TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- PlanItems (routing decisions)
CREATE TABLE IF NOT EXISTS plan_items (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  proposed_folder_key TEXT,
  final_folder_key TEXT,
  confidence REAL NOT NULL,
  router_type TEXT NOT NULL,
  decision TEXT DEFAULT 'approved',
  needs_approval BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

-- DuplicateFlags (new structure)
CREATE TABLE IF NOT EXISTS duplicate_flags (
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

-- LogEvents
CREATE TABLE IF NOT EXISTS log_events (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  workspace_id TEXT,
  level TEXT NOT NULL,
  action TEXT,
  message TEXT NOT NULL,
  file_id TEXT,
  from_path TEXT,
  to_path TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_active_template_id ON workspaces(active_template_id);
CREATE INDEX IF NOT EXISTS idx_templates_workspace_id ON templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_expected_items_template_id ON expected_items(template_id);
CREATE INDEX IF NOT EXISTS idx_expected_items_folder_key ON expected_items(folder_key);
CREATE INDEX IF NOT EXISTS idx_runs_workspace_id ON runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_runs_company_folder_id ON runs(company_folder_id);
CREATE INDEX IF NOT EXISTS idx_runs_mode ON runs(mode);
CREATE INDEX IF NOT EXISTS idx_plan_items_run_id ON plan_items(run_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_needs_approval ON plan_items(needs_approval);
CREATE INDEX IF NOT EXISTS idx_plan_items_decision ON plan_items(decision);
CREATE INDEX IF NOT EXISTS idx_duplicate_flags_workspace_id ON duplicate_flags(workspace_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_flags_run_id ON duplicate_flags(run_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_flags_group_id ON duplicate_flags(group_id);
CREATE INDEX IF NOT EXISTS idx_log_events_run_id ON log_events(run_id);
CREATE INDEX IF NOT EXISTS idx_log_events_workspace_id ON log_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_log_events_created_at ON log_events(created_at);
CREATE INDEX IF NOT EXISTS idx_log_events_action ON log_events(action);
`;
