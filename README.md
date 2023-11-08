# Declarative Based Flow (declarative-based-flow)

[![Node.js Jest](https://github.com/iagocalazans/declarative-based-flow/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/iagocalazans/declarative-based-flow/actions/workflows/node.js.yml)

Declarative-Based Flow is a powerful and intuitive npm package designed to simplify the construction of complex, structured workflows using a declarative and fluent syntax. This package provides a seamless way to define, orchestrate, and execute a series of operations or commands with ease.

__Key Features:__

Fluent Syntax: Create workflows by chaining commands together in a declarative style, similar to popular query builders, making your code more readable and maintainable.

Command Abstraction: Define individual commands or operations as separate modules, allowing for better code organization and reusability.

Customizable Commands: Easily extend the package to include custom command classes that suit your specific needs, whether it's data transformation, external integrations, or business logic.

Simplified Workflow: Focus on the high-level logic of your application, while the package handles the orchestration and execution of commands.

<!-- Error Handling: Built-in error handling and exception management to ensure that your workflows run smoothly. -->

## Installation

You can install this package using npm or yarn:

```bash
npm install declarative-based-flow
# or
yarn add declarative-based-flow
```

## USAGE

### Flow

Flow is a specialized widget that represents the starting point of a workflow. It allows you to connect other widgets and execute the workflow. Here's how to create a Flow:

```ts
import { Flow } from 'declarative-based-flow';

const myFlow = Flow.create('my_flow').start(yourFirstWidget).end();
```

### SetVariable

SetVariable is a widget used to set variables in a workflow. It allows you to define variables and specify their values using whitelabel expressions. Here's how to create a SetVariable widget:

```ts
import { SetVariable } from 'declarative-based-flow';

const mySetVariable = SetVariable.create('my_set_variable');
mySetVariable.variable('myVar', '{{ payload.data.value }}');
```

### Compare

`Compare` is a utility class that provides comparison operations for use in conditional statements within the workflow. You can create a `Comparator` instance using the `Compare` class:

```ts
import { Compare } from 'declarative-based-flow';

const myComparator = Compare.is(42);
myComparator.equal(42); // true 
```

### Split

`Split` is a widget that allows you to branch the workflow based on a specified condition. It provides a `case` method to define the condition and separate paths for different outcomes. Here's how to create a `Split` widget:

```ts
import { Split } from 'declarative-based-flow';

const mySplit = Split.create('my_split');
mySplit.case((data) => Compare.is(data.payload.value).equal('some_value'));
mySplit.moveTo(anotherWidget).elseMoveTo(aDiferentWidget);
```

### Extending

You can easily create custom command classes (as widgets) with `CustomWidget` to suit your specific needs. Whether it's data transformation, external integrations, or business logic, Declarative-Based Flow allows you to abstract and encapsulate these operations. Here's an example using `CustomWidget`:

```ts
import { CustomWidget } from 'declarative-based-flow';

export class MyWidget extends CustomWidget {
    private myActions = {
        do: {
            something: undefined
        }
    }

    myCustomStep(someAction: any) {
        this.myActions.do.something = someAction

        return this;
    }

    async process(a: any): Promise<void> {
        if (!Reflect.has(this.myActions.do, 'something')) {
            throw new Error('Some error message!');
        }

        // TODO: Your business logic comes here!

        super.register(`Info you want to log!`, 'info'); // Use super.register to log data on your process.

        super.process(a);
    }
}
```

To use this customized `Widget` you should move as standard:

```ts
import { MyWidget } from './my-custom-widget'

const myCustomWidget = MyWidget.create('my_custom_widget').myCustomStep(() => console.log("Easy to customize!"));

// ... 

Flow.create('unamed').start(myCustomWidget).end()(myDataToProcess);
```

### Examples

The package includes examples of how to use these widgets to build and execute workflows. You can refer to the provided test file for detailed usage examples:

- Creating and connecting widgets
- Defining variables with `SetVariable`
- Using `Compare` for conditional checks (mostly inside `Split`)
- Branching the workflow with `Split`

These examples should help you get started with building complex workflows using this package.

A fully running code should be like this:

```ts
    const amazingSetVariableWidgetOne = SetVariable
        .create('amazing_set_variable_widget_one')
        .variable('myVarOne', '{{ payload.act.like.that }}');

    amazingSetVariableWidgetOne.moveTo(
        Split
            .create('amazing_split_widget')
            .case((data: any) => Compare
                .is(data.payload.act.like.that)
                .in(['this', 'those', 'that'])
            )
            .moveTo(
                SetVariable
                    .create('amazing_set_variable_widget_three')
                    .variable('myVarThree', '{{ payload.act.like.those }}')
            )
            .elseMoveTo(
                SetVariable
                .create('amazing_set_variable_widget_two')
                .variable('myVarTwo', '{{ payload.act.like.this.should.be.this }}')
            )
        )
    
    const flow = Flow.create('amazing_flow').start(amazingSetVariableWidgetOne).end();

    const payload = flow({
        act: {
            like: { 
                that: 'that', 
                this: { 
                    should: { 
                        be: { 
                            this:'this' 
                        } 
                    } 
                }, 
                those: 'those' 
            }
        }
    });
```

### Why Use Declarative-Based Flow

Declarative-Based Flow is ideal for projects that involve complex, multi-step processes, such as data transformations, ETL (Extract, Transform, Load), and workflow automation. By encapsulating each step within a chainable command structure, your code becomes more modular, flexible, and maintainable.

Simplify your application's control flow and enhance your codebase with Declarative-Based Flow.

### License

This package is provided under the MIT License. You can find the license details in the `LICENSE` file included with the package.

### Contributions

Contributions and improvements to this package are welcome. If you encounter any issues or have ideas for enhancements, please open an issue or submit a pull request on the package's GitHub repository.

### Author

This package was created by Iago Calazans. You can contact the author at <iago.calazans@gmail.com> for any questions or inquiries.

Enjoy using this package to build and execute complex workflows in your Node.js applications!
