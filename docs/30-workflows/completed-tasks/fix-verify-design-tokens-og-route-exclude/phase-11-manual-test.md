[実装区分: 実装仕様書]

# Phase 11: 手動テスト

## 1. 事前準備

```bash
mise exec -- pnpm install
```

ローカル dev server 起動は不要（本タスクは CI 検査スクリプトの修正のみ）。

## 2. 手動テストケース

### TC-1: ローカル `pnpm verify:tokens` exit 0

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-104618-wt-18
mise exec -- pnpm verify:tokens 2>&1 | tee outputs/phase-11/verify-tokens-local.txt
echo "exit=$?" >> outputs/phase-11/verify-tokens-local.txt
```

期待:
- exit code `0`
- 出力末尾に `exit=0`
- `opengraph-image/route.tsx` に関する drift 行が出力されない

### TC-2: GitHub Actions `verify-design-tokens` job green

PR push 後、GitHub Actions ページで該当 job が green であることを確認:

```bash
gh pr checks <PR_NUMBER> --watch | tee outputs/phase-11/gh-pr-checks.txt
```

期待:
- `verify-design-tokens / verify-design-tokens` が `pass`
- `verify-indexes-up-to-date` / `verify-gate-metadata` / `verify-phase12-compliance` 等が regression なく pass

### TC-3: drift 検出能力の維持（regression canary）

```bash
# 一時的にカナリアファイルを作成
echo 'export const _drift = "#ff0000";' > apps/web/src/lib/_drift_canary.ts
mise exec -- pnpm verify:tokens 2>&1 | tee outputs/phase-11/drift-canary-fail.txt
echo "exit=$?" >> outputs/phase-11/drift-canary-fail.txt
# クリーンアップ（必須）
rm apps/web/src/lib/_drift_canary.ts
```

期待:
- exit code `1`（drift が検出されている = bypass されていない）
- `_drift_canary.ts` が drift 行に列挙される

### TC-4: exclude 対象の境界確認（path 誤マッチ防止）

```bash
# route.tsx が opengraph-image 配下でないファイルでは exclude されないことを確認
mkdir -p apps/web/app/_canary_not_og
echo 'export const _drift = "#ff0000";' > apps/web/app/_canary_not_og/route.tsx
mise exec -- pnpm verify:tokens 2>&1 | tee outputs/phase-11/canary-non-og-route.txt
echo "exit=$?" >> outputs/phase-11/canary-non-og-route.txt
rm -rf apps/web/app/_canary_not_og
```

期待:
- exit code `1`（`/_canary_not_og/route.tsx` は exclude 対象外なので fail する）

## 3. 証跡保存

`outputs/phase-11/` 配下に以下を保存:

```
outputs/phase-11/
  ├─ verify-tokens-local.txt       # TC-1 の terminal output
  ├─ gh-pr-checks.txt              # TC-2 の gh pr checks output
  ├─ drift-canary-fail.txt         # TC-3 の drift 検出確認
  └─ canary-non-og-route.txt       # TC-4 の境界確認
```

スクリーンショット（PNG/JPG）は本タスクでは生成しない（CI 検査スクリプト修正のため `visual_category: NON_VISUAL`）。

## 4. Phase 11 evidence inventory

| ID | 観点 | 期待 | 実測 | 証跡パス |
|----|------|------|------|---------|
| TC-1 | ローカル `pnpm verify:tokens` | exit 0 | （実行時記入） | `outputs/phase-11/verify-tokens-local.txt` |
| TC-2 | CI `verify-design-tokens` | green | PR 作成後に実行（user-gated） | `outputs/phase-11/gh-pr-checks.txt` |
| TC-3 | drift canary | exit 1 / canary 検出 | exit 1 / `_drift_canary.ts` 検出 | `outputs/phase-11/drift-canary-fail.txt` |
| TC-4 | 境界誤マッチなし | exit 1 / non-og route 検出 | exit 1 / `_canary_not_og/route.tsx` 検出 | `outputs/phase-11/canary-non-og-route.txt` |
| TC-5 | focused Vitest | 13 tests pass | 13 tests pass | `outputs/phase-11/vitest-verify-design-tokens.txt` |

## 5. NG 時の対応

| 症状 | 切り分け |
|---|---|
| TC-1 が exit 1 で `opengraph-image/route.tsx` が drift 行に残る | `scripts/verify-design-tokens.ts` line 61-66 への正規表現追加漏れ（`/\/opengraph-image\/route\.tsx$/` の `/` エスケープ確認） |
| TC-3 が exit 0 になる | exclude 正規表現が広域すぎる（`.tsx$` のみで終わっていないか確認） |
| TC-4 が exit 0 になる | exclude 正規表現が `route.tsx$` 単独で終わっていないか確認（path prefix `/<name>/` 必須） |
| TC-2 のみ fail（ローカル pass） | CI runner 上の cwd / `pnpm` 版数差異。`scripts/verify-design-tokens.ts` の I/O が CI 環境で異なる可能性を確認 |
