#!/usr/bin/env bash
# Start Kittyp Vite FE with a local env file.
# Usage:
#   ./scripts/run-local.sh
#   ENV_FILE=.env.devlocal ./scripts/run-local.sh
#   ./scripts/run-local.sh --check
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.devlocal}"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f .env.example ]]; then
    echo "Missing $ENV_FILE — creating from .env.example (fill Meta/Firebase/Razorpay ids)" >&2
    cp .env.example "$ENV_FILE"
  else
    echo "Missing $ENV_FILE and .env.example" >&2
    exit 1
  fi
fi

# Vite loads .env.[mode] automatically; we still validate Meta ids are present
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Soft-required for WhatsApp embedded signup (no hardcoded fallbacks)
if [[ -z "${VITE_META_APP_ID:-}" || -z "${VITE_META_CONFIG_ID:-}${VITE_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID:-}" ]]; then
  echo "warn: VITE_META_APP_ID / VITE_META_CONFIG_ID empty — WhatsApp Embedded Signup will stay disabled" >&2
fi
if [[ -z "${VITE_RAZORPAY_KEY_ID:-}" ]]; then
  echo "warn: VITE_RAZORPAY_KEY_ID empty — checkout will fail until set" >&2
fi
if [[ -z "${VITE_FIREBASE_API_KEY:-}" ]]; then
  echo "warn: VITE_FIREBASE_* incomplete — push/auth web features may skip" >&2
fi

if [[ "${1:-}" == "--check" ]]; then
  echo "OK: env file $ENV_FILE loadable (values not printed)"
  exit 0
fi

# Prefer explicit mode so Vite picks .env.devlocal when using --mode devlocal
MODE="${VITE_MODE:-devlocal}"
if [[ "$ENV_FILE" == ".env.development" ]]; then
  MODE=development
fi

echo "Starting Kittyp FE mode=$MODE (https://localhost:8080 → proxy BE :8082)"
exec npm run dev -- --mode "$MODE"
