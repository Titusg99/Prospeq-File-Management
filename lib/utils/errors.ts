/**
 * Error utilities and types
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class DriveAPIError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'DRIVE_API_ERROR', 502, details);
    this.name = 'DriveAPIError';
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET')
    );
  }
  return false;
}

