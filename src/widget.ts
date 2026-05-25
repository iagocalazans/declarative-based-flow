import { isRouteSignal } from "./route-signal";

/**
 * Base node of the workflow tree.
 *
 * Every widget owns a success pointer (`left`, reached via `moveTo`) and a
 * failure pointer (`right`, reached via `elseMoveTo`). Execution is driven by
 * the Template Method {@link Widget.process}: it runs the widget's own
 * operation through {@link Widget.run}, then advances into the success branch,
 * routing thrown values to the failure branch when one exists.
 */
export class Widget {
  protected constructor(
    protected readonly uniqueName: symbol,
    private left?: Widget,
    private right?: Widget,
  ) {}

  /**
   * Unique symbol identifying this widget instance.
   */
  get name() {
    return this.uniqueName;
  }

  /**
   * Description of the success-path widget, when connected.
   */
  get moveToName() {
    return this.left?.name.description;
  }

  /**
   * Description of the failure-path widget, when connected.
   */
  get elseMoveToName() {
    return this.right?.name.description;
  }

  protected success(widget: Widget) {
    this.left = widget;
  }

  protected failed(widget: Widget) {
    this.right = widget;
  }

  /**
   * Creates a widget with a unique symbolic name.
   *
   * A subclass that adds its own configuration methods should re-declare this
   * factory so the returned type exposes them, matching the pattern used by the
   * built-in widgets.
   *
   * @param name - Human-readable identifier for the widget.
   * @returns A new widget instance ready to be connected.
   */
  static create(name: string) {
    return new this(Symbol(name));
  }

  protected moveTo(widget: Widget) {
    this.success(widget);

    return this;
  }

  protected elseMoveTo(widget: Widget) {
    this.failed(widget);

    return this;
  }

  protected register(
    a: any,
    level: keyof Pick<
      Console,
      "debug" | "log" | "info" | "error" | "warn"
    > = "log",
  ): void {
    if (level !== "debug" && process.env.ENV !== "development") {
      console[level](
        `[${this.constructor.name}: ${
          this.uniqueName.description
        }]: => ${JSON.stringify(a, null, 2)}`,
      );
    }
  }

  /**
   * Widget-specific operation. Concrete widgets override this hook to perform
   * their work. Throwing here routes execution to this widget's failure path.
   *
   * @param _ctx - The workflow context (payload and variables).
   */
  protected async run(_ctx: any): Promise<void> {}

  /**
   * Executes this widget and the rest of the connected tree.
   *
   * Wraps a bare input into `{ payload }`, runs this widget's operation, then
   * advances into the success branch. The returned context is fully resolved:
   * every downstream widget is awaited before this method settles.
   *
   * @param a - Raw input on entry, or an already-wrapped workflow context.
   * @returns The resolved workflow context.
   */
  async process(a: any) {
    if (!Reflect.has(a, "payload")) {
      a = { payload: a };
    }

    await this.run(a);
    await this.traverse(a);

    this.register(a, "debug");
    return a;
  }

  private async traverse(a: any): Promise<void> {
    if (!this.left) {
      return;
    }

    try {
      await this.left.process(a);
    } catch (error) {
      if (this.left.right) {
        await this.left.right.process(a);
        return;
      }

      if (isRouteSignal(error)) {
        return;
      }

      throw error;
    }
  }
}
