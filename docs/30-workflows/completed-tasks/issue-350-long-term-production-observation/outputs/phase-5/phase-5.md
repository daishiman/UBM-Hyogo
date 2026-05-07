# Phase 5 — 詳細設計（シグネチャ / I/O / スキーマ）

**[実装区分: 実装仕様書]**

## 1. workflow YAML 詳細

### 1.1 ファイル: `.github/workflows/post-release-observation-reminder.yml`

```yaml
name: post-release-observation-reminder

on:
  schedule:
    - cron: '0 9 * * *'  # daily 09:00 UTC
  workflow_dispatch:
    inputs:
      release_date:
        description: 'Release date (YYYY-MM-DD). Empty = auto-detect latest production release.'
        required: false
        type: string
      offset_days:
        description: 'Offset (7 or 30). Empty = compute both.'
        required: false
        type: choice
        options: ['', '7', '30']

permissions:
  issues: write
  contents: read

concurrency:
  group: post-release-obs-reminder
  cancel-in-progress: false

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Resolve release date and offset
        id: resolve
        env:
          INPUT_RELEASE_DATE: ${{ inputs.release_date }}
          INPUT_OFFSET_DAYS: ${{ inputs.offset_days }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/observation/create-reminder-issue.sh --resolve-only

      - name: Create reminder issue
        if: steps.resolve.outputs.should_remind == 'true'
        env:
          RELEASE_DATE: ${{ steps.resolve.outputs.release_date }}
          OFFSET: ${{ steps.resolve.outputs.offset }}
          TARGET_DATE: ${{ steps.resolve.outputs.target_date }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash scripts/observation/create-reminder-issue.sh --create
```

## 2. shell 詳細

### 2.1 ファイル: `scripts/observation/create-reminder-issue.sh`

```sh
#!/usr/bin/env bash
# 役割: D+7 / D+30 production observation reminder Issue を起票する
# 使用: 
#   --resolve-only : 起票判定のみ。$GITHUB_OUTPUT に should_remind/release_date/offset/target_date
#   --create       : 冪等チェック + gh issue create
#   --dry-run      : create と同じ計算 + Issue body を stdout 出力（実際の起票なし）

set -euo pipefail

MODE="${1:-}"
REPO="daishiman/UBM-Hyogo"
TEMPLATE_PATH="$(dirname "$0")/reminder-issue-template.md"

resolve_release_date() {
  if [ -n "${INPUT_RELEASE_DATE:-}" ]; then
    echo "$INPUT_RELEASE_DATE"
    return
  fi
  local release_json
  release_json="$(gh api "repos/${REPO}/releases/latest" 2>/dev/null || true)"
  RELEASE_JSON="$release_json" python3 - <<'PY' | cut -d'T' -f1
import json
import os

try:
    payload = json.loads(os.environ.get("RELEASE_JSON", ""))
except json.JSONDecodeError:
    raise SystemExit(0)

published_at = payload.get("published_at") or ""
if published_at:
    print(published_at)
PY
}

days_diff() {
  python3 -c "import sys, datetime; \
    a=datetime.date.fromisoformat(sys.argv[1]); \
    b=datetime.date.fromisoformat(sys.argv[2]); \
    print((b-a).days)" "$1" "$2"
}

today_iso() { date -u +%Y-%m-%d; }

mode_resolve_only() {
  local rel today diff offset target_date
  rel="$(resolve_release_date)"
  if [ -z "$rel" ]; then
    echo "should_remind=false" >>"$GITHUB_OUTPUT"; return 0
  fi
  today="$(today_iso)"
  diff="$(days_diff "$rel" "$today")"

  if [ -n "${INPUT_OFFSET_DAYS:-}" ]; then
    offset="$INPUT_OFFSET_DAYS"
    if [ "$offset" != "7" ] && [ "$offset" != "30" ]; then
      echo "should_remind=false" >>"$GITHUB_OUTPUT"; return 0
    fi
    target_date="$(python3 -c "import datetime,sys; d=datetime.date.fromisoformat(sys.argv[1]); print((d+datetime.timedelta(days=int(sys.argv[2]))).isoformat())" "$rel" "$offset")"
  else
    case "$diff" in
      7|30) offset="$diff" ;;
      *) echo "should_remind=false" >>"$GITHUB_OUTPUT"; return 0 ;;
    esac
    target_date="$today"
  fi

  {
    echo "should_remind=true"
    echo "release_date=$rel"
    echo "offset=$offset"
    echo "target_date=$target_date"
  } >>"$GITHUB_OUTPUT"
}

render_body() {
  sed \
    -e "s|{{RELEASE_DATE}}|${RELEASE_DATE}|g" \
    -e "s|{{OFFSET}}|${OFFSET}|g" \
    -e "s|{{TARGET_DATE}}|${TARGET_DATE}|g" \
    "$TEMPLATE_PATH"
}

mode_create() {
  local title body existing
  title="[D+${OFFSET} observation] post-release ${RELEASE_DATE}"
  existing="$(gh issue list --repo "$REPO" --state open \
    --search "in:title \"$title\"" --json number --jq 'length')"
  if [ "$existing" -gt 0 ]; then
    echo "Reminder already exists: $title (skip, idempotent)"
    return 0
  fi
  body="$(render_body)"
  gh issue create --repo "$REPO" --title "$title" --body "$body" \
    --label "priority:medium"
}

mode_dry_run() {
  : "${RELEASE_DATE:?}" "${OFFSET:?}" "${TARGET_DATE:?}"
  echo "=== title ==="
  echo "[D+${OFFSET} observation] post-release ${RELEASE_DATE}"
  echo "=== body ==="
  render_body
}

case "$MODE" in
  --resolve-only) mode_resolve_only ;;
  --create)       mode_create ;;
  --dry-run)      mode_dry_run ;;
  *) echo "usage: $0 --resolve-only|--create|--dry-run" >&2; exit 2 ;;
esac
```

