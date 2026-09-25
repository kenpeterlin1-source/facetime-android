// Placeholder people for the web mock-up, until the Contacts integration is built.
// Numbers use the 555-01xx fictional range; links are made up.
const LINK = {
  facetime: 'https://facetime.apple.com/join#v=1&p=sample&k=sample', whatsapp: 'https://wa.me/15555550100',
  zoom: 'https://zoom.us/j/5550100000', meet: 'https://meet.google.com/abc-defg-hij',
  teams: 'https://teams.live.com/meet/5550100', slack: 'https://app.slack.com/huddle/T0/C0', jitsi: 'https://meet.jit.si/sample',
};
const RAW = [
  { id: '1', name: 'Mom', phone: '+1 303 555 0101', platforms: ['facetime', 'whatsapp'] },
  { id: '2', name: 'Kitchen iPad', phone: null, platforms: ['facetime'] },
  { id: '3', name: 'Giulia (Milan)', phone: '+39 02 5550 0103', platforms: ['whatsapp', 'zoom'] },
  { id: '4', name: 'Uncle Dave', phone: '+1 720 555 0104', platforms: ['meet', 'jitsi'] },
  { id: '5', name: 'Priya', phone: '+44 20 5550 0105', platforms: ['whatsapp', 'meet', 'zoom'] },
  { id: '8', name: 'Alex (work)', phone: '+1 303 555 0108', platforms: ['teams', 'slack'] },
  { id: '9', name: 'Jordan', phone: '+1 303 555 0109', platforms: ['facetime', 'teams'] },
  { id: '6', name: 'Dentist', phone: '+1 303 555 0106', platforms: [] },
  { id: '7', name: 'Sam', phone: '+1 303 555 0107', platforms: [] },
];

export const SAMPLE_CONTACTS = RAW.map((c) => ({ ...c, links: Object.fromEntries(c.platforms.map((p) => [p, LINK[p]])) }));
