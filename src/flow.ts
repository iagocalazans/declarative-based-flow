import { Command } from "./command.interface";
import { FunctionCallCommand } from "./function-call-command";
import { HttpCallCommand } from "./http-call-command";
import { ACTIONS_CONDITIONS, SplitCommand } from "./split-command";
import { SetVariableCommand } from "./set-variable-command";
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

export interface Request {
  payload: Record<string, unknown>;
  variables?: Record<string, unknown>;
  functions?: Record<string, unknown>;
  http?: Record<string, unknown>;
}

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

  get functions() {
    return this._req.functions;
  }

  get http() {
    return this._req.http;
  }

  split(
    conditional: ACTIONS_CONDITIONS,
    flow: {
      success: (flow: Flow<T, V>) => Flow<T, V>;
      failed: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    return this.execute(this.splitCommand, conditional, flow);
  }

  setVariable(name: string, value: unknown) {
    return this.execute(this.setVariableCommand, name, value);
  }

  functionCall<U>(
    opts: {
      name: string;
      fn: U;
    },
    next: {
      success: (flow: Flow<T, V>) => Flow<T, V>;
      error: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    return this.execute(this.functionCallCommand, opts, next);
  }

  httpCall<U>(
    http: {
      name: string;
      method: "GET" | "POST" | "PUT";
      url: string;
    },
    next: {
      response: (flow: Flow<T, V>, data: U) => Flow<T, V>;
      error: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    return this.execute(this.httpCallCommand, http, next);
  }

  execute(Command: new (t: Flow<T, V>) => Command, ...args: unknown[]) {
    const useLogger = (Instance: new (t: Flow<T, V>) => Command) => {
      logger.debug(
        `COMMAND: [ ${ Instance.name } ] called with args: ${ JSON.stringify(args, null, 2) }`
      );
        
      const i = new Command(this);
      const mounted = i.mount(...args);

      logger.info(
        `[ ${ Instance.name } ]: Returns with output: ${ JSON.stringify(this._req, null, 2) }`
      );

      return mounted;
    };

    return useLogger(Command);
  }

  async run(): Promise<V> {
    return this._req as unknown as V;
  }
}
