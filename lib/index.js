"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flow = exports.flow = void 0;
const set_variable_command_1 = require("./set-variable-command");
const split_command_1 = require("./split-command");
const flow = (content) => {
    return new Flow(content);
};
exports.flow = flow;
class Flow {
    constructor(_req) {
        this._req = _req;
        this.splitCommand = new split_command_1.SplitCommand(this);
        this.setVariableCommand = new set_variable_command_1.SetVariableCommand(this);
    }
    get request() {
        return this._req;
    }
    split(conditional, flow) {
        return this.splitCommand.mount(conditional, flow);
    }
    setVariable(name, value) {
        return this.setVariableCommand.mount(name, value);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._req.payload;
        });
    }
}
exports.Flow = Flow;
