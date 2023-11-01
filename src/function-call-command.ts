import { Flow } from "./flow";
import { Command } from "./command.interface";

export class FunctionCallCommand<T, V extends Partial<T> = T>
  implements Command
{
  private _flow: Flow<T, V>;

  constructor(flow: Flow<T, V>) {
    this._flow = flow;
  }

  mount({ name, fn }: { name: string; fn: any }, success: any, error: any) {
    new Promise(async (resolve, reject) => {
      try {
        resolve(await fn());
      } catch (error) {
        reject(error);
      }
    })
      .then(({ data }: any) => {
        if (!Reflect.has(this._flow.request, "functions")) {
          Reflect.defineProperty(this._flow.request, "functions", {
            enumerable: true,
            value: {},
          });
        }

        //@ts-ignore
        Reflect.defineProperty(this._flow.request.functions, name, {
          enumerable: true,
          writable: false,
          value: data,
        });

        success(this._flow);
      })
      .catch((err) => {
        console.error(err);
        error(this._flow);
      });

    return this._flow;
  }
}
