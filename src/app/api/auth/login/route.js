import { createSession, verifyPassword } from '@/server/auth';
import { getContext } from '@/server/context';
import { HttpError } from '@/server/errors';
import { errorResponse, json, readJson } from '@/server/http';

export const dynamic = 'force-dynamic';

// POST /api/auth/login
export async function POST(request) {
  try {
    const ctx = await getContext();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = ctx.now();
    let attempts = ctx.loginAttempts.get(ip) || { count: 0, resetAt: now };

    if (now - attempts.resetAt > 60_000) {
      attempts = { count: 0, resetAt: now };
    }

    if (attempts.count >= 5) {
      const retryAfter = Math.max(1, Math.ceil((attempts.resetAt + 60_000 - now) / 1000));
      return json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        429,
        { 'Retry-After': String(retryAfter) }
      );
    }

    const { email, password } = await readJson(request);

    const user = await ctx.db.get('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]);
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      attempts = { count: attempts.count + 1, resetAt: attempts.resetAt };
      ctx.loginAttempts.set(ip, attempts);
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    ctx.loginAttempts.delete(ip);
    const token = await createSession(ctx, user.id);
    return json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return errorResponse(err);
  }
}
