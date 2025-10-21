/**
 * Order Processing Workflow Example
 *
 * This example demonstrates an e-commerce order processing workflow that:
 * - Validates order data
 * - Checks inventory availability
 * - Applies discounts based on customer tier
 * - Calculates shipping costs
 * - Routes to different fulfillment centers
 *
 * Use Case: E-commerce order processing and fulfillment
 */

import { Flow, SetVariable, Split, Compare, CustomWidget } from '../src';

// Custom widget to validate order
class ValidateOrderWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const order = data.payload.order;

    if (!order || !order.items || order.items.length === 0) {
      data.payload.orderValid = false;
      this.register('Order validation failed: No items in order', 'error');
      throw new Error('Invalid order: No items');
    }

    if (!order.customerId) {
      data.payload.orderValid = false;
      this.register('Order validation failed: No customer ID', 'error');
      throw new Error('Invalid order: No customer ID');
    }

    data.payload.orderValid = true;
    this.register('Order validation passed', 'info');
  }
}

// Custom widget to check inventory
class CheckInventoryWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const items = data.payload.order.items;

    // Simulate inventory check
    const inventory: Record<string, number> = {
      'PROD001': 100,
      'PROD002': 50,
      'PROD003': 0, // Out of stock
      'PROD004': 25,
    };

    const itemsInStock = items.every((item: any) => {
      const available = inventory[item.productId] || 0;
      return available >= item.quantity;
    });

    data.payload.allItemsInStock = itemsInStock;

    if (itemsInStock) {
      this.register('All items are in stock', 'info');
    } else {
      this.register('Some items are out of stock', 'warn');
    }
  }
}

// Custom widget to calculate order total
class CalculateOrderTotalWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const items = data.payload.order.items;

    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    data.payload.orderSubtotal = subtotal;
    data.payload.orderItemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    this.register(`Order subtotal calculated: $${subtotal.toFixed(2)}`, 'info');
  }
}

// Custom widget to apply discount based on customer tier
class ApplyDiscountWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const customerTier = data.payload.order.customerTier || 'BRONZE';
    const subtotal = data.payload.orderSubtotal || 0;

    // Discount rates by tier
    const discountRates: Record<string, number> = {
      'BRONZE': 0,
      'SILVER': 0.05,
      'GOLD': 0.10,
      'PLATINUM': 0.15,
    };

    const discountRate = discountRates[customerTier] || 0;
    const discountAmount = subtotal * discountRate;
    const totalAfterDiscount = subtotal - discountAmount;

    data.payload.discountRate = discountRate;
    data.payload.discountAmount = discountAmount;
    data.payload.totalAfterDiscount = totalAfterDiscount;

    this.register(
      `Applied ${customerTier} discount: ${(discountRate * 100).toFixed(0)}% ($${discountAmount.toFixed(2)})`,
      'info'
    );
  }
}

// Custom widget to calculate shipping
class CalculateShippingWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const shippingCountry = data.payload.order.shippingAddress?.country || 'USA';
    const itemCount = data.payload.orderItemCount || 0;

    // Shipping rates
    const baseRates: Record<string, number> = {
      'USA': 5.99,
      'CANADA': 9.99,
      'UK': 12.99,
      'INTERNATIONAL': 19.99,
    };

    const baseRate = baseRates[shippingCountry] || baseRates['INTERNATIONAL'];
    const additionalItemFee = Math.max(0, itemCount - 1) * 1.5;
    const shippingCost = baseRate + additionalItemFee;

    data.payload.shippingCost = shippingCost;
    data.payload.orderTotal = (data.payload.totalAfterDiscount || 0) + shippingCost;

    this.register(`Shipping cost calculated: $${shippingCost.toFixed(2)}`, 'info');
  }
}

// Custom widget to route to fulfillment center
class RouteToFulfillmentWidget extends CustomWidget {
  private center: string;

  constructor(name: string, center: string) {
    super(name);
    this.center = center;
  }

  async process(data: any): Promise<void> {
    data.payload.fulfillmentCenter = this.center;
    data.payload.orderStatus = 'PROCESSING';
    data.payload.estimatedShipDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    this.register(`Order routed to ${this.center} fulfillment center`, 'info');
  }
}

// Custom widget to handle out of stock
class OutOfStockWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    data.payload.orderStatus = 'ON_HOLD';
    data.payload.reason = 'ITEMS_OUT_OF_STOCK';

    this.register('Order placed on hold: Items out of stock', 'warn');
  }
}

// Custom widget to send confirmation
class SendConfirmationWidget extends CustomWidget {
  async process(data: any): Promise<void> {
    const order = data.payload.order;
    const total = data.payload.orderTotal;

    // Simulate sending email
    this.register(
      `Confirmation email sent to customer ${order.customerId} for order total $${total?.toFixed(2)}`,
      'info'
    );

    data.payload.confirmationSent = true;
  }
}

