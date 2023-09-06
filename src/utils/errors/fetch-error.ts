import type { WebAPICallResult } from "@slack/web-api";

export class RequestError extends Error {
  private isRequestError = true;

  constructor(err?: string, public readonly response?: WebAPICallResult) {
    super(err);
  }
}
