const WHATSAPP_NUMBER = '919111110422';

export const whatsappLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const GENERAL_ENQUIRY_URL = whatsappLink('HELLO, I WOULD LIKE TO KNOW MORE ABOUT YOUR SERVICES!');
