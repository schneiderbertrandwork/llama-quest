#!/usr/bin/env bash
set -e

# In CI: Metro is pre-started before emulator boot (see e2e-android.yml).
# Bundle assembles during the ~14 min emulator boot, so it is ready (or nearly
# ready) by the time this script runs. Detect and reuse the running instance.
# In local runs: Metro is not pre-started, so start it here.
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

# Wait for the bundle to finish assembling. In CI, Metro has already been
# running for ~14 min (the emulator boot duration), so the wait is short.
# 1200s ceiling handles the case where assembly isn't done yet.
echo "Waiting for Metro bundle to be ready..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  -o /dev/null --max-time 1200 \
  && echo "Bundle ready" \
  || echo "WARNING: bundle not ready after 20 min — proceeding (testTimeout: 1200000 is the fallback)"

# Run Detox E2E tests.
npx detox test -c android.device.debug --headless --record-logs failing
