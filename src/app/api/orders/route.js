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
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 10;
    const rows = await ctx.db.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [user.id, limit, page * limit]
    );
    return json(rows.map(toOrderSummary));
  } catch (err) {
    return errorResponse(err);
  }
}
