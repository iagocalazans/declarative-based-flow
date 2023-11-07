import axios from "axios";
import { Command } from "./command.interface";
import { Flow } from "./flow";

export class HttpCallCommand<T, V extends Partial<T> = T> implements Command {
  private _flow: Flow<T, V>;

  constructor(flow: Flow<T, V>) {
    this._flow = flow;
  }

  mount<U>(
    {
      name,
      method,
      url,
    }: {
      name: string;
      method: "GET" | "POST" | "PUT";
      url: string;
    },
    next: {
      response: (flow: Flow<T, V>, data: U) => Flow<T, V>;
      error: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    if (["get", "post", "put"].indexOf(method.toLowerCase()) === -1) {
      throw "Invalid method, should be one of";
    }

    const { response, error } = next;

    axios({ method: method, url: url })
      .then(({ data }: { data: U }) => {
        if (!Reflect.has(this._flow.request, name)) {
          Reflect.defineProperty(this._flow.request, "http", {
            enumerable: true,
            value: {},
          });
        }

        Reflect.defineProperty(this._flow.request.http!, name, {
          enumerable: true,
          writable: false,
          value: data,
        });

        response(this._flow, data);
      })
      .catch((err) => {
        console.error(err);
        error(this._flow);
      });

    return this._flow;
  }
}
