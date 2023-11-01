import { Command } from "./command.interface";
import { HttpCallCommand as HttpCallCommand } from "./http-call-command";
import { SetVariableCommand } from "./set-variable-command";
import { SplitCommand, ACTIONS_CONDITIONS } from "./split-command";
import { FunctionCallCommand } from "./function-call-command";

export type Request = {
  payload: {
    [key: string]: any;
  };
  variables?: {
    [key: string]: any;
  };
  functions?: {
    [key: string]: any;
  };
  http?: {
    [key: string]: any;
  };
};

export class Flow<T, V extends Partial<T> = T> {
  private splitCommand: typeof SplitCommand<T, V>;
  private setVariableCommand: typeof SetVariableCommand<T, V>;
  private httpCallCommand: typeof HttpCallCommand<T, V>;
  private functionCallCommand: typeof FunctionCallCommand<T, V>; // TODO: rafaelib implement a FunctionCallCommand here!

  constructor(private readonly _req: Request) {
    this.splitCommand = SplitCommand<T, V>;
    this.setVariableCommand = SetVariableCommand<T, V>;
    this.httpCallCommand = HttpCallCommand<T, V>;
    this.functionCallCommand = FunctionCallCommand<T, V>; // TODO: rafaelib implement a FunctionCallCommand here!
  }

  get request() {
    return this._req;
  }

  get payload() {
    return this._req.payload;
  }

  get variables() {
    return this._req.variables;
  }

  split(
    conditional: ACTIONS_CONDITIONS,
    flow: {
      success: (flow: Flow<T, V>) => Flow<T, V>;
      failed: (flow: Flow<T, V>) => Flow<T, V>;
    }
  ) {
    return this.execute(this.splitCommand, conditional, flow);
  }

  setVariable(name: string, value: unknown) {
    return this.execute(this.setVariableCommand, name, value);
  }

  functionCall(
    opts: {
      name: string;
      fn: any;
    },
    success: (flow: Flow<T, V>) => Flow<T, V>,
    error: (flow: Flow<T, V>) => Flow<T, V>
  ) {
    return this.execute(this.functionCallCommand, opts, success, error);
  }

  httpCall(
    http: {
      name: string;
      method: "GET" | "POST" | "PUT";
      url: string;
    },
    next: {
      response: (flow: Flow<T, V>, data?: any) => Flow<T, V>;
      error: (flow: Flow<T, V>) => Flow<T, V>;
    }
  ) {
    return this.execute(this.httpCallCommand, http, next);
  }

  execute(command: any, ...args: any[]) {
    const useLogger = (Instance: any) => {
      console.log("COMMAND: [", Instance.name, "] called with args: ", args); // TODO: rafaelib implement a logger here!
      const i = new command(this);

      const mounted = i.mount(...args);
      console.log("POST-COMMAND: [", Instance.name, "] , ", this._req); // TODO: rafaelib implement a logger here!

      return mounted;
    };

    return useLogger(command);
  }

  async run(): Promise<V> {
    //@ts-ignore
    return this._req as V;
  }
}
