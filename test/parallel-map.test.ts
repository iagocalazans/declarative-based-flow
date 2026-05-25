import { CustomWidget, Flow, ParallelMap } from "../src";

let inFlight = 0;
let maxInFlight = 0;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class Doubler extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.doubled = data.payload.item * 2;
  }
}

describe("ParallelMap widget", () => {
  beforeEach(() => {
    inFlight = 0;
    maxInFlight = 0;
  });

  it("maps over items with a concurrency cap, preserving order", async () => {
    const map = ParallelMap.create("transform")
      .from("{{ payload.numbers }}")
      .withConcurrency(2)
      .each(async (item: number) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        try {
          await delay(10);
          return item * 10;
        } finally {
          inFlight--;
        }
      });

    const flow = Flow.create("map_flow").start(map).end();

    const result = await flow({ numbers: [1, 2, 3, 4, 5] });

    expect(maxInFlight).toBe(2);
    expect(result.payload.processed).toEqual([10, 20, 30, 40, 50]);
  });

  it("collects failures while keeping successful results in order", async () => {
    const map = ParallelMap.create("transform")
      .from("{{ payload.numbers }}")
      .withConcurrency(2)
      .each(async (item: number) => {
        if (item === 3) {
          throw new Error("bad-3");
        }
        return item * 10;
      });

    const flow = Flow.create("partial_flow").start(map).end();

    const result = await flow({ numbers: [1, 2, 3, 4, 5] });

    expect(result.payload.processed).toEqual([10, 20, 40, 50]);
    expect(result.payload.failures).toHaveLength(1);
    expect(result.payload.failures[0].index).toBe(2);
    expect(result.payload.failures[0].item).toBe(3);
  });

  it("aborts and routes to the failure path in fail-fast mode", async () => {
    const recover = class extends CustomWidget {
      protected async run(data: any): Promise<void> {
        data.payload.recovered = true;
      }
    }.create("recover");

    const map = ParallelMap.create("transform")
      .from("{{ payload.numbers }}")
      .each(async (item: number) => {
        if (item === 2) {
          throw new Error("stop");
        }
        return item;
      })
      .onItemError("fail-fast")
      .elseMoveTo(recover);

    const flow = Flow.create("fail_fast_map").start(map).end();

    const result = await flow({ numbers: [1, 2, 3] });

    expect(result.payload.recovered).toBe(true);
  });

  it("runs a widget branch per item when given a widget", async () => {
    const map = ParallelMap.create("transform")
      .from("{{ payload.numbers }}")
      .each(Doubler.create("doubler"));

    const flow = Flow.create("widget_map").start(map).end();

    const result = await flow({ numbers: [2, 4] });

    expect(result.payload.processed.map((p: any) => p.doubled)).toEqual([4, 8]);
  });
});
