#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPEN_NEXT_DIR="$ROOT_DIR/apps/web/.open-next"
WORKER_FILE="${1:-}"
LIMIT_KIB="${WORKER_SIZE_LIMIT_KIB:-3072}"
WARN_KIB="${WORKER_SIZE_WARN_KIB:-2800}"

if [ -n "${WORKER_SIZE_OVERRIDE_KIB:-}" ]; then
  gzip_kib="$WORKER_SIZE_OVERRIDE_KIB"
  echo "check-worker-size: worker=size-override gzip=${gzip_kib}KiB limit=${LIMIT_KIB}KiB warn=${WARN_KIB}KiB"
else
  worker_files=()

  if [ -n "$WORKER_FILE" ]; then
    if [ ! -f "$WORKER_FILE" ]; then
      echo "check-worker-size: FAIL: worker bundle not found: $WORKER_FILE" >&2
      exit 1
    fi
    worker_files+=("$WORKER_FILE")
  else
    if [ ! -d "$OPEN_NEXT_DIR" ]; then
      echo "check-worker-size: FAIL: OpenNext output not found: $OPEN_NEXT_DIR" >&2
      echo "Run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare" >&2
      exit 1
    fi

    while IFS= read -r file; do
      worker_files+=("$file")
    done < <(
      find "$OPEN_NEXT_DIR" -type f \( \
        -name 'worker.js' -o \
        -path '*/server-functions/*/handler.mjs' -o \
        -path '*/middleware/handler.mjs' \
      \) | sort
    )
  fi

  if [ "${#worker_files[@]}" -eq 0 ]; then
    echo "check-worker-size: FAIL: worker bundle files not found under $OPEN_NEXT_DIR" >&2
    echo "Run: mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare" >&2
    exit 1
  fi

  gzip_bytes=0
  for file in "${worker_files[@]}"; do
    file_gzip_bytes="$(gzip -c "$file" | wc -c | tr -d '[:space:]')"
    gzip_bytes="$((gzip_bytes + file_gzip_bytes))"
  done
  gzip_kib="$(( (gzip_bytes + 1023) / 1024 ))"

  echo "check-worker-size: files=${#worker_files[@]} gzip=${gzip_kib}KiB limit=${LIMIT_KIB}KiB warn=${WARN_KIB}KiB"
fi

if [ "$gzip_kib" -gt "$LIMIT_KIB" ]; then
  echo "check-worker-size: FAIL: gzip size exceeds Cloudflare Workers Free limit" >&2
  exit 1
fi

if [ "$gzip_kib" -gt "$WARN_KIB" ]; then
  echo "check-worker-size: WARN: gzip size is within limit but above warning threshold" >&2
fi
