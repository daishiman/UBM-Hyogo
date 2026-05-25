**[実装区分: 実装仕様書]**

# Phase 5: 実装 / 実装ステップ

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| 入力 | Phase 1-4 |

## 1. 事前確認（実装着手前）

| 項目 | コマンド | 期待 |
|---|---|---|
| 現在 branch | `git branch --show-current` | feature branch（dev / main では着手しない） |
| origin/dev 差分 | `git log origin/dev..HEAD --oneline` | 本 task 関連 commit のみ・無関係 diff を含まない |
| Node version | `mise exec -- node -v` | `v24.15.0` |
| pnpm version | `mise exec -- pnpm -v` | `10.33.2` |
| 既存 local PNG | `ls docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/` | 8 PNG 確認 |
| staging session 戦略 | `apps/web/playwright/tests/login-smoke.spec.ts` の state setup を grep し、staging で同等のモック手段（fixture cookie / mock route / dev-only header）が利用可能かを確認 | state ごとの再現手段が staging で動作することを Phase 5 ステップ 4 着手前に判明させる |

## 2. ステップ 1: `login-smoke.spec.ts` の `EVIDENCE_DIR` env-override 化

### 対象

`apps/web/playwright/tests/login-smoke.spec.ts`

### diff（最小差分）

```diff
- const EVIDENCE_DIR = resolve(
-   process.cwd(),
-   "../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots",
- );
+ const EVIDENCE_DIR = process.env.PLAYWRIGHT_EVIDENCE_DIR
+   ? resolve(process.env.PLAYWRIGHT_EVIDENCE_DIR)
+   : resolve(
+       process.cwd(),
+       "../../docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots",
+     );
```

### 検証

```bash
cd apps/web
mise exec -- pnpm exec playwright test playwright/tests/login-smoke.spec.ts \
  --grep 'renders LoginCard|captures mobile input' \
  --reporter=line
# 期待: 既存 local 配下に PNG 再生成、exit 0
```

## 3. ステップ 2: `scripts/run-login-staging-smoke.sh` 新規作成

### 対象

`scripts/run-login-staging-smoke.sh` (new file, mode 755)

### 完成形コード

```bash
#!/usr/bin/env bash
# Usage:
#   bash scripts/run-login-staging-smoke.sh <staging-base-url>
#   PLAYWRIGHT_STAGING_BASE_URL=<url> bash scripts/run-login-staging-smoke.sh
#
# Runs apps/web playwright login-smoke against Cloudflare Workers staging,
# saving evidence PNGs into docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/
# outputs/phase-11/staging-screenshots/.

set -euo pipefail

STAGING_URL="${1:-${PLAYWRIGHT_STAGING_BASE_URL:-}}"
if [[ -z "$STAGING_URL" ]]; then
  {
    echo "ERROR: staging URL not provided"
    echo "Usage: bash scripts/run-login-staging-smoke.sh <staging-base-url>"
    echo "   or: PLAYWRIGHT_STAGING_BASE_URL=<url> bash scripts/run-login-staging-smoke.sh"
  } >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="../../docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"
mkdir -p "$REPO_ROOT/docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"

export PLAYWRIGHT_STAGING_BASE_URL="$STAGING_URL"
export PLAYWRIGHT_EVIDENCE_DIR="$EVIDENCE_DIR"
export PLAYWRIGHT_SKIP_WEB_SERVER=1

cd "$REPO_ROOT"
pnpm --dir apps/web exec playwright test \
  playwright/tests/login-smoke.spec.ts \
  --project=staging \
  --grep 'renders LoginCard|captures mobile input' \
  --reporter=line
```

### 検証

```bash
chmod +x scripts/run-login-staging-smoke.sh
shellcheck scripts/run-login-staging-smoke.sh
bash scripts/run-login-staging-smoke.sh   # 期待: exit 1 + usage
```

## 4. ステップ 3: staging deploy（user-gated）

```bash
# user 承認後に実行
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  2>&1 | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/staging-deploy.log
# 期待: exit 0 / "Deployed" 行を含む
```

## 5. ステップ 4: staging URL warm-up

```bash
STAGING_URL="https://ubm-hyogo-web-staging.<account>.workers.dev"   # 実値は user 提供
curl -sI "$STAGING_URL/login" | head -1
# 期待: HTTP/2 200 （cold start で 5xx の場合 30 秒 wait して再試行）
```

## 6. ステップ 5: staging smoke 実行（user-gated）

```bash
bash scripts/run-login-staging-smoke.sh "$STAGING_URL" 2>&1 \
  | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-smoke.log
# 期待: exit 0 / "7 passed" を含む
```

## 7. ステップ 6: evidence 検証

```bash
EVIDENCE="docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"

# count
test "$(find "$EVIDENCE" -name 'login-*.png' -type f | wc -l)" -eq 7
echo "count OK"

# size
test -z "$(find "$EVIDENCE" -name '*.png' -size +500k)"
echo "size OK"

# non-empty
for f in "$EVIDENCE"/*.png; do
  test -s "$f" || { echo "empty: $f" >&2; exit 1; }
done
echo "non-empty OK"
```

## 8. ステップ 7: local baseline との目視 diff

```bash
LOCAL="docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots"
STAGING="docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"

# pairing list
for f in "$STAGING"/login-*.png; do
  base="$(basename "$f")"
  echo "DIFF: $LOCAL/$base  <-->  $STAGING/$base"
done
```

各 pair を image viewer で並べ、構造的回帰（OKLch 色 / typography / spacing / a11y アウトライン）の差がないことを確認し、メモを `outputs/phase-11/evidence/visual-diff-note.md` に残す。

## 9. ステップ 8: 親 workflow consumed trace 反映

### 対象 1: `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md`

frontmatter / 状態行を以下に書き換え:

```
状態: consumed (issue-874-login-staging-visual-smoke へ統合)
canonical_workflow: docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/
```

### 対象 2: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md`

FU-LOGIN-003 行を以下のように consumed 表記に更新:

```
| FU-LOGIN-003 | staging visual smoke + evidence | consumed by issue-874-login-staging-visual-smoke (docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/) |
```

### 検証

```bash
rg -n 'FU-LOGIN-003' docs/30-workflows/
# 期待: 上記 2 ファイルが consumed 表記で hit、それ以外に live ref なし
```

## 10. ステップ 9: 同 wave skill 同期

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
# 期待: drift 0（変更がないか、本 task 由来の topic 行追記のみ）
```

## 11. 実装範囲外（明示）

- `playwright.config.ts` の改修
- 自動 pixel diff threshold 設定
- production smoke の追加
- 新規 `*.spec.ts` ファイル追加
- D1 / Auth.js handler / Google Form 仕様の変更

## 12. Phase 5 完了条件

- [x] spec 改修の最小 diff を確定
- [x] shell helper の完成形コードを確定
- [x] staging deploy / warm-up / smoke / evidence 検証 / 目視 diff / consumed trace / skill 同期の 9 ステップを step-by-step で書き下し
- [x] 各ステップに検証コマンドと期待値を付与
- [x] user-gated 操作（deploy / smoke 本実行）を明示

## 13. 次 Phase への引き継ぎ

Phase 6 では本 Phase の実装ステップに対して、(a) fail path（cold start / cookie 不整合 / shell quoting 漏れ）の補助テスト、(b) regression guard（既存 local 実行が崩れていないことの確認）、(c) `verify-pr-ready.sh` 連動の補助確認コマンドを追加する。
