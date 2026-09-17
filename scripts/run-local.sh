#!/usr/bin/env bash
# Start Kittyp Vite FE after safely loading local env
#   ./scripts/run-local.sh
#   ENV_FILE=.env.devlocal ./scripts/run-local.sh --check
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.devlocal}"
LOADER="$ROOT/scripts/_load_env.py"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f .env.example ]]; then
    echo "Missing $ENV_FILE — copying from .env.example (fill Meta/Firebase/Razorpay)" >&2
    cp .env.example "$ENV_FILE"
  else
    echo "Missing $ENV_FILE" >&2
    exit 1
  fi
fi

eval "$("$LOADER" "$ENV_FILE")"

if [[ -z "${VITE_META_APP_ID:-}" || ( -z "${VITE_META_CONFIG_ID:-}" && -z "${VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID:-}" ) ]]; then
  echo "warn: VITE_META_APP_ID / VITE_META_CONFIG_ID empty — WhatsApp Embedded Signup disabled" >&2
fi
if [[ -z "${VITE_RAZORPAY_KEY_ID:-}" ]]; then
  echo "warn: VITE_RAZORPAY_KEY_ID empty — checkout will fail until set" >&2
fi
if [[ -z "${VITE_FIREBASE_API_KEY:-}" ]]; then
  echo "warn: VITE_FIREBASE_* incomplete — web push/auth may skip" >&2
fi

if [[ "${1:-}" == "--check" ]]; then
  echo "OK: env file $ENV_FILE loadable (values not printed)"
  exit 0
fi

MODE="${VITE_MODE:-devlocal}"
echo "Starting Kittyp FE mode=$MODE (https://localhost:8080)"
exec npm run dev:local
