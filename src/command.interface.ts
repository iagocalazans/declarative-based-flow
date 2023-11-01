import { Flow } from "./";

export interface Command {
  mount(...args: unknown[]): Flow<any>;
}
