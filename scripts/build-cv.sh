#!/usr/bin/env bash
# Builds cv/resume.tex into public/static/resume.pdf with Tectonic (XeTeX; fetches LaTeX packages on demand).
# Uses `tectonic` from PATH, else downloads the pinned release into node_modules/.cache/tectonic.
set -euo pipefail

VERSION=0.17.0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/cv/resume.tex"
OUT="$ROOT/public/static/resume.pdf"

if command -v tectonic >/dev/null 2>&1; then
  TECTONIC=tectonic
else
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) TARGET=aarch64-apple-darwin ;;
    Darwin-x86_64) TARGET=x86_64-apple-darwin ;;
    Linux-x86_64) TARGET=x86_64-unknown-linux-musl ;;
    Linux-aarch64) TARGET=aarch64-unknown-linux-musl ;;
    *) echo "build-cv: no prebuilt Tectonic for $(uname -sm); install it: https://tectonic-typesetting.github.io" >&2; exit 1 ;;
  esac
  CACHE="$ROOT/node_modules/.cache/tectonic/$VERSION"
  TECTONIC="$CACHE/tectonic"
  if [ ! -x "$TECTONIC" ]; then
    echo "build-cv: downloading Tectonic $VERSION ($TARGET)"
    mkdir -p "$CACHE"
    curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40$VERSION/tectonic-$VERSION-$TARGET.tar.gz" \
      | tar xz -C "$CACHE"
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
"$TECTONIC" -X compile --untrusted --outdir "$TMP" "$SRC"
mv "$TMP/resume.pdf" "$OUT"
echo "build-cv: wrote ${OUT#"$ROOT"/} ($(pdfinfo "$OUT" 2>/dev/null | awk '/^Pages:/ {print $2 " page(s)"}'))"
