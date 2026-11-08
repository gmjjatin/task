import crypto from 'crypto';
import { HttpError } from './errors';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export async function createSession(ctx, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await ctx.db.run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [
    token,
    userId,
    ctx.now(),
  ]);
  return token;
}

// The bearer token sent with the request, or undefined.
export function bearerToken(request) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization') || '');
  return match ? match[1] : undefined;
}

// Resolves with the logged-in user. Throws 401 when the request is not authenticated.
export async function requireAuth(ctx, request) {
  const token = bearerToken(request);
  if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
  const user = await ctx.db.get(
    `SELECT users.id, users.email, users.name
       FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?`,
    [token]
  );
  if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
  return user;
}
