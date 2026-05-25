/**
 * Normalizes a configured target path into a single payload key.
 *
 * Accepts both the bare `'results'` form and the `'payload.results'` form so
 * callers can write whichever reads better.
 *
 * @param path - The configured target path.
 * @returns The key relative to the payload object.
 */
export function normalizePayloadKey(path: string): string {
  return path.startsWith("payload.") ? path.slice("payload.".length) : path;
}
