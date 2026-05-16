/**
 * Error thrown by stub adapters when a method hasn't been implemented yet.
 * The REST layer in `connections/routes.ts` translates this into HTTP 501.
 */
export class NotImplementedError extends Error {
  constructor(platform: string, method: string) {
    super(`${platform}: ${method} is not implemented yet`);
    this.name = "NotImplementedError";
  }
}
