import React from 'react';
import './RichTextRenderer.css';

/**
 * Pure React Contentful RichText Document Renderer
 * Renders Contentful AST nodes with CITYREACH monochrome luxury styling
 */
export default function RichTextRenderer({ document }) {
  if (!document || !document.content) {
    if (typeof document === 'string') {
      return <div className="rich-text-body"><p>{document}</p></div>;
    }
    return null;
  }

  const renderNode = (node, index) => {
    if (!node) return null;

    // Render Text node with marks (bold, italic, underline, code)
    if (node.nodeType === 'text') {
      let content = node.value;
      if (!node.marks || node.marks.length === 0) {
        return <React.Fragment key={index}>{content}</React.Fragment>;
      }

      let element = <React.Fragment key={index}>{content}</React.Fragment>;
      node.marks.forEach((mark) => {
        if (mark.type === 'bold') {
          element = <strong key={index}>{element}</strong>;
        } else if (mark.type === 'italic') {
          element = <em key={index}>{element}</em>;
        } else if (mark.type === 'underline') {
          element = <u key={index}>{element}</u>;
        } else if (mark.type === 'code') {
          element = <code key={index} className="rich-code-inline">{element}</code>;
        }
      });
      return element;
    }

    const children = node.content ? node.content.map((child, i) => renderNode(child, i)) : null;

    switch (node.nodeType) {
      case 'heading-1':
        return <h1 key={index} className="rich-h1">{children}</h1>;
      case 'heading-2':
        return <h2 key={index} className="rich-h2">{children}</h2>;
      case 'heading-3':
        return <h3 key={index} className="rich-h3">{children}</h3>;
      case 'heading-4':
        return <h4 key={index} className="rich-h4">{children}</h4>;
      case 'heading-5':
        return <h5 key={index} className="rich-h5">{children}</h5>;
      case 'heading-6':
        return <h6 key={index} className="rich-h6">{children}</h6>;

      case 'paragraph':
        return <p key={index} className="rich-p">{children}</p>;

      case 'blockquote':
        return (
          <blockquote key={index} className="rich-blockquote">
            <div className="quote-accent-bar" />
            <div className="quote-inner">{children}</div>
          </blockquote>
        );

      case 'unordered-list':
        return <ul key={index} className="rich-ul">{children}</ul>;

      case 'ordered-list':
        return <ol key={index} className="rich-ol">{children}</ol>;

      case 'list-item':
        return <li key={index} className="rich-li">{children}</li>;

      case 'hr':
        return <hr key={index} className="rich-hr" />;

      case 'hyperlink': {
        const uri = node.data?.uri || '#';
        const isExternal = uri.startsWith('http://') || uri.startsWith('https://');
        return (
          <a
            key={index}
            href={uri}
            className="rich-link"
            target={isExternal ? '_blank' : '_self'}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            {children}
            {isExternal && <span className="external-arrow">↗</span>}
          </a>
        );
      }

      case 'embedded-asset-block': {
        const asset = node.data?.target;
        const fileUrl = asset?.fields?.file?.url ? (asset.fields.file.url.startsWith('//') ? 'https:' + asset.fields.file.url : asset.fields.file.url) : null;
        const title = asset?.fields?.title || 'Editorial Image';
        const description = asset?.fields?.description || '';

        if (!fileUrl) return null;

        return (
          <figure key={index} className="rich-figure">
            <div className="rich-image-wrapper">
              <img src={fileUrl} alt={title} className="rich-img" loading="lazy" />
            </div>
            {(title || description) && (
              <figcaption className="rich-figcaption">
                <span className="caption-dot">●</span> {description || title}
              </figcaption>
            )}
          </figure>
        );
      }

      case 'table':
        return (
          <div key={index} className="rich-table-container">
            <table className="rich-table">
              <tbody>{children}</tbody>
            </table>
          </div>
        );

      case 'table-row':
        return <tr key={index}>{children}</tr>;

      case 'table-cell':
        return <td key={index} className="rich-td">{children}</td>;

      case 'table-header-cell':
        return <th key={index} className="rich-th">{children}</th>;

      default:
        return <div key={index}>{children}</div>;
    }
  };

  return (
    <div className="rich-text-body">
      {document.content.map((node, index) => renderNode(node, index))}
    </div>
  );
}
