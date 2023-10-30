import { SetVariableCommand } from "./set-variable-command";
import { SplitCommand, ACTIONS_CONDITIONS } from "./split-command";

export type Request = {
    payload: {
        [key: string]: any;
    }
}

export const flow =  <T extends Request, V extends Partial<T> = T>(content: T) => {
    return new Flow<T, V>(content);
}

export class Flow<T, V extends Partial<T> = T> {
    private splitCommand: SplitCommand<T, V>
    private setVariableCommand: SetVariableCommand<T, V>

    constructor(private _req: Request) {
        this.splitCommand = new SplitCommand(this);
        this.setVariableCommand = new SetVariableCommand(this);
    }

    get request() {
        return this._req;
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

    async run(): Promise<V> {
        return this._req.payload as V;
    }
}