"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetVariableCommand = void 0;
class SetVariableCommand {
    constructor(flow) {
        this._flow = flow;
    }
    mount(name, value) {
        Reflect.defineProperty(this._flow.request.payload, name, {
            enumerable: true,
            value
        });
        return this._flow;
    }
}
exports.SetVariableCommand = SetVariableCommand;
