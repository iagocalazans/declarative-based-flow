import { Flow as FlowClass, Request } from "./flow";

export const flow =  <T extends Request, V extends Partial<T> = T>(content: T) => {
    return new FlowClass<T, V>(content);
}

export { ACTIONS } from './split-command'
export { type Flow, type Request } from "./flow";