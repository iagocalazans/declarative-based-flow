import { Command } from "./command.interface";
import { Flow } from "./flow";

export class SetVariableCommand<T, V extends Partial<T> = T>
  implements Command
{
  private _flow: Flow<T, V>;

  constructor(flow: Flow<T, V>) {
    this._flow = flow;
  }

  mount(name: string, value: unknown) {
    if (!Reflect.has(this._flow.request, "variables")) {
      Reflect.defineProperty(this._flow.request, "variables", {
        enumerable: true,
        value: {},
      });
    }

    Reflect.defineProperty(this._flow.request.variables!, name, {
      enumerable: true,
      writable: false,
      value,
    });

    return this._flow;
  }
}
