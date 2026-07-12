/**
 * DataForSEO failure taxonomy.
 *
 * The only question the payment layer asks is: "did the caller get what they
 * paid for?" These types answer it. A `DataForSEOUpstreamError` means we never
 * delivered data and must not charge; a `DataForSEORequestError` means the
 * caller's input was bad, which we detect before charging wherever possible.
 */

/** DataForSEO nests a status code both on the envelope and on each task. */
export const DFS_OK = 20000;
export const DFS_TASK_CREATED = 20100;

/** The caller's request was malformed. Their fault, no charge. */
export class DataForSEORequestError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DataForSEORequestError";
    this.statusCode = statusCode;
  }
}

/** DataForSEO failed or was unreachable. Our problem, no charge. */
export class DataForSEOUpstreamError extends Error {
  readonly statusCode: number | null;
  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "DataForSEOUpstreamError";
    this.statusCode = statusCode;
  }
}

/** Our credentials are wrong. Never surface upstream detail to the caller. */
export class DataForSEOAuthError extends Error {
  constructor(message = "DataForSEO credentials are invalid or missing") {
    super(message);
    this.name = "DataForSEOAuthError";
  }
}

/**
 * DataForSEO signals client-side problems with 401xx/402xx/405xx codes and
 * server-side ones with 5xxxx. 404xx is "not found", which for a task_get of an
 * unknown id is a client error.
 */
export function classifyStatus(code: number, message: string): Error {
  if (code === 40100 || code === 40101) return new DataForSEOAuthError();
  if (code >= 50000) return new DataForSEOUpstreamError(message, code);
  if (code >= 40000 && code < 50000) return new DataForSEORequestError(message, code);
  return new DataForSEOUpstreamError(message, code);
}
