class Widget {
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

class Flow extends Widget {
    static create(name: string) {
        return new Flow(Symbol(name));
    }

    start(widget: Widget) {
        super.success(widget);

        return this;
    }

    end() {
        return this.process.bind(this);
    }
}

function findObjectValue <T extends Record<string, any>>(object: T, keys: [keyof T], index = 0) {
    if (index < keys.length - 1 && Reflect.has(object, keys[index])) {
        const prop = Reflect.get(object, keys[index])
        return findObjectValue(prop, keys, ++index)
    }

    return object[keys[index]];
}

function useWhiteLabel<T extends Record<string, any>>(label: string) {
    const validator = RegExp(/(?<={{).+(?=}})/);
    const [structure] = validator.exec(label)!;
    const trimmedStructure = structure.trim();
    return trimmedStructure.split('.') as unknown as [keyof T];
}

function processWhiteLabel <T extends Record<string, any>>(label: string, object: T) {
    return findObjectValue(object, useWhiteLabel<T>(label))
}

class SetVariable extends Widget {
    private action: {
        set: {
            var?: string,
            use?: string
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

        const parsedValue = processWhiteLabel(this.action.set.use, a)

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

const amazingSetVariableWidgetOne = SetVariable
        .create('amazing_set_variable_widget_one')
        .variable('myVarOne', '{{ payload.act.like.that }}');

describe('Flow specs', () => {
    it('should be created as a class with an unique name', () => {
        const amazingFlow = Flow.create('amazing_flow');
        const uniqueName = Symbol.for('amazing_flow');

        expect(amazingFlow).toBeInstanceOf(Flow);
        expect(amazingFlow.name.toString()).toBe(uniqueName.toString())
    })

    it('should return the process method as extended function', () => {
        
        const flow = Flow.create('amazing_flow').start(amazingSetVariableWidgetOne).end();

        expect(flow.toString()).toBe(Flow.prototype.process.bind(Flow).toString())
    })
});

describe('Receives SetVariable widget\'s', () => {
    let flow: (a: any) => any;
    
    beforeAll(() => {
        amazingSetVariableWidgetOne.moveTo(
            SetVariable
                .create('amazing_set_variable_widget_two')
                .variable('myVarTwo', '{{ payload.act.like.this.should.be.this }}')
                .moveTo(
                    SetVariable
                        .create('amazing_set_variable_widget_three')
                        .variable('myVarThree', '{{ payload.act.like.those }}')
                    )
            );
        
        flow = Flow.create('amazing_flow').start(amazingSetVariableWidgetOne).end();
    })

    it('should create a SetVariable widget', () => {
        const widget = SetVariable.create('amazing_set_variable_widget');
        expect(widget).toBeInstanceOf(SetVariable);
    })
    
    it('should run with three SetVariable widget\'s', () => {
        const payload = flow({
            act: {
                like: { 
                    that: 'that', 
                    this: { 
                        should: { 
                            be: { 
                                this:'this' 
                            } 
                        } 
                    }, 
                    those: 'those' 
                }
            }
        });

        expect(payload).resolves.toMatchObject({
            payload: {
                act: {
                    like: { 
                        that: 'that', 
                        this: { 
                            should: { 
                                be: { 
                                    this:'this' 
                                } 
                            } 
                        }, 
                        those: 'those' 
                    }
                }
            },
            variables: { 
                myVarOne: 'that', 
                myVarTwo: 'this', 
                myVarThree: 'those' 
            }
        });
    });
});

class Compare {
    static is(value: any) {
        return Comparator.create(value);
    }
}

class Comparator {
    private constructor(private readonly value: any) {}

    static create(value: any) {
        return new Comparator(value);
    }

    equal(comparator: any) {
        return this.value === comparator;
    }

    notEqual(comparator: any) {
        return this.value === comparator;
    }

    in(comparator: any[]) {
        return !!comparator.find((el) => el === this.value);
    }

    notIn(comparator: any[]) {
        return !comparator.find((el) => el === this.value);
    }

    greaterThan(comparator: any[]) {
        return this.value > comparator
    }

    lesserThan(comparator: any[]) {
        return this.value < comparator
    }
}


class Split extends Widget {
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

describe('Receives Split widget\'s', () => {
    let flow: (a: any) => any;
    
    beforeAll(() => {
        amazingSetVariableWidgetOne.moveTo(
            Split
                .create('amazing_split_widget')
                .case((data: any) => Compare
                    .is(data.payload.act.like.that)
                    .in(['this', 'those', 'that'])
                )
                .moveTo(
                    SetVariable
                        .create('amazing_set_variable_widget_three')
                        .variable('myVarThree', '{{ payload.act.like.those }}')
                )
                .elseMoveTo(
                    SetVariable
                    .create('amazing_set_variable_widget_two')
                    .variable('myVarTwo', '{{ payload.act.like.this.should.be.this }}')
                )
            )
        
        flow = Flow.create('amazing_flow').start(amazingSetVariableWidgetOne).end();
    })
    
    it('should miss myVarTwo if data.payload.act.like.that is in array', () => {
        const payload = flow({
            act: {
                like: { 
                    that: 'that', 
                    this: { 
                        should: { 
                            be: { 
                                this:'this' 
                            } 
                        } 
                    }, 
                    those: 'those' 
                }
            }
        });

        expect(payload).resolves.toMatchObject({
            variables: { 
                myVarOne: 'that',
                myVarThree: 'those'
            }
        });
        expect(payload).resolves.not.toMatchObject({
            variables: { 
                myVarTwo: 'this',
            }
        });
    });

    it('should not miss myVarTwo if data.payload.act.like.that is not in array', () => {
        const payload = flow({
            act: {
                like: { 
                    that: 'they', 
                    this: { 
                        should: { 
                            be: { 
                                this:'this' 
                            } 
                        } 
                    }, 
                    those: 'those' 
                }
            }
        });

        expect(payload).resolves.toMatchObject({
            variables: { 
                myVarOne: 'they',
                myVarTwo: 'this',
            }
        });
        expect(payload).resolves.not.toMatchObject({
            variables: { 
                myVarThree: 'those'
            }
        });
    });
});