**[実装区分: 実装仕様書]**

# Phase 9: 品質保証 / Gate-B 判定

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| Gate | Gate-B (implementation_review) |
| 入力 | Phase 5-8 |

## 1. 品質保証コマンド suite

| # | 項目 | コマンド | 期待 |
|---|---|---|---|
| 1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| 2 | lint | `mise exec -- pnpm lint` | exit 0 |
| 3 | shellcheck | `shellcheck scripts/run-login-staging-smoke.sh` | exit 0 / 0 finding |
| 4 | local 互換 (env なし) | `cd apps/web && mise exec -- pnpm exec playwright test playwright/tests/login-smoke.spec.ts --grep 'renders LoginCard\|captures mobile input' --reporter=line` | exit 0 / 7 passed / 親 workflow path に対象 7 PNG |
| 5 | shell usage 検証 | `bash scripts/run-login-staging-smoke.sh; echo $?` | exit 1 + stderr usage |
| 6 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | exit 0 |
| 7 | phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| 8 | indexes rebuild drift | `mise exec -- pnpm indexes:rebuild && git status .claude/skills/aiworkflow-requirements/indexes/` | drift 0 |
| 9 | pr-ready wrapper | `bash scripts/verify-pr-ready.sh` | exit 0 |
| 10 | staging smoke (user-gated) | Phase 11 で実施 | exit 0 / 7 PNG |

## 2. Gate-B verdict 早見

| 条件 | 判定根拠 |
|---|---|
| typecheck PASS | spec 差分は型安全（`process.env` 三項分岐は string \| undefined を考慮） |
| lint PASS | 差分量が極小、既存 lint rule に違反しない |
| shellcheck PASS | `set -euo pipefail` / quoted variables / `[[ ]]` / mkdir -p |
| local playwright PASS | staging-target grep 7 test で EVIDENCE_DIR の既定値 path を保持 |
| gate-metadata PASS | artifacts.json schema 準拠 |
| phase12-compliance PASS | `outputs/phase-12/phase12-task-spec-compliance-check.md` の canonical 9 headings + Phase 11 evidence 表 |
| indexes drift 0 | 本 task で skill 構造変更なし |

## 3. fail 時の対応マトリクス

| fail 種別 | 1 次対応 | 2 次対応 |
|---|---|---|
| typecheck fail | `EVIDENCE_DIR` 三項分岐の型整合を確認 | `resolve` の引数 narrowing を追加 |
| lint fail | `pnpm lint --fix` | 残違反のみ手修正 |
| shellcheck fail | quoting 漏れを修正 | `set` flags / `local` 利用 |
| local playwright fail | 既定値文字列の差分を確認 | local PNG path を git diff で復元 |
| gate-metadata fail | `outputs/artifacts.json` zod schema を再確認 | gates 配列 / phases 配列の status 値整合 |
| phase12 fail | `phase12-task-spec-compliance-check.md` の canonical 9 headings 不足を補完 | Phase 11 evidence 表の status が valid (`present`/`pending`/`n/a`) か |
| indexes drift | `pnpm indexes:rebuild` 再実行 | 手動 ledger に差分を反映 |

## 4. Gate-B 判定

- 本 spec 時点では実行未済（spec_created）。Phase 11 完了後に上記 suite を実行し、全 PASS で Gate-B を `passed` に更新
- 実装後にこのファイル §1 表の「期待」欄を実測値に書き換え、Phase 12 main.md と同期する

**Gate-B 暫定 verdict: pending（実装+Phase 11 完了で確定）**

## 5. Phase 9 完了条件

- [x] 品質保証コマンド 10 件を確定
- [x] 各コマンドの期待値を明示
- [x] fail 時の対応マトリクスを記述
- [x] Gate-B 判定基準を明示

## 6. 次 Phase への引き継ぎ

Phase 10 では Phase 1-9 の総合レビューと AC-1〜AC-7 の最終 verdict 表を作成し、blocker の有無を判定する。
