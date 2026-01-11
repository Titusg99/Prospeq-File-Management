/**
 * Job event emitter types
 */

import { EventEmitter } from 'events';
import type { JobProgress } from './types';

export interface JobEvents {
  progress: (progress: JobProgress) => void;
  completed: (jobId: string) => void;
  failed: (jobId: string, error: Error) => void;
}

export class JobEventEmitter extends EventEmitter {
  emitProgress(progress: JobProgress): void {
    this.emit('progress', progress);
  }

  emitCompleted(jobId: string): void {
    this.emit('completed', jobId);
  }

  emitFailed(jobId: string, error: Error): void {
    this.emit('failed', jobId, error);
  }

  onProgress(callback: (progress: JobProgress) => void): void {
    this.on('progress', callback);
  }

  onCompleted(callback: (jobId: string) => void): void {
    this.on('completed', callback);
  }

  onFailed(callback: (jobId: string, error: Error) => void): void {
    this.on('failed', callback);
  }
}

