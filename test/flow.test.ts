
class Flow {
    private constructor (private readonly uniqueName: symbol) {}

    get name() {
        return this.uniqueName
    }

    static create(name: string) {
        return new Flow(Symbol(name));
    }
}



class Widget {
    protected constructor (protected readonly uniqueName: symbol, private left?: Widget, private right?: Widget) {}

    get name() {
        return this.uniqueName
    }

    // TODO: Must have a validator too?

    protected success(widget: Widget) {
        this.left = widget
    }

    protected failed(widget: Widget) {
        this.right = widget
    }

    static create(name: string) {
        return new this(Symbol(name))
    }

    execute(a: any) {
        console.log(this.name);
        console.log("Payload: %o", a);

        // TODO: Work on validator here in try/catch then move foward to right or left...

        if (this.left) {
            this.left.execute(a);
        }
    }
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
        return new this(Symbol(name))
    }

    afterSet(widget: Widget) {
        super.success(widget);
    }

    add(varName: string, whitelabel: string) {
        this.action.set = {
            var: varName,
            use: whitelabel
        }
    }
    
    async execute(a: any): Promise<any> {
        if (!this.action.set.use || !this.action.set.var) {
            throw new Error('To use SetVariable you must set .add("varName", "{{ whitelabel.to.use }}")')
        }

        // TODO: Implement a magic code to act on payload here!

        super.execute(a)
    }
}

describe('Flow specs', () => {
    it('should be created as a class with an unique name', () => {
        const amazingFlow = Flow.create('amazing_flow');
        const uniqueName = Symbol.for('amazing_flow');

        expect(amazingFlow).toBeInstanceOf(Flow);
        expect(amazingFlow.name.toString()).toBe(uniqueName.toString())
    })
});

describe('Receives widget\'s', () => {
    it('should create a SetVariable widget', () => {
        const widget = SetVariable.create('amazing_set_variable_widget');

        expect(widget).toBeInstanceOf(SetVariable);
    })
    
    it('should create two SetVariable widget\'s', () => {
        const widgetOne = SetVariable.create('amazing_set_variable_widget_one');
        const widgetTwo = SetVariable.create('amazing_set_variable_widget_two');
        const widgetThree = SetVariable.create('amazing_set_variable_widget_three');

        
        widgetOne.add('myVarOne', '{{ payload.act.like.that }}');
        widgetOne.afterSet(
            widgetTwo
        );

        widgetTwo.add('myVarTwo', '{{ payload.act.like.this }}');
        widgetTwo.afterSet(
            widgetThree
        );

        widgetThree.add('myVarThree', '{{ payload.act.like.this }}');

        widgetOne.execute({ payload: "data" });
    })
});



// Criar o Flow.
// Criar widget first_step
// Criar widget second_step
// Criar widget third_step
// Criar widget last_step

// Construir uma árvore de ações com os elementos.

// Deve retornar uma função que receberá o payload.
