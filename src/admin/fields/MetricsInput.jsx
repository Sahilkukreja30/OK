import React from 'react';
import { MAX_METRICS } from '../../../shared/resources';

export default function MetricsInput({ value, onChange }) {
  const update = (index, patch) => onChange(value.map((metric, i) => (i === index ? { ...metric, ...patch } : metric)));
  const remove = (index) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="admin-metrics">
      {value.map((metric, index) => (
        <div key={index} className="admin-metric-row">
          <input
            className="admin-input"
            placeholder="Figure, e.g. 3.9x"
            value={metric.value ?? ''}
            onChange={(e) => update(index, { value: e.target.value })}
          />
          <input
            className="admin-input"
            placeholder="Label, e.g. Return on ad spend"
            value={metric.label ?? ''}
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => remove(index)} aria-label="Remove metric">
            ✕
          </button>
        </div>
      ))}
      {value.length < MAX_METRICS && (
        <button type="button" className="admin-btn admin-btn-outline" onClick={() => onChange([...value, { label: '', value: '' }])}>
          + ADD METRIC
        </button>
      )}
    </div>
  );
}
