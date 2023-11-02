import { HttpCallCommand as HttpCallCommand } from "./http-call-command";
import { SetVariableCommand } from "./set-variable-command";
import { SplitCommand, ACTIONS_CONDITIONS } from "./split-command";
import { FunctionCallCommand } from "./function-call-command";
import winston from "winston";

// TODO: REMOVE LOGGER TO ANOTHER FOLDER
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "flow.log" }),
  ],
});

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
  private functionCallCommand: typeof FunctionCallCommand<T, V>;

  constructor(private readonly _req: Request) {
    this.splitCommand = SplitCommand<T, V>;
    this.setVariableCommand = SetVariableCommand<T, V>;
    this.httpCallCommand = HttpCallCommand<T, V>;
    this.functionCallCommand = FunctionCallCommand<T, V>;
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
      logger.info(
        `COMMAND: [${Instance.name}] called with args: ${JSON.stringify(args)}`
      );

      const i = new command(this);
      const mounted = i.mount(...args);

      logger.info(
        `POST-COMMAND: [${
          Instance.name
        }] returned following output: ${JSON.stringify(this._req)}`
      );

      return mounted;
    };

    return useLogger(command);
  }

  async run(): Promise<V> {
    //@ts-ignore
    return this._req as V;
  }
}
