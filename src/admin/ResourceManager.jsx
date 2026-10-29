import React, { useEffect, useState } from 'react';
import { listEntries } from './adminApi';
import ResourceForm from './ResourceForm';

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** List of entries for one resource, plus the create / edit form. Remount (key) to switch resource. */
export default function ResourceManager({ resource }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, { id } = edit, { id: null } = create
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    listEntries(resource.key)
      .then((list) => isMounted && setRows(list))
      .catch((error) => {
        if (!isMounted) return;
        setRows([]);
        setLoadError(error.message);
      });
    return () => {
      isMounted = false;
    };
  }, [resource.key, reloadCount]);

  const handleSaved = (message) => {
    setNotice(message);
    setEditing(null);
    setRows(null);
    setLoadError('');
    setReloadCount((count) => count + 1);
  };

  if (editing) {
    return <ResourceForm key={editing.id ?? 'new'} resource={resource} entryId={editing.id} onClose={() => setEditing(null)} onSaved={handleSaved} />;
  }

  return (
    <section>
      <div className="admin-list-head">
        <h2 className="admin-title">{resource.label}</h2>
        <button type="button" className="admin-btn admin-btn-solid" onClick={() => setEditing({ id: null })}>
          + NEW {resource.singular.toUpperCase()}
        </button>
      </div>

      {notice && <p className="admin-banner is-success" role="status">{notice}</p>}
      {loadError && <p className="admin-banner is-error" role="alert">{loadError}</p>}

      {rows === null ? (
        <p className="admin-empty">LOADING…</p>
      ) : rows.length === 0 && !loadError ? (
        <p className="admin-empty">No {resource.label.toLowerCase()} yet. Add the first one.</p>
      ) : (
        <ul className="admin-rows">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" className="admin-row" onClick={() => setEditing({ id: row.id })}>
                {row.thumbnail ? <img className="admin-row-thumb" src={row.thumbnail} alt="" /> : <span className="admin-row-thumb" />}
                <span className="admin-row-main">
                  <span className="admin-row-title">{row.title}</span>
                  <span className="admin-row-sub">{row.subtitle}</span>
                </span>
                <span className="admin-row-date">{formatDate(row.updatedAt)}</span>
                <span className={`admin-status is-${row.status}`}>{row.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
