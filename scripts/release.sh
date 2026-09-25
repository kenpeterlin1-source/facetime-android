#!/bin/bash
# Publish the current Android build as a GitHub Release so installed apps can update themselves (src/update.js).
#   scripts/release.sh "What changed in one line"
# Reads name, version, android.versionCode and extra.releasesRepo from app.json; expects
# android/app/build/outputs/apk/release/app-release.apk to be the build of that version.
# Uploads <Name>-<version>.apk + latest.json to the release. The repo must be PUBLIC so phones can download.
#
# Token, first one found: $GH_TOKEN, the file $TOKEN_FILE, or `gh auth token` (personal Mac, gh logged in).
# Uses curl + the GitHub REST API, not `gh release`: on the REMAX network the firewall resets gh's connections.
set -euo pipefail
cd "$(dirname "$0")/.."
NOTES="${1:?usage: scripts/release.sh \"release notes\"}"
j() { python3 -c "import json;d=json.load(open('app.json'))['expo'];print($1)"; }
NAME=$(j 'd["name"].replace(" ","")'); VER=$(j 'd["version"]'); CODE=$(j 'd["android"]["versionCode"]')
REPO=$(j 'd["extra"]["releasesRepo"]')
TOKEN_FILE="$HOME/.config/$(echo "$NAME" | tr A-Z a-z)/github-token"
TOKEN="${GH_TOKEN:-$(cat "$TOKEN_FILE" 2>/dev/null || gh auth token 2>/dev/null || true)}"
[ -n "$TOKEN" ] || { echo "no token: export GH_TOKEN, put one in $TOKEN_FILE, or run 'gh auth login'"; exit 1; }
api() { curl -sS -m 60 -H "authorization: Bearer $TOKEN" -H "accept: application/vnd.github+json" -H "x-github-api-version: 2022-11-28" "$@"; }

if [ -f android/app/build.gradle ]; then
  GRADLE_CODE=$(sed -n 's/^ *versionCode \([0-9]*\).*/\1/p' android/app/build.gradle)
  [ "$CODE" = "$GRADLE_CODE" ] || { echo "app.json versionCode $CODE != build.gradle versionCode $GRADLE_CODE - rebuild (npx expo prebuild) first"; exit 1; }
fi
APK=android/app/build/outputs/apk/release/app-release.apk
[ -f "$APK" ] || { echo "no $APK - build first"; exit 1; }
TAG="v$VER"; APKNAME="$NAME-$VER.apk"
URL="https://github.com/$REPO/releases/download/$TAG/$APKNAME"

VIS=$(api "https://api.github.com/repos/$REPO" | python3 -c 'import json,sys;j=json.load(sys.stdin);print(j.get("visibility") or j.get("message"))')
[ "$VIS" = "public" ] || { echo "repo $REPO is '$VIS' - it must exist and be public"; exit 1; }

OUT=$(mktemp -d); trap 'rm -rf "$OUT"' EXIT
cp "$APK" "$OUT/$APKNAME"
VER="$VER" CODE="$CODE" URL="$URL" NOTES="$NOTES" OUT="$OUT" python3 -c 'import json,os;e=os.environ;json.dump({"version":e["VER"],"versionCode":int(e["CODE"]),"url":e["URL"],"notes":e["NOTES"]},open(e["OUT"]+"/latest.json","w"))'

REL=$(api "https://api.github.com/repos/$REPO/releases/tags/$TAG")
ID=$(echo "$REL" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("id",""))')
if [ -z "$ID" ]; then
  BODY=$(TAG="$TAG" NAME="$NAME" VER="$VER" NOTES="$NOTES" python3 -c 'import json,os;e=os.environ;print(json.dumps({"tag_name":e["TAG"],"name":e["NAME"]+" "+e["VER"],"body":e["NOTES"],"make_latest":"true"}))')
  REL=$(api -X POST "https://api.github.com/repos/$REPO/releases" -d "$BODY")
  ID=$(echo "$REL" | python3 -c 'import json,sys;j=json.load(sys.stdin);print(j.get("id") or sys.exit("create failed: "+j.get("message","?")))')
  echo "created release $TAG (id $ID)"
else
  echo "release $TAG exists (id $ID) - replacing assets"
fi
for f in "$APKNAME" latest.json; do
  echo "$REL" | F="$f" python3 -c 'import json,sys,os;[print(a["id"]) for a in json.load(sys.stdin).get("assets",[]) if a["name"]==os.environ["F"]]' \
    | while read -r aid; do api -X DELETE "https://api.github.com/repos/$REPO/releases/assets/$aid" >/dev/null; done
  CT=$([ "$f" = latest.json ] && echo application/json || echo application/vnd.android.package-archive)
  # big APKs: allow 15 minutes for the upload (the 60 s default in api() cut off a 107 MB upload)
  api -m 900 -X POST -H "content-type: $CT" --data-binary "@$OUT/$f" "https://uploads.github.com/repos/$REPO/releases/$ID/assets?name=$f" \
    | python3 -c 'import json,sys;j=json.load(sys.stdin);print("uploaded", j.get("name") or j.get("message"), j.get("size",""))'
done
echo "published $URL"
echo "install page: https://github.com/$REPO/releases/latest"
