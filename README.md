# Krypu

A contacts-first video-call launcher for Android: FaceTime links, WhatsApp, Zoom, Meet, Teams, Slack and Jitsi,
one tap per person. Started as "FaceTime for Android" (design below). Named 2026-09-24 - a made-up word, a nod to
cryptids (Scott Sigler's *Nocturnal*) and "KePu".

## Original design: FaceTime for Android

Let the two Android phones in the house join FaceTime calls with the three Apple phones, in one tap,
without anyone re-sharing a link every time.

**Status: designed, not started.** Opened 2026-09-23. No deadline. Personal.

## The actual use case
Five phones in the household: **3 Apple, 2 Android**. The Apple phones can FaceTime each other natively.
The Android phones currently can't join without someone generating and sending a fresh link each time.

## Why this works (and where the ceiling is)

Apple publishes **no FaceTime SDK or API** for Android, and there is no way to sign in to an Apple account
from Android. The one supported route is **FaceTime links** (iOS 15+ / macOS Monterey+): an Apple device
creates a link, and it opens at `facetime.apple.com` over WebRTC in a browser.

The thing that makes this project worth building: **FaceTime links are persistent and reusable.** A link
created in the FaceTime app stays valid until its creator deletes it, and can be named. So each of the three
Apple phones creates **one permanent named link** — "Ken", "Mom", "Kitchen" — shares it with the Android
phones **once**, and the Android app saves all three forever. After that, joining is one tap with no new
link, no message, no setup.

What it still cannot do:
- **Android cannot start a call.** Only Apple devices create links or initiate.
- **No ringing and no push on Android.** There is no background presence to hook into, so an incoming
  FaceTime cannot alert an Android phone. This is the real friction and the design has to work around it
  (see "The no-ringing problem" below).
- **The host must admit the joiner** from their Apple device each time. If nobody on the Apple side is in
  the call, the Android user just sits in the lobby.
- Apple's web client officially supports **Chrome and Edge** on Android and it user-agent sniffs. A plain
  `WebView` will likely be refused or break on camera/mic permissions — use **Chrome Custom Tabs**.

## The no-ringing problem (the part worth designing well)
Because Android can't be rung, a saved link alone only solves half the problem: the Android user can join
instantly, but has no way to know a call is happening, and no way to summon anyone.

**Decided (Ken, 2026-09-23): the nudge is a text message.** Each saved person has one button that
(a) opens the FaceTime link in a Custom Tab and (b) fires an SMS intent to that person's number with a
pre-written "join me on FaceTime" message carrying the link. That turns "join a call someone else started"
into something close to "call them", which is what the household actually wants.
So each saved entry stores: **name + FaceTime link (with fragment) + phone number + message template.**

## Critical implementation detail
A FaceTime link looks like:

    https://facetime.apple.com/join#v=1&p=<...>&k=<...>

The joining secret lives in the **URL fragment**, after the `#`. It is never sent to Apple's server — it is
handled client-side. So the app must **store and pass the complete URL including everything after the `#`**.
Any code path that normalises, rebuilds, or logs a link by its path alone will silently break joining.
Treat saved links as secrets: anyone holding one can join.

## What the app does
1. Intent filter on `https://facetime.apple.com/join*` so a link shared into the house opens in the app.
2. On first receipt of a link: offer to **save it with a name and a phone number** ("Mom").
3. Main screen: a short list of saved people, each a big one-tap **Join** button.
4. Join = warm up a Chrome Custom Tab, ensure camera/mic permission, open the full link with fragment intact.
5. Per-person **"Text to join"** — SMS intent with the link (see above). Core, not optional.
6. Optional: home-screen widget or quick-settings tile for the most-used link.

No accounts, no backend. ~~Links live in local storage~~ → superseded 2026-09-24: links live on the contact card (see Update below).

## To verify before building
- Do FaceTime links really persist indefinitely, or do they rotate? (Design depends on this.)
- Does a Custom Tab carry camera/mic permission cleanly, or does Chrome re-prompt every join?
- Will Chrome claim `facetime.apple.com` via Digital Asset Links and win the intent filter?
- Does the fragment survive the Android intent → Custom Tab handoff intact?

## Update 2026-09-24: ask for links, and keep them in Contacts (Ken's decisions)

### 1. "Ask for their link" - getting the link in the first place
Today someone has to know to make a link and send it. The app does the asking:
- **Ask for link** → pick a contact → choose their mobile number → opens an SMS with a pre-written message:
  > Hi! So I can FaceTime you from my Android phone, could you send me a FaceTime link? On your iPhone:
  > open **FaceTime** → **Create Link** → **Add Name** (e.g. "Ken for Mom") → **Messages** → send it to me.
  > It's a one-time thing - I'll save it and use it every time. Thanks!
- The app remembers **who it asked and when** ("pending"), so when a link arrives it can suggest that person.
- Message text is editable per send; the default lives in settings.

### 2. Links live in Android Contacts (the contact is the source of truth)
Each FaceTime link is written to that person's **contact card** as a **website/URL entry labelled "FaceTime"**
(`ContactsContract.CommonDataKinds.Website`, via `expo-contacts` `urlAddresses`).
- **The app's main list = every contact that has a `facetime.apple.com/join` URL.** No separate app database.
- The **phone number for "Text to join"** comes from the same contact - nothing entered twice.
- Survives an app reinstall or a new phone (if contacts sync to the Google account), and the link is also
  reachable from the normal Contacts app: tapping it opens Chrome → FaceTime.
- Store the **full URL including the `#` fragment**, and check it on read-back (see "Critical implementation detail").
- Trade-off, accepted: the link then sits in the Google account's contacts. Anyone who can see those contacts
  could join that person's FaceTime link (the host still has to admit them).
- Permissions: `READ_CONTACTS` + `WRITE_CONTACTS`.

### 3. Getting a link from Messages into the app (Android 12+ reality)
We can't verify `facetime.apple.com` as an App Link (Apple owns it), so on Android 12+ **tapping a FaceTime link
opens Chrome, not the app**, unless the user turns on "Open supported links" for the app by hand. So support all three:
1. **Share sheet** (most reliable): long-press the link in Messages → Share → *FaceTime Links* (`ACTION_SEND` text/plain).
2. **Clipboard check** on opening the app: "Found a FaceTime link - save it to Mom?" (pre-selects the pending contact).
3. **Paste** field on the Add screen.
The app also offers a one-time "Open supported links" setup screen for people who want tap-to-open.

### Revised main flows
- **Join** (per contact): open the link in a Chrome Custom Tab.
- **Text to join** (per contact): SMS to the contact's mobile with the link.
- **Ask for link**: SMS request (above) → pending → save to contact when it arrives.
- **Fix a link**: if a link stops working, "Ask again" re-sends the request and replaces the URL on the contact.

## Update 2026-09-24 (later): contacts-first, multi-platform (Ken's direction)

The app becomes a **universal "how do I video-call this person" launcher**, built contacts-first. FaceTime is v1;
the design is general from day one.

### Main screen = your phone contacts, filtered to people you can video-call
The app reads the phone's contacts and, for each person, detects every video platform it knows about:

| Platform | How it's detected on the contact | What "call" does |
|---|---|---|
| **FaceTime** | URL entry `facetime.apple.com/join#…` (label "FaceTime") - saved by this app | SMS/WhatsApp nudge + open link in a Chrome Custom Tab |
| **WhatsApp** | WhatsApp's own data rows on the contact (raw contact account `com.whatsapp`, mimetype `vnd.android.cursor.item/vnd.com.whatsapp.video.call`) | **Starts a WhatsApp video call directly** (ACTION_VIEW on that data row - same as the Contacts app) |
| **Zoom** | URL entry `zoom.us/j/…` (or a regional `*.zoom.us`) | Open link → Zoom app |
| **Google Meet** | URL entry `meet.google.com/xxx-xxxx-xxx`; later also Meet's own data rows | Open link → Meet app |
| **Teams** | URL entry `teams.live.com/meet/…` (personal) or `teams.microsoft.com/l/meetup-join/…` / `/l/call/…` (work) | Open link → Teams app |
| **Slack** | URL entry: a huddle link (`app.slack.com/huddle/…`) copied from a DM or channel | Open link → Slack app (both people must be in that workspace) |
| **Jitsi** | URL entry `meet.jit.si/<room>` | Open link → browser or Jitsi app. Also **"Start a Jitsi room"** for *anyone*: the app makes a hard-to-guess room (`meet.jit.si/summit-xxxxxxxxxxxx`), texts them the link, and joins. Guests need no account or app. Note: public meet.jit.si asks the **first person in the room (the host) to sign in** (Google/GitHub/etc.) to start it; guests don't. Self-hosting Jitsi would remove that, not needed for v1 |
| later | Signal, Telegram, Viber (data rows); Messenger, WeChat, LINE, **Snapchat, Instagram** (open their chat/profile only - none let another app start a video call) | |

### Group calls (Jitsi)
**Group call with Jitsi** → pick any number of contacts (including people with no saved links) → **Start room with N
people**: one fresh room link, sent to each person individually over their nudge channel (SMS or WhatsApp - separate
messages, not a group thread), then the app opens the room. Jitsi is the only platform where Krypu can *create* the
call, so it is the group option; FaceTime/Zoom/Meet group calls stay in those apps.

- List shows each person with **platform chips** (FaceTime · WhatsApp · Zoom · Meet); people with none are hidden
  behind a "Show everyone" toggle, where each has **Ask for a link**.
- Search box at the top; favourites/recents pinned first.
- Tap a person → **sheet listing their platforms** → pick one → that platform's workflow runs.
- Per person, remember the **last platform used** and show it first.

### Implementation notes
- `expo-contacts` covers names, phones, URL entries (read + write). It does **not** expose other apps' data rows,
  so WhatsApp/Meet detection and the direct WhatsApp video call need a **small local Expo module (Kotlin)** that
  queries `ContactsContract.Data` by mimetype and fires `ACTION_VIEW` on the data URI. Built in v1.1, not v1.
- Nudge channel per person: SMS or WhatsApp message (`https://wa.me/<number>?text=…`); default SMS for US numbers,
  WhatsApp for international numbers.
- Name: **Krypu** (decided 2026-09-24; replaces the placeholder "FaceTime Links").

### Phasing
- **v1:** contacts-first list + FaceTime end to end (ask, save to contact, join, nudge). Other chips shown only if
  detection is cheap (URL-based Zoom/Meet/Teams/Slack come almost free).
- **v1.1:** native module → WhatsApp detection + direct video call; WhatsApp nudge.
- **v1.2:** Meet data rows, Signal/Telegram, recents/favourites.

### Your rooms (host instead of ask) - 2026-09-24
Set up **your own permanent room once** per platform; Krypu then **sends your link** to whoever you call and opens the room.
The reverse of "ask for their link", and it works for people who have never saved anything.
- **Zoom:** your Personal Meeting Room link (never changes). **Meet:** one "meeting for later" link. **Teams:** one meeting
  link. **Jitsi:** Krypu creates a private room once and keeps it. **FaceTime: not possible** (Android can't create links).
- Setup: paste each link once (help text per platform, same steps as peterlin.com/krypu); Jitsi is automatic.
- Stored in app storage on the phone only.
- Person sheet: their platforms first, then **"Or invite <name> to your room"** (each ready room).
- **Group calls** use any of your ready rooms (Zoom, Meet, Teams or Jitsi), not just Jitsi: pick people → tap the room.
- Auto-creating Zoom/Meet/Teams rooms via their APIs would need sign-in (OAuth) - not planned; pasting once is enough.

## Look and feel
**Personal styling, not REMAX corporate colours.** This is a household app — warm and plain, nothing
that looks like a work tool.

## Stack
Expo / React Native, reusing the DropFile setup (`~/projects/quantum/dropfile`):
`expo-web-browser` for Custom Tabs, `expo-linking` for the intent filter, `expo-sharing`/intent for the nudge.
Fallback to native Kotlin if Expo can't configure the intent filter or preserve the fragment properly.

## Honest alternative
WhatsApp or Google Meet group calls work on all five phones today with no build and no lobby. This project
is only worth it if the three Apple users won't move off FaceTime — which is usually the real situation.

## Notes
- 2026-09-23: project opened; use case and design captured. Nothing built yet.
- 2026-09-24: added "Ask for link" SMS flow and decided links are stored on the Android contact card (URL field, label "FaceTime"); on GitHub (public): https://github.com/kenpeterlin1-source/facetime-android
- 2026-09-24: logo chosen: **summit camera** (concept 3) - camera on topo rings. Icon set generated by `node tools/make_icons.mjs` (sources in `assets/logo/`).
- 2026-09-24: direction changed to a contacts-first, multi-platform video launcher (FaceTime first; WhatsApp via native module in v1.1).
- 2026-09-24: added Teams and Slack (URL-based) to the platform list (Ken).
- 2026-09-24: added Jitsi, including "Start a Jitsi room" for anyone as the no-app fallback (Ken).
- 2026-09-24: app will get a web page at **peterlin.com/<appname>** (served from the peterlin.com Cloudflare site, `site/<appname>/`). APK downloads stay on apps.peterlin.com. Name: Krypu → peterlin.com/krypu.
- 2026-09-24: **renamed to Krypu** (package com.peterlin.krypu). Checked: no existing app by that name; krypu.com and krypu.app unregistered.
- TODO (end of 2026-09-24 session): rename GitHub repo facetime-android → krypu and local folder ~/personal/facetime-android → ~/personal/krypu (update ~/personal/README.md table + .claude/launch.json path).
- 2026-09-24: added group Jitsi calls (multi-select). Snapchat/Instagram: later, open-chat tier only.
- 2026-09-24: web page built at peterlin-com-website/site/krypu/ (→ peterlin.com/krypu). "Ask for link" texts should link to https://peterlin.com/krypu/#<platform> for the steps.
- 2026-09-24: added "your rooms": host with your own permanent Zoom/Meet/Teams/Jitsi room; group calls can use any of them.
