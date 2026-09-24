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

No accounts, no backend, no sync — links live in local storage on each Android phone.

## To verify before building
- Do FaceTime links really persist indefinitely, or do they rotate? (Design depends on this.)
- Does a Custom Tab carry camera/mic permission cleanly, or does Chrome re-prompt every join?
- Will Chrome claim `facetime.apple.com` via Digital Asset Links and win the intent filter?
- Does the fragment survive the Android intent → Custom Tab handoff intact?

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
