import React, { useState } from 'react';
import { login } from '../services/auth.service';
import { setToken } from '../services/token.service';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      setToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
      />
      {error && <p>{error}</p>}
      <button disabled={loading} type="submit">
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
