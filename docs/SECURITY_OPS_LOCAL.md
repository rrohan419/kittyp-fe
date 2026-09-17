# Kittyp security ops — local env, GCP referrer locks, key rotation

## 1. Local startup (load secrets safely)

### Backend
```bash
cd kittyp-be
cp .env.example .env          # once
# edit .env with real values (never commit)
./scripts/run-local.sh --check
./scripts/run-local.sh
```
Equivalent manual load:
```bash
set -a
source .env
set +a
export SPRING_PROFILES_ACTIVE=local
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

### Frontend
```bash
cd kittyp-fe
cp .env.example .env.devlocal # once; set VITE_META_* (required, no code fallbacks)
./scripts/run-local.sh --check
./scripts/run-local.sh
```
FE: https://localhost:8080 → Vite proxy → http://127.0.0.1:8082

### Validation (no secret printing)
```bash
# BE required vars present?
cd kittyp-be && ./scripts/run-local.sh --check
# FE env file loadable?
cd kittyp-fe && ./scripts/run-local.sh --check
# Confirm client bundle does not contain key secrets:
cd kittyp-fe && npm run build && ! grep -R "rzp_test_.*secret\|BEGIN PRIVATE KEY\|sk_live_" dist/ || echo "FAIL: secret-like material in bundle"
```

---

## 2. Google Cloud / Firebase — HTTP referrer restrictions

Apply to **browser** keys only (`VITE_FIREBASE_API_KEY`, browser Maps key).  
**Server** keys (`GOOGLE_API_KEY` / Places on BE) should use **IP** restrictions, not HTTP referrers.

### A. Firebase / Google Browser API key
1. Open [Google Cloud Console](https://console.cloud.google.com/) → select the Firebase/GCP project.
2. **APIs & Services** → **Credentials**.
3. Open the **Browser key** used as `VITE_FIREBASE_API_KEY` (or create “Browser key (auto created by Firebase)”).
4. **Application restrictions** → **HTTP referrers (web sites)**.
5. Add referrers (adjust to your real hosts):
   - `https://localhost:8080/*`
   - `https://127.0.0.1:8080/*`
   - `https://kittyp.in/*`
   - `https://*.kittyp.in/*`
   - Staging host(s), e.g. `https://staging.kittyp.in/*`
6. **API restrictions** → **Restrict key** → enable only what the web app needs, typically:
   - Identity Toolkit API
   - Token Service API
   - Firebase Installations API
   - FCM Registration API (if used from web)
7. Save. Wait 1–5 minutes. Verify login/FCM still works from allowed origins; confirm a random origin fails.

### B. Maps JavaScript / Places (if a browser Maps key is used on FE)
1. Same **Credentials** page → Maps browser key (or dedicated key).
2. **HTTP referrers** as above.
3. **API restrictions**: Maps JavaScript API, Places API (whichever the FE calls).
4. Prefer **not** using an unrestricted server key in Vite.

### C. Backend Google/Maps key (`GOOGLE_MAPS_API_KEY` / `GOOGLE_API_KEY`)
1. Create a **separate** key from the browser key.
2. **Application restrictions** → **IP addresses** → NAT/egress IPs of BE (Railway/AWS/static office IP).
3. Restrict to Places/Geocoding/Weather APIs the BE actually calls.
4. Never put this key in `VITE_*`.

### D. Firebase service account
- Keep JSON only in `FIREBASE_SERVICE_ACCOUNT` (BE `.env`).
- If it was ever in git or chat: **rotate** (Google Cloud IAM → Service accounts → Keys → Add key / delete old).

---

## 3. Key rotation checklist (priority order, minimal downtime)

Do **read-only dual-run** where the product supports old+new, then cut over, then revoke old.

| Pri | Asset | Steps (zero/near-zero downtime) | Validate | Revoke old |
|-----|--------|----------------------------------|----------|------------|
| P0 | **Firebase service account** | Create new key → set `FIREBASE_SERVICE_ACCOUNT` on BE staging → deploy BE → smoke push/login → prod BE | Send test FCM; admin SDK call | Delete old key in IAM |
| P0 | **JWT_SECRET / APP_CRYPTO_SECRET** | Schedule short maintenance or accept forced re-login: set new secrets on all BE instances **together** → rolling restart | Login issues new JWT; encrypted fields still decrypt (if crypto secret changes, migrate or keep old crypto secret) | Remove old JWT from secret manager |
| P0 | **DB password** | Create new DB role/password → update `SPRING_DATASOURCE_PASSWORD` on a single canary → full fleet → keep old role until healthy | Health `/actuator/health` DB UP; login | `ALTER USER … PASSWORD` drop old / rotate role |
| P0 | **Razorpay key secret + webhook secret** | Dashboard: generate new secret / webhook secret → update BE env (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) → deploy BE → update FE `VITE_RAZORPAY_KEY_ID` only if Key Id changed → redeploy FE | Test payment + webhook delivery | Disable old key in Razorpay |
| P1 | **AWS access keys** | IAM: new access key on same user/role → set env on BE → deploy → S3 upload/download smoke → disable old key (not delete yet) | Invoice/user image upload | Delete old access key after 24–48h |
| P1 | **Zoho/Zepto API key** | Issue new send key → `ZOHO_API_KEY` → deploy BE → send test OTP email | OTP/mail received from `noreply@…` | Revoke old Zepto key |
| P1 | **Google API / Maps keys** | New restricted keys (referrer vs IP as above) → update FE/BE env → deploy → Places/Maps smoke → delete old unrestricted key | Signup location autocomplete; BE Places | Delete old key |
| P2 | **SMS gateway password** | Change gateway creds → `SMS_USERNAME`/`SMS_PASSWORD` → deploy → phone OTP | SMS or email failover still works | Invalidate old gateway user |
| P2 | **Shiprocket password** | Reset in Shiprocket → update BE → deploy → auth token call | Create shipment dry-run | — |
| P2 | **WhatsApp token / Meta app secret** | Meta: refresh system user token / app secret → update BE → deploy → send template | WhatsApp test message | Invalidate old token |
| P2 | **ADMIN_BOOTSTRAP_SECRET / master TOTP** | Set new values in secret manager → deploy → confirm bootstrap/TOTP paths | Admin bootstrap & TOTP fallback | Remove old from vault |

### Rotation rules
1. **Never** commit new secrets; use `.env` locally and your host’s secret store in prod.
2. Change **FE Key Id** and **BE Key Secret** in the same release window if Razorpay regenerates the pair.
3. After JWT rotation, expect existing sessions to fail → communicate re-login.
4. Prefer **separate** browser vs server Google keys before locking referrers/IPs.
5. Keep an incident note: what was rotated, when, by whom (no secret values in the note).
