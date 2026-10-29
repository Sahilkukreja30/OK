import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isEditableAsMarkdown, markdownToRichText, richTextToMarkdown } from '../shared/richText.js';

const SAMPLE = [
  '## Why speed matters',
  'Fast sites **convert** better, as *every* shop owner knows. See [the study](https://example.com/study) and `LCP`.',
  '> Performance is a feature.',
  '- First point\n- Second point',
  '1. Measure\n2. Improve',
  '![hero](asset:abc123)',
  '---',
  '### Wrap up',
  'Thanks for reading.'
].join('\n\n');

test('converts markdown into valid Contentful rich text nodes', () => {
  const { nodeType, content } = markdownToRichText(SAMPLE);
  assert.equal(nodeType, 'document');
  assert.deepEqual(
    content.map((node) => node.nodeType),
    ['heading-2', 'paragraph', 'blockquote', 'unordered-list', 'ordered-list', 'embedded-asset-block', 'hr', 'heading-3', 'paragraph']
  );

  const paragraph = content[1].content;
  assert.deepEqual(paragraph[1].marks, [{ type: 'bold' }]);
  assert.equal(paragraph.find((n) => n.nodeType === 'hyperlink').data.uri, 'https://example.com/study');
  assert.equal(content[3].content[0].nodeType, 'list-item');
  assert.equal(content[3].content[0].content[0].nodeType, 'paragraph');
  assert.equal(content[5].data.target.sys.id, 'abc123');
  assert.ok(content.every((node) => node.data && Array.isArray(node.content)));
});

test('round-trips through markdown without losing content', () => {
  const once = richTextToMarkdown(markdownToRichText(SAMPLE));
  const twice = richTextToMarkdown(markdownToRichText(once));
  assert.equal(twice, once);
  assert.match(once, /\*\*convert\*\*/);
  assert.match(once, /\[the study\]\(https:\/\/example\.com\/study\)/);
  assert.match(once, /> Performance is a feature\./);
  assert.match(once, /!\[image\]\(asset:abc123\)/);
});

test('keeps links inside quotes and list items', () => {
  const md = '> read [this](https://a.co)\n\n- see [that](https://b.co)';
  const out = richTextToMarkdown(markdownToRichText(md));
  assert.match(out, /> read \[this\]\(https:\/\/a\.co\)/);
  assert.match(out, /- see \[that\]\(https:\/\/b\.co\)/);
});

test('joins wrapped lines into one paragraph and ignores blank input', () => {
  const doc = markdownToRichText('one\ntwo\n\nthree');
  assert.equal(doc.content.length, 2);
  assert.equal(doc.content[0].content[0].value, 'one two');
  assert.deepEqual(markdownToRichText('').content, []);
});

test('flags documents the markdown editor cannot represent', () => {
  assert.equal(isEditableAsMarkdown(markdownToRichText(SAMPLE)), true);
  const withTable = { nodeType: 'document', content: [{ nodeType: 'table', content: [] }] };
  assert.equal(isEditableAsMarkdown(withTable), false);
  const underlined = markdownToRichText('hello');
  underlined.content[0].content[0].marks = [{ type: 'underline' }];
  assert.equal(isEditableAsMarkdown(underlined), false);
});
