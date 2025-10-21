/**
 * Basic Example - Simple Workflow
 *
 * This is a minimal example to demonstrate the core concepts of the library.
 * Perfect for getting started and understanding the basics.
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

// Simple custom widget
class GreetingWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const userName = data.variables?.userName || 'Guest';
    data.payload.greeting = `Hello, ${userName}!`;
    this.register(`Generated greeting for ${userName}`, 'info');
    await super.process(data);
  }
}

// Build a simple workflow
const buildSimpleWorkflow = () => {
  // Extract user name
  const extractName = SetVariable
    .create('extract_name')
    .variable('userName', '{{ payload.user.name }}');

  // Check if user is premium
  const checkPremium = Split
    .create('check_premium')
    .case((data: any) => Compare
      .is(data.payload.user.isPremium)
      .equal(true)
    );

  // Premium greeting
  class PremiumGreetingWidget extends CustomWidget {
    async process(data: any): Promise<void> {
      const userName = data.variables?.userName || 'Guest';
      data.payload.greeting = `Welcome back, Premium Member ${userName}!`;
      data.payload.benefits = ['Free shipping', 'Exclusive discounts', 'Priority support'];
      this.register(`Generated premium greeting for ${userName}`, 'info');
      await super.process(data);
    }
  }
  const premiumGreeting = PremiumGreetingWidget.create('premium_greeting');

  // Regular greeting
  const regularGreeting = GreetingWidget.create('regular_greeting');

  // Connect the workflow
  extractName.moveTo(checkPremium);
  checkPremium
    .moveTo(premiumGreeting)
    .elseMoveTo(regularGreeting);

  // Create and return the flow
  return Flow.create('simple_greeting_workflow')
    .start(extractName)
    .end();
};

// Example: Regular user
const runRegularUserExample = async () => {
  console.log('=== Regular User Example ===\n');

  const workflow = buildSimpleWorkflow();

  const result = await workflow({
    user: {
      name: 'Alice',
      isPremium: false,
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result.payload, null, 2));
};

// Example: Premium user
const runPremiumUserExample = async () => {
  console.log('\n=== Premium User Example ===\n');

  const workflow = buildSimpleWorkflow();

  const result = await workflow({
    user: {
      name: 'Bob',
      isPremium: true,
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result.payload, null, 2));
};

// Run all examples
const runAllExamples = async () => {
  await runRegularUserExample();
  await runPremiumUserExample();
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { buildSimpleWorkflow, runRegularUserExample, runPremiumUserExample };
