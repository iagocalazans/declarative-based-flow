import { Command } from "./command.interface";
import { Flow } from "./flow";

export class FunctionCallCommand<T, V extends Partial<T> = T>
  implements Command
{
  private _flow: Flow<T, V>;

  constructor(flow: Flow<T, V>) {
    this._flow = flow;
  }

  mount<U extends Promise<unknown>>(
    {
      name,
      fn,
    }: {
      name: string;
      fn: U;
    },
    next: {
      success: (flow: Flow<T, V>) => Flow<T, V>;
      error: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    const { success, error } = next;

    fn.then((value: unknown) => {
      if (!Reflect.has(this._flow.request, "functions")) {
        Reflect.defineProperty(this._flow.request, "functions", {
          enumerable: true,
          value: {},
        });
      }

      Reflect.defineProperty(this._flow.request.functions!, name, {
        enumerable: true,
        writable: false,
        value: value,
      });

      success(this._flow);
    }).catch(() => error(this._flow));

    return this._flow;
  }
}
