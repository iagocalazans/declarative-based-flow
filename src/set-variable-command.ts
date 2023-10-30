import { Flow } from "./flow";
import { Command } from "./command.interface";


export class SetVariableCommand<T, V extends Partial<T> = T> implements Command {
    private _flow: Flow<T, V>;

    constructor(flow: Flow<T, V>) {
        this._flow = flow;
    }

    mount(name: string, value: unknown) {
        Reflect.defineProperty(this._flow.request.payload, name, {
            enumerable: true,
            value
        });

        return this._flow;
    }
}