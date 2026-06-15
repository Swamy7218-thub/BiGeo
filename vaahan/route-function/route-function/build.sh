#!/usr/bin/env bash
# build.sh — package route-function for AWS Lambda (Python 3.12)
# Usage: bash build.sh
# Output: package/ directory ready for sam build / zip upload

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$SCRIPT_DIR/package"

echo "==> Cleaning previous build..."
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "==> Installing dependencies into package/..."
pip install \
  --platform manylinux2014_x86_64 \
  --target "$PACKAGE_DIR" \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  --upgrade \
  -r "$SCRIPT_DIR/requirements.txt"

echo "==> Copying handler..."
cp "$SCRIPT_DIR/handler.py" "$PACKAGE_DIR/"

echo "==> Build complete. Contents of package/:"
ls -lh "$PACKAGE_DIR"

# Optional: create a zip for manual upload
if [[ "${1:-}" == "--zip" ]]; then
  ZIP_PATH="$SCRIPT_DIR/route-function.zip"
  echo "==> Zipping to $ZIP_PATH..."
  cd "$PACKAGE_DIR"
  zip -r "$ZIP_PATH" . -q
  echo "==> Zip size: $(du -sh "$ZIP_PATH" | cut -f1)"
fi
