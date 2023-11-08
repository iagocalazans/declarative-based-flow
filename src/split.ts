import { Widget } from "./widget";

export class Split extends Widget {
    private action: {
        fn?: (a: any) => boolean
    } = { 
        fn: undefined
    }

    static create(name: string) {
        return new this(Symbol(name));
    }

    moveTo(widget: Widget) {
        super.success(widget);

        return this;
    }

    elseMoveTo(widget: Widget) {
        super.failed(widget);

        return this;
    }

    case(fn: (a: any) => boolean) {
        this.action.fn = fn;

        return this;
    }
    
    async process(a: any): Promise<any> {
        if (!this.action.fn) {
            throw new Error('To use Split you must set a .case((data: any) => Compare.is(data.payload.act.like.that).in([\'this\', \'those\', \'that\'])');
        }

        
        if (this.action.fn(a) === true) {
            super.register(`Moved to: ${super.moveToName}`, 'info')
            await super.process(a);
        }
        
        if (this.action.fn(a) === false) {
            super.register(`Moved to: ${super.elseMoveToName}`, 'info')
            throw 'force right side'
        }
    }
}