/** Toolbar actions for the article editor. Each returns the new text and selection. */

const wrapSelection = (marker, placeholder) => ({ value, start, end }) => {
  const selected = value.slice(start, end) || placeholder;
  const text = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
  return { value: text, start: start + marker.length, end: start + marker.length + selected.length };
};

const prefixLines = (prefix) => ({ value, start, end }) => {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const block = value.slice(lineStart, end) || 'Text';
  const prefixed = block.split('\n').map((line) => `${prefix}${line}`).join('\n');
  return { value: value.slice(0, lineStart) + prefixed + value.slice(end), start: lineStart, end: lineStart + prefixed.length };
};

const insertLink = ({ value, start, end }) => {
  const label = value.slice(start, end) || 'link text';
  const markdown = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { value: value.slice(0, start) + markdown + value.slice(end), start: urlStart, end: urlStart + 'https://'.length };
};

export const TOOLBAR = [
  { id: 'h2', label: 'H2', title: 'Heading', apply: prefixLines('## ') },
  { id: 'h3', label: 'H3', title: 'Sub-heading', apply: prefixLines('### ') },
  { id: 'bold', label: 'B', title: 'Bold', apply: wrapSelection('**', 'bold text') },
  { id: 'italic', label: 'I', title: 'Italic', apply: wrapSelection('*', 'italic text') },
  { id: 'link', label: 'LINK', title: 'Link', apply: insertLink },
  { id: 'quote', label: 'QUOTE', title: 'Quote', apply: prefixLines('> ') },
  { id: 'list', label: 'LIST', title: 'Bullet list', apply: prefixLines('- ') }
];

export function insertAtCursor({ value, start, end }, snippet) {
  return { value: value.slice(0, start) + snippet + value.slice(end), start: start + snippet.length, end: start + snippet.length };
}

export const imageMarkdown = (caption, url) => `\n\n![${caption.replace(/[[\]]/g, '')}](${url})\n\n`;
