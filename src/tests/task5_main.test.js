const { setup, login, checkout, USERS, PRODUCT } = require('./helpers/server');

describe('Task 5: Validation and rate limiting', () => {
  test('an invalid quantity returns 400 in the validation error format', async () => {
    const ctx = await setup();
    const token = await login(ctx);

    const res = await checkout(ctx, token, [{ productId: PRODUCT.backpack, quantity: 0 }]);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fields: { 'items[0].quantity': expect.any(String) },
      },
    });
  });

  test('login is rate limited after 5 failed attempts', async () => {
    const ctx = await setup();
    const attempt = (password) => ctx.api().post('/api/auth/login').send({ email: USERS[4], password });
    for (let i = 0; i < 5; i += 1) await attempt('wrong');

    const res = await attempt('wrong');

    expect(res.status).toBe(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});
