import { requireAuth } from '@/server/auth';
import { getContext } from '@/server/context';
import { HttpError } from '@/server/errors';
import { errorResponse, json, readJson } from '@/server/http';
import { loadOrder } from '@/server/orders';

export const dynamic = 'force-dynamic';

// POST /api/checkout  { "items": [{ "productId": 2, "quantity": 1 }] }
export async function POST(request) {
  try {
    const ctx = await getContext();
    const user = await requireAuth(ctx, request);
    const { items } = await readJson(request);
    const userId = user.id;

    const lines = [];
    let totalCents = 0;
    for (const item of items) {
      const product = await ctx.db.get('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) throw new HttpError(404, 'NOT_FOUND', `Product ${item.productId} not found`);
      lines.push({ product, quantity: item.quantity });
      totalCents += product.price_cents * item.quantity;
    }

    const createdAt = ctx.now();
    const { lastInsertRowid: orderId } = await ctx.db.run(
      "INSERT INTO orders (user_id, status, total_cents, created_at) VALUES (?, 'pending', ?, ?)",
      [userId, totalCents, createdAt]
    );

    // Queue the confirmation email early so customers get it quickly.
    await ctx.db.run(
      "INSERT INTO emails (user_id, order_id, template, created_at) VALUES (?, ?, 'order_confirmation', ?)",
      [userId, orderId, createdAt]
    );

    for (const { product, quantity } of lines) {
      if (product.stock < quantity) {
        throw new HttpError(409, 'OUT_OF_STOCK', `${product.name} does not have enough stock`);
      }
      await ctx.db.run('UPDATE products SET stock = ? WHERE id = ?', [product.stock - quantity, product.id]);
      await ctx.db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES (?, ?, ?, ?)',
        [orderId, product.id, quantity, product.price_cents]
      );
    }

    try {
      await ctx.payments.charge({ amountCents: totalCents, reference: `order-${orderId}` });
    } catch (err) {
      if (err.code === 'card_declined') {
        throw new HttpError(402, 'PAYMENT_DECLINED', 'Your card was declined');
      }
      throw err;
    }

    await ctx.db.run("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
    await ctx.db.run('INSERT INTO invoices (order_id, amount_cents, created_at) VALUES (?, ?, ?)', [
      orderId,
      totalCents,
      createdAt,
    ]);

    return json(await loadOrder(ctx.db, orderId), 201);
  } catch (err) {
    return errorResponse(err);
  }
}
