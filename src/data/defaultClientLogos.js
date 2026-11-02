/**
 * Client logos shown until the first logo is added from the /admin dashboard.
 * `type` is one of the display styles in shared/resources.js (LOGO_STYLE_OPTIONS).
 */
export const DEFAULT_CLIENT_LOGOS = [
  // ROW 1: LEFT TO RIGHT
  {
    id: 'twoblends',
    name: 'TWO BLENDS COFFEE',
    url: 'https://twoblends.ae',
    src: '/LOGO/2BLENDS.png',
    type: 'white-on-dark'
  },
  {
    id: 'bclub',
    name: 'THE B CLUB',
    url: 'https://thebclub.me',
    src: '/LOGO/BCLUB.png',
    type: 'invert-white'
  },
  {
    id: 'bilingual',
    name: 'BILINGUAL',
    url: null,
    src: '/LOGO/BILINGUAL.jpg',
    type: 'invert-white'
  },
  {
    id: 'fold',
    name: 'FOLD BAKEHOUSE',
    url: null,
    src: '/LOGO/FOLD.jpg',
    type: 'color-badge'
  },

  // ROW 2: LEFT TO RIGHT
  {
    id: 'ghazi',
    name: 'GHAZI COLD STORAGE',
    url: 'https://ghazicold.com',
    src: '/LOGO/GHAZ.webp',
    type: 'standard'
  },
  {
    id: 'healthwealth',
    name: 'THE HEALTH AND WEALTH CLUB',
    url: 'https://healthandwealthclub.com',
    src: '/LOGO/H&W.avif',
    type: 'standard'
  },
  {
    id: 'hide',
    name: 'HIDE CAFE',
    url: null,
    src: '/LOGO/HIDE.jpg',
    type: 'invert-white'
  },
  {
    id: 'ilife',
    name: 'ILIFE PHYSIOTHERAPY CLINIC',
    url: 'https://ilifephysiocare.in',
    src: '/LOGO/ILIFE.webp',
    type: 'standard'
  },

  // ROW 3: LEFT TO RIGHT
  {
    id: 'kaze',
    name: 'KAZE PERFUMES',
    url: 'https://kazeperfumes.com',
    src: '/LOGO/KAZE.avif',
    type: 'standard'
  },
  {
    id: 'loversclub',
    name: 'THE LOVERS CLUB',
    url: 'https://theloversclub.ae',
    src: '/LOGO/LOVERSCLUB.png',
    type: 'white-on-dark'
  },
  {
    id: 'lucedoro',
    name: 'LUCE DORO CLUB',
    url: 'https://lucedoroclub.com',
    src: '/LOGO/LUCEDORO.webp',
    type: 'standard'
  },
  {
    id: 'needleform',
    name: 'NEEDLE FORM',
    url: 'https://theneedleform.com',
    src: '/LOGO/NEEDLEFORM.png',
    type: 'white-pure'
  },

  // ROW 4: LEFT TO RIGHT
  {
    id: 'ofelia',
    name: 'OFELIA BOUTIQUE',
    url: 'https://ofeliaboutique.com',
    src: '/LOGO/OFELIA.avif',
    type: 'standard'
  },
  {
    id: 'twostyles',
    name: 'TWOSTYLES ABAYAS DUBAI',
    url: null,
    src: '/LOGO/TWOSTYLES.jpg',
    type: 'invert-white'
  },
  {
    id: 'voya',
    name: 'VOYA BAKEHOUSE',
    url: 'https://voyabakehouse.ae',
    src: '/LOGO/VOYA.webp',
    type: 'standard'
  },
  {
    id: 'overlay',
    name: 'OVERLAY PERFUMES',
    url: 'https://overlayae.com',
    src: '/LOGO/logo_overlay.webp',
    type: 'standard'
  }
];

const normalize = (name) => name.trim().toLowerCase();

/** The built-in logos that are not in the CMS yet (matched by name, ignoring case and spacing). */
export function missingDefaultLogos(existingNames) {
  const present = new Set(existingNames.map(normalize));
  return DEFAULT_CLIENT_LOGOS.filter((logo) => !present.has(normalize(logo.name)));
}
