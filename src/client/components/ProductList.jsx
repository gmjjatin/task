import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatPrice } from '../format';

export default function ProductList({ version, onAdd }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .getProducts()
      .then((data) => setProducts(data.items))
      .catch((err) => console.error(err));
  }, [version]);

  const needle = query.trim().toLowerCase();
  const visible = products.filter((product) => product.name.toLowerCase().includes(needle));

  return (
    <section className="panel" aria-labelledby="products-heading">
      <h2 id="products-heading">Products</h2>
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="list" aria-label="Products">
        {visible.map((product, index) => (
          <li key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <div className="muted">
                {formatPrice(product.priceCents)} · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>
            <button onClick={() => onAdd(product)} disabled={product.stock === 0}>
              Add to cart
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="muted">No products found.</p>}
    </section>
  );
}
