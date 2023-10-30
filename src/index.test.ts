import { flow } from './'

type EmptyPayload = {
    payload: {}
}

describe('given a flow is called with an empty payload and instantly executed', () => {
    it('should returns an empty object', async () => {
        const data = flow<EmptyPayload>({ payload: {} }).run();
        expect(data).resolves.toEqual({});
    })
})