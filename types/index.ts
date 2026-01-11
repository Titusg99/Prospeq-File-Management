/**
 * Shared types across the application
 */

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  driveId?: string;
  folderId?: string;
  cleanBuildRootFolderId?: string;
  archiveRootFolderId?: string;
  activeTemplateId?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FolderTreeNode {
  id: string;
  key: string; // Stable key (not Drive ID)
  name: string;
  path: string;
  children?: FolderTreeNode[];
}

export interface RoutingRule {
  id: string;
  folderKey: string; // Points to template node key
  keywords: string[];
  synonyms?: string[];
  filetypeHints?: string[]; // MIME type hints
  targetPath: string;
  priority: number;
}

export interface Template {
  id: string;
  workspaceId: string;
  name: string;
  version: number;
  folderTree: FolderTreeNode;
  routingRules: RoutingRule[];
  status: 'draft' | 'published';
  isPublished: boolean; // Keep for backward compatibility
  createdAt: number;
  updatedAt: number;
}

export interface ExpectedItemEvidence {
  keywords?: string[];
  requiredMimeTypes?: string[];
  matchScope: 'folderOnly' | 'subtree';
  recencyDays?: number;
}

export interface ExpectedItem {
  id: string;
  templateId: string;
  folderPath: string; // Keep for backward compatibility
  folderKey: string; // Points to template node key
  name: string;
  keywords?: string[]; // Keep for backward compatibility
  mimeTypes?: string[]; // Keep for backward compatibility
  recencyDays?: number; // Keep for backward compatibility
  priority: 'Essential' | 'Important' | 'Nice-to-have';
  searchScope: 'folderOnly' | 'subtree';
  evidence?: ExpectedItemEvidence;
  createdAt: number;
}

export interface RunLinks {
  originalFolderId?: string;
  cleanFolderId?: string;
  promotedFolderId?: string;
  archivedFolderId?: string;
}

export interface Run {
  id: string;
  workspaceId: string;
  templateId?: string;
  companyFolderId?: string;
  companyName?: string;
  mode?: 'cleanup' | 'ingest';
  type: 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  links?: RunLinks;
}

export interface PlanItem {
  id: string;
  runId: string;
  fileId: string;
  fileName: string;
  mimeType?: string;
  sourcePath: string;
  targetPath: string;
  proposedFolderKey?: string;
  finalFolderKey?: string;
  confidence: number;
  routerType: 'keyword' | 'llm' | 'other';
  decision: 'approved' | 'overridden' | 'excluded';
  needsApproval: boolean;
  reason?: string;
  keywordMatches?: string[];
  createdAt: number;
}

export interface DuplicateFlag {
  id: string;
  runId?: string;
  workspaceId: string;
  groupId: string;
  fileIds: string[];
  basis: 'md5' | 'name+size' | 'name+mimetype';
  severity: 'exact' | 'probable';
  detectedAt: number;
}

export interface LogEvent {
  id: string;
  runId?: string;
  workspaceId?: string;
  level: 'info' | 'warn' | 'error';
  action?: 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE' | 'ERROR';
  message: string;
  fileId?: string;
  fromPath?: string;
  toPath?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  path?: string;
  md5Checksum?: string;
}

export interface DriveFolder extends DriveFile {
  mimeType: 'application/vnd.google-apps.folder';
  path?: string;
}
