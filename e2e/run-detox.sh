#!/usr/bin/env bash
set -e

# Start Metro bundler (CI=1 disables watch mode)
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &

# Wait for Metro to be ready (up to 90 seconds)
for i in $(seq 1 45); do
  curl -sf http://localhost:8081/status > /dev/null 2>&1 && echo "Metro ready after ${i} attempts" && break
  sleep 2
done

# Forward Metro port 8081 from the emulator to the host via ADB reverse tunnel.
# Without this, expo-dev-client in the emulator would use 10.0.2.2:8081 which
# may be firewalled on CI. With this, the app uses localhost:8081 which tunnels
# reliably to the host's Metro server.
adb reverse tcp:8081 tcp:8081
echo "ADB reverse: emulator localhost:8081 → host:8081"

# Pre-warm the Metro JS bundle (first compile takes 6-10 min on a 2-CPU CI runner).
# The URL /index.bundle is correct for Expo managed apps — curl returns non-zero
# immediately on 404 (with -f), so a timeout here means it IS compiling.
# When Detox launches the app via deep link, Metro serves the cached bundle instantly.
echo "Pre-warming Metro bundle — this takes 6-10 min on CI (cold transformer cache)..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" \
  -o /dev/null --max-time 600 \
  && echo "Bundle pre-warm complete" \
  || echo "WARNING: bundle pre-warm exceeded 600s — proceeding, but app launch may be slow"

# Run Detox E2E tests.
# Tests use exp+llama-quest:// deep link to auto-connect expo-dev-client to Metro.
npx detox test -c android.device.debug --headless --record-logs failing
