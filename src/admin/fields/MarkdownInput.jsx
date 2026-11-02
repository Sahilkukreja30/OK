import React, { useRef, useState } from 'react';
import RichTextRenderer from '../../components/RichTextRenderer';
import { markdownToRichText } from '../../../shared/richText';
import { imageMarkdown, insertAtCursor, TOOLBAR } from '../markdownTools';
import { uploadImageFile } from '../imageUpload';

const BODY_IMAGE_WIDTH = 1400;

export default function MarkdownInput({ value, onChange }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const selection = () => {
    const { selectionStart, selectionEnd } = textareaRef.current;
    return { value, start: selectionStart, end: selectionEnd };
  };

  const applyEdit = ({ value: next, start, end }) => {
    onChange(next);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, end);
    });
  };

  const handleImage = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    const caption = window.prompt('Caption for this image (also used as its alt text):', '') ?? '';
    setIsUploading(true);
    setUploadError('');
    try {
      const { url } = await uploadImageFile(file, { maxWidth: BODY_IMAGE_WIDTH, title: caption, description: caption });
      applyEdit(insertAtCursor(selection(), imageMarkdown(caption || 'image', url)));
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-markdown">
      <div className="admin-toolbar">
        {TOOLBAR.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="admin-tool"
            title={tool.title}
            disabled={isPreview}
            onClick={() => applyEdit(tool.apply(selection()))}
          >
            {tool.label}
          </button>
        ))}
        <button type="button" className="admin-tool" disabled={isPreview || isUploading} onClick={() => fileRef.current.click()}>
          {isUploading ? 'UPLOADING…' : 'IMAGE'}
        </button>
        <button type="button" className={`admin-tool admin-tool-right ${isPreview ? 'is-active' : ''}`} onClick={() => setIsPreview(!isPreview)}>
          {isPreview ? 'EDIT' : 'PREVIEW'}
        </button>
      </div>

      {isPreview ? (
        <div className="admin-preview">
          <RichTextRenderer document={markdownToRichText(value)} />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="admin-input admin-textarea admin-article"
          rows={18}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your article here…"
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
      {uploadError && <p className="admin-error" role="alert">{uploadError}</p>}
    </div>
  );
}
