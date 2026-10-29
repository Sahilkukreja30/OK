import React from 'react';

/** Label, hint, character counter and error message around any input. */
export default function FieldShell({ field, value, error, children }) {
  const length = typeof value === 'string' ? value.length : 0;
  const isOverLimit = field.maxLength && length > field.maxLength;

  return (
    <div className={`admin-field ${error ? 'has-error' : ''}`} data-field={field.key}>
      <div className="admin-field-head">
        <label className="admin-label">
          {field.label}
          {field.required && <span className="admin-required"> *</span>}
        </label>
        {field.maxLength && (
          <span className={`admin-counter ${isOverLimit ? 'is-over' : ''}`}>
            {length}/{field.maxLength}
          </span>
        )}
      </div>
      {children}
      {field.hint && !error && <p className="admin-hint">{field.hint}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </div>
  );
}
