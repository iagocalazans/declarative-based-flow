/* eslint-disable @typescript-eslint/ban-types */
const axios = require("axios");
jest.mock("axios");

import { flow } from "../src";

interface EmptyPayload {
  payload: {};
}

const sampleResponse = {
  data: {
    userId: 1,
    id: 1,
    title: "mocked title",
    body: "mocked body",
  },
};

type SampleResponseType = (typeof sampleResponse)["data"];

describe("given a flow is called with an empty payload and call external functions", () => {
  it("should return external data as widgetCall when resolves", async () => {
    axios.mockResolvedValue(sampleResponse);

    const data = flow<
      EmptyPayload,
      {
        payload: {};
        variables: {
          user: SampleResponseType["userId"];
        };
        http: {
          widgetCall: SampleResponseType;
        };
      }
    >({
      payload: {},
    })
      .httpCall(
        {
          name: "widgetCall",
          method: "GET",
          url: "http://localhost:3000",
        },
        {
          response: (next, data: SampleResponseType) =>
            next.setVariable("user", data.userId),
          error: (next) => next,
        },
      )
      .run();

    expect(data).resolves.toMatchObject({
      payload: {},
      variables: { user: sampleResponse.data.userId },
      http: {
        widgetCall: sampleResponse.data,
      },
    });
  });

  it("should return move to error when catch", async () => {
    axios.mockRejectedValue(new Error("An error occours"));

    const data = flow<
      EmptyPayload,
      {
        payload: {};
      }
    >({
      payload: {},
    })
      .httpCall(
        {
          name: "widgetCall",
          method: "GET",
          url: "http://localhost:3000",
        },
        {
          response: (next, data: SampleResponseType) =>
            next.setVariable("user", data.userId),
          error: (next) => next,
        },
      )
      .run();

    expect(data).resolves.toMatchObject({
      payload: {},
    });
  });
});
