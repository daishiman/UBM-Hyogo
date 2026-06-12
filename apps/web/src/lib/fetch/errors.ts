import type { ApiTransportDescriptor } from "./transport";

export class AuthRequiredError extends Error {
  constructor(message = "AUTH_REQUIRED") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  readonly transport?: ApiTransportDescriptor;
  constructor(status: number, bodyText: string, transport?: ApiTransportDescriptor) {
    super(`fetchAuthed failed: ${status}`);
    this.name = "FetchAuthedError";
    this.status = status;
    this.bodyText = bodyText;
    if (transport !== undefined) this.transport = transport;
  }
}
