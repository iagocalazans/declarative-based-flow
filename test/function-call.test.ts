/* eslint-disable @typescript-eslint/ban-types */
import { flow } from "../src";

interface EmptyPayload {
  payload: {};
}

const promisify = (
  ...args: boolean[]
):
  | Promise<{
      first: "value";
      second: "data";
      third: "info";
    }>
  | Promise<Error> => {
  const [shouldPass] = args;

  return new Promise<{
    first: "value";
    second: "data";
    third: "info";
  }>((resolves, rejects) => {
    if (shouldPass) {
      resolves({
        first: "value",
        second: "data",
        third: "info",
      });
    } else {
      rejects(new Error("Failed due to didn should pass..."));
    }
  });
};

describe("given a flow is called with an empty payload and call a function", () => {
  it("should attach some value to functions payload when resolves", async () => {
    const data = flow<
      EmptyPayload,
      {
        payload: {};
        functions: {
          someRandomFunction: {
            first: "value";
            second: "data";
            third: "info";
          };
        };
      }
    >({
      payload: {},
    })
      .functionCall(
        {
          name: "someRandomFunction",
          fn: promisify(true),
        },
        {
          success: (next) => next,
          error: (next) => next,
        },
      )
      .run();

    expect(data).resolves.toMatchObject({
      payload: {},
      functions: {
        someRandomFunction: {
          first: "value",
          second: "data",
          third: "info",
        },
      },
    });
  });

  it("shouldnt attach a value to functions payload when rejects", async () => {
    const data = flow<
      EmptyPayload,
      {
        payload: {};
        functions: {
          someRandomFunction: {
            first: "value";
            second: "data";
            third: "info";
          };
        };
      }
    >({
      payload: {},
    })
      .functionCall(
        {
          name: "someRandomFunction",
          fn: promisify(false),
        },
        {
          success: (next) => next,
          error: (next) => next,
        },
      )
      .run();

    expect(data).resolves.toMatchObject({
      payload: {},
    });
  });
});
