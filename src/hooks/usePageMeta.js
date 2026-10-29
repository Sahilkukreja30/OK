import { useEffect } from 'react';

/** Sets attributes on a <head> element (creating it if needed) and returns a function that undoes it. */
function upsertHeadTag(selector, tagName, attributes) {
  let element = document.head.querySelector(selector);
  const wasCreated = !element;
  if (wasCreated) {
    element = document.createElement(tagName);
    document.head.appendChild(element);
  }

  const previous = Object.fromEntries(Object.keys(attributes).map((name) => [name, element.getAttribute(name)]));
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));

  return () => {
    if (wasCreated) element.remove();
    else Object.entries(previous).forEach(([name, value]) => (value === null ? element.removeAttribute(name) : element.setAttribute(name, value)));
  };
}

const metaByName = (name, content) => [`meta[name="${name}"]`, 'meta', { name, content }];
const metaByProperty = (property, content) => [`meta[property="${property}"]`, 'meta', { property, content }];

function buildTags({ description, image, canonical, robots, type }, title) {
  const tags = [
    metaByProperty('og:title', title),
    metaByProperty('og:type', type),
    metaByName('twitter:title', title),
    description && metaByName('description', description),
    description && metaByProperty('og:description', description),
    description && metaByName('twitter:description', description),
    image && metaByProperty('og:image', image),
    image && metaByName('twitter:image', image),
    canonical && ['link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical }],
    robots && metaByName('robots', robots)
  ];
  return tags.filter(Boolean);
}

/**
 * Per-page SEO for the SPA: <title>, description, canonical, robots, Open Graph / Twitter tags
 * and optional JSON-LD. Restores the previous head on unmount.
 * Pass `title: null` to do nothing (e.g. while a post is still loading).
 */
export default function usePageMeta({ title, description, image, canonical, noindex, nofollow, type = 'website', jsonLd }) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (!title) return undefined;

    const previousTitle = document.title;
    document.title = title;

    const robots = [noindex && 'noindex', nofollow && 'nofollow'].filter(Boolean).join(', ');
    const undo = buildTags({ description, image, canonical, robots, type }, title).map(([selector, tagName, attributes]) =>
      upsertHeadTag(selector, tagName, attributes)
    );

    let jsonLdTag;
    if (jsonLdText) {
      jsonLdTag = document.createElement('script');
      jsonLdTag.type = 'application/ld+json';
      jsonLdTag.textContent = jsonLdText;
      document.head.appendChild(jsonLdTag);
    }

    return () => {
      document.title = previousTitle;
      undo.forEach((restore) => restore());
      jsonLdTag?.remove();
    };
  }, [title, description, image, canonical, noindex, nofollow, type, jsonLdText]);
}
