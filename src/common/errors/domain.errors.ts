export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found`, 'NOT_FOUND', { resource, identifier });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends DomainError {
  constructor(message = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_EXCEEDED', details);
    this.name = 'RateLimitError';
  }
}

export class SessionRevokedError extends DomainError {
  constructor(message = 'Session has been revoked') {
    super(message, 'SESSION_REVOKED');
    this.name = 'SessionRevokedError';
  }
}

export class MfaRequiredError extends DomainError {
  constructor(message = 'Multi-factor authentication required') {
    super(message, 'MFA_REQUIRED');
    this.name = 'MfaRequiredError';
  }
}

export class ContentNotVisibleError extends DomainError {
  constructor(message = 'Content is not visible') {
    super(message, 'CONTENT_NOT_VISIBLE');
    this.name = 'ContentNotVisibleError';
  }
}

export class ConversationAccessDeniedError extends DomainError {
  constructor(message = 'Access to conversation denied') {
    super(message, 'CONVERSATION_ACCESS_DENIED');
    this.name = 'ConversationAccessDeniedError';
  }
}

export class UploadRejectedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'UPLOAD_REJECTED', details);
    this.name = 'UploadRejectedError';
  }
}

export class PrivacyRequestInProgressError extends DomainError {
  constructor(message = 'Privacy request already in progress') {
    super(message, 'PRIVACY_REQUEST_IN_PROGRESS');
    this.name = 'PrivacyRequestInProgressError';
  }
}