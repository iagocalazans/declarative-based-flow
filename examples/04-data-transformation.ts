/**
 * Data Transformation Example
 *
 * This example demonstrates complex data transformation workflows using
 * SetVariable's template expression system to extract, transform, and
 * restructure nested data.
 *
 * Use Case: API response transformation and data normalization
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

// Custom widget to enrich data
class EnrichDataWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const userId = data.variables.userId;

    // Simulate enrichment from external API
    const enrichmentData: Record<string, any> = {
      '101': { preferences: { theme: 'dark', language: 'en' }, loyalty: 'gold' },
      '102': { preferences: { theme: 'light', language: 'es' }, loyalty: 'silver' },
      '103': { preferences: { theme: 'dark', language: 'fr' }, loyalty: 'bronze' },
    };

    const enrichment = enrichmentData[userId] || { preferences: {}, loyalty: 'none' };

    data.payload.enrichment = enrichment;

    this.register(`Enriched data for user ${userId}`, 'info');
  }
}

// Custom widget to normalize data structure
class NormalizeDataWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const normalized = {
      user: {
        id: data.variables.userId,
        profile: {
          firstName: data.variables.firstName,
          lastName: data.variables.lastName,
          fullName: data.variables.fullName,
          email: data.variables.userEmail,
        },
        address: {
          street: data.variables.street,
          city: data.variables.city,
          country: data.variables.country,
          fullAddress: data.variables.fullAddress,
        },
        metadata: {
          accountAge: data.variables.accountAge,
          isPremium: data.variables.isPremium,
          totalPurchases: data.variables.totalPurchases,
          preferences: data.payload.enrichment?.preferences || {},
          loyaltyTier: data.payload.enrichment?.loyalty || 'none',
        },
      },
      transformedAt: new Date().toISOString(),
    };

    data.payload.normalized = normalized;

    this.register('Data normalized successfully', 'info');
  }
}

// Custom widget to format output
class FormatOutputWidget extends CustomWidget {
  private format: string;

  constructor(name: string, format: string) {
    super(name);
    this.format = format;
  }

  async process(data: any): Promise<void> {
    const normalized = data.payload.normalized;

    if (this.format === 'SUMMARY') {
      data.payload.output = {
        userId: normalized.user.id,
        name: normalized.user.profile.fullName,
        location: normalized.user.address.fullAddress,
        tier: normalized.user.metadata.loyaltyTier,
        premium: normalized.user.metadata.isPremium,
      };
    } else if (this.format === 'FULL') {
      data.payload.output = normalized;
    } else {
      data.payload.output = {
        userId: normalized.user.id,
        email: normalized.user.profile.email,
      };
    }

    this.register(`Formatted output as ${this.format}`, 'info');
  }
}

// Build a complex data transformation workflow
const buildDataTransformationWorkflow = () => {
  // Step 1: Extract basic user information
  const extractBasicInfo = SetVariable
    .create('extract_basic_info')
    .variable('userId', '{{ payload.data.user.id }}')
    .variable('firstName', '{{ payload.data.user.profile.name.first }}')
    .variable('lastName', '{{ payload.data.user.profile.name.last }}');

  // Step 2: Extract contact information
  const extractContactInfo = SetVariable
    .create('extract_contact_info')
    .variable('userEmail', '{{ payload.data.user.contact.email }}')
    .variable('userPhone', '{{ payload.data.user.contact.phone }}');

  // Step 3: Extract address information
  const extractAddressInfo = SetVariable
    .create('extract_address_info')
    .variable('street', '{{ payload.data.user.address.street }}')
    .variable('city', '{{ payload.data.user.address.city }}')
    .variable('country', '{{ payload.data.user.address.country }}');

  // Step 4: Extract metadata
  const extractMetadata = SetVariable
    .create('extract_metadata')
    .variable('accountAge', '{{ payload.data.metadata.accountAge }}')
    .variable('isPremium', '{{ payload.data.metadata.premium }}')
    .variable('totalPurchases', '{{ payload.data.metadata.purchases.total }}');

  // Step 5: Create computed variables (full name and full address)
  const createComputedFields = new (class extends CustomWidget {
    async process(data: any): Promise<void> {
      // Create full name
      const fullName = `${data.variables.firstName} ${data.variables.lastName}`;
      Object.defineProperty(data.variables, 'fullName', {
        value: fullName,
        writable: false,
        enumerable: true,
        configurable: false,
      });

      // Create full address
      const fullAddress = `${data.variables.street}, ${data.variables.city}, ${data.variables.country}`;
      Object.defineProperty(data.variables, 'fullAddress', {
        value: fullAddress,
        writable: false,
        enumerable: true,
        configurable: false,
      });

      this.register('Computed fields created', 'info');
    }
  })('create_computed_fields');

  // Step 6: Enrich with external data
  const enrichData = new EnrichDataWidget('enrich_data');

  // Step 7: Normalize the data structure
  const normalizeData = new NormalizeDataWidget('normalize_data');

  // Step 8: Check if user is premium for output formatting
  const checkPremiumStatus = Split
    .create('check_premium_status')
    .case((data: any) => Compare
      .is(data.variables.isPremium)
      .equal(true)
    );

  // Premium users get full format
  const formatPremiumOutput = new FormatOutputWidget('format_premium_output', 'FULL');

  // Step 9: For non-premium, check purchase count
  const checkPurchaseCount = Split
    .create('check_purchase_count')
    .case((data: any) => Compare
      .is(data.variables.totalPurchases)
      .greaterThan(10)
    );

  // Active users get summary
  const formatSummaryOutput = new FormatOutputWidget('format_summary_output', 'SUMMARY');

  // New users get minimal format
  const formatMinimalOutput = new FormatOutputWidget('format_minimal_output', 'MINIMAL');

  // Build the workflow chain
  extractBasicInfo.moveTo(extractContactInfo);
  extractContactInfo.moveTo(extractAddressInfo);
  extractAddressInfo.moveTo(extractMetadata);
  extractMetadata.moveTo(createComputedFields);
  createComputedFields.moveTo(enrichData);
  enrichData.moveTo(normalizeData);
  normalizeData.moveTo(checkPremiumStatus);

  checkPremiumStatus
    .moveTo(formatPremiumOutput)
    .elseMoveTo(checkPurchaseCount);

  checkPurchaseCount
    .moveTo(formatSummaryOutput)
    .elseMoveTo(formatMinimalOutput);

  // Create and return the flow
  return Flow.create('data_transformation_workflow')
    .start(extractBasicInfo)
    .end();
};

// Example: Premium user data
const runPremiumUserExample = async () => {
  console.log('=== Premium User Transformation ===\n');

  const workflow = buildDataTransformationWorkflow();

  const result = await workflow({
    data: {
      user: {
        id: '101',
        profile: {
          name: {
            first: 'John',
            last: 'Doe',
          },
        },
        contact: {
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
        },
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          country: 'USA',
        },
      },
      metadata: {
        accountAge: 365,
        premium: true,
        purchases: {
          total: 45,
          lastPurchase: '2024-01-15',
        },
      },
    },
  });

  console.log('Transformed Output:');
  console.log(JSON.stringify(result.payload.output, null, 2));
  console.log('\nExtracted Variables:');
  console.log(JSON.stringify(result.variables, null, 2));
};

// Example: Active non-premium user
const runActiveUserExample = async () => {
  console.log('\n=== Active Non-Premium User Transformation ===\n');

  const workflow = buildDataTransformationWorkflow();

  const result = await workflow({
    data: {
      user: {
        id: '102',
        profile: {
          name: {
            first: 'Jane',
            last: 'Smith',
          },
        },
        contact: {
          email: 'jane.smith@example.com',
          phone: '+1-555-0456',
        },
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          country: 'USA',
        },
      },
      metadata: {
        accountAge: 180,
        premium: false,
        purchases: {
          total: 15,
          lastPurchase: '2024-01-10',
        },
      },
    },
  });

  console.log('Transformed Output:');
  console.log(JSON.stringify(result.payload.output, null, 2));
};

// Example: New user with minimal data
const runNewUserExample = async () => {
  console.log('\n=== New User Transformation ===\n');

  const workflow = buildDataTransformationWorkflow();

  const result = await workflow({
    data: {
      user: {
        id: '103',
        profile: {
          name: {
            first: 'Bob',
            last: 'Johnson',
          },
        },
        contact: {
          email: 'bob.johnson@example.com',
          phone: '+1-555-0789',
        },
        address: {
          street: '789 Pine Rd',
          city: 'Austin',
          country: 'USA',
        },
      },
      metadata: {
        accountAge: 5,
        premium: false,
        purchases: {
          total: 2,
          lastPurchase: '2024-01-18',
        },
      },
    },
  });

  console.log('Transformed Output:');
  console.log(JSON.stringify(result.payload.output, null, 2));
};

// Run all examples
const runAllExamples = async () => {
  await runPremiumUserExample();
  await runActiveUserExample();
  await runNewUserExample();
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { buildDataTransformationWorkflow, runPremiumUserExample, runActiveUserExample, runNewUserExample };
