import { Flow as FlowClass } from "./flow";

export type Request = {
    payload: {
        [key: string]: any;
    }
}

export const flow =  <T extends Request, V extends Partial<T> = T>(content: T) => {
    return new FlowClass<T, V>(content);
}

export { ACTIONS } from './split-command'
export { type Flow } from "./flow";