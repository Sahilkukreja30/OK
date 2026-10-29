/**
 * Markdown <-> Contentful Rich Text.
 * The admin edits a small, predictable markdown subset; Contentful stores the rich-text AST
 * that RichTextRenderer already renders on the public blog.
 *
 * Supported: # / ## / ### / #### headings, paragraphs, > quotes, - and 1. lists, ---,
 * **bold**, *italic*, `code`, [links](url) and images as ![caption](asset:<assetId>).
 */

const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/;
const HEADING_PATTERN = /^(#{1,4})\s+(.*)$/;
const IMAGE_PATTERN = /^!\[(.*?)\]\(asset:([\w-]+)\)$/;
const BULLET_PATTERN = /^[-*]\s+(.*)$/;
const NUMBERED_PATTERN = /^\d+\.\s+(.*)$/;
const QUOTE_PATTERN = /^>\s?(.*)$/;
const RULE_PATTERN = /^(-{3,}|\*{3,})$/;

const text = (value, marks = []) => ({ nodeType: 'text', value, marks, data: {} });
const block = (nodeType, content, data = {}) => ({ nodeType, data, content });
const paragraph = (value) => block('paragraph', parseInline(value));

function parseInline(source, marks = []) {
  const nodes = [];
  let rest = source;

  while (rest) {
    const match = INLINE_PATTERN.exec(rest);
    if (!match) {
      nodes.push(text(rest, marks));
      break;
    }
    if (match.index > 0) nodes.push(text(rest.slice(0, match.index), marks));

    const [whole, bold, italic, code, linkText, uri] = match;
    if (bold !== undefined) nodes.push(...parseInline(bold, [...marks, { type: 'bold' }]));
    else if (italic !== undefined) nodes.push(...parseInline(italic, [...marks, { type: 'italic' }]));
    else if (code !== undefined) nodes.push(text(code, [...marks, { type: 'code' }]));
    else nodes.push(block('hyperlink', parseInline(linkText, marks), { uri }));

    rest = rest.slice(match.index + whole.length);
  }

  return nodes.length ? nodes : [text('', marks)];
}

/** Consumes consecutive lines matching `pattern`, returns [capturedGroups, nextIndex]. */
function takeWhile(lines, start, pattern) {
  const captured = [];
  let i = start;
  while (i < lines.length && pattern.test(lines[i])) {
    captured.push(pattern.exec(lines[i])[1]);
    i += 1;
  }
  return [captured, i];
}

const isBlockStart = (line) =>
  !line.trim() ||
  [HEADING_PATTERN, IMAGE_PATTERN, BULLET_PATTERN, NUMBERED_PATTERN, QUOTE_PATTERN, RULE_PATTERN].some((p) =>
    p.test(line)
  );

export function markdownToRichText(markdown = '') {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n').map((line) => line.trimEnd());
  const content = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    let match;
    if ((match = HEADING_PATTERN.exec(line))) {
      content.push(block(`heading-${match[1].length}`, parseInline(match[2])));
      i += 1;
    } else if ((match = IMAGE_PATTERN.exec(line))) {
      const target = { sys: { type: 'Link', linkType: 'Asset', id: match[2] } };
      content.push(block('embedded-asset-block', [], { target }));
      i += 1;
    } else if (RULE_PATTERN.test(line)) {
      content.push(block('hr', []));
      i += 1;
    } else if (QUOTE_PATTERN.test(line)) {
      const [quoted, next] = takeWhile(lines, i, QUOTE_PATTERN);
      content.push(block('blockquote', [paragraph(quoted.join(' '))]));
      i = next;
    } else if (BULLET_PATTERN.test(line) || NUMBERED_PATTERN.test(line)) {
      const ordered = NUMBERED_PATTERN.test(line);
      const [items, next] = takeWhile(lines, i, ordered ? NUMBERED_PATTERN : BULLET_PATTERN);
      const listItems = items.map((item) => block('list-item', [paragraph(item)]));
      content.push(block(ordered ? 'ordered-list' : 'unordered-list', listItems));
      i = next;
    } else {
      const paragraphLines = [line];
      i += 1;
      while (i < lines.length && !isBlockStart(lines[i])) {
        paragraphLines.push(lines[i]);
        i += 1;
      }
      content.push(paragraph(paragraphLines.join(' ')));
    }
  }

  return { nodeType: 'document', data: {}, content };
}

const MARK_WRAPPERS = {
  bold: (value) => `**${value}**`,
  italic: (value) => `*${value}*`,
  code: (value) => `\`${value}\``
};

function inlineToMarkdown(nodes = []) {
  return nodes
    .map((node) => {
      if (node.nodeType === 'hyperlink') return `[${inlineToMarkdown(node.content)}](${node.data?.uri || ''})`;
      if (node.nodeType !== 'text') return inlineToMarkdown(node.content);
      return (node.marks || []).reduce((value, mark) => MARK_WRAPPERS[mark.type]?.(value) ?? value, node.value);
    })
    .join('');
}

/** Inline text of a block whose children are paragraphs (quote, list item) or inline nodes. */
const flattenInline = (node) =>
  inlineToMarkdown((node.content || []).flatMap((child) => (child.nodeType === 'paragraph' ? child.content : [child])));

const BLOCK_SERIALIZERS = {
  paragraph: (node) => inlineToMarkdown(node.content),
  blockquote: (node) => `> ${node.content.map(flattenInline).join(' ')}`,
  hr: () => '---',
  'embedded-asset-block': (node) => `![image](asset:${node.data?.target?.sys?.id})`,
  'unordered-list': (node) => node.content.map((item) => `- ${flattenInline(item)}`).join('\n'),
  'ordered-list': (node) => node.content.map((item, n) => `${n + 1}. ${flattenInline(item)}`).join('\n')
};

for (let level = 1; level <= 6; level += 1) {
  BLOCK_SERIALIZERS[`heading-${level}`] = (node) =>
    `${'#'.repeat(Math.min(level, 4))} ${inlineToMarkdown(node.content)}`;
}

export function richTextToMarkdown(document) {
  if (!document?.content) return '';
  return document.content
    .map((node) => (BLOCK_SERIALIZERS[node.nodeType] || flattenInline)(node))
    .join('\n\n');
}

/** Ids of the assets embedded in a document (used to preview images in the editor). */
export const embeddedAssetIds = (document) =>
  (document?.content ?? []).filter((node) => node.nodeType === 'embedded-asset-block').map((node) => node.data.target.sys.id);

/** True when the markdown editor can represent every node without losing content (tables, underline...). */
export function isEditableAsMarkdown(document) {
  const supportedMarks = new Set(Object.keys(MARK_WRAPPERS));
  const isSupported = (node) => {
    if (node.nodeType === 'text') return (node.marks || []).every((mark) => supportedMarks.has(mark.type));
    const known = node.nodeType in BLOCK_SERIALIZERS || ['list-item', 'hyperlink'].includes(node.nodeType);
    return known && (node.content || []).every(isSupported);
  };
  return (document?.content || []).every(isSupported);
}
