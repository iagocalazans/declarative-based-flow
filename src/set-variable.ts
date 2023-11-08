import { isValidLabel, processWhiteLabel } from "./validate-whitelabel";
import { Widget } from "./widget";

export class SetVariable extends Widget {
    private action: {
        set: {
            var?: string,
            use?: unknown
        }
    } = { 
        set: {
            var: undefined,
            use: undefined
        }
    }

    static create(name: string) {
        return new this(Symbol(name));
    }

    moveTo(widget: Widget) {
        super.success(widget);

        return this
    }

    variable(varName: string, whitelabel: string) {
        this.action.set = {
            var: varName,
            use: whitelabel
        }

        return this
    }
    
    async process(a: any): Promise<any> {
        if (!this.action.set.use || !this.action.set.var) {
            throw new Error('To use SetVariable you must set .add("varName", "{{ whitelabel.to.use }}")');
        }

        if (!Reflect.has(a, 'variables')) {
            Reflect.defineProperty(a, 'variables', {
                configurable: true,
                enumerable: true,
                value: {}
            })
        }

        const parsedValue = isValidLabel(this.action.set.use) ? processWhiteLabel(this.action.set.use as string, a) : this.action.set.use

        Reflect.defineProperty(a.variables, this.action.set.var, {
            configurable: false,
            writable: false,
            enumerable: true,
            value: parsedValue
        })

        super.register(`Defined var ${this.action.set.var} = ${parsedValue}`, 'info');

        super.process(a);
    }
}