import { flow } from './'

type EmptyPayload = {
    payload: {}
}

describe('given a flow is called with an empty payload and instantly executed', () => {
    it('should returns an empty object', async () => {
        const data = flow<EmptyPayload>({ payload: {} }).execute();
        expect(data).resolves.toEqual({});
    })
})


type NumericStringValuePayload = {
    payload: { value: string }
}


describe('given a flow is called with a payload and it splits', () => {
    it('should returns a object with string', async () => {
        const data = flow<NumericStringValuePayload>({ 
            payload: { 
                value: '1_124' 
            } 
        })
        .split(
            { 
                action: 'type_check', 
                property: 'value', 
                matcher: 'string' 
            }, 
            {
                success: (next) => next
                    .setVariable('value', '1_224'), 
                
                failed: (next) => next
                    .setVariable('value', '1_124')
            }
        )
        .execute();
        
        expect(data).resolves.toEqual({ value: '1_224' });
    })

    it('should returns a object with number', async () => {
        const data = flow<NumericStringValuePayload>({ 
            payload: { 
                value: '1_124' 
            } 
        })
        .split(
            { 
                action: 'type_check', 
                property: 'value', 
                matcher: 'number' 
            }, 
            {
                success: (next) => next
                    .setVariable('value', '1_224'), 
                
                failed: (next) => next
                    .setVariable('value', 1_224)
            }
        )
        .execute();

        expect(data).resolves.toEqual({ value: 1_224 });
    })
})