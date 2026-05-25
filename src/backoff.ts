import { BackoffOptions, BackoffStrategy } from "./types";

const DEFAULTS: Required<BackoffOptions> = {
  baseMs: 100,
  factor: 2,
  maxMs: 30000,
  jitter: true,
};

/**
 * Computes the wait time before the next retry attempt.
 *
 * @param attempt - 1-based index of the attempt that just failed.
 * @param strategy - `fixed` keeps the base delay; `exponential` grows it by `factor`.
 * @param options - Backoff tuning options.
 * @returns Delay in milliseconds, capped at `maxMs` and optionally jittered.
 */
export function computeBackoff(
  attempt: number,
  strategy: BackoffStrategy,
  options: BackoffOptions = {},
): number {
  const { baseMs, factor, maxMs, jitter } = { ...DEFAULTS, ...options };

  const raw =
    strategy === "exponential"
      ? baseMs * Math.pow(factor, Math.max(0, attempt - 1))
      : baseMs;

  const capped = Math.min(raw, maxMs);

  return jitter ? Math.random() * capped : capped;
}

/**
 * Resolves after the given delay.
 *
 * @param ms - Milliseconds to wait.
 * @returns A promise that settles once the delay elapses.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
