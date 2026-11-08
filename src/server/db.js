import initSqlJs from 'sql.js';
import { hashPassword } from './auth';

const SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);

  CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_cents INTEGER NOT NULL
  );

  CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    amount_cents INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    template TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

const USERS = [
  { email: 'alice@shoplite.test', name: 'Alice' },
  { email: 'bob@shoplite.test', name: 'Bob' },
  { email: 'carol@shoplite.test', name: 'Carol' },
  { email: 'dave@shoplite.test', name: 'Dave' },
  { email: 'erin@shoplite.test', name: 'Erin' },
];

const PRODUCTS = [
  ['Water Bottle', 'Insulated steel bottle, 750 ml', 1999, 50],
  ['Backpack', '25 L everyday backpack', 4999, 25],
  ['Desk Lamp', 'LED lamp with dimmer', 3499, 10],
  ["Chef's Knife", '8 inch stainless steel knife', 5999, 8],
  ['Notebook', 'A5 dotted notebook', 499, 100],
  ['Headphones', 'Wireless over-ear headphones', 12999, 5],
  ['Coffee Mug', 'Ceramic mug, 350 ml', 1299, 40],
  ['Running Shoes', 'Lightweight trail shoes', 8999, 12],
];

const DEFAULT_PASSWORD = 'password123';

// Mimics a network database driver: every query resolves asynchronously.
const nextTick = () => new Promise((resolve) => setImmediate(resolve));

function normalizeParams(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

function createConnection(sqlDb) {
  return {
    async get(sql, params) {
      await nextTick();
      const stmt = sqlDb.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        return stmt.step() ? stmt.getAsObject() : undefined;
      } finally {
        stmt.free();
      }
    },

    async all(sql, params) {
      await nextTick();
      const stmt = sqlDb.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      } finally {
        stmt.free();
      }
    },

    async run(sql, params) {
      await nextTick();
      sqlDb.run(sql, normalizeParams(params));
      const changes = sqlDb.getRowsModified();
      const [result] = sqlDb.exec('SELECT last_insert_rowid() AS id');
      return { changes, lastInsertRowid: result ? result.values[0][0] : undefined };
    },
  };
}

/**
 * A single shared SQLite connection. Every call is queued, so operations never interleave
 * at the SQL level. `transaction(fn)` holds the queue until `fn` settles: commit on success,
 * rollback on throw. Inside `fn`, use the `tx` argument, not `db` (calling `db` would wait
 * for the transaction to finish and deadlock).
 */
export class Database {
  constructor(sqlDb) {
    this.sqlDb = sqlDb;
    this.connection = createConnection(sqlDb);
    this.queue = Promise.resolve();
  }

  get(sql, params) {
    return this.exclusive(() => this.connection.get(sql, params));
  }

  all(sql, params) {
    return this.exclusive(() => this.connection.all(sql, params));
  }

  run(sql, params) {
    return this.exclusive(() => this.connection.run(sql, params));
  }

  transaction(fn) {
    return this.exclusive(async () => {
      this.sqlDb.run('BEGIN');
      try {
        const result = await fn(this.connection);
        this.sqlDb.run('COMMIT');
        return result;
      } catch (err) {
        this.sqlDb.run('ROLLBACK');
        throw err;
      }
    });
  }

  exclusive(task) {
    const result = this.queue.then(task);
    this.queue = result.catch(() => {});
    return result;
  }
}

let sqlJsPromise;

export async function createDatabase({ seed = true } = {}) {
  sqlJsPromise = sqlJsPromise || initSqlJs();
  const SQL = await sqlJsPromise;
  const sqlDb = new SQL.Database();
  sqlDb.run('PRAGMA foreign_keys = ON');
  sqlDb.exec(SCHEMA);
  const db = new Database(sqlDb);
  if (seed) await seedDatabase(db);
  return db;
}

async function seedDatabase(db) {
  for (const user of USERS) {
    await db.run('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)', [
      user.email,
      user.name,
      hashPassword(DEFAULT_PASSWORD),
    ]);
  }
  for (const [name, description, priceCents, stock] of PRODUCTS) {
    await db.run('INSERT INTO products (name, description, price_cents, stock) VALUES (?, ?, ?, ?)', [
      name,
      description,
      priceCents,
      stock,
    ]);
  }
}
