#!/usr/bin/env bash
# visual-baseline-status.sh — Playwright visual-full baseline の鮮度を診断する。
#
# .baseline-meta.json の captured_at_commit_sha と現在 HEAD を比較し、
# rendering_relevant_paths に該当する変更が baseline 以降に発生していれば
# baseline は stale と判定する。stale の場合 exit 1 で警告を返す。
#
# 用途:
#   - ローカル開発者が PR を作る前に baseline 鮮度を確認する
#   - CI workflow から呼び出し、視覚回帰失敗の根因（regression か staleness か）を切り分ける
#
# 出力例:
#   [visual-baseline] baseline commit: 80e0843d... (2026-05-16T20:42:33+09:00)
#   [visual-baseline] STALE: 38 rendering-relevant files changed since baseline
#   [visual-baseline] refresh: gh workflow run playwright-visual-baseline-update.yml -f reason="..." -r <branch>

set -euo pipefail

META_PATH="${VISUAL_BASELINE_META_PATH:-apps/web/playwright/tests/visual-full/.baseline-meta.json}"

if [ ! -f "$META_PATH" ]; then
  echo "[visual-baseline] ERROR: $META_PATH が見つかりません。baseline 未捕捉の可能性あり。" >&2
  exit 2
fi

CAPTURED_SHA="$(python3 -c "import json,sys;print(json.load(open('$META_PATH'))['captured_at_commit_sha'])")"
CAPTURED_AT="$(python3 -c "import json,sys;print(json.load(open('$META_PATH'))['captured_at'])")"
PATHS_JSON="$(python3 -c "import json;print(json.dumps(json.load(open('$META_PATH'))['rendering_relevant_paths']))")"

if ! git rev-parse --verify "$CAPTURED_SHA" >/dev/null 2>&1; then
  echo "[visual-baseline] WARN: captured commit $CAPTURED_SHA がローカルに存在しません。git fetch を試してください。" >&2
  exit 3
fi

PATHS_NL="$(python3 -c "import json;print('\n'.join(json.loads('''$PATHS_JSON''')))")"

# shellcheck disable=SC2086
CHANGED=$(printf '%s\n' "$PATHS_NL" | xargs -I{} git diff --name-only "$CAPTURED_SHA" HEAD -- "{}" 2>/dev/null | sort -u | grep -c . || true)

printf "[visual-baseline] baseline commit: %s (%s)\n" "${CAPTURED_SHA:0:10}" "$CAPTURED_AT"

if [ "$CHANGED" -eq 0 ]; then
  echo "[visual-baseline] FRESH: rendering-relevant files に baseline 以降の変更なし"
  exit 0
fi

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || echo HEAD)"
printf "[visual-baseline] STALE: %s rendering-relevant files changed since baseline\n" "$CHANGED"
echo "[visual-baseline] refresh command:"
printf "  gh workflow run playwright-visual-baseline-update.yml -f reason=\"sync after dev merge\" -r %s\n" "$CURRENT_BRANCH"
echo "[visual-baseline] approval: GitHub UI で 'visual-baseline-approval' environment を承認すると baseline 更新 PR が自動作成される。"

if [ "${VISUAL_BASELINE_STATUS_FAIL_ON_STALE:-1}" = "1" ]; then
  exit 1
fi
exit 0
