#!/bin/sh
set -eu

SCRIPT_PATH=$(readlink -f "$0")
APP_DIR=$(dirname "$SCRIPT_PATH")
APPLICATIONS_DIR=${XDG_DATA_HOME:-"$HOME/.local/share"}/applications
DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || true)

if [ -z "$DESKTOP_DIR" ]; then
  DESKTOP_DIR="$HOME/Desktop"
fi

if [ ! -x "$APP_DIR/node_modules/.bin/electron" ]; then
  printf '%s\n' "Bağımlılıklar kuruluyor..."
  cd "$APP_DIR"
  npm ci
fi

mkdir -p "$APPLICATIONS_DIR" "$DESKTOP_DIR"
sed "s|@APP_DIR@|$APP_DIR|g" "$APP_DIR/saat.desktop" > "$APPLICATIONS_DIR/saat.desktop"
cp "$APPLICATIONS_DIR/saat.desktop" "$DESKTOP_DIR/Saat.desktop"
chmod +x "$APP_DIR/launch-saat" "$APPLICATIONS_DIR/saat.desktop" "$DESKTOP_DIR/Saat.desktop"
gio set "$DESKTOP_DIR/Saat.desktop" metadata::trusted true 2>/dev/null || true
update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true

printf '%s\n' "Saat kuruldu. Masaüstündeki Saat ikonundan açabilirsin."
