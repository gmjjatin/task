export function toOrderSummary(row) {
  return { id: row.id, status: row.status, totalCents: row.total_cents, createdAt: row.created_at };
}

// An order with its items, or undefined. `conn` is `ctx.db`, or the `tx` passed to a transaction callback.
export async function loadOrder(conn, orderId) {
  const order = await conn.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) return undefined;
  const items = await conn.all(
    `SELECT order_items.product_id, products.name, order_items.quantity, order_items.price_cents
       FROM order_items JOIN products ON products.id = order_items.product_id
      WHERE order_items.order_id = ?
      ORDER BY order_items.id`,
    [orderId]
  );
  return {
    ...toOrderSummary(order),
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.price_cents,
    })),
  };
}
