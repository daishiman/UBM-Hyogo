#!/usr/bin/env bash
# 1Password CLI (`op`) と `.env` が揃っていれば `op run` でラップ実行、
# 揃っていなければそのまま実行する（CI などで環境変数を別経路で注入する想定）。
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 64
fi

ENV_FILE="${ENV_FILE:-./.env}"

if command -v op >/dev/null 2>&1 && [ -f "$ENV_FILE" ]; then
  exec op run --env-file="$ENV_FILE" -- "$@"
else
  exec "$@"
fi
