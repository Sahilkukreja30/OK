import React from 'react';
import FieldShell from './FieldShell';
import ImageInput from './ImageInput';
import MarkdownInput from './MarkdownInput';
import MetricsInput from './MetricsInput';
import { DateInput, NumberInput, SelectInput, TextareaInput, TextInput, ToggleInput } from './InputFields';

/** field.type -> input component. Add a new field type by adding one entry here. */
const INPUTS = {
  text: TextInput,
  textarea: TextareaInput,
  number: NumberInput,
  date: DateInput,
  select: SelectInput,
  boolean: ToggleInput,
  image: ImageInput,
  markdown: MarkdownInput,
  metrics: MetricsInput
};

export default function FieldRenderer({ field, value, error, onChange, form }) {
  const Input = INPUTS[field.type];
  return (
    <FieldShell field={field} value={value} error={error}>
      <Input field={field} value={value} onChange={onChange} form={form} />
    </FieldShell>
  );
}
