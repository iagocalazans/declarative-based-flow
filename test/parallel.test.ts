import { CustomWidget, Flow, Parallel } from "../src";

let inFlight = 0;
let maxInFlight = 0;

class Tagger extends CustomWidget {
  protected async run(data: any): Promise<void> {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 15));
    inFlight--;
    data.payload.tag = this.name.description;
  }
}

class Exploder extends CustomWidget {
  protected async run(): Promise<void> {
    throw new Error("branch failed");
  }
}

class Recover extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.recovered = true;
  }
}

describe("Parallel widget", () => {
  beforeEach(() => {
    inFlight = 0;
    maxInFlight = 0;
  });

  it("runs branches concurrently and merges results by name", async () => {
    const parallel = Parallel.create("fan_out")
      .branch("a", Tagger.create("branch_a"))
      .branch("b", Tagger.create("branch_b"))
      .branch("c", Tagger.create("branch_c"))
      .into("payload.sources");

    const flow = Flow.create("parallel_flow").start(parallel).end();

    const result = await flow({ seed: 1 });

    expect(maxInFlight).toBe(3);
    expect(result.payload.sources.a.tag).toBe("branch_a");
    expect(result.payload.sources.b.tag).toBe("branch_b");
    expect(result.payload.sources.c.tag).toBe("branch_c");
  });

  it("respects the concurrency cap", async () => {
    const parallel = Parallel.create("capped")
      .branch("a", Tagger.create("branch_a"))
      .branch("b", Tagger.create("branch_b"))
      .branch("c", Tagger.create("branch_c"))
      .concurrency(1);

    const flow = Flow.create("capped_flow").start(parallel).end();

    await flow({});

    expect(maxInFlight).toBe(1);
  });

  it("routes to the failure path when a branch fails in fail-fast mode", async () => {
    const parallel = Parallel.create("fail_fast")
      .branch("ok", Tagger.create("branch_ok"))
      .branch("bad", Exploder.create("branch_bad"))
      .elseMoveTo(Recover.create("recover"));

    const flow = Flow.create("fail_fast_flow").start(parallel).end();

    const result = await flow({});

    expect(result.payload.recovered).toBe(true);
  });

  it("collects every outcome in settle mode", async () => {
    const parallel = Parallel.create("settle")
      .branch("ok", Tagger.create("branch_ok"))
      .branch("bad", Exploder.create("branch_bad"))
      .onError("settle")
      .into("payload.sources");

    const flow = Flow.create("settle_flow").start(parallel).end();

    const result = await flow({});

    expect(result.payload.sources.ok.tag).toBe("branch_ok");
    expect(result.payload.sources.bad.error).toContain("branch failed");
  });
});
