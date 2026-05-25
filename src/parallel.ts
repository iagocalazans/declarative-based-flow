import { runWithConcurrency } from "./concurrency";
import { normalizePayloadKey } from "./payload-path";
import { ParallelErrorMode, SettledBranchResult } from "./types";
import { Widget } from "./widget";

type CloneFn = (ctx: any) => any;
type MergeFn = (ctx: any, results: Record<string, SettledBranchResult>) => void;
type Branch = { name: string; widget: Widget };

/**
 * Fan-out / fan-in widget.
 *
 * Runs independent named branches concurrently, each on an isolated clone of
 * the context, then merges their results back. Ideal for multi-source ETL
 * extraction where several systems are queried at once.
 */
export class Parallel extends Widget {
  private branches: Branch[] = [];
  private concurrencyLimit = 0;
  private errorMode: ParallelErrorMode = "fail-fast";
  private intoKey = "results";
  private cloneFn: CloneFn = (ctx) => structuredClone(ctx);
  private mergeFn?: MergeFn;

  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the success path taken once every branch resolves.
   *
   * @param widget - Widget to execute after the fan-in completes.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);

    return this;
  }

  /**
   * Connects the failure path taken when the group fails in `fail-fast` mode.
   *
   * @param widget - Widget to execute on failure.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);

    return this;
  }

  /**
   * Registers a concurrently executed branch.
   *
   * @param name - Stable key under which the branch result is merged.
   * @param widget - Entry widget of the branch subtree.
   * @returns This widget for chaining.
   */
  branch(name: string, widget: Widget) {
    this.branches.push({ name, widget });

    return this;
  }

  /**
   * Caps how many branches run at once. Omit (or pass 0) to run all at once.
   *
   * @param limit - Maximum number of in-flight branches.
   * @returns This widget for chaining.
   */
  concurrency(limit: number) {
    this.concurrencyLimit = limit;

    return this;
  }

  /**
   * Selects failure behavior for the group.
   *
   * @param mode - `fail-fast` aborts on the first rejection; `settle` collects every outcome.
   * @returns This widget for chaining.
   */
  onError(mode: ParallelErrorMode) {
    this.errorMode = mode;

    return this;
  }

  /**
   * Sets the payload key under which branch results are merged.
   *
   * @param path - Target key, accepting either `'results'` or `'payload.results'`.
   * @returns This widget for chaining.
   */
  into(path: string) {
    this.intoKey = normalizePayloadKey(path);

    return this;
  }

  /**
   * Overrides the per-branch context cloner (default `structuredClone`).
   *
   * Use this when the payload holds values `structuredClone` cannot copy, such
   * as functions or class instances.
   *
   * @param fn - Custom clone function.
   * @returns This widget for chaining.
   */
  clone(fn: CloneFn) {
    this.cloneFn = fn;

    return this;
  }

  /**
   * Replaces the default merge with a custom reducer.
   *
   * The reducer receives the parent context and a map of branch outcomes whose
   * `value` is the resolved branch context.
   *
   * @param fn - Custom merge function.
   * @returns This widget for chaining.
   */
  merge(fn: MergeFn) {
    this.mergeFn = fn;

    return this;
  }

  protected async run(a: any): Promise<void> {
    if (this.branches.length === 0) {
      throw new Error(
        "To use Parallel you must add at least one .branch(name, widget)",
      );
    }

    const settled =
      this.errorMode === "settle"
        ? await this.runSettled(a)
        : await this.runFailFast(a);

    this.commit(a, settled);
  }

  private async runFailFast(
    a: any,
  ): Promise<Record<string, SettledBranchResult>> {
    const outcomes = await runWithConcurrency(
      this.branches,
      this.concurrencyLimit,
      async ({ name, widget }) => {
        const branchCtx = this.cloneFn(a);
        await widget.process(branchCtx);

        return { name, status: "fulfilled", value: branchCtx } as const;
      },
    );

    return this.indexByName(outcomes);
  }

  private async runSettled(
    a: any,
  ): Promise<Record<string, SettledBranchResult>> {
    const outcomes = await runWithConcurrency<Branch, SettledBranchResult>(
      this.branches,
      this.concurrencyLimit,
      async ({ name, widget }) => {
        const branchCtx = this.cloneFn(a);

        try {
          await widget.process(branchCtx);

          return { name, status: "fulfilled", value: branchCtx };
        } catch (error) {
          return { name, status: "rejected", error };
        }
      },
    );

    return this.indexByName(outcomes);
  }

  private indexByName(
    outcomes: SettledBranchResult[],
  ): Record<string, SettledBranchResult> {
    const byName: Record<string, SettledBranchResult> = {};

    for (const outcome of outcomes) {
      byName[outcome.name] = outcome;
    }

    return byName;
  }

  private commit(a: any, results: Record<string, SettledBranchResult>): void {
    if (this.mergeFn) {
      this.mergeFn(a, results);

      return;
    }

    const merged: Record<string, any> = {};

    for (const [name, result] of Object.entries(results)) {
      merged[name] =
        result.status === "fulfilled"
          ? (result.value as { payload: unknown }).payload
          : { error: String(result.error) };
    }

    a.payload[this.intoKey] = merged;
  }
}
