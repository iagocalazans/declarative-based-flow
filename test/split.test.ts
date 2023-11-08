import { Split, Compare, SetVariable, Flow } from "../src";
import { amazingSetVariableWidgetOne } from './consts';

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