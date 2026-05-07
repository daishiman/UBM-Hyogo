export class AuditFetchAuthError extends Error {
  constructor(status: number, message?: string) {
    super(`GitHub audit fetch auth error (status=${status})${message ? `: ${message}` : ''}`);
    this.name = 'AuditFetchAuthError';
  }
}

export class FingerprintInputEmptyError extends Error {
  constructor() {
    super('Fingerprint input is empty (all fields undefined)');
    this.name = 'FingerprintInputEmptyError';
  }
}

export class AuditFetchRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditFetchRateLimitError';
  }
}
