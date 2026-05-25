/**
 * Runs an async task over every item with a bounded number of concurrent executions.
 *
 * Results are returned in input order regardless of completion order. On the
 * first rejection the pool stops scheduling new work, lets in-flight tasks
 * settle (so no rejection goes unhandled), then rethrows that first error.
 *
 * @typeParam T - Item type.
 * @typeParam R - Result produced per item.
 * @param items - Items to process.
 * @param limit - Maximum in-flight tasks; a non-positive value runs all at once.
 * @param task - Async operation applied to each item.
 * @returns Ordered array of results.
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);

  if (items.length === 0) {
    return results;
  }

  const effectiveLimit =
    limit > 0 ? Math.min(limit, items.length) : items.length;

  let cursor = 0;
  let aborted = false;
  let firstError: unknown;

  const worker = async (): Promise<void> => {
    while (cursor < items.length && !aborted) {
      const index = cursor++;

      try {
        results[index] = await task(items[index], index);
      } catch (error) {
        if (!aborted) {
          aborted = true;
          firstError = error;
        }

        return;
      }
    }
  };

  const workers = Array.from({ length: effectiveLimit }, () => worker());
  await Promise.all(workers);

  if (aborted) {
    throw firstError;
  }

  return results;
}
