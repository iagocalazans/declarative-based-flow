import { CircuitBreaker, CustomWidget, Flow } from "../src";

let shouldFail = true;
let calls = 0;

class Toggle extends CustomWidget {
  protected async run(data: any): Promise<void> {
    calls++;
    if (shouldFail) {
      throw new Error("down");
    }
    data.payload.ok = true;
  }
}

class Succeeded extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.succeeded = true;
  }
}

class FellBack extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.fellBack = true;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CircuitBreaker widget", () => {
  it("opens after the threshold, short-circuits, then recovers via half-open", async () => {
    shouldFail = true;
    calls = 0;

    const breaker = CircuitBreaker.create("api_breaker")
      .threshold(2)
      .cooldown(30)
      .wrap(Toggle.create("api"))
      .moveTo(Succeeded.create("succeeded"))
      .elseMoveTo(FellBack.create("fell_back"));

    const flow = Flow.create("breaker_flow").start(breaker).end();

    const first = await flow({});
    expect(first.payload.fellBack).toBe(true);
    expect(calls).toBe(1);

    const second = await flow({});
    expect(second.payload.fellBack).toBe(true);
    expect(calls).toBe(2);

    const third = await flow({});
    expect(third.payload.fellBack).toBe(true);
    expect(calls).toBe(2);

    await delay(80);
    shouldFail = false;

    const fourth = await flow({});
    expect(fourth.payload.succeeded).toBe(true);
    expect(calls).toBe(3);
  });
});
