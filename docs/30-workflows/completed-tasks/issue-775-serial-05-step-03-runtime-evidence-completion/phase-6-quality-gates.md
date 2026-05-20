# Phase 6: 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| Gate | 内容 | コマンド | PASS 条件 |
|------|------|---------|----------|
| G1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G2 | lint | `mise exec -- pnpm lint` | exit 0 |
| G3 | unit/contract test (差分範囲) | `mise exec -- pnpm test apps/api --run -- schema` | green |
| G4 | Playwright spec | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --config=playwright.admin-schema-diff.config.ts` | 11 passed |
| G5 | grep gate (local endpoint / HEX 直書き / process.env) | 下記 §2 スクリプト | changed production files introduce 0 new violations; pre-existing fallback baseline is explicitly recorded |
| G6 | 不変ファイル diff freeze | Phase 5 §3 スクリプト | 0 line |
| G7 | PNG サイズ予算 | 下記 §3 スクリプト | 各 ≤ 500KB |
| G8 | storageState 未 commit | `git ls-files apps/web/playwright/.auth/admin.json` | 出力 0 行 |
| G9 | pre-flight gate | `bash scripts/verify-pr-ready.sh` | exit 0 |

## 2. grep gate

```bash
ROOT=docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence
mkdir -p "$ROOT"
( grep -rnE 'bg-\[#|text-\[#|127\.0\.0\.1:|process\.env\.' \
    apps/web/app/\(admin\)/admin/schema \
    apps/web/src/lib/admin/server-fetch.ts \
    apps/web/src/components/admin/SchemaDiffPanel.tsx || true ) \
  2>&1 | tee "$ROOT/grep-gate.log"
if grep -v 'apps/web/src/lib/admin/server-fetch.ts:12:const FALLBACK_INTERNAL_API' "$ROOT/grep-gate.log" | grep -q ':'; then
  echo FAIL
  exit 1
fi
echo "Known baseline allowed: apps/web/src/lib/admin/server-fetch.ts FALLBACK_INTERNAL_API existed before this recovery workflow."
echo PASS
```

> 新規 spec 側 (`playwright/tests/visual/admin-schema-diff.spec.ts`) は test code のため grep gate 対象外（`process.env.ADMIN_SCHEMA_DIFF_*` 参照は許容）。

## 3. PNG サイズ予算

```bash
DIR=docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots
find "$DIR" -maxdepth 1 -name '*.png' -size +500k -print | tee /tmp/oversize.log
test ! -s /tmp/oversize.log && echo PASS || { echo "FAIL: oversize PNG"; exit 1; }
```

## 4. ゲート実行順序

```
G1, G2, G3 (parallel)
  └─→ G4 (Playwright, requires local stack)
        └─→ G5, G6, G7, G8 (parallel post-evidence)
              └─→ G9 (pre-flight aggregate)
```

## 5. 失敗時の取り扱い

| Gate | 失敗時の即時アクション |
|------|---------------------|
| G1/G2/G3 | 修正後再実行（実装側変更は禁止 — spec/seed/config のみ） |
| G4 | Phase 5 §5 失敗パターン表に従い切り分け |
| G5 | 該当ファイルから違反箇所削除（実装変更不可なら spec/seed 側で吸収） |
| G6 | 不変ファイル変更を `git checkout dev -- <path>` で復元 |
| G7 | PNG を pngquant 等で圧縮（visual diff が出ないことを再確認） |
| G8 | `git rm --cached` で除外し `.gitignore` を見直し |
| G9 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 |
