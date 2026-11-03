import React, { useEffect, useState } from 'react';
import { listEntries } from './adminApi';
import { missingDefaultLogos } from '../data/defaultClientLogos';
import { importDefaultLogos } from './importDefaultLogos';
import ResourceForm from './ResourceForm';

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Optional one-click helpers per resource: { label, hint, pending(rows) -> count, run(rows, onProgress) -> count }. */
const RESOURCE_IMPORTS = {
  logo: {
    label: 'IMPORT CURRENT WEBSITE LOGOS',
    hint: 'The site is showing its built-in logos. Import them first: then you can change their links and add new ones. (Adding one before importing would replace the whole wall.)',
    pending: (rows) => missingDefaultLogos(rows.map((row) => row.title)).length,
    run: (rows, onProgress) => importDefaultLogos(rows.map((row) => row.title), onProgress)
  }
};

/** List of entries for one resource, plus the create / edit form. Remount (key) to switch resource. */
export default function ResourceManager({ resource }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // null = list, { id } = edit, { id: null } = create
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [importProgress, setImportProgress] = useState(null); // null = idle, else { done, total }
  const [importError, setImportError] = useState('');

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

  const importer = RESOURCE_IMPORTS[resource.key];
  const needsImport = Boolean(importer && rows && !rows.length && !loadError && importer.pending(rows) > 0);

  const runImport = async () => {
    setNotice('');
    setImportError('');
    setImportProgress({ done: 0, total: importer.pending(rows) });
    try {
      const count = await importer.run(rows, (done, total) => setImportProgress({ done, total }));
      setNotice(`Imported ${count} logo${count === 1 ? '' : 's'}. Open any of them to edit its link.`);
      setRows(null);
      setReloadCount((reloads) => reloads + 1);
    } catch (error) {
      setImportError(`${error.message} Nothing changed on the site – press the button again to retry.`);
    }
    setImportProgress(null);
  };

  if (editing) {
    return <ResourceForm key={editing.id ?? 'new'} resource={resource} entryId={editing.id} onClose={() => setEditing(null)} onSaved={handleSaved} />;
  }

  return (
    <section>
      <div className="admin-list-head">
        <h2 className="admin-title">{resource.label}</h2>
        <button type="button" className="admin-btn admin-btn-solid" disabled={needsImport || Boolean(loadError)} onClick={() => setEditing({ id: null })}>
          + NEW {resource.singular.toUpperCase()}
        </button>
      </div>

      {(needsImport || importProgress) && (
        <div className="admin-banner">
          <p>{importer.hint}</p>
          <button type="button" className="admin-btn admin-btn-outline" disabled={Boolean(importProgress)} onClick={runImport}>
            {importProgress ? `IMPORTING ${importProgress.done}/${importProgress.total}…` : `${importer.label} (${importer.pending(rows)})`}
          </button>
        </div>
      )}

      {importError && <p className="admin-banner is-error" role="alert">{importError}</p>}
      {notice && <p className="admin-banner is-success" role="status">{notice}</p>}
      {loadError && <p className="admin-banner is-error" role="alert">{loadError}</p>}

      {rows === null ? (
        <p className="admin-empty">LOADING…</p>
      ) : needsImport ? null : rows.length === 0 && !loadError ? (
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
