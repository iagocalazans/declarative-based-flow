/**
 * Resilient Parallel ETL Example
 *
 * Showcases the parallel-execution and resilience widgets working together on a
 * realistic ETL pipeline:
 *
 * 1. Extract: fetch orders from two systems concurrently with `Parallel`.
 * 2. Combine: merge the per-source results into a single records array.
 * 3. Transform: normalize records with `ParallelMap`, capping concurrency and
 *    collecting per-item failures instead of aborting the whole batch.
 * 4. Load: persist the result behind `CircuitBreaker` wrapping `Retry`, so a
 *    transient outage is retried and a sustained outage fast-fails to a fallback.
 *
 * Custom widgets here use the `run()` lifecycle hook: implement the operation
 * and let the engine advance the workflow (no manual `super.process` call).
 */

import {
  CircuitBreaker,
  CustomWidget,
  Flow,
  Parallel,
  ParallelMap,
  Retry,
} from '../src';

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

class FetchWarehouseWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    await delay(40);
    data.payload.warehouseOrders = [
      { id: 'W-1', customer: 'acme', amount: 120 },
      { id: 'W-2', customer: 'globex', amount: 80 },
    ];
    this.register('Fetched warehouse orders', 'info');
  }
}

class FetchBillingWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    await delay(60);
    data.payload.billingOrders = [
      { id: 'B-1', customer: 'initech', amount: 200 },
      { id: 'B-2', customer: 'umbrella', amount: null },
    ];
    this.register('Fetched billing orders', 'info');
  }
}

class CombineSourcesWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const warehouse = data.payload.sources.warehouse.warehouseOrders ?? [];
    const billing = data.payload.sources.billing.billingOrders ?? [];
    data.payload.records = [...warehouse, ...billing];
    this.register(`Combined ${data.payload.records.length} records`, 'info');
  }
}

let warehouseLoadAttempts = 0;

class LoadWarehouseWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    warehouseLoadAttempts++;
    await delay(20);

    if (warehouseLoadAttempts < 3) {
      this.register(
        `Load attempt ${warehouseLoadAttempts} failed (transient)`,
        'warn'
      );
      throw new Error('warehouse temporarily unavailable');
    }

    data.payload.loadResult = {
      destination: 'DATA_WAREHOUSE',
      loadedCount: data.payload.processed.length,
    };
    this.register(`Loaded ${data.payload.processed.length} records`, 'info');
  }
}

const buildResilientPipeline = () => {
  const extract = Parallel.create('extract_sources')
    .branch('warehouse', FetchWarehouseWidget.create('fetch_warehouse'))
    .branch('billing', FetchBillingWidget.create('fetch_billing'))
    .into('payload.sources');

  const combine = CombineSourcesWidget.create('combine_sources');

  const normalize = ParallelMap.create('normalize_records')
    .from('{{ payload.records }}')
    .withConcurrency(3)
    .each(async (order: any) => {
      await delay(10);

      if (typeof order.amount !== 'number') {
        throw new Error(`order ${order.id} has an invalid amount`);
      }

      return {
        ...order,
        customer: order.customer.toUpperCase(),
        amountWithTax: Number((order.amount * 1.1).toFixed(2)),
      };
    })
    .into('payload.processed')
    .collectErrorsInto('payload.failures');

  const resilientLoad = CircuitBreaker.create('warehouse_breaker')
    .threshold(5)
    .cooldown(2000)
    .wrap(
      Retry.create('load_retry')
        .attempts(3)
        .backoff('exponential', { baseMs: 20, factor: 2, jitter: false })
        .wrap(LoadWarehouseWidget.create('load_warehouse'))
    );

  extract.moveTo(combine);
  combine.moveTo(normalize);
  normalize.moveTo(resilientLoad);

  return Flow.create('resilient_etl').start(extract).end();
};

let serviceCalls = 0;

class CallFlakyServiceWidget extends CustomWidget {
  protected async run(): Promise<void> {
    serviceCalls++;
    await delay(10);
    throw new Error('downstream service is down');
  }
}

class ServeFromCacheWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.servedFrom = 'cache';
  }
}

const buildCircuitBreakerDemo = () => {
  const breaker = CircuitBreaker.create('downstream_breaker')
    .threshold(2)
    .cooldown(5000)
    .wrap(CallFlakyServiceWidget.create('call_service'))
    .elseMoveTo(ServeFromCacheWidget.create('serve_cache'));

  return Flow.create('breaker_demo').start(breaker).end();
};

const runResilientPipeline = async () => {
  console.log('=== Resilient Parallel ETL ===\n');

  const pipeline = buildResilientPipeline();
  const result = await pipeline({ batchId: 'BATCH_2026_05' });

  console.log('\nProcessed records:');
  console.log(JSON.stringify(result.payload.processed, null, 2));

  console.log('\nCollected failures:');
  console.log(
    JSON.stringify(
      result.payload.failures.map((failure: any) => ({
        index: failure.index,
        id: failure.item.id,
        error: String(failure.error),
      })),
      null,
      2
    )
  );

  console.log('\nLoad result:');
  console.log(JSON.stringify(result.payload.loadResult, null, 2));
};

const runCircuitBreakerDemo = async () => {
  console.log('\n=== Circuit Breaker Fast-Fail ===\n');

  const demo = buildCircuitBreakerDemo();

  for (let call = 1; call <= 4; call++) {
    await demo({});
    console.log(`After call ${call}, the service was hit ${serviceCalls} time(s)`);
  }

  console.log(
    '\nThe circuit opened after 2 failures, so calls 3 and 4 never reached the service.'
  );
};

const runExample = async () => {
  await runResilientPipeline();
  await runCircuitBreakerDemo();
};

if (require.main === module) {
  runExample().catch(console.error);
}

export { buildResilientPipeline, buildCircuitBreakerDemo, runExample };
