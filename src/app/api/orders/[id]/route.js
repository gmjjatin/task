import { requireAuth } from '@/server/auth';
import { getContext } from '@/server/context';
import { HttpError } from '@/server/errors';
import { errorResponse, json } from '@/server/http';
import { loadOrder } from '@/server/orders';

export const dynamic = 'force-dynamic';

// GET /api/orders/:id
export async function GET(request, { params }) {
  try {
    const ctx = await getContext();
    const user = await requireAuth(ctx, request);

    const order = await ctx.db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [Number(params.id), user.id]);
    if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found');
    return json(await loadOrder(ctx.db, order.id));
  } catch (err) {
    return errorResponse(err);
  }
}
