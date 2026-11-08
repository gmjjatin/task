import { useState } from 'react';
import { api } from '../api';
import { formatPrice } from '../format';

export default function Cart({ items, onQuantityChange, onRemove, onOrderPlaced }) {
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

  async function placeOrder() {
    if (isSubmitting || items.length === 0) return;

    setStatus(null);
    setIsSubmitting(true);
    try {
      const order = await api.checkout(items);
      setStatus({ type: 'status', message: `Order #${order.id} placed.` });
      onOrderPlaced(order);
    } catch (err) {
      const message = err.retryAfter
        ? `${err.message}. Please wait ${err.retryAfter} seconds.`
        : err.message;
      setStatus({ type: 'alert', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="cart-heading">
      <h2 id="cart-heading">Cart</h2>
      {items.length === 0 ? (
        <p className="muted">Your cart is empty.</p>
      ) : (
        <ul className="list" aria-label="Cart">
          {items.map((item) => (
            <li key={item.product.id}>
              <span>{item.product.name}</span>
              <input
                className="qty"
                type="number"
                min="1"
                max="10"
                aria-label={`Quantity for ${item.product.name}`}
                value={item.quantity}
                onChange={(e) => onQuantityChange(item.product.id, Number(e.target.value))}
              />
              <button onClick={() => onRemove(item.product.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p>Total: {formatPrice(totalCents)}</p>
      {status && <p role={status.type === 'alert' ? 'alert' : 'status'}>{status.message}</p>}
      <button className="primary" onClick={placeOrder} disabled={items.length === 0 || isSubmitting}>
        Place order
      </button>
    </section>
  );
}
