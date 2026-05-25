import { computeBackoff, delay } from "./backoff";
import { isRouteSignal } from "./route-signal";
import { BackoffOptions, BackoffStrategy } from "./types";
import { Widget } from "./widget";

type RetryPredicate = (error: unknown) => boolean;
type CloneFn = (ctx: any) => any;

/**
 * Retry decorator widget.
 *
 * Re-executes a wrapped branch on retryable failures using a configurable
 * backoff. Routing signals are never retried. When attempts are exhausted the
 * last error propagates, routing execution to the failure path.
 */
export class Retry extends Widget {
  private maxAttempts = 3;
  private strategy: BackoffStrategy = "exponential";
  private backoffOptions: BackoffOptions = {};
  private predicate?: RetryPredicate;
  private inner?: Widget;
  private isolated = false;
  private cloneFn: CloneFn = (ctx) => structuredClone(ctx);

  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the success path taken once the wrapped branch succeeds.
   *
   * @param widget - Widget to execute on success.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);

    return this;
  }

  /**
   * Connects the failure path taken when every attempt fails.
   *
   * @param widget - Widget to execute on exhaustion.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);

    return this;
  }

  /**
   * Sets the maximum number of attempts (including the first).
   *
   * @param count - Total attempts; defaults to `3`.
   * @returns This widget for chaining.
   */
  attempts(count: number) {
    this.maxAttempts = count;

    return this;
  }

  /**
   * Configures the backoff used between attempts.
   *
   * @param strategy - `fixed` or `exponential`.
   * @param options - Backoff tuning options.
   * @returns This widget for chaining.
   */
  backoff(strategy: BackoffStrategy, options: BackoffOptions = {}) {
    this.strategy = strategy;
    this.backoffOptions = options;

    return this;
  }

  /**
   * Restricts which errors are retryable. Defaults to any `Error`.
   *
   * @param predicate - Returns `true` when the error should be retried.
   * @returns This widget for chaining.
   */
  retryIf(predicate: RetryPredicate) {
    this.predicate = predicate;

    return this;
  }

  /**
   * Runs each attempt on a fresh clone, committing mutations only on success.
   *
   * Use this when the wrapped branch is not naturally idempotent (for example
   * when it defines variables), since variables cannot be redefined in place.
   *
   * @returns This widget for chaining.
   */
  isolate() {
    this.isolated = true;

    return this;
  }

  /**
   * Overrides the clone function used by {@link Retry.isolate}.
   *
   * @param fn - Custom clone function.
   * @returns This widget for chaining.
   */
  clone(fn: CloneFn) {
    this.cloneFn = fn;

    return this;
  }

  /**
   * Sets the branch to execute with retry semantics.
   *
   * @param widget - Entry widget of the wrapped branch.
   * @returns This widget for chaining.
   */
  wrap(widget: Widget) {
    this.inner = widget;

    return this;
  }

  protected async run(a: any): Promise<void> {
    if (!this.inner) {
      throw new Error("To use Retry you must set .wrap(widget)");
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        await this.attempt(a);

        return;
      } catch (error) {
        if (isRouteSignal(error)) {
          throw error;
        }

        lastError = error;

        if (attempt >= this.maxAttempts || !this.isRetryable(error)) {
          throw error;
        }

        super.register(
          `Attempt ${attempt}/${this.maxAttempts} failed, retrying`,
          "warn",
        );

        await delay(
          computeBackoff(attempt, this.strategy, this.backoffOptions),
        );
      }
    }

    throw lastError;
  }

  private async attempt(a: any): Promise<void> {
    if (!this.isolated) {
      await (this.inner as Widget).process(a);

      return;
    }

    const attemptCtx = this.cloneFn(a);
    await (this.inner as Widget).process(attemptCtx);
    this.commit(a, attemptCtx);
  }

  private commit(a: any, attemptCtx: any): void {
    Object.assign(a.payload, attemptCtx.payload);

    if (!attemptCtx.variables) {
      return;
    }

    if (!Reflect.has(a, "variables")) {
      Reflect.defineProperty(a, "variables", {
        configurable: true,
        enumerable: true,
        value: {},
      });
    }

    for (const [key, value] of Object.entries(attemptCtx.variables)) {
      if (!Reflect.has(a.variables, key)) {
        Reflect.defineProperty(a.variables, key, {
          configurable: false,
          writable: false,
          enumerable: true,
          value,
        });
      }
    }
  }

  private isRetryable(error: unknown): boolean {
    if (this.predicate) {
      return this.predicate(error);
    }

    return error instanceof Error;
  }
}
