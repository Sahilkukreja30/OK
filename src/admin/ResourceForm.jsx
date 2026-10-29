import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyValues, fieldsOf, validateValues } from '../../shared/resources';
import { ApiError, deleteEntry, getEntry, saveEntry } from './adminApi';
import FieldRenderer from './fields';
import { slugify } from './slugify';

const LIVE_STATUSES = ['published', 'changed'];

/** The main fields first, then each linked entry (e.g. SEO) under its own heading. */
const fieldGroups = (resource) => [
  { entry: 'main', title: null },
  ...Object.entries(resource.linked ?? {}).map(([entry, link]) => ({ entry, title: link.title }))
];

export default function ResourceForm({ resource, entryId, onClose, onSaved }) {
  const [values, setValues] = useState(() => emptyValues(resource));
  const [assetUrls, setAssetUrls] = useState({});
  const [status, setStatus] = useState('draft');
  const [isEditable, setIsEditable] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(entryId));
  const [busyAction, setBusyAction] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!entryId) return undefined;
    let isMounted = true;
    getEntry(resource.key, entryId)
      .then((entry) => {
        if (!isMounted) return;
        setValues({ ...emptyValues(resource), ...entry.values });
        setAssetUrls(entry.assetUrls ?? {});
        setStatus(entry.status);
        setIsEditable(entry.editable);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        setMessage(error.message);
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [resource, entryId]);

  const setValue = useCallback(
    (key, value) => {
      setValues((previous) => {
        const next = { ...previous, [key]: value };
        // New entries only: keep the URL slug in step with the title until it is edited by hand.
        // (Changing a live slug would break its public link, so existing entries never auto-change.)
        if (!entryId) {
          for (const field of resource.fields) {
            const followsThisField = field.slugFrom === key;
            if (followsThisField && (!previous[field.key] || previous[field.key] === slugify(previous[key]))) {
              next[field.key] = slugify(value);
            }
          }
        }
        return next;
      });
      setErrors((previous) => ({ ...previous, [key]: undefined }));
    },
    [entryId, resource]
  );

  const formContext = useMemo(
    () => ({
      altText: values[resource.titleKey],
      assetUrls,
      rememberAsset: (id, url) => setAssetUrls((previous) => ({ ...previous, [id]: url }))
    }),
    [values, resource.titleKey, assetUrls]
  );

  const isLive = LIVE_STATUSES.includes(status);

  const save = async (publish) => {
    const clientErrors = validateValues(resource, values);
    setMessage('');
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setMessage('Please fix the highlighted fields.');
      document.querySelector(`[data-field="${Object.keys(clientErrors)[0]}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setBusyAction(publish ? 'publish' : 'draft');
    try {
      await saveEntry(resource.key, { id: entryId, values, publish });
      onSaved(publish ? `Published “${values[resource.titleKey]}”. It appears on the site within about a minute.` : `Saved “${values[resource.titleKey]}” as a draft (not on the site).`);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.details);
      setMessage(error.message);
    } finally {
      setBusyAction(null);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete this ${resource.singular} permanently? This cannot be undone.`)) return;
    setBusyAction('delete');
    try {
      await deleteEntry(resource.key, entryId);
      onSaved(`Deleted the ${resource.singular}.`);
    } catch (error) {
      setMessage(error.message);
      setBusyAction(null);
    }
  };

  if (isLoading) return <p className="admin-empty">LOADING…</p>;

  const isBusy = Boolean(busyAction);

  return (
    <form className="admin-form" onSubmit={(event) => event.preventDefault()} noValidate>
      <div className="admin-form-head">
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
          ← BACK TO LIST
        </button>
        <h2 className="admin-title">{entryId ? `Edit ${resource.singular}` : `New ${resource.singular}`}</h2>
        {entryId && <span className={`admin-status is-${status}`}>{status}</span>}
      </div>

      {!isEditable && (
        <p className="admin-banner is-warning">
          This article uses formatting (tables or underline) that the editor can’t show. Saving here would remove it, so please edit it in
          Contentful instead.
        </p>
      )}

      {fieldGroups(resource).map(({ entry, title }) => {
        const fields = fieldsOf(resource, entry);
        if (!fields.length) return null;
        return (
          <fieldset key={entry} className="admin-group">
            {title && <legend className="admin-group-title">{title}</legend>}
            {fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={values[field.key]}
                error={errors[field.key]}
                onChange={(value) => setValue(field.key, value)}
                form={formContext}
              />
            ))}
          </fieldset>
        );
      })}

      {message && <p className={`admin-banner ${Object.keys(errors).length ? 'is-error' : ''}`} role="alert">{message}</p>}

      <div className="admin-actions">
        <button type="button" className="admin-btn admin-btn-solid" disabled={isBusy || !isEditable} onClick={() => save(true)}>
          {busyAction === 'publish' ? 'PUBLISHING…' : isLive ? 'UPDATE LIVE' : 'PUBLISH'}
        </button>
        <button type="button" className="admin-btn admin-btn-outline" disabled={isBusy || !isEditable} onClick={() => save(false)}>
          {busyAction === 'draft' ? 'SAVING…' : isLive ? 'UNPUBLISH & SAVE DRAFT' : 'SAVE DRAFT'}
        </button>
        {entryId && (
          <button type="button" className="admin-btn admin-btn-danger" disabled={isBusy} onClick={remove}>
            {busyAction === 'delete' ? 'DELETING…' : 'DELETE'}
          </button>
        )}
      </div>
    </form>
  );
}
