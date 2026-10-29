import React, { useRef, useState } from 'react';
import { uploadImageFile } from '../imageUpload';

/** Uploads straight to the media library; the form only keeps { id, url }. */
export default function ImageInput({ field, value, onChange, form }) {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      onChange(await uploadImageFile(file, { maxWidth: field.maxWidth, title: form.altText }));
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-image-field">
      {value?.url ? (
        <img className="admin-image-preview" src={value.url} alt="" />
      ) : (
        <div className="admin-image-empty">{isUploading ? 'UPLOADING…' : 'NO IMAGE YET'}</div>
      )}

      <div className="admin-image-actions">
        <button type="button" className="admin-btn admin-btn-outline" disabled={isUploading} onClick={() => fileRef.current.click()}>
          {isUploading ? 'UPLOADING…' : value ? 'REPLACE IMAGE' : 'UPLOAD IMAGE'}
        </button>
        {value && !isUploading && (
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange(null)}>
            REMOVE
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      {uploadError && <p className="admin-error" role="alert">{uploadError}</p>}
    </div>
  );
}
