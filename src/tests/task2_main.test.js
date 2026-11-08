const { setup, login, get, checkout, USERS, PRODUCT } = require('./helpers/server');

describe('Task 2: Security fixes', () => {
  test("a user cannot read another user's order", async () => {
    const ctx = await setup();
    const bob = await login(ctx, USERS[1]);
    const carol = await login(ctx, USERS[2]);
    const order = await checkout(ctx, bob, [{ productId: PRODUCT.coffeeMug, quantity: 1 }]);

    const res = await get(ctx, `/api/orders/${order.body.id}`, carol);

    expect(res.status).toBe(404);
  });

  test('search input is not interpreted as SQL', async () => {
    const ctx = await setup();

    const res = await get(ctx, `/api/products?q=${encodeURIComponent("x' OR 1=1 --")}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});
