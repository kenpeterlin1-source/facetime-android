// Video platforms the app knows how to detect on a contact and launch.
// Colours come from the personal palette (not the platforms' own brand colours).

export const PLATFORMS = {
  facetime: {
    label: 'FaceTime',
    tone: 'clay',
    // full URL incl. the #fragment - the joining secret lives there
    match: (url) => /^https:\/\/facetime\.apple\.com\/join#/i.test(url),
    how: 'Texts them that you are waiting, then opens their FaceTime link. They let you in from their iPhone.',
  },
  whatsapp: {
    label: 'WhatsApp',
    tone: 'sage',
    match: (url) => /^https:\/\/(call\.whatsapp\.com|wa\.me)\//i.test(url),
    how: 'Starts a WhatsApp video call straight away.',
  },
  zoom: {
    label: 'Zoom',
    tone: 'sky',
    match: (url) => /^https:\/\/([a-z0-9-]+\.)?zoom\.us\/j\//i.test(url),
    how: 'Opens their Zoom room in the Zoom app.',
  },
  meet: {
    label: 'Meet',
    tone: 'sand',
    match: (url) => /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i.test(url),
    how: 'Opens their Google Meet link in the Meet app.',
  },
};

export const PLATFORM_ORDER = ['facetime', 'whatsapp', 'zoom', 'meet'];

export function detectPlatform(url) {
  return PLATFORM_ORDER.find((key) => PLATFORMS[key].match(url)) ?? null;
}
