// Your own permanent rooms: set up once, then Krypu sends the link to whoever you call.
// Stored on the phone only (see settings.js), never on a server.

// Platforms where you can host a reusable room. FaceTime is not here: Android cannot create FaceTime links.
export const HOSTABLE = ['zoom', 'meet', 'teams', 'jitsi'];

export const SETUP_HELP = {
  zoom: 'Zoom → Meetings → Personal Room → Copy Invitation, then paste it here.',
  meet: 'Meet → New meeting → Create a meeting for later, then paste the link here.',
  teams: 'Teams → Meet → Create a meeting link, then paste it here.',
  jitsi: 'Krypu makes a private room for you. Nothing to do.',
};
