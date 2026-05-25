import { CustomWidget, Flow, Retry, RouteSignal } from "../src";
import { computeBackoff } from "../src/backoff";

let attemptCount = 0;

class FlakyLoad extends CustomWidget {
  protected async run(data: any): Promise<void> {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error("transient");
    }
    data.payload.loaded = true;
  }
}

class AlwaysFails extends CustomWidget {
  protected async run(): Promise<void> {
    attemptCount++;
    throw new Error("permanent");
  }
}

class RouteOut extends CustomWidget {
  protected async run(): Promise<void> {
    attemptCount++;
    throw new RouteSignal("test:else");
  }
}

class Recover extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.recovered = true;
  }
}

describe("Retry widget", () => {
  beforeEach(() => {
    attemptCount = 0;
  });

  it("retries until the wrapped branch succeeds", async () => {
    const retry = Retry.create("retry_load")
      .attempts(3)
      .backoff("fixed", { baseMs: 1, jitter: false })
      .wrap(FlakyLoad.create("load"));

    const flow = Flow.create("retry_flow").start(retry).end();

    const result = await flow({});

    expect(attemptCount).toBe(3);
    expect(result.payload.loaded).toBe(true);
  });

  it("routes to the failure path after exhausting attempts", async () => {
    const retry = Retry.create("retry_exhaust")
      .attempts(2)
      .backoff("fixed", { baseMs: 1, jitter: false })
      .wrap(AlwaysFails.create("load"))
      .elseMoveTo(Recover.create("recover"));

    const flow = Flow.create("retry_exhaust_flow").start(retry).end();

    const result = await flow({});

    expect(attemptCount).toBe(2);
    expect(result.payload.recovered).toBe(true);
  });

  it("never retries routing signals", async () => {
    const retry = Retry.create("retry_route")
      .attempts(3)
      .wrap(RouteOut.create("route"))
      .elseMoveTo(Recover.create("recover"));

    const flow = Flow.create("retry_route_flow").start(retry).end();

    const result = await flow({});

    expect(attemptCount).toBe(1);
    expect(result.payload.recovered).toBe(true);
  });

  it("respects a custom retryIf predicate", async () => {
    const retry = Retry.create("retry_predicate")
      .attempts(5)
      .backoff("fixed", { baseMs: 1, jitter: false })
      .retryIf(
        (error) => error instanceof Error && error.message === "transient",
      )
      .wrap(AlwaysFails.create("load"))
      .elseMoveTo(Recover.create("recover"));

    const flow = Flow.create("retry_predicate_flow").start(retry).end();

    const result = await flow({});

    expect(attemptCount).toBe(1);
    expect(result.payload.recovered).toBe(true);
  });
});

describe("computeBackoff", () => {
  it("grows exponentially and respects the cap", () => {
    const options = { baseMs: 100, factor: 2, maxMs: 1000, jitter: false };

    expect(computeBackoff(1, "exponential", options)).toBe(100);
    expect(computeBackoff(2, "exponential", options)).toBe(200);
    expect(computeBackoff(3, "exponential", options)).toBe(400);
    expect(computeBackoff(10, "exponential", options)).toBe(1000);
  });

  it("keeps a constant delay for the fixed strategy", () => {
    const options = { baseMs: 50, jitter: false };

    expect(computeBackoff(1, "fixed", options)).toBe(50);
    expect(computeBackoff(5, "fixed", options)).toBe(50);
  });
});
