// Starting calls: opens the right app for each platform, and the texts Krypu sends on your behalf
// (you always press Send yourself - Krypu only fills in the message).
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { PLATFORMS } from './platforms';

const digits = (phone) => (phone ?? '').replace(/[^\d]/g, '');

// Their link (or WhatsApp by phone number). FaceTime must open in a Chrome Custom Tab - Apple's web client only
// works in Chrome/Edge, and the #fragment (the joining secret) must be passed through untouched.
export async function openTheirs(person, platform) {
  const url = person.links?.[platform];
  if (platform === 'facetime' && url) return WebBrowser.openBrowserAsync(url);
  if (url) return Linking.openURL(url);
  if (platform === 'whatsapp' && person.phone) return Linking.openURL(`https://wa.me/${digits(person.phone)}`);
  throw new Error(`No ${PLATFORMS[platform].label} link saved for ${person.name}.`);
}

export function openRoom(url) {
  return Linking.openURL(url);
}

export function callPhone(person) {
  return Linking.openURL(`tel:${person.phone}`);
}

// Text someone (you press Send). Several numbers → one group text; Krypu sends them individually instead.
export function text(phone, body) {
  return Linking.openURL(`sms:${phone ?? ''}?body=${encodeURIComponent(body)}`);
}

export function inviteText(platform, url) {
  return `Join me on ${PLATFORMS[platform].label}: ${url}`;
}

export function nudgeText(platform) {
  return `I'm on ${PLATFORMS[platform].label} now - join me when you can!`;
}

// Short, and says up front they'll have to let you in - FaceTime links don't ring, the host admits the guest.
const FACETIME_ASK =
  "Hi! I'm on Android and want to be able to FaceTime you. Could you send me a FaceTime link? It's quick:\n" +
  '1. Open the FaceTime app (green camera icon)\n' +
  '2. Tap New FaceTime (or the + / New Call button), then Create Link. On older iPhones Create Link is right at the top\n' +
  '3. Tap Messages, pick me, and send it (or tap Copy and paste it into our chat)\n' +
  'It sends me a link starting with facetime.apple.com. When I use it, you\'ll get a notification that I\'d like to ' +
  'join - tap it and let me in with the green check. You only do this once. Thanks!';

const HOW = {
  facetime: '',
  zoom: 'In Zoom: Meetings → Personal Room → Copy Invitation, and text it to me.',
  meet: 'In Google Meet: New meeting → Create a meeting for later, and text me the link.',
  teams: 'In Teams: Meet → Create a meeting link, and text it to me.',
  slack: 'In our Slack DM: start a huddle → Copy huddle link, and send it to me.',
};

export function askText(platform) {
  if (platform === 'facetime') return FACETIME_ASK;
  const label = PLATFORMS[platform].label;
  return `Hi! Could you send me a ${label} link so I can call you from my phone? ${HOW[platform] ?? ''} ` +
    "It's a one-time thing - I'll save it and use it every time. Thanks!";
}
