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

Extend with your own business logic.

```typescript
class SendEmailWidget extends CustomWidget {
  async process(data: WorkflowData): Promise<void> {
    const email = data.payload.user?.email;

    // Your business logic
    await sendEmail(email, 'Welcome!');

    // Log activity
    this.register(`Email sent to ${email}`, 'info');

    // IMPORTANT: Call super.process to continue workflow
    await super.process(data);
  }
}

// Usage
const emailWidget = SendEmailWidget.create('send_welcome_email');
```

**Custom Widget Requirements:**
1. Extend `CustomWidget` class
2. Implement `async process(data): Promise<void>`
3. Call `await super.process(data)` at the end
4. Use `this.register(message, level)` for logging

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

- [ ] Parallel execution support
- [ ] Built-in retry and circuit breaker patterns
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
