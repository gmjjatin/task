const { setup, login, checkout, count, PRODUCT } = require('./helpers/server');

describe('Task 4.1: Idempotent checkout', () => {
  test('a retried request with the same key returns the same order', async () => {
    const ctx = await setup();
    const token = await login(ctx);
    const cart = [{ productId: PRODUCT.waterBottle, quantity: 1 }];

    const first = await checkout(ctx, token, cart, 'retry-example');
    const second = await checkout(ctx, token, cart, 'retry-example');

    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(await count(ctx, 'orders')).toBe(1);
  });

  test('reusing a key for a different cart returns 422', async () => {
    const ctx = await setup();
    const token = await login(ctx);

    await checkout(ctx, token, [{ productId: PRODUCT.waterBottle, quantity: 1 }], 'reuse-example');
    const res = await checkout(ctx, token, [{ productId: PRODUCT.waterBottle, quantity: 2 }], 'reuse-example');

    expect(res.status).toBe(422);
  });
});
