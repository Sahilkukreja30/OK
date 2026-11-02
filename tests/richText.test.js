import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markdownToRichText, readingTimeLabel } from '../shared/richText.js';

const SAMPLE = [
  '## Why speed matters',
  'Fast sites **convert** better, as *every* shop owner knows. See [the study](https://example.com/study) and `LCP`.',
  '> Performance is a feature.',
  '- First point\n- Second point',
  '1. Measure\n2. Improve',
  '![hero shot](https://cdn.example.com/hero.webp)',
  '---',
  '### Wrap up',
  'Thanks for reading.'
].join('\n\n');

test('converts markdown into the rich-text nodes the blog renders', () => {
  const { nodeType, content } = markdownToRichText(SAMPLE);
  assert.equal(nodeType, 'document');
  assert.deepEqual(
    content.map((node) => node.nodeType),
    ['heading-2', 'paragraph', 'blockquote', 'unordered-list', 'ordered-list', 'embedded-asset-block', 'hr', 'heading-3', 'paragraph']
  );

  const paragraph = content[1].content;
  assert.deepEqual(paragraph[1].marks, [{ type: 'bold' }]);
  assert.equal(paragraph.find((n) => n.nodeType === 'hyperlink').data.uri, 'https://example.com/study');
  assert.equal(content[3].content[0].content[0].nodeType, 'paragraph');
  assert.ok(content.every((node) => node.data && Array.isArray(node.content)));
});

test('images become embedded assets with url and caption', () => {
  const { content } = markdownToRichText('![A caption](https://cdn.example.com/a.webp)\n\n![local](/api/media?key=images%2Fa.png)');
  const [remote, local] = content.map((node) => node.data.target.fields);
  assert.equal(remote.file.url, 'https://cdn.example.com/a.webp');
  assert.equal(remote.description, 'A caption');
  assert.equal(local.file.url, '/api/media?key=images%2Fa.png');
});

test('unsafe link and image addresses are never turned into links', () => {
  const doc = markdownToRichText('Click [here](javascript:void) or [data](data:text/html;base64,AAAA) or [ok](https://a.co)\n\n![x](javascript:void)');
  const [para, second] = doc.content;
  const links = para.content.filter((n) => n.nodeType === 'hyperlink');
  assert.deepEqual(links.map((l) => l.data.uri), ['https://a.co']);
  assert.match(para.content.map((n) => n.value ?? n.content?.[0]?.value ?? '').join(''), /Click here or data or ok/);
  assert.equal(second.nodeType, 'paragraph', 'a javascript: image is plain text, not an embedded asset');
});

test('keeps mailto, tel and on-site links', () => {
  const { content } = markdownToRichText('[mail](mailto:a@b.co) [call](tel:+911) [home](/in) [top](#top)');
  assert.deepEqual(content[0].content.filter((n) => n.nodeType === 'hyperlink').map((l) => l.data.uri), ['mailto:a@b.co', 'tel:+911', '/in', '#top']);
});

test('joins wrapped lines into one paragraph and ignores blank input', () => {
  const doc = markdownToRichText('one\ntwo\n\nthree');
  assert.equal(doc.content.length, 2);
  assert.equal(doc.content[0].content[0].value, 'one two');
  assert.deepEqual(markdownToRichText('').content, []);
});

test('reading time rounds up and is at least one minute', () => {
  assert.equal(readingTimeLabel(''), '1 MIN READ');
  assert.equal(readingTimeLabel('word '.repeat(450)), '3 MIN READ');
});
