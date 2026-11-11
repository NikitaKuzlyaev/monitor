#!/usr/bin/env bash
# wait-for host port timeout_seconds
set -e

HOST="$1"
PORT="$2"
TIMEOUT="${3:-60}"

echo "Waiting for $HOST:$PORT up to $TIMEOUT seconds..."
for i in $(seq 1 "$TIMEOUT"); do
  if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
    echo "$HOST:$PORT is available"
    exit 0
  fi
  sleep 1
done

echo "Timeout waiting for $HOST:$PORT"
exit 1
