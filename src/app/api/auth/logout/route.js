import { bearerToken, requireAuth } from '@/server/auth';
import { getContext } from '@/server/context';
import { errorResponse, noContent } from '@/server/http';

export const dynamic = 'force-dynamic';

// POST /api/auth/logout
export async function POST(request) {
  try {
    const ctx = await getContext();
    const user = await requireAuth(ctx, request);
    await ctx.db.run('DELETE FROM sessions WHERE user_id = ? AND token = ?', [user.id, bearerToken(request)]);
    return noContent();
  } catch (err) {
    return errorResponse(err);
  }
}
