import { isRouteSignal } from "./route-signal";
import { Widget } from "./widget";

type FailurePredicate = (error: unknown) => boolean;
type CircuitState = "closed" | "open" | "half-open";

/**
 * Error thrown when a {@link CircuitBreaker} rejects a call because the circuit
 * is open. Routes execution to the breaker's failure path.
 */
export class CircuitOpenError extends Error {
  constructor(breaker: string) {
    super(`Circuit '${breaker}' is open`);
    this.name = "CircuitOpenError";
  }
}

/**
 * Circuit breaker decorator widget.
 *
 * Tracks consecutive failures of a wrapped branch. After `threshold` failures
 * the circuit opens and calls fast-fail (routing to the failure path) until a
 * cooldown elapses, at which point a half-open probe decides whether to close.
 * State lives on the instance, so it is shared across every flow invocation.
 */
export class CircuitBreaker extends Widget {
  private failureThreshold = 5;
  private cooldownMs = 30000;
  private halfOpenLimit = 1;
  private failurePredicate?: FailurePredicate;
  private inner?: Widget;

  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;
  private halfOpenInFlight = 0;

  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the success path taken when the wrapped branch succeeds.
   *
   * @param widget - Widget to execute on success.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);

    return this;
  }

  /**
   * Connects the failure path, also used as the fallback while the circuit is open.
   *
   * @param widget - Widget to execute on failure or short-circuit.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);

    return this;
  }

  /**
   * Sets how many consecutive failures open the circuit.
   *
   * @param count - Failure threshold; defaults to `5`.
   * @returns This widget for chaining.
   */
  threshold(count: number) {
    this.failureThreshold = count;

    return this;
  }

  /**
   * Sets how long the circuit stays open before allowing a half-open probe.
   *
   * @param ms - Cooldown in milliseconds; defaults to `30000`.
   * @returns This widget for chaining.
   */
  cooldown(ms: number) {
    this.cooldownMs = ms;

    return this;
  }

  /**
   * Sets how many concurrent probes are allowed while half-open.
   *
   * @param count - Probe limit; defaults to `1`.
   * @returns This widget for chaining.
   */
  halfOpenAttempts(count: number) {
    this.halfOpenLimit = count;

    return this;
  }

  /**
   * Restricts which errors count toward opening the circuit. Defaults to any `Error`.
   *
   * @param predicate - Returns `true` when the error should count as a failure.
   * @returns This widget for chaining.
   */
  isFailure(predicate: FailurePredicate) {
    this.failurePredicate = predicate;

    return this;
  }

  /**
   * Sets the branch protected by this breaker.
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
      throw new Error("To use CircuitBreaker you must set .wrap(widget)");
    }

    this.refreshState();

    if (this.state === "open" || !this.reserveProbe()) {
      super.register(
        `Circuit open, short-circuiting ${this.name.description}`,
        "warn",
      );

      throw new CircuitOpenError(this.name.description ?? "unknown");
    }

    try {
      await this.inner.process(a);
      this.recordSuccess();
    } catch (error) {
      this.releaseProbe();

      if (isRouteSignal(error)) {
        throw error;
      }

      this.recordFailure(error);
      throw error;
    }
  }

  private refreshState(): void {
    if (
      this.state === "open" &&
      Date.now() - this.openedAt >= this.cooldownMs
    ) {
      this.state = "half-open";
      this.halfOpenInFlight = 0;
    }
  }

  private reserveProbe(): boolean {
    if (this.state !== "half-open") {
      return true;
    }

    if (this.halfOpenInFlight >= this.halfOpenLimit) {
      return false;
    }

    this.halfOpenInFlight++;
    return true;
  }

  private releaseProbe(): void {
    this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
  }

  private recordSuccess(): void {
    this.releaseProbe();
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  private recordFailure(error: unknown): void {
    if (!this.countsAsFailure(error)) {
      return;
    }

    this.consecutiveFailures++;

    if (
      this.state === "half-open" ||
      this.consecutiveFailures >= this.failureThreshold
    ) {
      this.open();
    }
  }

  private open(): void {
    this.state = "open";
    this.openedAt = Date.now();
  }

  private countsAsFailure(error: unknown): boolean {
    if (this.failurePredicate) {
      return this.failurePredicate(error);
    }

    return error instanceof Error;
  }
}
