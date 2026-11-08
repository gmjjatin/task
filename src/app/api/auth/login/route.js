import { createSession, verifyPassword } from '@/server/auth';
import { getContext } from '@/server/context';
import { HttpError } from '@/server/errors';
import { errorResponse, json, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';

// POST /api/auth/login
export async function POST(request) {
  try {
    const ctx = await getContext();
    const { email, password } = await readJson(request);

    const user = await ctx.db.get('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]);
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = await createSession(ctx, user.id);
    return json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return errorResponse(err);
  }
}
