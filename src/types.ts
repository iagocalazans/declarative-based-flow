/**
 * Canonical data structure that flows through every widget.
 *
 * @typeParam P - Shape of the mutable payload object.
 * @typeParam V - Shape of the immutable variables bag populated by `SetVariable`.
 */
export interface WorkflowContext<
  P extends Record<string, any> = Record<string, any>,
  V extends Record<string, any> = Record<string, any>,
> {
  payload: P;
  variables?: V;
}

/**
 * Strategy used to compute the wait time between retry attempts.
 */
export type BackoffStrategy = "fixed" | "exponential";

/**
 * Tuning options for backoff calculation.
 */
export interface BackoffOptions {
  /** Base delay in milliseconds applied to the first retryable failure. */
  baseMs?: number;
  /** Multiplier applied per attempt when using the `exponential` strategy. */
  factor?: number;
  /** Upper bound in milliseconds that a computed delay can never exceed. */
  maxMs?: number;
  /** When `true`, applies full jitter to spread retries and avoid thundering herds. */
  jitter?: boolean;
}

/**
 * Determines how a `Parallel` widget reacts when one of its branches throws.
 *
 * - `fail-fast`: the first rejection aborts the group and routes to the failure path.
 * - `settle`: every branch runs to completion and outcomes are collected, never throwing.
 */
export type ParallelErrorMode = "fail-fast" | "settle";

/**
 * Determines how a `ParallelMap` widget reacts when an item operation throws.
 *
 * - `collect`: failures are gathered into a separate bucket (partial-failure ETL).
 * - `fail-fast`: the first item error aborts the batch and routes to the failure path.
 */
export type ItemErrorMode = "collect" | "fail-fast";

/**
 * Outcome of a single branch when a `Parallel` widget runs in `settle` mode.
 */
export interface SettledBranchResult {
  name: string;
  status: "fulfilled" | "rejected";
  value?: unknown;
  error?: unknown;
}

/**
 * Record describing a single item that failed during a `ParallelMap` batch.
 *
 * @typeParam T - Type of the item that failed.
 */
export interface FailedItem<T = unknown> {
  index: number;
  item: T;
  error: unknown;
}
