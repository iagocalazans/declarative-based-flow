"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitCommand = exports.ACTIONS = void 0;
var ACTIONS;
(function (ACTIONS) {
    ACTIONS["TYPE_CHECK"] = "type_check";
    ACTIONS["GREATER_THAN"] = "greater_than";
    ACTIONS["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    ACTIONS["LESSER_THAN"] = "lesser_than";
    ACTIONS["LESSER_THAN_OR_EQUAL"] = "lesser_than_or_equal";
    ACTIONS["EQUAL"] = "equal";
    ACTIONS["NOT_EQUAL"] = "not_equal";
    ACTIONS["IN"] = "in";
    ACTIONS["NOT_IN"] = "not_in";
})(ACTIONS || (exports.ACTIONS = ACTIONS = {}));
class SplitCommand {
    constructor(flow) {
        this._flow = flow;
    }
    mount(conditional, flow) {
        const { success, failed } = flow;
        switch (conditional.action) {
            case ACTIONS.TYPE_CHECK:
                typeof this._flow.request.payload[conditional.property] === conditional.matcher ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.GREATER_THAN:
                Number(this._flow.request.payload[conditional.property]) > Number(conditional.matcher) ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.GREATER_THAN_OR_EQUAL:
                Number(this._flow.request.payload[conditional.property]) >= Number(conditional.matcher) ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.LESSER_THAN:
                Number(this._flow.request.payload[conditional.property]) < Number(conditional.matcher) ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.LESSER_THAN_OR_EQUAL:
                Number(this._flow.request.payload[conditional.property]) <= Number(conditional.matcher) ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.EQUAL:
                this._flow.request.payload[conditional.property] === conditional.matcher ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.NOT_EQUAL:
                this._flow.request.payload[conditional.property] !== conditional.matcher ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.IN:
                const has = conditional.matcher.find(el => el === this._flow.request.payload[conditional.property]);
                !!has ? success(this._flow) : failed(this._flow);
                return this._flow;
            case ACTIONS.NOT_IN:
                const hasnot = conditional.matcher.find(el => el === this._flow.request.payload[conditional.property]);
                !hasnot ? success(this._flow) : failed(this._flow);
                return this._flow;
            default:
                throw "Not a valid Action";
        }
    }
}
exports.SplitCommand = SplitCommand;
