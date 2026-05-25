/**
 * Control-flow marker used to route execution to a widget's failure path
 * without representing an operational error.
 *
 * It is intentionally not an `Error` subclass so that resilience widgets which
 * inspect `error instanceof Error` ignore routing decisions automatically and
 * never retry or count them as failures.
 */
export class RouteSignal {
  /**
   * @param reason - Short, machine-readable description of why routing occurred.
   */
  constructor(readonly reason: string) {}
}

/**
 * Type guard that detects a {@link RouteSignal}.
 *
 * @param value - The caught value to inspect.
 * @returns `true` when the value is a routing signal rather than a real error.
 */
export function isRouteSignal(value: unknown): value is RouteSignal {
  return value instanceof RouteSignal;
}
