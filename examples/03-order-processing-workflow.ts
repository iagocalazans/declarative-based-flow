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

class ValidateOrderWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
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

class CheckInventoryWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const items = data.payload.order.items;

    const inventory: Record<string, number> = {
      PROD001: 100,
      PROD002: 50,
      PROD003: 0,
      PROD004: 25,
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

class CalculateOrderTotalWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const items = data.payload.order.items;

    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    data.payload.orderSubtotal = subtotal;
    data.payload.orderItemCount = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );

    this.register(`Order subtotal calculated: $${subtotal.toFixed(2)}`, 'info');
  }
}

class ApplyDiscountWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const customerTier = data.payload.order.customerTier || 'BRONZE';
    const subtotal = data.payload.orderSubtotal || 0;

    const discountRates: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0.05,
      GOLD: 0.1,
      PLATINUM: 0.15,
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

class CalculateShippingWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const shippingCountry = data.payload.order.shippingAddress?.country || 'USA';
    const itemCount = data.payload.orderItemCount || 0;

    const baseRates: Record<string, number> = {
      USA: 5.99,
      CANADA: 9.99,
      UK: 12.99,
      INTERNATIONAL: 19.99,
    };

    const baseRate = baseRates[shippingCountry] || baseRates['INTERNATIONAL'];
    const additionalItemFee = Math.max(0, itemCount - 1) * 1.5;
    const shippingCost = baseRate + additionalItemFee;

    data.payload.shippingCost = shippingCost;
    data.payload.orderTotal =
      (data.payload.totalAfterDiscount || 0) + shippingCost;

    this.register(`Shipping cost calculated: $${shippingCost.toFixed(2)}`, 'info');
  }
}

class RouteToFulfillmentWidget extends CustomWidget {
  private center = '';

  static create(name: string) {
    return new this(Symbol(name));
  }

  setCenter(center: string) {
    this.center = center;

    return this;
  }

  protected async run(data: any): Promise<void> {
    data.payload.fulfillmentCenter = this.center;
    data.payload.orderStatus = 'PROCESSING';
    data.payload.estimatedShipDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString();

    this.register(`Order routed to ${this.center} fulfillment center`, 'info');
  }
}

class OutOfStockWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.orderStatus = 'ON_HOLD';
    data.payload.reason = 'ITEMS_OUT_OF_STOCK';

    this.register('Order placed on hold: Items out of stock', 'warn');
  }
}

class SendConfirmationWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    const order = data.payload.order;
    const total = data.payload.orderTotal;

    this.register(
      `Confirmation email sent to customer ${order.customerId} for order total $${total?.toFixed(2)}`,
      'info'
    );

    data.payload.confirmationSent = true;
  }
}

class ApplyFreeShippingWidget extends CustomWidget {
  protected async run(data: any): Promise<void> {
    data.payload.shippingCost = 0;
    data.payload.orderTotal = data.payload.totalAfterDiscount;
    this.register('Free shipping applied (order over $100)', 'info');
  }
}

const buildOrderProcessingWorkflow = () => {
  const extractOrderData = SetVariable.create('extract_order_data')
    .variable('customerId', '{{ payload.order.customerId }}')
    .variable('orderCountry', '{{ payload.order.shippingAddress.country }}');

  const validateOrder = ValidateOrderWidget.create('validate_order');

  const checkInventory = CheckInventoryWidget.create('check_inventory');

  const checkInventoryAvailable = Split.create(
    'check_inventory_available'
  ).case((data: any) => Compare.is(data.payload.allItemsInStock).equal(true));

  const outOfStock = OutOfStockWidget.create('out_of_stock_handler');

  const calculateTotal = CalculateOrderTotalWidget.create(
    'calculate_order_total'
  );

  const applyDiscount = ApplyDiscountWidget.create('apply_discount');

  const checkFreeShipping = Split.create('check_free_shipping').case(
    (data: any) => Compare.is(data.payload.totalAfterDiscount).greaterThan(99.99)
  );

  const applyFreeShipping = ApplyFreeShippingWidget.create('apply_free_shipping');

  const calculateShipping = CalculateShippingWidget.create('calculate_shipping');

  const routeByCountry = Split.create('route_by_country').case((data: any) => {
    const country = data.payload.order.shippingAddress?.country || '';
    return Compare.is(country).in(['USA', 'CANADA']);
  });

  const routeToNorthAmerica = RouteToFulfillmentWidget.create(
    'route_to_na'
  ).setCenter('NORTH_AMERICA_FC');
  const routeToInternational = RouteToFulfillmentWidget.create(
    'route_to_intl'
  ).setCenter('INTERNATIONAL_FC');

  const sendConfirmation = SendConfirmationWidget.create('send_confirmation');

  extractOrderData.moveTo(validateOrder);
  validateOrder.moveTo(checkInventory);
  checkInventory.moveTo(checkInventoryAvailable);

  checkInventoryAvailable.moveTo(calculateTotal).elseMoveTo(outOfStock);

  calculateTotal.moveTo(applyDiscount);
  applyDiscount.moveTo(checkFreeShipping);

  checkFreeShipping.moveTo(applyFreeShipping).elseMoveTo(calculateShipping);

  applyFreeShipping.moveTo(routeByCountry);
  calculateShipping.moveTo(routeByCountry);

  routeByCountry.moveTo(routeToNorthAmerica).elseMoveTo(routeToInternational);

  routeToNorthAmerica.moveTo(sendConfirmation);
  routeToInternational.moveTo(sendConfirmation);

  return Flow.create('order_processing_workflow').start(extractOrderData).end();
};

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

const runOutOfStockExample = async () => {
  console.log('\n=== Out of Stock Order ===\n');

  const workflow = buildOrderProcessingWorkflow();

  const result = await workflow({
    order: {
      orderId: 'ORD-12347',
      customerId: 'CUST-123',
      customerTier: 'GOLD',
      items: [
        { productId: 'PROD003', name: 'Monitor', price: 299.99, quantity: 1 },
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

const runAllExamples = async () => {
  await runPlatinumOrderExample();
  await runInternationalOrderExample();
  await runOutOfStockExample();
};

if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  buildOrderProcessingWorkflow,
  runPlatinumOrderExample,
  runInternationalOrderExample,
  runOutOfStockExample,
};
