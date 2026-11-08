import { requireAuth } from '@/server/auth';
import { getContext } from '@/server/context';
import { HttpError } from '@/server/errors';
import { errorResponse, json, readJson } from '@/server/http';
import { loadOrder } from '@/server/orders';

export const dynamic = 'force-dynamic';

function normalizeCart(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request validation failed', {
      fields: { items: 'At least one item is required' },
    });
  }

  const fields = {};
  const normalized = items.map((item, index) => {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      fields[`items[${index}].productId`] = 'Product ID must be a positive integer';
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      fields[`items[${index}].quantity`] = 'Quantity must be a positive integer';
    }

    return { productId, quantity };
  });

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Request validation failed', { fields });
  }

  return normalized;
}

// POST /api/checkout  { "items": [{ "productId": 2, "quantity": 1 }] }
export async function POST(request) {
  try {
    const ctx = await getContext();
    const user = await requireAuth(ctx, request);
    const { items } = await readJson(request);
    const userId = user.id;
    const normalizedItems = normalizeCart(items);
    const key = request.headers.get('Idempotency-Key');
    const signature = JSON.stringify(normalizedItems);

    if (key) {
      const prior = ctx.idempotencyKeys.get(`${userId}:${key}`);
      if (prior) {
        if (prior.signature !== signature) {
          throw new HttpError(422, 'IDEMPOTENCY_KEY_REUSED', 'This idempotency key was already used for a different request');
        }
        return json(await loadOrder(ctx.db, prior.orderId), 201);
      }
    }

    const order = await ctx.db.transaction(async (tx) => {
      const lines = [];
      let totalCents = 0;

      for (const item of normalizedItems) {
        const product = await tx.get('SELECT * FROM products WHERE id = ?', [item.productId]);
        if (!product) throw new HttpError(404, 'NOT_FOUND', `Product ${item.productId} not found`);
        if (product.stock < item.quantity) {
          throw new HttpError(409, 'OUT_OF_STOCK', `${product.name} does not have enough stock`);
        }
        lines.push({ product, quantity: item.quantity });
        totalCents += product.price_cents * item.quantity;
      }

      const createdAt = ctx.now();
      const { lastInsertRowid: orderId } = await tx.run(
        "INSERT INTO orders (user_id, status, total_cents, created_at) VALUES (?, 'pending', ?, ?)",
        [userId, totalCents, createdAt]
      );

      await tx.run(
        "INSERT INTO emails (user_id, order_id, template, created_at) VALUES (?, ?, 'order_confirmation', ?)",
        [userId, orderId, createdAt]
      );

      for (const { product, quantity } of lines) {
        await tx.run('UPDATE products SET stock = ? WHERE id = ?', [product.stock - quantity, product.id]);
        await tx.run(
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

      await tx.run("UPDATE orders SET status = 'paid' WHERE id = ?", [orderId]);
      await tx.run('INSERT INTO invoices (order_id, amount_cents, created_at) VALUES (?, ?, ?)', [
        orderId,
        totalCents,
        createdAt,
      ]);

      if (key) {
        ctx.idempotencyKeys.set(`${userId}:${key}`, { orderId, signature });
      }

      return await loadOrder(tx, orderId);
    });

    return json(order, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
