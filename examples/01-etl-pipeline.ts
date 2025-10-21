/**
 * ETL Pipeline Example
 *
 * This example demonstrates how to build an ETL (Extract, Transform, Load) pipeline
 * for processing user data from an API, validating it, transforming it, and then
 * routing it to different destinations based on business rules.
 *
 * Use Case: Customer data synchronization between systems
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

// Custom widget to fetch data from API
class FetchCustomersWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    try {
      // Simulate API call
      const customers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, country: 'USA', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, country: 'UK', status: 'active' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 45, country: 'USA', status: 'inactive' },
      ];

      // Add fetched data to payload
      data.payload.customers = customers;

      this.register('Fetched customers from API', 'info');
      await super.process(data);
    } catch (error) {
      this.register(`Error fetching customers: ${error}`, 'error');
      throw error;
    }
  }
}

// Custom widget to transform customer data
class TransformCustomersWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const customers = data.payload.customers || [];

    // Transform data: add full name, normalize email
    const transformedCustomers = customers.map((customer: any) => ({
      ...customer,
      fullName: customer.name,
      email: customer.email.toLowerCase(),
      isAdult: customer.age >= 18,
      processedAt: new Date().toISOString(),
    }));

    data.payload.transformedCustomers = transformedCustomers;
    this.register(`Transformed ${transformedCustomers.length} customers`, 'info');
    await super.process(data);
  }
}

// Custom widget to load data to destination
class LoadToDestinationWidget extends CustomWidget {
  private destination: string = '';

  setDestination(destination: string) {
    this.destination = destination;
    return this;
  }

  async process(data: any): Promise<void> {
    const customers = data.payload.transformedCustomers || [];

    // Simulate loading to destination (database, API, file, etc.)
    this.register(
      `Loading ${customers.length} customers to ${this.destination}`,
      'info'
    );

    // Here you would implement actual loading logic
    data.payload.loadedTo = this.destination;
    data.payload.loadedCount = customers.length;

    await super.process(data);
  }
}

// Build the ETL pipeline
const buildETLPipeline = () => {
  // Step 1: Fetch data
  const fetchWidget = FetchCustomersWidget.create('fetch_customers');

  // Step 2: Extract total count
  const extractCount = SetVariable
    .create('extract_customer_count')
    .variable('totalCustomers', '{{ payload.customers.length }}');

  // Step 3: Transform data
  const transformWidget = TransformCustomersWidget.create('transform_customers');

  // Step 4: Check if we have customers to process
  const checkCustomersExist = Split
    .create('check_customers_exist')
    .case((data: any) => Compare
      .is(data.variables.totalCustomers)
      .greaterThan(0)
    );

  // Step 5a: If customers exist, route based on country
  const routeByCountry = Split
    .create('route_by_country')
    .case((data: any) => {
      const customers = data.payload.transformedCustomers || [];
      const usaCustomers = customers.filter((c: any) => c.country === 'USA');
      return usaCustomers.length > 0;
    });

  // Load to USA database
  const loadToUSA = LoadToDestinationWidget.create('load_to_usa').setDestination('USA_DATABASE');

  // Load to International database
  const loadToInternational = LoadToDestinationWidget.create('load_to_intl').setDestination('INTL_DATABASE');

  // Step 5b: If no customers, log warning
  class NoCustomersWidget extends CustomWidget {
    async process(data: any): Promise<void> {
      this.register('No customers to process', 'warn');
      data.payload.result = 'NO_CUSTOMERS';
      await super.process(data);
    }
  }
  const noCustomersWidget = NoCustomersWidget.create('no_customers_handler');

  // Connect the pipeline
  fetchWidget.moveTo(extractCount);
  extractCount.moveTo(transformWidget);
  transformWidget.moveTo(checkCustomersExist);

  checkCustomersExist
    .moveTo(routeByCountry)
    .elseMoveTo(noCustomersWidget);

  routeByCountry
    .moveTo(loadToUSA)
    .elseMoveTo(loadToInternational);

  // Create and return the flow
  return Flow.create('etl_customer_pipeline')
    .start(fetchWidget)
    .end();
};

// Execute the pipeline
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

// Run if executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

export { buildETLPipeline, runExample };
