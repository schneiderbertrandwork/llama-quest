#!/usr/bin/env bash
set -e

# Start Metro bundler (CI=1 disables watch mode)
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &

# Wait for Metro to be ready (up to 90 seconds)
for i in $(seq 1 45); do
  curl -sf http://localhost:8081/status > /dev/null 2>&1 && echo "Metro ready after ${i} attempts" && break
  sleep 2
done

# Pre-warm the Metro bundle before Detox launches the app.
# Without this, Metro compiles the bundle lazily on first app launch (~3-5 min),
# which causes device.launchApp() to exceed setupTimeout on a slow CI emulator.
echo "Pre-warming Metro bundle (may take 3-5 min on first request)..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  -o /dev/null --max-time 360 \
  && echo "Bundle pre-warm complete" \
  || echo "Bundle pre-warm timed out or failed (will proceed anyway)"

# Run Detox E2E tests
npx detox test -c android.device.debug --headless --record-logs failing
