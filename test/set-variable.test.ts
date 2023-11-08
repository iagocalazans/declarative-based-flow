import { SetVariable, Flow } from "../src";
import { amazingSetVariableWidgetOne } from './consts';

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
