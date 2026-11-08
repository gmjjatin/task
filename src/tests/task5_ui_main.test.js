/**
 * @jest-environment jsdom
 */
const { mockApi, jsonResponse, renderLoggedIn, addToCart, placeOrderButton, expectAlert } = require(
  './helpers/client'
);

describe('Task 5: Errors shown in the UI', () => {
  test('a rate-limited checkout tells the user to wait', async () => {
    mockApi({
      'POST /api/checkout': () =>
        jsonResponse(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { 'Retry-After': 45 }),
    });
    const { user } = await renderLoggedIn();
    await addToCart(user, 'Desk Lamp');

    await user.click(placeOrderButton());

    await expectAlert(/too many requests/i, /\b45\b/);
  });
});
