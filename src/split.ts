import { RouteSignal } from "./route-signal";
import { Widget } from "./widget";

/**
 * Conditional branching widget.
 *
 * Evaluates a boolean predicate against the workflow context. A truthy result
 * continues down the `moveTo` path; a falsy result throws a {@link RouteSignal}
 * so execution routes to the `elseMoveTo` path without being treated as an error.
 */
export class Split extends Widget {
  private action: {
    fn?: (a: any) => boolean;
  } = {
    fn: undefined,
  };

  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the path taken when the predicate is truthy.
   *
   * @param widget - Widget to execute on a positive match.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);

    return this;
  }

  /**
   * Connects the path taken when the predicate is falsy.
   *
   * @param widget - Widget to execute on a negative match.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);

    return this;
  }

  /**
   * Defines the predicate that decides which branch to follow.
   *
   * @param fn - Function receiving the context and returning a boolean.
   * @returns This widget for chaining.
   */
  case(fn: (a: any) => boolean) {
    this.action.fn = fn;

    return this;
  }

  protected async run(a: any): Promise<void> {
    if (!this.action.fn) {
      throw new Error(
        "To use Split you must set a .case((data: any) => Compare.is(data.payload.act.like.that).in(['this', 'those', 'that'])",
      );
    }

    if (this.action.fn(a)) {
      super.register(`Moved to: ${this.moveToName}`, "info");
      return;
    }

    super.register(`Moved to: ${this.elseMoveToName}`, "info");
    throw new RouteSignal("split:else");
  }
}
