# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Declarative-Based Flow** is a TypeScript library for building complex, structured workflows using a declarative and fluent syntax. It provides chainable widgets for orchestrating multi-step operations, ideal for ETL pipelines, data transformations, and workflow automation.

**Key Use Cases:** ETL operations, workflow automation, multi-step data transformations, conditional branching, business logic orchestration.

## Commands

### Build
```bash
npm run build
```
Removes `./lib` directory and compiles TypeScript to CommonJS in `./lib` with `.d.ts` declaration files.

### Testing
```bash
npm test                 # Run all tests once
npm run test:dev         # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

To run a single test file:
```bash
npx jest test/flow.test.ts
npx jest test/split.test.ts
npx jest test/set-variable.test.ts
```

### Code Quality
```bash
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

## Architecture

### Core Widget System

The library is built on a **Widget Tree Pattern** where all components extend the base `Widget` class ([src/widget.ts:1](src/widget.ts#L1)). Widgets form a linked tree structure using internal navigation:

- **`left`** pointer: Success path (accessed via `.moveTo()`)
- **`right`** pointer: Failure/alternative path (accessed via `.elseMoveTo()`)

This dual-path system enables automatic error handling and conditional branching throughout the workflow.

### Widget Execution Flow

1. **Entry Point:** `Flow.create(name).start(widget).end()` returns an executable function
2. **Payload Wrapping:** Input data is automatically wrapped as `{ payload: originalData }`
3. **Lifecycle Hook:** Widgets implement `protected async run(ctx)`; the base `process()` runs it, then advances into `left`, awaiting the whole chain. Legacy widgets that override `process()` and call `await super.process()` still work.
4. **Error Handling:** A thrown value routes to the widget's `right` path. When no failure path exists, real errors propagate (no silent swallow) while a `RouteSignal` (control flow) completes quietly.
5. **Immutability:** `variables` entries are read-only; widgets add new payload properties or use the `variables` object

### Core Widgets

#### 1. Flow ([src/flow.class.ts](src/flow.class.ts))
- Entry point and workflow executor
- Connects widgets and returns callable function
- Usage: `Flow.create('name').start(firstWidget).end()(data)`

#### 2. SetVariable ([src/set-variable.ts](src/set-variable.ts))
- Extracts values using **template expressions**: `{{ payload.path.to.value }}`
- Stores immutable variables using `Object.defineProperty`
- Supports deep nested access via dot notation
- Usage: `SetVariable.create('name').variable('varName', '{{ payload.user.email }}')`

#### 3. Split ([src/split.ts](src/split.ts))
- Conditional branching based on boolean function
- Routes to `.moveTo()` on true, `.elseMoveTo()` on false
- Usage: `Split.create('name').case((data) => boolean).moveTo(widget).elseMoveTo(other)`

#### 4. Compare + Comparator ([src/compare.ts](src/compare.ts), [src/comparator.ts](src/comparator.ts))
- Factory pattern for comparison operations
- **Operations:** `equal()`, `notEqual()`, `in()`, `notIn()`, `greaterThan()`, `lesserThan()`
- Usage: `Compare.is(value).equal(expected)` or `Compare.is(value).in(['option1', 'option2'])`

#### 5. CustomWidget ([src/custom-widget.ts](src/custom-widget.ts))
- Base class for extending with custom business logic
- Override `protected async run(data: any): Promise<void>` with the operation (the base advances the chain)
- Throw to route to the `.elseMoveTo()` failure path
- Use `this.register(message, level)` for logging ('info', 'warn', 'error')
- A subclass that adds config methods should re-declare `static create(name)` so the returned type exposes them
- Legacy contract (override `process()` + call `await super.process()`) still works

#### 6. Parallel ([src/parallel.ts](src/parallel.ts))
- Fan-out/fan-in: runs named branches concurrently on isolated context clones, then merges
- `concurrency(n)` caps in-flight branches; `onError('fail-fast' | 'settle')`; `into(path)` or custom `merge(fn)`
- Usage: `Parallel.create('x').branch('a', wA).branch('b', wB).into('payload.sources')`

#### 7. ParallelMap ([src/parallel-map.ts](src/parallel-map.ts))
- Concurrency-limited batch map over an array (the ETL batch workhorse)
- `from('{{ payload.items }}')`, `withConcurrency(n)`, `each(widgetOrFn)`, `into(path)`, `collectErrorsInto(path)`
- `onItemError('collect' | 'fail-fast')`; `collect` gathers `{ index, item, error }` for partial-failure ETL

#### 8. Retry ([src/retry.ts](src/retry.ts))
- Decorator that re-runs `wrap(branch)` on retryable failures with fixed/exponential backoff
- Never retries a `RouteSignal`; exhausted attempts route to `.elseMoveTo()`
- `attempts(n)`, `backoff(strategy, options)`, `retryIf(fn)`, `isolate()`

#### 9. CircuitBreaker ([src/circuit-breaker.ts](src/circuit-breaker.ts))
- Decorator with closed/open/half-open state held on the instance (shared across flow runs)
- Opens after `threshold` consecutive failures; fast-fails to `.elseMoveTo()` until `cooldown` elapses
- Throws `CircuitOpenError` while open; compose as `CircuitBreaker.wrap(Retry.wrap(op))`

#### Internals
- `RouteSignal` ([src/route-signal.ts](src/route-signal.ts)): typed control-flow marker (not an `Error`) that distinguishes branch routing from real failures
- `runWithConcurrency` ([src/concurrency.ts](src/concurrency.ts)): dependency-free ordered async pool used by both parallel widgets
- `computeBackoff` ([src/backoff.ts](src/backoff.ts)): fixed/exponential backoff with optional jitter

### Template Expression System

**Location:** [src/validate-whitelabel.ts](src/validate-whitelabel.ts)

The "whitelabel" system extracts values from nested objects using `{{ path.to.value }}` syntax:

- **Regex Pattern:** `/(?<={{).+(?=}})/`
- **Parsing:** Splits on `.` for recursive object traversal
- **Example:** `{{ payload.user.profile.name.first }}` → accesses `data.payload.user.profile.name.first`
- **Functions:** `isValidLabel()` validates syntax, `processWhiteLabel()` extracts value

### Data Structure Convention

All workflows operate on this structure:

```typescript
{
  payload: {
    // Original input data (frozen/immutable)
    // Widgets can add new properties
  },
  variables: {
    // Variables extracted by SetVariable
    // Immutable (read-only, non-configurable)
  }
}
```

## Important Implementation Details

### Widget Chaining
- All widget methods return `this` for fluent chaining
- `.moveTo()` and `.elseMoveTo()` are protected methods exposed in specific widgets
- Widgets must be connected before calling `.end()` on Flow

### Error Propagation
- Base `Widget.process()` ([src/widget.ts:59](src/widget.ts#L59)) wraps execution in try-catch
- Errors automatically route to `this.left.right` (the else path of the next widget)
- Custom widgets should throw errors to trigger alternative paths

### Logging
- Uses `console[level]()` in base Widget class
- Debug logs only appear in development (`ENV=development`)
- Format: `[WidgetClass: widgetName]: => { data }`

### Static Factory Pattern
- All widgets use `static create(name: string)` factory method
- Creates widget with `Symbol(name)` for unique identification
- Enables method chaining from creation

## Testing Patterns

Tests are in `/test` directory:
- [test/flow.test.ts](test/flow.test.ts) - Flow widget tests
- [test/split.test.ts](test/split.test.ts) - Split conditional tests
- [test/set-variable.test.ts](test/set-variable.test.ts) - Variable extraction tests

Common test pattern:
```typescript
const widget = WidgetClass.create('test_widget');
// Configure widget...
const flow = Flow.create('test_flow').start(widget).end();
const result = await flow(inputData);
// Assert on result.payload and result.variables
```

## TypeScript Configuration

- **Target:** ES2022
- **Module:** CommonJS (for npm distribution)
- **Strict Mode:** Enabled
- **Output:** `./lib` with declaration files
- **Excludes:** Test files from compilation
- **Source:** `./src` only

## Examples

Real-world examples are in `/examples`:
- `01-etl-pipeline.ts` - Customer data ETL workflow
- `02-user-validation-workflow.ts` - Multi-step user registration validation
- `03-order-processing-workflow.ts` - E-commerce order fulfillment
- `04-data-transformation.ts` - Complex nested data transformation

Run examples with: `npx ts-node examples/01-etl-pipeline.ts`

## Common Workflow Patterns

### Sequential Processing
```typescript
widgetA.moveTo(widgetB);
widgetB.moveTo(widgetC);
```

### Conditional Branching
```typescript
Split.create('check')
  .case((data) => Compare.is(data.payload.value).greaterThan(100))
  .moveTo(successWidget)
  .elseMoveTo(failureWidget);
```

### Multiple Merge Points
```typescript
// Both paths converge to same widget
widgetA.moveTo(mergePoint);
widgetB.moveTo(mergePoint);
```

### Variable Extraction Chain
```typescript
SetVariable.create('extract1')
  .variable('userId', '{{ payload.user.id }}')
  .moveTo(
    SetVariable.create('extract2')
      .variable('userEmail', '{{ payload.user.email }}')
  );
```

## Dependencies

**Runtime:**
- None. The library has zero runtime dependencies.

**Dev:**
- TypeScript (^5.9.3) with strict mode
- Jest (^30) + ts-jest for testing with ESM support
- ESLint (^9, flat config in `eslint.config.mjs`) with typescript-eslint + Prettier for code quality

**Engines:** Node.js `>=22.0.0` (see `.nvmrc`).
