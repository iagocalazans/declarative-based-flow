import { flow } from "../src";

interface EmptyPayload {
  payload: {};
}

describe("given a flow is called with an empty payload and instantly executed", () => {
  it("should returns an empty object", async () => {
    const data = flow<EmptyPayload>({
      payload: {},
    }).run();

    expect(data).resolves.toMatchObject({
      payload: {},
    });
  });

  it("should returns an object with prop noName", async () => {
    const data = flow<EmptyPayload>({
      payload: {},
    })
      .setVariable("noName", 1)
      .setVariable("noData", "teste-data")
      .setVariable("noThing", [])
      .run();

    expect(data).resolves.toMatchObject({
      payload: {},
      variables: {
        noName: 1,
        noData: "teste-data",
        noThing: [],
      },
    });
  });
});
