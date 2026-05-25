import { runWithConcurrency } from "./concurrency";
import { normalizePayloadKey } from "./payload-path";
import { FailedItem, ItemErrorMode } from "./types";
import { isValidLabel, processWhiteLabel } from "./validate-whitelabel";
import { Widget } from "./widget";

type ItemFunction = (item: any, ctx: any) => Promise<any> | any;
type ItemTask = Widget | ItemFunction;
type CloneFn = (ctx: any) => any;
type ItemOutcome = { ok: true; value: any } | { ok: false };

/**
 * Concurrency-limited batch map widget.
 *
 * Maps an async operation over an array resolved from the context, capping the
 * number of in-flight operations. Successful results are collected in order;
 * failures are gathered separately, making partial-failure ETL the default.
 */
export class ParallelMap extends Widget {
  private sourcePath?: string;
  private asKey = "item";
  private concurrencyLimit = 5;
  private task?: ItemTask;
  private intoKey = "processed";
  private errorMode: ItemErrorMode = "collect";
  private errorsKey = "failures";
  private cloneFn: CloneFn = (ctx) => structuredClone(ctx);

  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the success path taken once the batch completes.
   *
   * @param widget - Widget to execute after the batch.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);

    return this;
  }

  /**
   * Connects the failure path taken when the batch aborts in `fail-fast` mode.
   *
   * @param widget - Widget to execute on failure.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);

    return this;
  }

  /**
   * Sets the template expression that resolves the source array.
   *
   * @param path - Expression such as `'{{ payload.records }}'`.
   * @returns This widget for chaining.
   */
  from(path: string) {
    this.sourcePath = path;

    return this;
  }

  /**
   * Names the payload key under which each item is injected into its clone.
   *
   * @param key - Property name (default `'item'`).
   * @returns This widget for chaining.
   */
  as(key: string) {
    this.asKey = key;

    return this;
  }

  /**
   * Caps how many item operations run at once.
   *
   * @param limit - Maximum number of in-flight operations (default `5`).
   * @returns This widget for chaining.
   */
  withConcurrency(limit: number) {
    this.concurrencyLimit = limit;

    return this;
  }

  /**
   * Defines the per-item operation.
   *
   * @param task - A widget branch executed on a clone, or an async function `(item, ctx) => result`.
   * @returns This widget for chaining.
   */
  each(task: ItemTask) {
    this.task = task;

    return this;
  }

  /**
   * Sets the payload key that collects successful results in input order.
   *
   * @param path - Target key, accepting either `'processed'` or `'payload.processed'`.
   * @returns This widget for chaining.
   */
  into(path: string) {
    this.intoKey = normalizePayloadKey(path);

    return this;
  }

  /**
   * Selects failure behavior per item.
   *
   * @param mode - `collect` gathers failures (default); `fail-fast` aborts on the first error.
   * @returns This widget for chaining.
   */
  onItemError(mode: ItemErrorMode) {
    this.errorMode = mode;

    return this;
  }

  /**
   * Sets the payload key that collects failed items in `collect` mode.
   *
   * @param path - Target key, accepting either `'failures'` or `'payload.failures'`.
   * @returns This widget for chaining.
   */
  collectErrorsInto(path: string) {
    this.errorsKey = normalizePayloadKey(path);

    return this;
  }

  /**
   * Overrides the per-item context cloner (default `structuredClone`).
   *
   * @param fn - Custom clone function.
   * @returns This widget for chaining.
   */
  clone(fn: CloneFn) {
    this.cloneFn = fn;

    return this;
  }

  protected async run(a: any): Promise<void> {
    if (!this.sourcePath) {
      throw new Error(
        "To use ParallelMap you must set .from('{{ payload.path.to.array }}')",
      );
    }

    if (!this.task) {
      throw new Error(
        "To use ParallelMap you must set .each(widgetOrFunction)",
      );
    }

    const items = this.resolveItems(a);
    const failures: FailedItem[] = [];

    const outcomes = await runWithConcurrency<any, ItemOutcome>(
      items,
      this.concurrencyLimit,
      async (item, index) => {
        try {
          return { ok: true, value: await this.execute(a, item) };
        } catch (error) {
          if (this.errorMode === "fail-fast") {
            throw error;
          }

          failures.push({ index, item, error });
          return { ok: false };
        }
      },
    );

    a.payload[this.intoKey] = outcomes
      .filter((outcome): outcome is { ok: true; value: any } => outcome.ok)
      .map((outcome) => outcome.value);

    if (this.errorMode === "collect") {
      a.payload[this.errorsKey] = failures;
    }
  }

  private resolveItems(a: any): any[] {
    const source = isValidLabel(this.sourcePath)
      ? processWhiteLabel(this.sourcePath as string, a)
      : undefined;

    if (!Array.isArray(source)) {
      throw new Error(
        `ParallelMap source '${this.sourcePath}' did not resolve to an array`,
      );
    }

    return source;
  }

  private async execute(a: any, item: any): Promise<any> {
    if (this.task instanceof Widget) {
      const itemCtx = this.cloneFn(a);
      itemCtx.payload[this.asKey] = item;
      await this.task.process(itemCtx);

      return itemCtx.payload;
    }

    return (this.task as ItemFunction)(item, a);
  }
}
