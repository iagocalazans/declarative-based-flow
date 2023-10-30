import { flow, Flow, ACTIONS } from "../src";


type NumberStringValuePayload = {
    payload: { value: string | number }
}

const destination = {
    success: (next: Flow<NumberStringValuePayload, NumberStringValuePayload>) => next.setVariable('path', 'success'), 
    failed: (next: Flow<NumberStringValuePayload, NumberStringValuePayload>) => next.setVariable('path', 'failed')
}

describe('given a flow is called with a payload and it splits', () => {
    it('matches a "string" and split to success', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1124' 
            } 
        })
        .split(
            { 
                action: ACTIONS.TYPE_CHECK, 
                property: 'value', 
                matcher: 'string' 
            }, 
            destination
        )
        .run();
        
        expect(data).resolves.toMatchObject({
            payload: { 
                value: '1124' 
            }, variables: { 
                path: 'success' 
            }
        });
    })

    it('didnt match "number" and split to failed', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1124' 
            } 
        })
        .split(
            { 
                action: ACTIONS.TYPE_CHECK, 
                property: 'value', 
                matcher: 'number' 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1124' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
    
})

describe('ACTION.GREATER_THAN', () => {
    it('should split to success as 1124 is grt 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1124' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.GREATER_THAN, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1124' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as 1022 isnt grt 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1022' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.GREATER_THAN, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1022' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.GREATER_THAN_OR_EQUAL', () => {
    it('should split to success as 1023 is grt or equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.GREATER_THAN_OR_EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1023' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as 1022 isnt grt or equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1022' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.GREATER_THAN_OR_EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1022' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.LESSER_THAN', () => {
    it('should split to success as 937 is lower then 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '937' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.LESSER_THAN, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '937' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as 1123 isnt grt or equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1123' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.LESSER_THAN, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1123' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.LESSER_THAN_OR_EQUAL', () => {
    it('should split to success as 1023 is lower then or equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.LESSER_THAN_OR_EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1023' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as 1123 isnt grt or equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1123' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.LESSER_THAN_OR_EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1123' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.EQUAL', () => {
    it('should split to success as 1023 is equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: 1_023 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: 1_023
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as "1_023" isnt equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.NOT_EQUAL', () => {
    it('should split to success as "1_023" is not equal 1_023', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.NOT_EQUAL, 
                matcher: 1_023 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as "1_023" is equal "1_023"', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.NOT_EQUAL, 
                matcher: '1_023'
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.IN', () => {
    it('should split to success as "1_023" is in array', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.IN, 
                matcher: ['1_022', '1_021', '1_023'] 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as "1_023" isnt in array', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.IN, 
                matcher: ['1_022', '1_021', '1_024'] 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})

describe('ACTION.NOT_IN', () => {
    it('should split to success as "1_023" isnt in array', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.NOT_IN, 
                matcher: ['1_022', '1_021', '1_024'] 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'success'
            }
        });
    })

    it('should split to failed as "1_023" is in array', async () => {
        const data = flow<NumberStringValuePayload>({ 
            payload: { 
                value: '1_023' 
            } 
        })
        .split(
            { 
                property: 'value', 
                action: ACTIONS.NOT_IN, 
                matcher: ['1_022', '1_021', '1_023'] 
            }, 
            destination
        )
        .run();

        expect(data).resolves.toMatchObject({ 
            payload: { 
                value: '1_023' 
            },
            variables: {
                path: 'failed'
            }
        });
    })
})