class Widget {
    protected constructor (protected readonly uniqueName: symbol, private left?: Widget, private right?: Widget) {}

    get name() {
        return this.uniqueName;
    }

    // TODO: Must have a validator too?

    protected success(widget: Widget) {
        this.left = widget;
    }

    protected failed(widget: Widget) {
        this.right = widget;
    }

    static create(name: string) {
        return new this(Symbol(name));
    }

    process(a: any) {
        // TODO: Work on validator here in try/catch then move foward to right or left...
        
        if (!Reflect.has(a, 'payload')) {
            const payload = a;
            a = { payload: payload };
            Object.freeze(a.payload);
        }


        if (this.left) {
            this.left.process(a);
        }

        return a;
    }

    protected alternate(a: any) {
        // TODO: Work on validator here in try/catch then move foward to right or left...
        
        if (!Reflect.has(a, 'payload')) {
            const payload = a;
            a = { payload: payload };
            Object.freeze(a.payload);
        }


        if (this.right) {
            this.right.process(a);
        }

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

        Reflect.defineProperty(a.variables, this.action.set.var, {
            configurable: false,
            writable: false,
            enumerable: true,
            value: processWhiteLabel(this.action.set.use, a)
        })

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
    
    it('should create two SetVariable widget\'s', () => {
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

        expect(payload).toMatchObject({
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
            super.process(a);
        }

        if (this.action.fn(a) === false) {
            //@ts-ignore
            super.alternate(a);
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
                        .variable('myVarThree', '{{ payload.act.like.those }}'))
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

        expect(payload).toMatchObject({
            variables: { 
                myVarOne: 'that',
                myVarThree: 'those'
            }
        });
        expect(payload).not.toMatchObject({
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

        expect(payload).toMatchObject({
            variables: { 
                myVarOne: 'they',
                myVarTwo: 'this',
            }
        });
        expect(payload).not.toMatchObject({
            variables: { 
                myVarThree: 'those'
            }
        });
    });
});