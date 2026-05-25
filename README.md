<div align="center">

# 🌊 Declarative Based Flow

**Build complex workflows with elegant, chainable TypeScript**

[![Node.js Jest](https://github.com/iagocalazans/declarative-based-flow/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/iagocalazans/declarative-based-flow/actions/workflows/node.js.yml)
[![npm version](https://badge.fury.io/js/declarative-based-flow.svg)](https://www.npmjs.com/package/declarative-based-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/iagocalazans/declarative-based-flow/pulls)

[Features](#-features) • [Quick Start](#-quick-start) • [Examples](#-examples) • [Documentation](#-documentation) • [API](#-api-reference)

</div>

---

## 🎯 Why Declarative Based Flow?

Transform complex business logic into readable, maintainable workflows. No more spaghetti code or deeply nested conditionals.

```typescript
// Before: Nested callbacks and hard-to-follow logic
async function processUser(userData) {
  if (validateEmail(userData.email)) {
    if (checkPasswordStrength(userData.password)) {
      if (!await userExists(userData.email)) {
        return await createUser(userData);
      } else {
        throw new Error('User exists');
      }
    } else {
      throw new Error('Weak password');
    }
  } else {
    throw new Error('Invalid email');
  }
}

// After: Clean, declarative workflow
const userRegistrationFlow = Flow.create('user_registration')
  .start(
    ValidateEmailWidget.create('validate_email')
      .moveTo(CheckPasswordStrengthWidget.create('check_password'))
      .moveTo(CheckUserExistsWidget.create('check_exists'))
      .moveTo(CreateUserWidget.create('create_user'))
  )
  .end();

await userRegistrationFlow(userData);
```

---

## ✨ Features

### 🔗 **Fluent API & Method Chaining**
Build workflows that read like sentences. Chain widgets together naturally with `.moveTo()` and `.elseMoveTo()`.

### 🌳 **Widget Tree Architecture**
Each widget is a node in a binary tree with success (left) and failure (right) paths. Automatic error routing included.

### 🔀 **Conditional Branching**
Use `Split` widgets with powerful comparison operators to route workflow execution based on data conditions.

### 📦 **Variable Extraction**
Extract values from nested objects using template expressions: `{{ payload.user.email }}`. Variables are immutable by default.

### 🎨 **Fully Extensible**
Create custom widgets by extending `CustomWidget`. Implement your business logic while inheriting workflow orchestration.

### ⚡ **Parallel & Resilient**
Fan out work with `Parallel`, process batches with bounded concurrency via `ParallelMap`, and harden steps with `Retry` and `CircuitBreaker`.

### 🛡️ **Type-Safe**
Written in TypeScript with strict mode. Full type inference and IntelliSense support.

### ⚡ **Zero Dependencies** (Runtime)
Core library has zero runtime dependencies. Optional integrations available (axios, winston).

### 🧪 **Fully Tested**
Comprehensive test suite with Jest. 100% coverage on core functionality.

---

## 📦 Installation

```bash
npm install declarative-based-flow
```

```bash
yarn add declarative-based-flow
```

```bash
pnpm add declarative-based-flow
```

---

## 🚀 Quick Start

### Basic Example: Data Transformation Pipeline

```typescript
import { Flow, SetVariable, Split, Compare, CustomWidget } from 'declarative-based-flow';

// 1. Extract variables from input
const extractData = SetVariable
  .create('extract_data')
  .variable('userId', '{{ payload.user.id }}')
  .variable('userEmail', '{{ payload.user.email }}');

// 2. Create conditional branch
const checkUserType = Split
  .create('check_user_type')
  .case((data) => Compare.is(data.payload.user.type).equal('premium'));

// 3. Define success path (premium users)
const processPremium = SetVariable
  .create('process_premium')
  .variable('discount', '{{ payload.pricing.premium }}');

// 4. Define alternative path (standard users)
const processStandard = SetVariable
  .create('process_standard')
  .variable('discount', '{{ payload.pricing.standard }}');

// 5. Connect the workflow
extractData.moveTo(checkUserType);
checkUserType
  .moveTo(processPremium)
  .elseMoveTo(processStandard);

// 6. Create and execute the flow
const flow = Flow.create('user_discount_flow').start(extractData).end();

const result = await flow({
  user: { id: 123, email: 'user@example.com', type: 'premium' },
  pricing: { premium: 0.2, standard: 0.1 }
});

console.log(result.variables.discount); // 0.2
```

---

## 💡 Examples

### ETL Pipeline

Extract, transform, and load data through a multi-stage pipeline:

```typescript
const etlFlow = Flow.create('customer_etl')
  .start(
    ExtractCustomersWidget.create('extract')
      .moveTo(TransformDataWidget.create('transform'))
      .moveTo(ValidateSchemaWidget.create('validate'))
      .moveTo(LoadToDatabase.create('load'))
  )
  .end();
```

**[See full ETL example →](examples/01-etl-pipeline.ts)**

### User Validation Workflow

Multi-step validation with error handling:

```typescript
const validationFlow = Flow.create('user_validation')
  .start(
    ValidateEmailWidget.create('validate_email')
      .moveTo(
        Split.create('email_check')
          .case((data) => Compare.is(data.payload.emailValid).equal(true))
          .moveTo(ValidatePasswordWidget.create('validate_password'))
          .elseMoveTo(EmailErrorWidget.create('email_error'))
      )
  )
  .end();
```

**[See full validation example →](examples/02-user-validation-workflow.ts)**

### Order Processing

E-commerce order fulfillment with inventory checks:

```typescript
const orderFlow = Flow.create('order_processing')
  .start(
    CheckInventoryWidget.create('check_inventory')
      .moveTo(
        Split.create('inventory_available')
          .case((data) => Compare.is(data.payload.inStock).equal(true))
          .moveTo(ProcessPaymentWidget.create('payment'))
          .elseMoveTo(OutOfStockWidget.create('out_of_stock'))
      )
  )
  .end();
```

**[See full order example →](examples/03-order-processing-workflow.ts)**

### Data Transformation

Complex nested data transformation:

```typescript
const transformFlow = Flow.create('data_transform')
  .start(
    SetVariable.create('extract_fields')
      .variable('name', '{{ payload.customer.profile.name }}')
      .variable('address', '{{ payload.customer.shipping.address }}')
      .moveTo(NormalizeDataWidget.create('normalize'))
  )
  .end();
```

**[See full transformation example →](examples/04-data-transformation.ts)**

### Resilient Parallel ETL

Concurrent extraction, bounded-concurrency transforms with partial-failure handling, and resilient loads:

```typescript
const etl = Flow.create('resilient_etl')
  .start(
    Parallel.create('extract')
      .branch('warehouse', FetchWarehouse.create('warehouse'))
      .branch('billing', FetchBilling.create('billing'))
      .moveTo(
        ParallelMap.create('transform')
          .from('{{ payload.records }}')
          .withConcurrency(10)
          .each(async (record) => normalize(record))
          .moveTo(
            CircuitBreaker.create('breaker').wrap(
              Retry.create('retry').attempts(3).wrap(LoadWidget.create('load'))
            )
          )
      )
  )
  .end();
```

**[See full resilient ETL example →](examples/05-resilient-parallel-etl.ts)**

---

## 📚 Documentation

### Core Concepts

#### 🌊 Flow

The entry point of every workflow. Connects widgets and returns an executable function.

```typescript
const flow = Flow.create('workflow_name')
  .start(firstWidget)
  .end();

// Execute with data
const result = await flow(inputData);
```

**Data Structure Convention:**
```typescript
{
  payload: {
    // Your input data (can be extended by widgets)
  },
  variables: {
    // Extracted variables (immutable)
  }
}
```

#### 🔧 SetVariable

Extract values from nested objects using template expressions.

```typescript
const extractor = SetVariable
  .create('extract_user_info')
  .variable('email', '{{ payload.user.email }}')
  .variable('fullName', '{{ payload.user.profile.name.first }}');
```

**Template Syntax:**
- Pattern: `{{ path.to.value }}`
- Supports deep nesting: `{{ payload.user.profile.settings.theme }}`
- Variables are stored immutably using `Object.defineProperty`

#### 🔀 Split

Conditional branching based on boolean functions.

```typescript
const branch = Split
  .create('check_age')
  .case((data) => Compare.is(data.payload.age).greaterThan(18))
  .moveTo(adultPathWidget)
  .elseMoveTo(minorPathWidget);
```

#### ⚖️ Compare & Comparator

Factory pattern for comparison operations.

```typescript
Compare.is(value).equal(expected)           // ===
Compare.is(value).notEqual(expected)        // !==
Compare.is(value).in(['a', 'b', 'c'])       // includes
Compare.is(value).notIn(['x', 'y'])         // !includes
Compare.is(value).greaterThan(10)           // >
Compare.is(value).lesserThan(100)           // <
```

#### 🎨 CustomWidget

Extend with your own business logic by overriding the `run()` lifecycle hook. Implement your operation; the engine advances the workflow and awaits the rest of the chain for you.

```typescript
class SendEmailWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const email = data.payload.user?.email;

    await sendEmail(email, 'Welcome!');

    this.register(`Email sent to ${email}`, 'info');
  }
}

// Usage
const emailWidget = SendEmailWidget.create('send_welcome_email');
```

**Custom Widget Requirements:**
1. Extend `CustomWidget`
2. Override `protected async run(data): Promise<void>` with your logic
3. Throw to route execution to the failure path (`elseMoveTo`)
4. Use `this.register(message, level)` for logging

> The legacy pattern of overriding `process(data)` and calling `await super.process(data)` still works, but `run()` is recommended: it cannot forget to await the downstream chain and keeps your operation separate from traversal. A custom widget that adds its own configuration methods should re-declare `static create(name)` so the returned type exposes them.

#### ⚡ Parallel

Run independent branches concurrently on isolated context clones, then merge.

```typescript
const extract = Parallel.create('extract_sources')
  .branch('warehouse', FetchWarehouseWidget.create('warehouse'))
  .branch('billing', FetchBillingWidget.create('billing'))
  .concurrency(2)          // optional cap; default runs all at once
  .onError('settle')       // 'fail-fast' (default) | 'settle'
  .into('payload.sources') // results keyed by branch name
  .moveTo(combineWidget);
```

#### 🧺 ParallelMap

Map an async operation over an array with a concurrency cap and partial-failure handling. The ETL batch workhorse.

```typescript
const transform = ParallelMap.create('transform_records')
  .from('{{ payload.records }}')
  .withConcurrency(10)
  .each(async (record) => normalize(record))  // a widget branch or an async function
  .into('payload.processed')                   // ordered successes
  .collectErrorsInto('payload.failures')       // { index, item, error }[]
  .moveTo(loadWidget);
```

#### 🔁 Retry

Re-run a wrapped branch on retryable failures using fixed or exponential backoff. Routing signals (such as a `Split` taking its else path) are never retried.

```typescript
const resilientLoad = Retry.create('load_with_retry')
  .attempts(3)
  .backoff('exponential', { baseMs: 100, factor: 2, maxMs: 5000, jitter: true })
  .retryIf((error) => error instanceof NetworkError)
  .wrap(LoadWidget.create('load'))
  .moveTo(next)
  .elseMoveTo(loadFailed);  // taken once attempts are exhausted
```

#### 🔌 CircuitBreaker

Stop hammering a failing dependency. After `threshold` consecutive failures the circuit opens and fast-fails to the failure path until `cooldown` elapses, then a half-open probe decides whether to close. State lives on the instance, so it is shared across every flow invocation.

```typescript
const breaker = CircuitBreaker.create('billing_breaker')
  .threshold(5)
  .cooldown(30000)
  .wrap(CallBillingApi.create('billing'))
  .moveTo(next)
  .elseMoveTo(serveFromCache);  // fallback while the circuit is open
```

Compose the two: place `CircuitBreaker` outside `Retry` so the breaker judges the post-retry outcome.

```typescript
CircuitBreaker.create('breaker')
  .wrap(Retry.create('retry').attempts(3).wrap(LoadWidget.create('load')));
```

---

## 🔧 API Reference

### Flow

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `Flow` | Static factory method |
| `start(widget)` | `widget: Widget` | `Flow` | Set the first widget |
| `end()` | - | `(data: any) => Promise<any>` | Returns executable function |

### SetVariable

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `SetVariable` | Static factory method |
| `variable(key, template)` | `key: string, template: string` | `SetVariable` | Define variable extraction |
| `moveTo(widget)` | `widget: Widget` | `SetVariable` | Set success path |

### Split

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `Split` | Static factory method |
| `case(fn)` | `fn: (data: any) => boolean` | `Split` | Define condition function |
| `moveTo(widget)` | `widget: Widget` | `Split` | Set true path |
| `elseMoveTo(widget)` | `widget: Widget` | `Split` | Set false path |

### Compare

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `is(value)` | `value: any` | `Comparator` | Create comparator instance |

### Comparator

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `equal(value)` | `value: any` | `boolean` | Strict equality (===) |
| `notEqual(value)` | `value: any` | `boolean` | Strict inequality (!==) |
| `in(array)` | `array: any[]` | `boolean` | Array includes |
| `notIn(array)` | `array: any[]` | `boolean` | Array not includes |
| `greaterThan(value)` | `value: any` | `boolean` | Greater than (>) |
| `lesserThan(value)` | `value: any` | `boolean` | Less than (<) |

### CustomWidget

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `CustomWidget` | Static factory method |
| `process(data)` | `data: any` | `Promise<void>` | Override to implement logic |
| `register(msg, level)` | `msg: any, level: string` | `void` | Log messages |
| `moveTo(widget)` | `widget: Widget` | `CustomWidget` | Set success path |
| `elseMoveTo(widget)` | `widget: Widget` | `CustomWidget` | Set failure path |

### Parallel

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `Parallel` | Static factory method |
| `branch(name, widget)` | `name: string, widget: Widget` | `Parallel` | Register a concurrent branch |
| `concurrency(limit)` | `limit: number` | `Parallel` | Cap in-flight branches (0 = all) |
| `onError(mode)` | `'fail-fast' \| 'settle'` | `Parallel` | Group failure behavior |
| `into(path)` | `path: string` | `Parallel` | Payload key for merged results |
| `merge(fn)` | `(ctx, results) => void` | `Parallel` | Custom merge reducer |
| `clone(fn)` | `(ctx) => ctx` | `Parallel` | Custom per-branch cloner |
| `moveTo(widget)` / `elseMoveTo(widget)` | `widget: Widget` | `Parallel` | Success / failure path |

### ParallelMap

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `ParallelMap` | Static factory method |
| `from(path)` | `path: string` | `ParallelMap` | Template expression for the source array |
| `as(key)` | `key: string` | `ParallelMap` | Payload key for the injected item (default `item`) |
| `withConcurrency(limit)` | `limit: number` | `ParallelMap` | In-flight cap (default `5`) |
| `each(task)` | `Widget \| (item, ctx) => result` | `ParallelMap` | Per-item operation |
| `into(path)` | `path: string` | `ParallelMap` | Payload key for ordered successes |
| `onItemError(mode)` | `'collect' \| 'fail-fast'` | `ParallelMap` | Per-item failure behavior |
| `collectErrorsInto(path)` | `path: string` | `ParallelMap` | Payload key for collected failures |
| `moveTo(widget)` / `elseMoveTo(widget)` | `widget: Widget` | `ParallelMap` | Success / failure path |

### Retry

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `Retry` | Static factory method |
| `attempts(count)` | `count: number` | `Retry` | Max attempts (default `3`) |
| `backoff(strategy, options)` | `'fixed' \| 'exponential', BackoffOptions` | `Retry` | Backoff configuration |
| `retryIf(predicate)` | `(error) => boolean` | `Retry` | Which errors are retryable |
| `isolate()` | - | `Retry` | Run each attempt on a fresh clone |
| `wrap(widget)` | `widget: Widget` | `Retry` | Branch to retry |
| `moveTo(widget)` / `elseMoveTo(widget)` | `widget: Widget` | `Retry` | Success / exhausted path |

### CircuitBreaker

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `create(name)` | `name: string` | `CircuitBreaker` | Static factory method |
| `threshold(count)` | `count: number` | `CircuitBreaker` | Failures that open the circuit (default `5`) |
| `cooldown(ms)` | `ms: number` | `CircuitBreaker` | Open duration before half-open (default `30000`) |
| `halfOpenAttempts(count)` | `count: number` | `CircuitBreaker` | Concurrent probes while half-open (default `1`) |
| `isFailure(predicate)` | `(error) => boolean` | `CircuitBreaker` | Which errors count as failures |
| `wrap(widget)` | `widget: Widget` | `CircuitBreaker` | Protected branch |
| `moveTo(widget)` / `elseMoveTo(widget)` | `widget: Widget` | `CircuitBreaker` | Success / open-or-failure path |

---

## 🎓 Advanced Patterns

### Sequential Processing

```typescript
widgetA
  .moveTo(widgetB)
  .moveTo(widgetC)
  .moveTo(widgetD);
```

### Convergent Paths

```typescript
// Multiple paths converge to same widget
successPath.moveTo(finalWidget);
failurePath.moveTo(finalWidget);
```

### Nested Conditionals

```typescript
Split.create('outer_check')
  .case(outerCondition)
  .moveTo(
    Split.create('inner_check')
      .case(innerCondition)
      .moveTo(deepSuccessWidget)
      .elseMoveTo(deepFailureWidget)
  );
```

### Variable Chain Extraction

```typescript
SetVariable.create('extract_1')
  .variable('userId', '{{ payload.user.id }}')
  .moveTo(
    SetVariable.create('extract_2')
      .variable('userName', '{{ payload.user.name }}')
      .moveTo(ProcessWidget.create('process'))
  );
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test                 # Run all tests
npm run test:dev         # Watch mode
npm run test:coverage    # Coverage report
```

Run specific tests:

```bash
npx jest test/flow.test.ts
npx jest test/split.test.ts
npx jest test/set-variable.test.ts
```

---

## 🛠️ Development

### Build

```bash
npm run build            # Compile TypeScript to CommonJS
```

### Code Quality

```bash
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

### Project Structure

```
declarative-based-flow/
├── src/
│   ├── flow.class.ts          # Flow widget
│   ├── set-variable.ts        # Variable extraction
│   ├── split.ts               # Conditional branching
│   ├── compare.ts             # Comparison factory
│   ├── comparator.ts          # Comparison operators
│   ├── custom-widget.ts       # Base for custom widgets
│   ├── widget.ts              # Base widget class
│   └── index.ts               # Public exports
├── test/                      # Jest test suite
├── examples/                  # Real-world examples
│   ├── 01-etl-pipeline.ts
│   ├── 02-user-validation-workflow.ts
│   ├── 03-order-processing-workflow.ts
│   └── 04-data-transformation.ts
└── lib/                       # Compiled output
```

---

## 🌟 Use Cases

### Perfect For:

- ✅ **ETL Pipelines** - Extract, transform, load data workflows
- ✅ **Business Process Automation** - Order processing, approvals, notifications
- ✅ **Data Validation** - Multi-step validation with error handling
- ✅ **API Orchestration** - Chain multiple API calls with conditional logic
- ✅ **State Machines** - Model complex state transitions
- ✅ **Workflow Engines** - Build custom workflow execution engines
- ✅ **Data Transformation** - Complex nested data mapping and transformation

### Not Ideal For:

- ❌ Simple CRUD operations (use direct functions)
- ❌ Real-time streaming (consider RxJS)
- ❌ UI rendering logic (use React/Vue state management)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Development Guidelines:**
- Follow existing code style (run `npm run lint` and `npm run format`)
- Add tests for new features
- Update documentation
- Ensure all tests pass (`npm test`)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**Iago Calazans** - [iago.calazans@gmail.com](mailto:iago.calazans@gmail.com)

**Contributors:**
- Rafael Iunes - [rafaeliunes97@gmail.com](mailto:rafaeliunes97@gmail.com)

---

## 🙏 Acknowledgments

- Inspired by functional programming and reactive patterns
- Built with TypeScript, Jest, and modern tooling
- Thanks to all contributors and users

---

## 📊 Roadmap

- [x] Parallel execution support
- [x] Built-in retry and circuit breaker patterns
- [ ] Visual workflow builder/debugger
- [ ] Performance monitoring and metrics
- [ ] Plugin system for common integrations
- [ ] GraphQL workflow definitions

---

## 💬 Support

- 📫 **Email:** [iago.calazans@gmail.com](mailto:iago.calazans@gmail.com)
- 🐛 **Issues:** [GitHub Issues](https://github.com/iagocalazans/declarative-based-flow/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/iagocalazans/declarative-based-flow/discussions)

---

<div align="center">

**If this project helped you, please give it a ⭐ star!**

Made with ❤️ by [Iago Calazans](https://github.com/iagocalazans)

</div>
