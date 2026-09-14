#!/bin/zsh
# Free localhost:8080 for Kittyp FE (Jenkins LTS currently owns it).
set -euo pipefail
echo "Stopping Homebrew Jenkins LTS (frees :8080)..."
brew services stop jenkins-lts 2>/dev/null || true
launchctl bootout "gui/$(id -u)/homebrew.mxcl.jenkins-lts" 2>/dev/null || true
sleep 1
if lsof -iTCP:8080 -sTCP:LISTEN -P -n >/dev/null 2>&1; then
  echo "Still listening on 8080:"
  lsof -iTCP:8080 -sTCP:LISTEN -P -n
  echo "Kill manually if needed, then: npm run local"
  exit 1
fi
echo "8080 free. Start FE: cd kittyp-fe && npm run local"
echo "Open http://localhost:8080/  (API: http://localhost:8002)"
