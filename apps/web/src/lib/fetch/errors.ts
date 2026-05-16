export class AuthRequiredError extends Error {
  constructor(message = "AUTH_REQUIRED") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;

  constructor(status: number, bodyText: string) {
    super(`fetchAuthed failed: ${status}`);
    this.name = "FetchAuthedError";
    this.status = status;
    this.bodyText = bodyText;
  }
}
