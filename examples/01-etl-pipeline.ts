/**
 * ETL Pipeline Example
 *
 * Demonstrates a classic Extract, Transform, Load pipeline: data is fetched from
 * an API, validated, transformed, and routed to different destinations based on
 * business rules.
 *
 * Custom widgets here use the `run()` lifecycle hook: implement the operation
 * and let the engine advance the workflow. Awaited delays simulate real I/O, and
 * because the engine awaits the whole chain, the resolved result reflects every
 * stage having completed.
 *
 * Use Case: Customer data synchronization between systems
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

class FetchCustomersWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    await delay(30);

    data.payload.customers = [
      { id: 1, name: 'John Doe', email: 'John@Example.com', age: 30, country: 'USA', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'Jane@Example.com', age: 25, country: 'UK', status: 'active' },
      { id: 3, name: 'Bob Johnson', email: 'Bob@Example.com', age: 45, country: 'USA', status: 'inactive' },
    ];

    this.register('Fetched customers from API', 'info');
  }
}

class TransformCustomersWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const customers = data.payload.customers ?? [];

    data.payload.transformedCustomers = customers.map((customer: any) => ({
      ...customer,
      fullName: customer.name,
      email: customer.email.toLowerCase(),
      isAdult: customer.age >= 18,
      processedAt: new Date().toISOString(),
    }));

    this.register(
      `Transformed ${data.payload.transformedCustomers.length} customers`,
      'info'
    );
  }
}

class LoadToDestinationWidget extends CustomWidget {
  private destination = '';

  static create(name: string) {
    return new this(Symbol(name));
  }

  setDestination(destination: string) {
    this.destination = destination;

    return this;
  }

  protected async run(data: any): Promise<void> {
    await delay(20);

    const customers = data.payload.transformedCustomers ?? [];
    this.register(
      `Loading ${customers.length} customers to ${this.destination}`,
      'info'
    );

    data.payload.loadedTo = this.destination;
    data.payload.loadedCount = customers.length;
  }
}

class NoCustomersWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    this.register('No customers to process', 'warn');
    data.payload.result = 'NO_CUSTOMERS';
  }
}

const buildETLPipeline = () => {
  const fetchWidget = FetchCustomersWidget.create('fetch_customers');

  const extractCount = SetVariable.create('extract_customer_count').variable(
    'totalCustomers',
    '{{ payload.customers.length }}'
  );

  const transformWidget = TransformCustomersWidget.create('transform_customers');

  const checkCustomersExist = Split.create('check_customers_exist').case(
    (data: any) => Compare.is(data.variables.totalCustomers).greaterThan(0)
  );

  const routeByCountry = Split.create('route_by_country').case((data: any) => {
    const customers = data.payload.transformedCustomers ?? [];
    return customers.some((customer: any) => customer.country === 'USA');
  });

  const loadToUSA = LoadToDestinationWidget.create('load_to_usa').setDestination(
    'USA_DATABASE'
  );

  const loadToInternational = LoadToDestinationWidget.create(
    'load_to_intl'
  ).setDestination('INTL_DATABASE');

  const noCustomersWidget = NoCustomersWidget.create('no_customers_handler');

  fetchWidget.moveTo(extractCount);
  extractCount.moveTo(transformWidget);
  transformWidget.moveTo(checkCustomersExist);

  checkCustomersExist.moveTo(routeByCountry).elseMoveTo(noCustomersWidget);

  routeByCountry.moveTo(loadToUSA).elseMoveTo(loadToInternational);

  return Flow.create('etl_customer_pipeline').start(fetchWidget).end();
};

const runExample = async () => {
  console.log('=== ETL Pipeline Example ===\n');

  const pipeline = buildETLPipeline();

  const result = await pipeline({
    source: 'CUSTOMER_API',
    batchId: 'BATCH_001',
  });

  console.log('\nPipeline Result:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\nExtracted Variables:');
  console.log(JSON.stringify(result.variables, null, 2));
};

if (require.main === module) {
  runExample().catch(console.error);
}

export { buildETLPipeline, runExample };
