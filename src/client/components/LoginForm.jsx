import { useState } from 'react';
import { api } from '../api';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      onLogin(await api.login(email, password));
    } catch {
      setError('Invalid email or password.');
    }
  }

  return (
    <form className="login panel" onSubmit={handleSubmit}>
      <h1>ShopLite</h1>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="primary">
        Log in
      </button>
    </form>
  );
}
