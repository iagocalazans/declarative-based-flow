import { Flow } from ".";

export interface Command {
    mount(...args: any[]): Flow<any>;
}
