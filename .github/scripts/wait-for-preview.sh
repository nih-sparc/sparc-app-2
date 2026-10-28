#!/usr/bin/env bash
# Waits for the Cypress preview server with a GET-based retry loop (the
# method pull_request_playwright.yml already uses reliably on this same
# runner), rather than cypress-io/github-action's default HEAD-based
# wait-on, which has been failing here with "Socket closed before the
# connection was established" for reasons we could not reproduce locally
# (tried on Windows and a real Linux kernel via WSL2 with an identical
# build - both worked fine). If it still fails, dump enough to diagnose it
# on the next occurrence instead of just "timed out".
set -u

url="${1:-http://localhost:3000}"
attempts="${2:-60}"

echo "Waiting for $url ($attempts attempts, 2s apart)"
for i in $(seq 1 "$attempts"); do
  if curl -sf -o /dev/null "$url"; then
    echo "Ready after $i attempt(s)"
    exit 0
  fi
  sleep 2
done

echo "::error::Server did not respond at $url after $attempts attempts"
echo "--- getent hosts localhost ---"
getent hosts localhost || true
echo "--- ip addr ---"
ip addr || true
echo "--- listening sockets ---"
ss -tlnp || true
echo "--- one more curl, verbose ---"
curl -v "$url" || true
exit 1
