import { CustomWidget, Flow, SetVariable } from "../src";

class SlowAppend extends CustomWidget {
  protected async run(data: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    data.payload.log = data.payload.log || [];
    data.payload.log.push("done");
  }
}

class Boom extends CustomWidget {
  protected async run(): Promise<void> {
    throw new Error("boom");
  }
}

class Recover extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.recovered = true;
  }
}

describe("Widget core execution", () => {
  it("awaits the full downstream chain after SetVariable", async () => {
    const extract = SetVariable.create("extract")
      .variable("seed", "{{ payload.seed }}")
      .moveTo(SlowAppend.create("slow"));

    const flow = Flow.create("await_chain").start(extract).end();

    const result = await flow({ seed: 1 });

    expect(result.variables.seed).toBe(1);
    expect(result.payload.log).toEqual(["done"]);
  });

  it("propagates unhandled errors instead of swallowing them", async () => {
    const flow = Flow.create("propagates").start(Boom.create("boom")).end();

    await expect(flow({})).rejects.toThrow("boom");
  });

  it("routes a thrown error to the failure path when one exists", async () => {
    const boom = Boom.create("boom").elseMoveTo(Recover.create("recover"));
    const flow = Flow.create("recovers").start(boom).end();

    const result = await flow({});

    expect(result.payload.recovered).toBe(true);
  });
});
