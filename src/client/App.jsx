import { useState } from 'react';
import { api, getSession } from './api';
import LoginForm from './components/LoginForm';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [view, setView] = useState('shop');
  const [cart, setCart] = useState([]);
  const [productsVersion, setProductsVersion] = useState(0);

  if (!session) return <LoginForm onLogin={setSession} />;

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((items) => items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
  }

  function removeFromCart(productId) {
    setCart((items) => items.filter((item) => item.product.id !== productId));
  }

  function handleOrderPlaced() {
    setCart([]);
    setProductsVersion((v) => v + 1);
  }

  async function logout() {
    await api.logout().catch(() => {});
    setSession(null);
    setCart([]);
  }

  return (
    <>
      <header className="topbar">
        <h1>ShopLite</h1>
        <nav>
          <button onClick={() => setView('shop')} aria-pressed={view === 'shop'}>
            Shop
          </button>
          <button onClick={() => setView('orders')} aria-pressed={view === 'orders'}>
            My orders
          </button>
          <span className="muted">{session.user.email}</span>
          <button onClick={logout}>Log out</button>
        </nav>
      </header>
      {view === 'shop' ? (
        <main className="layout">
          <ProductList version={productsVersion} onAdd={addToCart} />
          <Cart
            items={cart}
            onQuantityChange={updateQuantity}
            onRemove={removeFromCart}
            onOrderPlaced={handleOrderPlaced}
          />
        </main>
      ) : (
        <main className="layout">
          <OrderHistory />
        </main>
      )}
    </>
  );
}
