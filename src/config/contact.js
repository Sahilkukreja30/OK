const WHATSAPP_NUMBER = '919111110422';

export const whatsappLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** Plain link to the chat: what a link falls back to when the contact form cannot open (e.g. JavaScript failed). */
export const GENERAL_ENQUIRY_URL = whatsappLink('HELLO, I WOULD LIKE TO KNOW MORE ABOUT YOUR SERVICES!');

/** Choices for "What are you looking for?" on the contact form. */
export const LOOKING_FOR_OPTIONS = ['Website design', 'Social media advertising'];

/** WhatsApp link whose message is one friendly paragraph built from the contact form answers; `topic` is an extra sentence, placed before the sign-off, about what the visitor clicked on. */
export const enquiryLink = ({ name, instagram, lookingFor, topic }) => {
  const message = [
    `Hi CityReach! I'm ${name.trim()}, and I'm interested in ${lookingFor.trim().toLowerCase()} for my business.`,
    `You can find us on Instagram at ${instagram.trim()}.`,
    ...(topic ? [topic.trim()] : []),
    'Looking forward to hearing from you!'
  ];
  return whatsappLink(message.join(' '));
};
