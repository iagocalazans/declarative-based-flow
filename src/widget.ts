export class Widget {
    protected constructor (protected readonly uniqueName: symbol, private left?: Widget, private right?: Widget) {}

    get name() {
        return this.uniqueName;
    }

    get moveToName() {
        return this.left?.name.description
    }

    get elseMoveToName() {
        return this.right?.name.description
    }

    protected success(widget: Widget) {
        this.left = widget;
    }

    protected failed(widget: Widget) {
        this.right = widget;
    }

    static create(name: string) {
        return new this(Symbol(name));
    }

    protected moveTo(widget: Widget) {
        this.success(widget);

        return this;
    }

    protected elseMoveTo(widget: Widget) {
        this.failed(widget);

        return this;
    }

    protected register(a: any, level: keyof Pick<Console, 'debug' | 'log' | 'info' | 'error'> = 'log'): void {

        // TODO: Must optmize debugging log

        if (level !== 'debug' && process.env.ENV !== 'development') {
            console[level](`[${this.constructor.name}: ${this.uniqueName.description}]: => ${JSON.stringify(a, null, 2)}`);
        }
    }

    async process(a: any) {
        
        if (!Reflect.has(a, 'payload')) {
            const payload = a;
            a = { payload: payload };
            Object.freeze(a.payload);
        }

        
        try {
            if (this.left) {
                await this.left?.process(a);
            }
        } catch {
            if (this.left?.right) {
                await this.left?.right.process(a);
            }
        }
        
        this.register(a, 'debug');
        return a;
    }
}