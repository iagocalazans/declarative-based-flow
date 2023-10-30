# Declarative Based Flow (declarative-based-flow)

Declarative-Based Flow is a powerful and intuitive npm package designed to simplify the construction of complex, structured workflows using a declarative and fluent syntax. This package provides a seamless way to define, orchestrate, and execute a series of operations or commands with ease.

__Key Features:__

Fluent Syntax: Create workflows by chaining commands together in a declarative style, similar to popular query builders, making your code more readable and maintainable.

Command Abstraction: Define individual commands or operations as separate modules, allowing for better code organization and reusability.

<!-- Customizable Commands: Easily extend the package to include custom command classes that suit your specific needs, whether it's data transformation, external integrations, or business logic. -->

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

```ts
 import { flow } from 'declarative-based-flow';
 const data = flow({ 
            payload: { 
                value: '1022' 
            } 
        })
        .split(
            { 
                property: 'value', // => payload.value
                action: ACTIONS.GREATER_THAN, 
                matcher: 1_023 
            }, 
            {
                success: (next) => next.setVariable('path', 'success'), 
                failed: (next) => next.setVariable('path', 'failed')
            }
        )
        .run();
```

### Why Use Declarative-Based Flow

Declarative-Based Flow is ideal for projects that involve complex, multi-step processes, such as data transformations, ETL (Extract, Transform, Load), and workflow automation. By encapsulating each step within a chainable command structure, your code becomes more modular, flexible, and maintainable.

Simplify your application's control flow and enhance your codebase with Declarative-Based Flow.

## License

This package is distributed under the MIT License. Feel free to use it in your projects, and don't forget to star the repository on GitHub if you find it helpful!
