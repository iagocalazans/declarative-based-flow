/* eslint-disable no-case-declarations */
import { Command } from "./command.interface";
import { Flow } from "./flow";
import { Request } from "./index";

export enum ACTIONS {
  TYPE_CHECK = "type_check",
  GREATER_THAN = "greater_than",
  GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
  LESSER_THAN = "lesser_than",
  LESSER_THAN_OR_EQUAL = "lesser_than_or_equal",
  EQUAL = "equal",
  NOT_EQUAL = "not_equal",
  IN = "in",
  NOT_IN = "not_in",
}

type TypeOf =
  | "undefined"
  | "object"
  | "boolean"
  | "number"
  | "bigint"
  | "string"
  | "symbol"
  | "function";

export interface TypeCheck {
  action: ACTIONS.TYPE_CHECK;
  property: keyof Request["payload"];
  matcher: TypeOf;
}

export interface GreaterThan {
  action: ACTIONS.GREATER_THAN;
  property: keyof Request["payload"];
  matcher: number;
}

export interface GreaterThanOrEqual {
  action: ACTIONS.GREATER_THAN_OR_EQUAL;
  property: keyof Request["payload"];
  matcher: number;
}

export interface LesserThan {
  action: ACTIONS.LESSER_THAN;
  property: keyof Request["payload"];
  matcher: number;
}

export interface LesserThanOrEqual {
  action: ACTIONS.LESSER_THAN_OR_EQUAL;
  property: keyof Request["payload"];
  matcher: number;
}

export interface Equal {
  action: ACTIONS.EQUAL;
  property: keyof Request["payload"];
  matcher: any;
}

export interface NotEqual {
  action: ACTIONS.NOT_EQUAL;
  property: keyof Request["payload"];
  matcher: any;
}

export interface In {
  action: ACTIONS.IN;
  property: keyof Request["payload"];
  matcher: any[];
}

export interface NotIn {
  action: ACTIONS.NOT_IN;
  property: keyof Request["payload"];
  matcher: any[];
}

export type ACTIONS_CONDITIONS =
  | TypeCheck
  | GreaterThan
  | GreaterThanOrEqual
  | LesserThan
  | LesserThanOrEqual
  | Equal
  | NotEqual
  | In
  | NotIn;

export class SplitCommand<T, V extends Partial<T> = T> implements Command {
  private _flow: Flow<T, V>;

  constructor(flow: Flow<T, V>) {
    this._flow = flow;
  }

  mount(
    conditional: ACTIONS_CONDITIONS,
    flow: {
      success: (flow: Flow<T, V>) => Flow<T, V>;
      failed: (flow: Flow<T, V>) => Flow<T, V>;
    },
  ) {
    const { success, failed } = flow;

    switch (conditional.action) {
      case ACTIONS.TYPE_CHECK:
        typeof this._flow.request.payload[conditional.property] ===
        conditional.matcher
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.GREATER_THAN:
        Number(this._flow.request.payload[conditional.property]) >
        Number(conditional.matcher)
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.GREATER_THAN_OR_EQUAL:
        Number(this._flow.request.payload[conditional.property]) >=
        Number(conditional.matcher)
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.LESSER_THAN:
        Number(this._flow.request.payload[conditional.property]) <
        Number(conditional.matcher)
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.LESSER_THAN_OR_EQUAL:
        Number(this._flow.request.payload[conditional.property]) <=
        Number(conditional.matcher)
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.EQUAL:
        this._flow.request.payload[conditional.property] === conditional.matcher
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.NOT_EQUAL:
        this._flow.request.payload[conditional.property] !== conditional.matcher
          ? success(this._flow)
          : failed(this._flow);

        return this._flow;

      case ACTIONS.IN:
        const has = conditional.matcher.find(
          (el) => el === this._flow.request.payload[conditional.property],
        );
        has ? success(this._flow) : failed(this._flow);

        return this._flow;

      case ACTIONS.NOT_IN:
        const hasnot = conditional.matcher.find(
          (el) => el === this._flow.request.payload[conditional.property],
        );
        !hasnot ? success(this._flow) : failed(this._flow);

        return this._flow;

      default:
        throw "Not a valid Action";
    }
  }
}
