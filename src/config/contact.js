const WHATSAPP_NUMBER = '919111110422';

export const whatsappLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** Plain link to the chat: what a link falls back to when the contact form cannot open (e.g. JavaScript failed). */
export const GENERAL_ENQUIRY_URL = whatsappLink('HELLO, I WOULD LIKE TO KNOW MORE ABOUT YOUR SERVICES!');

/** Choices for "What are you looking for?" on the contact form. */
export const LOOKING_FOR_OPTIONS = ['Website design', 'Social media advertising'];

/** WhatsApp link whose message is built from the contact form answers; `topic` adds a line about what the visitor clicked on. */
export const enquiryLink = ({ name, instagram, lookingFor, topic }) => {
  const lines = [
    'Hello CityReach! I would like to know more about your services.',
    ...(topic ? [topic] : []),
    '',
    `Name: ${name.trim()}`,
    `Instagram: ${instagram.trim()}`,
    `Looking for: ${lookingFor}`
  ];
  return whatsappLink(lines.join('\n'));
};
