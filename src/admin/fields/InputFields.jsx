import React from 'react';

/* Plain controls. Each takes { field, value, onChange } and renders only the input. */

export function TextInput({ field, value, onChange }) {
  return <input className="admin-input" type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
}

export function TextareaInput({ value, onChange }) {
  return <textarea className="admin-input admin-textarea" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function NumberInput({ value, onChange }) {
  return (
    <input
      className="admin-input"
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
    />
  );
}

export function DateInput({ value, onChange }) {
  return <input className="admin-input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function SelectInput({ field, value, onChange }) {
  return (
    <select className="admin-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ToggleInput({ field, value, onChange }) {
  return (
    <label className="admin-toggle">
      <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      <span>{field.toggleLabel ?? 'Yes'}</span>
    </label>
  );
}
