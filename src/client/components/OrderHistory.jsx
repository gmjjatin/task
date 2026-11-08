import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatPrice } from '../format';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api
      .getOrders(1)
      .then(setOrders)
      .catch((err) => console.error(err));
  }, []);

  return (
    <section className="panel" aria-labelledby="orders-heading">
      <h2 id="orders-heading">My orders</h2>
      {orders.length === 0 ? (
        <p className="muted">You have no orders yet.</p>
      ) : (
        <ul className="list" aria-label="Orders">
          {orders.map((order) => (
            <li key={order.id}>
              <span>Order #{order.id}</span>
              <span className="muted">{new Date(order.createdAt).toLocaleString()}</span>
              <span>{formatPrice(order.totalCents)}</span>
              <span>{order.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
