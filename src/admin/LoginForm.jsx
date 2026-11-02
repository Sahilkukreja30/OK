import React, { useState } from 'react';
import { signIn } from './adminApi';

export default function LoginForm({ onSignedIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    try {
      await signIn(password);
      onSignedIn();
    } catch (err) {
      setError(err.message);
      setIsBusy(false);
    }
  };

  return (
    <main className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <span className="admin-brand">CITYREACH</span>
        <h1 className="admin-title">Admin sign in</h1>
        <input
          className="admin-input"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button type="submit" className="admin-btn admin-btn-solid" disabled={isBusy || !password}>
          {isBusy ? 'SIGNING IN…' : 'SIGN IN'}
        </button>
      </form>
    </main>
  );
}
