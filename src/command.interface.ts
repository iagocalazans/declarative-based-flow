import { Flow } from "./flow";

export interface Command {
    mount(...args: any[]): Flow<any>;
}
