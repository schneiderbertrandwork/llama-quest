#!/usr/bin/env bash
set -e

# Start Metro bundler (CI=1 disables watch mode)
CI=1 EXPO_NO_TELEMETRY=1 npx expo start --port 8081 &

# Wait for Metro to be ready (up to 90 seconds)
for i in $(seq 1 45); do
  curl -sf http://localhost:8081/status > /dev/null 2>&1 && echo "Metro ready after ${i} attempts" && break
  sleep 2
done

# Run Detox E2E tests
npx detox test -c android.device.debug --headless --record-logs failing
