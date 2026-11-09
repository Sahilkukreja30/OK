/** Home page sections linked from the top menu and the phone menu, in order. */
const SECTION_LINKS = [
  { id: 'home', label: 'HOME' },
  { id: 'services', label: 'SERVICES' },
  { id: 'case-studies', label: 'CASE STUDIES', needsCaseStudies: true },
  { id: 'work', label: 'OUR WORK' }
];

/** The Case Studies link only shows once a case study is published, so it never points at a hidden section. */
export const sectionLinks = ({ hasCaseStudies }) => SECTION_LINKS.filter((link) => !link.needsCaseStudies || hasCaseStudies);
