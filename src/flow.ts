import { FunctionCallCommand } from "./function-call-command";
import { SetVariableCommand } from "./set-variable-command";
import { SplitCommand, ACTIONS_CONDITIONS } from "./split-command";

export type Request = {
    payload: {
        [key: string]: any;
    },
    variables?: {
        [key: string]: any;
    }
}

export class Flow<T, V extends Partial<T> = T> {
    private splitCommand: SplitCommand<T, V>
    private setVariableCommand: SetVariableCommand<T, V>
    private functionCallCommand: FunctionCallCommand<T, V>

    constructor(private readonly _req: Request) {
        this.splitCommand = new SplitCommand(this);
        this.setVariableCommand = new SetVariableCommand(this);
        this.functionCallCommand = new FunctionCallCommand(this);
    }

    get request() {
        return this._req;
    }

    get payload() {
        return this._req.payload
    }

    get variables() {
        return this._req.variables
    }

    split(conditional: ACTIONS_CONDITIONS, flow: {
        success: (flow: Flow<T, V>) => Flow<T, V>,
        failed: (flow: Flow<T, V>) => Flow<T, V>
    }) {
        return this.splitCommand.mount(conditional, flow);
    }

    setVariable(name: string, value: unknown) {
        return this.setVariableCommand.mount(name, value);
    }

    functionCall(http: {
        name: string, 
        method: "GET" | "POST" | "PUT", 
        url: string
    }, 
    next: { 
        response: (flow: Flow<T, V>, data?: any) => Flow<T, V>, 
        error: (flow: Flow<T, V>) => Flow<T, V>
    } ) {
        return this.functionCallCommand.mount(http, next);
    }

    async run(): Promise<V> {
        //@ts-ignore
        return this._req as V;
    }
}