import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatPrice } from '../format';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api
      .getOrders(page, limit)
      .then((data) => {
        setOrders(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total) || 0);
      })
      .catch((err) => console.error(err));
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="panel" aria-labelledby="orders-heading">
      <h2 id="orders-heading">My orders</h2>
      {orders.length === 0 ? (
        <p className="muted">You have no orders yet.</p>
      ) : (
        <>
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
          <div className="pagination" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
