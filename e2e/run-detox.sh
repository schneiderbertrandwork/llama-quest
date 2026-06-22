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

# Run Detox E2E tests.
# expo-dev-client requests the bundle from Metro when launchApp() is called.
# With a warm Metro transformer cache the bundle assembles in <120s — well within
# testTimeout: 300000 (5 min). Do NOT pre-download the bundle here: doing so during
# emulator boot exhausts the swiftshader GPU ColorBuffer pool and crashes all launches.
npx detox test -c android.device.debug --headless --record-logs failing
