/**
 * Markdown -> rich-text document, the shape RichTextRenderer renders on the public blog.
 * Articles are stored as markdown (what the admin edits) and converted when shown.
 *
 * Supported: # / ## / ### / #### headings, paragraphs, > quotes, - and 1. lists, ---,
 * **bold**, *italic*, `code`, [links](url) and images as ![caption](https://image-url).
 */

const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/;
const HEADING_PATTERN = /^(#{1,4})\s+(.*)$/;
const IMAGE_PATTERN = /^!\[(.*?)\]\(((?:https?:\/\/|\/)\S+?)\)$/;
const BULLET_PATTERN = /^[-*]\s+(.*)$/;
const NUMBERED_PATTERN = /^\d+\.\s+(.*)$/;
const QUOTE_PATTERN = /^>\s?(.*)$/;
const RULE_PATTERN = /^(-{3,}|\*{3,})$/;
const SAFE_LINK_PATTERN = /^(https?:|mailto:|tel:|\/|#)/i;

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
    // Anything that is not a normal web, mail, phone or on-site address (javascript:, data:, …) is shown as plain text.
    else if (SAFE_LINK_PATTERN.test(uri.trim())) nodes.push(block('hyperlink', parseInline(linkText, marks), { uri: uri.trim() }));
    else nodes.push(...parseInline(linkText, marks));

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
      const target = { fields: { file: { url: match[2] }, title: match[1], description: match[1] } };
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

const WORDS_PER_MINUTE = 200;

export function readingTimeLabel(markdown = '') {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} MIN READ`;
}
