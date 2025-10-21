# Declarative-Based Flow - Examples

This directory contains real-world examples demonstrating how to use the **Declarative-Based Flow** library to build complex workflows.

## Overview

Each example showcases different aspects and use cases of the library:

1. **ETL Pipeline** - Data extraction, transformation, and loading
2. **User Validation Workflow** - Multi-step validation with error handling
3. **Order Processing Workflow** - E-commerce order fulfillment with conditional routing
4. **Data Transformation** - Complex data restructuring and normalization

## Prerequisites

Before running these examples, ensure you have the library installed:

```bash
npm install
npm run build
```

## Examples

### 01 - ETL Pipeline (`01-etl-pipeline.ts`)

**Use Case:** Customer data synchronization between systems

**Key Features Demonstrated:**
- Custom widgets for API interactions
- Data extraction with `SetVariable`
- Conditional routing with `Split` and `Compare`
- Multi-path workflows (success/failure handling)

**What it does:**
1. Fetches customer data from an API
2. Extracts customer count
3. Transforms customer data (normalization)
4. Routes customers to different databases based on country

**Run it:**
```bash
npx ts-node examples/01-etl-pipeline.ts
```

**Key Concepts:**
- Extending `CustomWidget` for business logic
- Using template expressions: `{{ payload.customers.length }}`
- Chaining widgets with `.moveTo()` and `.elseMoveTo()`

---

### 02 - User Validation Workflow (`02-user-validation-workflow.ts`)

**Use Case:** User registration and validation system

**Key Features Demonstrated:**
- Multi-step validation workflow
- Email and password validation
- Database existence checks
- Age restriction enforcement
- Error handling and routing

**What it does:**
1. Extracts user data from payload
2. Validates email format
3. Checks password strength (8+ chars, uppercase, lowercase, number, special char)
4. Verifies user doesn't already exist
5. Checks age requirements (18+)
6. Creates user if all validations pass

**Run it:**
```bash
npx ts-node examples/02-user-validation-workflow.ts
```

**Examples included:**
- ✅ Valid user registration
- ❌ Invalid password (weak)
- ❌ User already exists

**Key Concepts:**
- Sequential validation with conditional branching
- Error accumulation in payload
- Using `Compare.is().equal()`
- Custom validation widgets

---

### 03 - Order Processing Workflow (`03-order-processing-workflow.ts`)

**Use Case:** E-commerce order processing and fulfillment

**Key Features Demonstrated:**
- Complex business logic orchestration
- Multiple conditional branches
- Discount calculation based on customer tier
- Dynamic shipping cost calculation
- Fulfillment center routing

**What it does:**
1. Validates order data
2. Checks inventory availability
3. Calculates order subtotal
4. Applies tier-based discounts (BRONZE/SILVER/GOLD/PLATINUM)
5. Determines free shipping eligibility ($100+)
6. Calculates shipping costs
7. Routes to regional fulfillment centers
8. Sends order confirmation

**Run it:**
```bash
npx ts-node examples/03-order-processing-workflow.ts
```

**Examples included:**
- PLATINUM customer with free shipping
- International BRONZE customer
- Out of stock order handling

**Key Concepts:**
- Using `Compare.is().greaterThan()`
- Using `Compare.is().in([array])`
- Multiple merge points in workflow
- Constructor parameters in CustomWidget

---

### 04 - Data Transformation (`04-data-transformation.ts`)

**Use Case:** API response transformation and data normalization

**Key Features Demonstrated:**
- Deep nested data extraction
- Template expressions with dot notation
- Computed fields
- Data enrichment
- Dynamic output formatting

**What it does:**
1. Extracts user data from deeply nested structure:
   - `{{ payload.data.user.profile.name.first }}`
   - `{{ payload.data.user.contact.email }}`
   - `{{ payload.data.user.address.street }}`
2. Creates computed fields (full name, full address)
3. Enriches data from external sources
4. Normalizes into standard structure
5. Formats output based on user tier and activity

**Run it:**
```bash
npx ts-node examples/04-data-transformation.ts
```

**Examples included:**
- Premium user (full output)
- Active user (summary output)
- New user (minimal output)

**Key Concepts:**
- Chaining multiple `SetVariable` widgets
- Extracting deeply nested values: `{{ payload.data.user.profile.name.first }}`
- Creating immutable variables with `Object.defineProperty`
- Data enrichment patterns

---

## Common Patterns

### 1. Creating a Flow

```typescript
const flow = Flow.create('my_flow_name')
  .start(firstWidget)
  .end();

const result = await flow(inputData);
```

### 2. Extracting Variables

```typescript
const extractData = SetVariable
  .create('extract_data')
  .variable('userId', '{{ payload.user.id }}')
  .variable('userName', '{{ payload.user.name }}');
```

### 3. Conditional Branching

```typescript
const checkCondition = Split
  .create('check_condition')
  .case((data) => Compare.is(data.payload.value).greaterThan(100));

checkCondition
  .moveTo(successWidget)
  .elseMoveTo(failureWidget);
```

### 4. Custom Business Logic

```typescript
class MyCustomWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    // Your logic here
    data.payload.result = 'processed';
    this.register('Processing complete', 'info');
  }
}
```

### 5. Comparison Operations

```typescript
// Equality
Compare.is(value).equal(expectedValue)
Compare.is(value).notEqual(expectedValue)

// Array membership
Compare.is(value).in(['option1', 'option2', 'option3'])
Compare.is(value).notIn(['excluded1', 'excluded2'])

// Numeric comparison
Compare.is(value).greaterThan(100)
Compare.is(value).lesserThan(50)
```

## Data Structure

All workflows operate on a consistent data structure:

```typescript
{
  payload: {
    // Your input data and any data added during workflow
    // Original input is preserved
    // Widgets can add new properties
  },
  variables: {
    // Variables extracted by SetVariable widgets
    // Immutable (read-only, non-configurable)
    // Accessible via data.variables.variableName
  }
}
```

## Tips and Best Practices

1. **Name Your Widgets Descriptively**
   - Use clear, descriptive names for widgets
   - Example: `'validate_user_email'` instead of `'widget1'`

2. **Use Template Expressions for Data Extraction**
   - Extract data with `{{ payload.path.to.value }}`
   - Supports deep nested access with dot notation

3. **Chain Widgets Logically**
   - Use `.moveTo()` for success paths
   - Use `.elseMoveTo()` for alternative/failure paths

4. **Log Important Steps**
   - Use `this.register(message, level)` in CustomWidget
   - Levels: `'info'`, `'warn'`, `'error'`

5. **Handle Errors Gracefully**
   - Widgets automatically catch errors and route to `.elseMoveTo()`
   - Provide meaningful error handlers

6. **Keep Widgets Focused**
   - Each widget should do one thing well
   - Complex logic should be broken into multiple widgets

7. **Test Each Path**
   - Test success paths
   - Test failure/alternative paths
   - Ensure proper error handling

## Running Multiple Examples

To run all examples in sequence:

```bash
# ETL Pipeline
npx ts-node examples/01-etl-pipeline.ts

# User Validation
npx ts-node examples/02-user-validation-workflow.ts

# Order Processing
npx ts-node examples/03-order-processing-workflow.ts

# Data Transformation
npx ts-node examples/04-data-transformation.ts
```

## Learn More

- **Main README:** [../README.md](../README.md)
- **Source Code:** [../src/](../src/)
- **Tests:** [../test/](../test/)

## Contributing

Have an interesting use case? Feel free to contribute additional examples by submitting a PR!

## License

MIT
