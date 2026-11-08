import { requireAuth } from '@/server/auth';
import { getContext } from '@/server/context';
import { errorResponse, json } from '@/server/http';
import { toOrderSummary } from '@/server/orders';

export const dynamic = 'force-dynamic';

// GET /api/orders?page=1&limit=10: the logged-in user's order history
export async function GET(request) {
  try {
    const ctx = await getContext();
    const user = await requireAuth(ctx, request);

    const params = request.nextUrl.searchParams;
    const rawPage = Number(params.get('page'));
    const rawLimit = Number(params.get('limit'));
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit)
      ? Math.min(50, Math.max(1, Math.floor(rawLimit)))
      : 10;
    const offset = (page - 1) * limit;

    const totalRow = await ctx.db.get('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [user.id]);
    const rows = await ctx.db.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [user.id, limit, offset]
    );

    return json({
      page,
      limit,
      total: Number(totalRow.total),
      items: rows.map(toOrderSummary),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
