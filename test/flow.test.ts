import { Flow } from '../src';
import { amazingSetVariableWidgetOne } from './consts';


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
