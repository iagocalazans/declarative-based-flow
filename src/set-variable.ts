import { isValidLabel, processWhiteLabel } from "./validate-whitelabel";
import { Widget } from "./widget";

type VariableAction = {
  var: string;
  use: unknown;
};

/**
 * Variable extraction widget.
 *
 * Resolves one or more template expressions (`{{ payload.path.to.value }}`) or
 * literal values and stores each as an immutable entry on the context's
 * `variables` bag. Multiple `variable()` calls accumulate, so a single widget
 * can extract several values.
 */
export class SetVariable extends Widget {
  private actions: VariableAction[] = [];

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
   * Declares a variable to extract. Can be called multiple times.
   *
   * @param varName - Name of the variable to store on `variables`.
   * @param whitelabel - Template expression to resolve, or a literal value.
   * @returns This widget for chaining.
   */
  variable(varName: string, whitelabel: string) {
    this.actions.push({ var: varName, use: whitelabel });

    return this;
  }

  protected async run(a: any): Promise<void> {
    if (this.actions.length === 0) {
      throw new Error(
        'To use SetVariable you must set .variable("varName", "{{ whitelabel.to.use }}")'
      );
    }

    if (!Reflect.has(a, "variables")) {
      Reflect.defineProperty(a, "variables", {
        configurable: true,
        enumerable: true,
        value: {},
      });
    }

    for (const action of this.actions) {
      const parsedValue = isValidLabel(action.use)
        ? processWhiteLabel(action.use as string, a)
        : action.use;

      Reflect.defineProperty(a.variables, action.var, {
        configurable: false,
        writable: false,
        enumerable: true,
        value: parsedValue,
      });

      super.register(`Defined var ${action.var} = ${parsedValue}`, "info");
    }
  }
}
