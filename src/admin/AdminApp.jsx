import React, { useEffect, useState } from 'react';
import { RESOURCES } from '../../shared/resources';
import usePageMeta from '../hooks/usePageMeta';
import { hasSession, setSessionExpiredHandler, signOut } from './adminApi';
import LoginForm from './LoginForm';
import ResourceManager from './ResourceManager';
import './admin.css';

const TABS = Object.values(RESOURCES);

export default function AdminApp() {
  const [isSignedIn, setIsSignedIn] = useState(hasSession);
  const [activeKey, setActiveKey] = useState(TABS[0].key);

  usePageMeta({ title: 'Admin | CITYREACH', noindex: true, nofollow: true });

  useEffect(() => {
    setSessionExpiredHandler(() => setIsSignedIn(false));
    return () => setSessionExpiredHandler(() => {});
  }, []);

  if (!isSignedIn) return <LoginForm onSignedIn={() => setIsSignedIn(true)} />;

  const handleSignOut = () => {
    signOut();
    setIsSignedIn(false);
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-brand">CITYREACH · ADMIN</span>
        <nav className="admin-tabs" aria-label="Content types">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tab ${tab.key === activeKey ? 'is-active' : ''}`}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </nav>
        <div className="admin-topbar-actions">
          <a className="admin-link" href="/" target="_blank" rel="noopener noreferrer">VIEW SITE ↗</a>
          <button type="button" className="admin-link" onClick={handleSignOut}>SIGN OUT</button>
        </div>
      </header>

      <main className="admin-main">
        <ResourceManager key={activeKey} resource={RESOURCES[activeKey]} />
      </main>
    </div>
  );
}