**入力**:
- env: `INPUT_RELEASE_DATE` / `INPUT_OFFSET_DAYS` / `RELEASE_DATE` / `OFFSET` / `TARGET_DATE` / `GH_TOKEN`

**出力**:
- `--resolve-only`: `$GITHUB_OUTPUT` に `should_remind` / `release_date` / `offset` / `target_date`
- `--create`: GitHub Issue 1 件（または冪等 skip）
- `--dry-run`: stdout に title + body

**副作用**:
- `--create` のみ — `gh issue create`（write）

## 3. テンプレ詳細

### 3.1 ファイル: `scripts/observation/reminder-issue-template.md`

```markdown
# [D+{{OFFSET}} observation] post-release {{RELEASE_DATE}}

**観測対象日**: {{TARGET_DATE}} (release {{RELEASE_DATE}} + {{OFFSET}} days)

## 1. 観測指標

| 指標 | 閾値 | 実測 | 判定 | evidence |
| --- | --- | --- | --- | --- |
| req/day (API total) | < 100k | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |
| D1 reads/day | < 5M | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |
| D1 writes/day | < 100k | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |
| error rate (5xx) p95 | < 1% | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |
| cron success rate (3 cron) | 100% (D+7) / ≥99% (D+30) | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |
| authz smoke (admin/member 403) | PASS | _ | ☐ PASS / ☐ FAIL | _ |
| free plan headroom | ≥60% (D+7) / ≥50% (D+30) | _ | ☐ PASS / ☐ WARN / ☐ CRIT | _ |

## 2. 取得手順

`docs/runbooks/post-release-long-term-observation.md` §3 を参照。

## 3. 判定 / 異常時分岐

- **WARN** (閾値 80%到達): 本 Issue にコメント追記し継続観測
- **CRITICAL** (閾値超過): runbook §4 → rollback 判断
- **silent regression** (authz fail / cron 0%): 即時 rollback + postmortem

## 4. 完了条件

- [ ] 全指標欄が記入済
- [ ] 判定が確定
- [ ] CRITICAL の場合 rollback / postmortem Issue がリンク済
- [ ] runbook §7「履歴」に本 Issue を追記済

## 5. 参照

- runbook: `docs/runbooks/post-release-long-term-observation.md`
- 元仕様書: `docs/30-workflows/issue-350-long-term-production-observation/`
- 24h baseline: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/`
```

## 4. runbook スキーマ

`docs/runbooks/post-release-long-term-observation.md` の H2 構成を以下に固定:

1. `## 1. 目的と適用範囲`
2. `## 2. 観測指標と閾値`（Phase 1 表をそのまま転記）
3. `## 3. 取得手順`
4. `## 4. 異常時分岐（WARN / CRITICAL / silent）`
5. `## 5. rollback 連携`（09c runbook へのリンク）
6. `## 6. postmortem テンプレ`
7. `## 7. 履歴`（observation Issue 履歴 — 表）

## 5. SSOT スキーマ

`.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md`:

```markdown
---
topic: post-release-long-term-observation
applies_to: operations
related_workflows:
  - 09c-serial-production-deploy-and-post-release-verification
  - issue-350-long-term-production-observation
runbook_canonical: docs/runbooks/post-release-long-term-observation.md
last_updated: 2026-05-06
---

# Post-Release Long-Term Observation (D+7 / D+30)

## 概要
（200 字以内）

## 正本 runbook
[docs/runbooks/post-release-long-term-observation.md](../../../../docs/runbooks/post-release-long-term-observation.md)

## 関連
- 24h baseline: 09c
- reminder workflow: `.github/workflows/post-release-observation-reminder.yml`
```

## 6. 完了条件

- [ ] workflow YAML / shell / template / runbook / SSOT の全シグネチャ確定
- [ ] 入出力 / 副作用が明示済
- [ ] Phase 7 がそのままコピペで実装に着手できる粒度
