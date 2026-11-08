const { setup, login, get, insertOrders, USERS } = require('./helpers/server');

describe('Task 1.1: Order history pagination', () => {
  test('page 1 returns the most recent orders first', async () => {
    const ctx = await setup();
    const ids = await insertOrders(ctx, USERS[0], 12);
    const token = await login(ctx);

    const res = await get(ctx, '/api/orders?page=1', token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 10, total: 12 });
    expect(res.body.items[0].id).toBe(ids[11]);
    expect(res.body.items).toHaveLength(10);
  });
});
