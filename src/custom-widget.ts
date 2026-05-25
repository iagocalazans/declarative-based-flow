import { Widget } from "./widget";

/**
 * Base class for user-defined widgets.
 *
 * Override the protected `run(ctx)` hook to implement business logic; the engine
 * advances the workflow automatically. Inherits the polymorphic `create`
 * factory, so subclasses keep their own methods on the created instance.
 */
export class CustomWidget extends Widget {
  static create(name: string) {
    return new this(Symbol(name));
  }

  /**
   * Connects the next widget in the success path.
   *
   * @param widget - Widget to execute after this one.
   * @returns This widget for chaining.
   */
  moveTo(widget: Widget) {
    super.success(widget);
    return this;
  }

  /**
   * Connects the widget executed when this widget throws.
   *
   * @param widget - Widget to execute on failure.
   * @returns This widget for chaining.
   */
  elseMoveTo(widget: Widget) {
    super.failed(widget);
    return this;
  }
}
