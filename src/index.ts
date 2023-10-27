export type Payload = {
    payload: {
        [key: string]: any;
    }
}

export enum ACTIONS {
    TYPE_CHECK = 'type_check'
}

type TypeOf = "undefined" | "object" | "boolean" | "number" | "bigint" | "string" | "symbol" | "function"

export type VisitorTypeCheck = {
    action: ACTIONS, 
    property: keyof Payload['payload'], 
    matcher: TypeOf
}

export const flow =  <T extends Payload, V extends Partial<T> = T>(content: T) => {
    return new Flow<T, V>(content)
}

export interface Command<T> {
    execute(): Promise<T>;
}

export class Flow<T, V extends Partial<T> = T> implements Command<V> {
    constructor(private request: Payload) {

    }

    split(conditional: VisitorTypeCheck, flow: {
        success: (flow: Flow<T, V>) => Flow<T, V>,
        failed: (flow: Flow<T, V>) => Flow<T, V>
    }) {
        const {success, failed} = flow;

        switch(conditional.action) {
            case ACTIONS.TYPE_CHECK: 
                typeof this.request.payload[conditional.property] === conditional.matcher ? success(this) : failed(this)
                
                return this
        }
    }

    setVariable(name: string, value: unknown) {
        Reflect.defineProperty(this.request.payload, name, {
            enumerable: true,
            value
        })

        return this;
    }

    async execute(): Promise<V> {
        return this.request.payload as V
    }
}