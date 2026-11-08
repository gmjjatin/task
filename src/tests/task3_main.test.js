const { setup, login, checkout, counts, stockOf, setStock, USERS, PRODUCT } = require('./helpers/server');

describe('Task 3: Checkout data integrity', () => {
  test('a failed checkout writes nothing to the database', async () => {
    const ctx = await setup();
    await setStock(ctx, PRODUCT.runningShoes, 0);
    const token = await login(ctx);

    const res = await checkout(ctx, token, [
      { productId: PRODUCT.waterBottle, quantity: 1 },
      { productId: PRODUCT.runningShoes, quantity: 1 },
    ]);

    expect(res.status).toBe(409);
    expect(await counts(ctx)).toEqual({ orders: 0, orderItems: 0, invoices: 0, emails: 0 });
    expect(await stockOf(ctx, PRODUCT.waterBottle)).toBe(50);
  });

  test('the last unit is sold only once', async () => {
    const ctx = await setup({ delayMs: 20 });
    await setStock(ctx, PRODUCT.deskLamp, 1);
    const alice = await login(ctx, USERS[0]);
    const bob = await login(ctx, USERS[1]);

    const results = await Promise.all([
      checkout(ctx, alice, [{ productId: PRODUCT.deskLamp, quantity: 1 }]),
      checkout(ctx, bob, [{ productId: PRODUCT.deskLamp, quantity: 1 }]),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  test('a declined payment returns 402 and leaves no order behind', async () => {
    const ctx = await setup({ decline: true });
    const token = await login(ctx);

    const res = await checkout(ctx, token, [{ productId: PRODUCT.headphones, quantity: 1 }]);

    expect(res.status).toBe(402);
    expect((await counts(ctx)).orders).toBe(0);
  });
});
