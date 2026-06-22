#!/usr/bin/env bash
set -e

# In CI: Metro is pre-started before emulator boot (see e2e-android.yml).
# Detect and reuse the running instance; fall back to starting it for local runs.
if curl -sf http://localhost:8081/status > /dev/null 2>&1; then
  echo "Metro already running (pre-started before emulator boot)"
else
  echo "Starting Metro bundler..."
  CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &
  for i in $(seq 1 45); do
    curl -sf http://localhost:8081/status > /dev/null 2>&1 \
      && echo "Metro ready after ${i} attempts" && break
    sleep 2
  done
fi

# Forward Metro port from emulator to host via ADB reverse tunnel.
adb reverse tcp:8081 tcp:8081
echo "ADB reverse: emulator localhost:8081 → host:8081"

# Wait for the bundle to finish assembling. In CI, the background bundle request
# started in the "Start Metro bundler" step means Metro has been assembling since
# before emulator boot (~16 min head start). Max 40 min from script start.
echo "Waiting for Metro bundle to be ready..."
BUNDLE_STATUS=$(curl -s \
  -o /dev/null \
  -w "%{http_code}" \
  "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  --max-time 2400) || BUNDLE_STATUS="CURL_ERROR"
echo "Metro bundle HTTP status: ${BUNDLE_STATUS}"

if [ "${BUNDLE_STATUS}" = "200" ]; then
  echo "Bundle ready"
else
  echo "WARNING: unexpected bundle status (${BUNDLE_STATUS}) — diagnostic info:"
  echo "--- Metro /status ---"
  curl -sv http://localhost:8081/status 2>&1 | tail -10 || true
  echo "--- Metro /index.bundle error (first 300 chars) ---"
  curl -s --max-time 10 \
    "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
    2>&1 | head -c 300 || true
  echo "--- (proceeding; testTimeout: 1200000 is the fallback) ---"
fi

# Run Detox E2E tests.
npx detox test -c android.device.debug --headless --record-logs failing
