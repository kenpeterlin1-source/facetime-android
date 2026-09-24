# FaceTime for Android

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
