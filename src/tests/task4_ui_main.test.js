/**
 * @jest-environment jsdom
 */
const { mockApi, jsonResponse, deferred, callsTo, renderLoggedIn, addToCart, placeOrderButton } = require(
  './helpers/client'
);

describe('Task 4.2: Duplicate submissions from the UI', () => {
  test('clicking Place order twice sends one request', async () => {
    const pending = deferred();
    const fetchMock = mockApi({ 'POST /api/checkout': () => pending.promise });
    const { user } = await renderLoggedIn();
    await addToCart(user, 'Notebook');

    const button = placeOrderButton();
    await user.click(button);
    await user.click(button);

    expect(callsTo(fetchMock, 'POST', '/api/checkout')).toHaveLength(1);
    pending.resolve(jsonResponse(201, { id: 7, status: 'paid', totalCents: 499, createdAt: 0, items: [] }));
  });
});
