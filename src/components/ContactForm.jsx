import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOOKING_FOR_OPTIONS, enquiryLink } from '../config/contact';
import './ContactForm.css';

const ContactFormContext = createContext(null);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])';
const NOT_BLANK = '.*\\S.*';

/** Every "Contact" entry point calls this; the popup lives once, here. */
export const useContactForm = () => useContext(ContactFormContext);

export function ContactFormProvider({ children }) {
  const [request, setRequest] = useState(null);
  const returnFocusRef = useRef(null);

  const openContactForm = useCallback((options = {}) => {
    returnFocusRef.current = document.activeElement;
    setRequest(options);
  }, []);

  const closeContactForm = useCallback(() => {
    setRequest(null);
    returnFocusRef.current?.focus?.();
  }, []);

  /** onClick handler for a link whose href is the plain WhatsApp link: opens the form instead, unless the visitor asked for a new tab. */
  const onContactClick = useCallback(
    (options) => (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
      event.preventDefault();
      openContactForm(options);
    },
    [openContactForm]
  );

  const value = useMemo(() => ({ openContactForm, onContactClick }), [openContactForm, onContactClick]);

  return (
    <ContactFormContext.Provider value={value}>
      {children}
      {request && <ContactFormModal topic={request.topic} onClose={closeContactForm} />}
    </ContactFormContext.Provider>
  );
}

function ContactFormModal({ topic, onClose }) {
  const dialogRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation(); // a case study popup underneath stays open
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep Tab inside the dialog.
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = enquiryLink({
      name: data.get('name'),
      businessType: data.get('businessType'),
      instagram: data.get('instagram'),
      lookingFor: data.get('lookingFor'),
      topic
    });
    const chat = window.open(url, '_blank');
    if (chat) {
      chat.opener = null;
      onClose();
    } else {
      window.location.assign(url); // pop-up blocked: open WhatsApp in this tab instead
    }
  };

  // Portal: the page's curtain layer is its own stacking context, which would keep the popup under the navbar.
  return createPortal(
    <div className="contact-modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="contact-modal-header">
          <h2 id="contact-modal-title" className="contact-modal-title">
            Tell us about your business
          </h2>
          <button type="button" className="contact-modal-close" onClick={onClose} aria-label="Close contact form">
            ✕
          </button>
        </header>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label className="contact-field">
            <span className="contact-label">Your name</span>
            <input ref={nameRef} name="name" type="text" required pattern={NOT_BLANK} autoComplete="name" maxLength={100} />
          </label>

          <label className="contact-field">
            <span className="contact-label">What type of business do you own</span>
            <input name="businessType" type="text" required pattern={NOT_BLANK} maxLength={150} />
          </label>

          <label className="contact-field">
            <span className="contact-label">Business Instagram username or URL</span>
            <input
              name="instagram"
              type="text"
              required
              pattern={NOT_BLANK}
              placeholder="@yourbusiness"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={200}
            />
          </label>

          <fieldset className="contact-field contact-choices">
            <legend className="contact-label">What are you looking for?</legend>
            {LOOKING_FOR_OPTIONS.map((option, index) => (
              <label key={option} className="contact-choice">
                <input type="radio" name="lookingFor" value={option} required={index === 0} />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>

          <button type="submit" className="contact-submit">
            Continue on WhatsApp
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