// Build the order processing workflow
const buildOrderProcessingWorkflow = () => {
  // Step 1: Extract order data
  const extractOrderData = SetVariable
    .create('extract_order_data')
    .variable('customerId', '{{ payload.order.customerId }}')
    .variable('orderCountry', '{{ payload.order.shippingAddress.country }}');

  // Step 2: Validate order
  const validateOrder = new ValidateOrderWidget('validate_order');

  // Step 3: Check inventory
  const checkInventory = new CheckInventoryWidget('check_inventory');

  // Step 4: Split based on inventory availability
  const checkInventoryAvailable = Split
    .create('check_inventory_available')
    .case((data: any) => Compare
      .is(data.payload.allItemsInStock)
      .equal(true)
    );

  // If out of stock, put on hold
  const outOfStock = new OutOfStockWidget('out_of_stock_handler');

  // Step 5: Calculate order total
  const calculateTotal = new CalculateOrderTotalWidget('calculate_order_total');

  // Step 6: Apply discount
  const applyDiscount = new ApplyDiscountWidget('apply_discount');

  // Step 7: Check if order qualifies for free shipping
  const checkFreeShipping = Split
    .create('check_free_shipping')
    .case((data: any) => Compare
      .is(data.payload.totalAfterDiscount)
      .greaterThan(99.99)
    );

  // Free shipping handler
  const applyFreeShipping = new (class extends CustomWidget {
    async process(data: any): Promise<void> {
      data.payload.shippingCost = 0;
      data.payload.orderTotal = data.payload.totalAfterDiscount;
      this.register('Free shipping applied (order over $100)', 'info');
    }
  })('apply_free_shipping');

  // Calculate regular shipping
  const calculateShipping = new CalculateShippingWidget('calculate_shipping');

  // Step 8: Route to fulfillment center based on country
  const routeByCountry = Split
    .create('route_by_country')
    .case((data: any) => {
      const country = data.payload.order.shippingAddress?.country || '';
      return Compare.is(country).in(['USA', 'CANADA']);
    });

  const routeToNorthAmerica = new RouteToFulfillmentWidget('route_to_na', 'NORTH_AMERICA_FC');
  const routeToInternational = new RouteToFulfillmentWidget('route_to_intl', 'INTERNATIONAL_FC');

  // Step 9: Send confirmation
  const sendConfirmation = new SendConfirmationWidget('send_confirmation');

  // Build the workflow chain
  extractOrderData.moveTo(validateOrder);
  validateOrder.moveTo(checkInventory);
  checkInventory.moveTo(checkInventoryAvailable);

  checkInventoryAvailable
    .moveTo(calculateTotal)
    .elseMoveTo(outOfStock);

  calculateTotal.moveTo(applyDiscount);
  applyDiscount.moveTo(checkFreeShipping);

  checkFreeShipping
    .moveTo(applyFreeShipping)
    .elseMoveTo(calculateShipping);

  // Both free shipping and regular shipping go to routing
  applyFreeShipping.moveTo(routeByCountry);
  calculateShipping.moveTo(routeByCountry);

  routeByCountry
    .moveTo(routeToNorthAmerica)
    .elseMoveTo(routeToInternational);

  // Both fulfillment centers send confirmation
  routeToNorthAmerica.moveTo(sendConfirmation);
  routeToInternational.moveTo(sendConfirmation);

  // Create and return the flow
  return Flow.create('order_processing_workflow')
    .start(extractOrderData)
    .end();
};

// Example: High-value PLATINUM customer order
const runPlatinumOrderExample = async () => {
  console.log('=== PLATINUM Customer Order (Free Shipping) ===\n');

  const workflow = buildOrderProcessingWorkflow();

  const result = await workflow({
    order: {
      orderId: 'ORD-12345',
      customerId: 'CUST-789',
      customerTier: 'PLATINUM',
      items: [
        { productId: 'PROD001', name: 'Laptop', price: 899.99, quantity: 1 },
        { productId: 'PROD002', name: 'Mouse', price: 29.99, quantity: 2 },
      ],
      shippingAddress: {
        country: 'USA',
        state: 'CA',
        city: 'San Francisco',
      },
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Example: International BRONZE customer order
const runInternationalOrderExample = async () => {
  console.log('\n=== International BRONZE Customer Order ===\n');

  const workflow = buildOrderProcessingWorkflow();

  const result = await workflow({
    order: {
      orderId: 'ORD-12346',
      customerId: 'CUST-456',
      customerTier: 'BRONZE',
      items: [
        { productId: 'PROD004', name: 'Keyboard', price: 49.99, quantity: 1 },
      ],
      shippingAddress: {
        country: 'UK',
        city: 'London',
      },
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Example: Out of stock order
const runOutOfStockExample = async () => {
  console.log('\n=== Out of Stock Order ===\n');

  const workflow = buildOrderProcessingWorkflow();

  const result = await workflow({
    order: {
      orderId: 'ORD-12347',
      customerId: 'CUST-123',
      customerTier: 'GOLD',
      items: [
        { productId: 'PROD003', name: 'Monitor', price: 299.99, quantity: 1 }, // Out of stock
      ],
      shippingAddress: {
        country: 'CANADA',
        city: 'Toronto',
      },
    },
  });

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
};

// Run all examples
const runAllExamples = async () => {
  await runPlatinumOrderExample();
  await runInternationalOrderExample();
  await runOutOfStockExample();
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { buildOrderProcessingWorkflow, runPlatinumOrderExample, runInternationalOrderExample, runOutOfStockExample };
