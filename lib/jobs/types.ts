/**
 * Job types
 */

export type JobType = 'SCAN' | 'PLAN' | 'COPY' | 'PROMOTE';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  workspaceId: string;
  templateId?: string;
  status: JobStatus;
  progress: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
}

export interface JobProgress {
  jobId: string;
  progress: number;
  status: JobStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ScanJobData {
  folderId: string;
  driveId?: string;
  companyName?: string;
}

export interface PlanJobData {
  fileIds: string[];
  templateId: string;
}

export interface CopyJobData {
  planId: string;
  targetFolderId: string;
  driveId?: string;
}

export interface PromoteJobData {
  originalFileIds: string[];
  cleanFileIds: string[];
  driveId?: string;
}

