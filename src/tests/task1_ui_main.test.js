/**
 * @jest-environment jsdom
 */
const { screen, within } = require('@testing-library/react');
const { mockApi, renderLoggedIn, addToCart } = require('./helpers/client');

describe('Task 1.2: Wrong product added to cart', () => {
  test('adds the clicked product when a search filter is applied', async () => {
    mockApi();
    const { user } = await renderLoggedIn();

    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'knife');
    await addToCart(user, "Chef's Knife");

    const cart = await screen.findByRole('list', { name: /cart/i });
    expect(within(cart).getByText(/Chef's Knife/)).toBeInTheDocument();
  });
});
