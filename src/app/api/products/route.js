import { getContext } from '@/server/context';
import { errorResponse, json } from '@/server/http';

export const dynamic = 'force-dynamic';

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    stock: row.stock,
  };
}

// GET /api/products?q=...
export async function GET(request) {
  try {
    const ctx = await getContext();
    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    const cached = ctx.productCache.get(q);
    if (cached) return json(cached);

    const rows = q
      ? await ctx.db.all(`SELECT * FROM products WHERE name LIKE '%${q}%' ORDER BY id`)
      : await ctx.db.all('SELECT * FROM products ORDER BY id');
    const body = { items: rows.map(toProduct) };
    ctx.productCache.set(q, body);
    return json(body);
  } catch (err) {
    return errorResponse(err);
  }
}
