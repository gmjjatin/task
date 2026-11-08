import { createDatabase } from './db';
import { PaymentGateway } from './payments';
import { createProductCache } from './productCache';

const KEY = '__shopliteContext';

/**
 * Everything the route handlers share: the database, the payment provider, the clock and the product cache.
 *
 * Tests build their own with createContext({ db, payments, now }) and install it with setContext(), so keep
 * these exports and their parameters. `now` is the clock for all time-based logic (tests control it).
 */
export function createContext({ db, payments = new PaymentGateway(), now = () => Date.now() } = {}) {
  if (!db) throw new Error('createContext requires a db');
  return {
    db,
    payments,
    now,
    productCache: createProductCache(now),
    idempotencyKeys: new Map(),
    loginAttempts: new Map(),
  };
}

export function setContext(ctx) {
  globalThis[KEY] = Promise.resolve(ctx);
}

/**
 * Route handlers call `await getContext()`. The first call creates and seeds the in-memory database.
 *
 * The context is kept on globalThis, not in a module variable: `next dev` compiles every route separately and
 * reloads modules when you save, and all of them must keep talking to the same database. The flip side is that
 * the database and the cache are created once per server process. Restart `npm start` after you change
 * `db.js` (for example to add a table).
 */
export function getContext() {
  if (!globalThis[KEY]) {
    globalThis[KEY] = createDatabase()
      .then((db) => createContext({ db }))
      .catch((err) => {
        delete globalThis[KEY]; // do not cache a failed start
        throw err;
      });
  }
  return globalThis[KEY];
}
