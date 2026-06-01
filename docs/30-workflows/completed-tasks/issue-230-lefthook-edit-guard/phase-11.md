# Phase 11: 手動テスト（NON_VISUAL） — issue-230-lefthook-edit-guard

> visualEvidence=NON_VISUAL のため screenshot は取得しない（`outputs/phase-11/visual-verification-skip.md` に根拠を記録）。
> 本タスクは **implemented_local_runtime_pending**（コード実装済み、CI/PR は user-gated）。本 phase は NON_VISUAL evidence の取得結果と canonical path を記録する。

## 11.1 NON_VISUAL 証跡方針

UI 非接触のため、証跡は以下 3 系統で構成する:

1. **focused vitest 実行ログ** — guard / integrity の fixture spec（exit code・メッセージ assertion）
2. **shell 単体実行の exit code** — `bash scripts/hooks/lefthook-edit-guard.sh` / `bash scripts/verify-hook-integrity.sh`
3. **grep gate** — fail メッセージに AC-3 必須文字列（`LEFTHOOK_EDIT_ACK` / `CLAUDE.md` / `lefthook-operations.md`）が含まれること

## 11.2 取得済み evidence

| 種別 | canonical path | 取得方法 | 現状態 |
|------|---------------|---------|--------|
| focused vitest | `outputs/phase-11/manual-test-result.md` | `mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts` | present（12 PASS） |
| shell 単体実行 | `outputs/phase-11/manual-test-result.md` | `bash scripts/verify-hook-integrity.sh` / `bash scripts/hooks/lefthook-edit-guard.sh` | present（exit 0） |
| AC-3 メッセージ確認 | `outputs/phase-11/manual-test-result.md` | focused vitest LG-b / LG-d で `LEFTHOOK_EDIT_ACK` / `CLAUDE.md` / `lefthook-operations.md` を assertion | present |
| typecheck/lint/shellcheck/YAML | `outputs/phase-11/manual-test-result.md` | `pnpm typecheck`, `pnpm lint`, shellcheck, YAML parse | present（PASS） |
| 視覚証跡スキップ | `outputs/phase-11/visual-verification-skip.md` | NON_VISUAL 根拠 | present |

> 個別ログファイルは作成せず、Phase 11 evidence は `manual-test-result.md` に集約する。UI 非接触のため screenshot は不要。

## 11.3 受け入れ確認

1. clean fixture / clean 実リポジトリで guard が通る（exit 0）
2. `lefthook.yml` を stage した fixture で ack 無し block、`LEFTHOOK_EDIT_ACK=1` で通過
3. `.git/hooks/pre-commit` 手書き fixture は block、`.sample` / lefthook 管理 hook / dotted backup は除外
4. `MERGE_HEAD` 存在 fixture では guard が skip
5. 欠落 script / `min_version` 欠落 / tracked stray hook fixture で `verify-hook-integrity.sh` が exit 1

## 11.4 完了条件（Phase 11）

- NON_VISUAL 証跡 3 系統と canonical path を取得・記録（完了）
- screenshot 不要の根拠を `visual-verification-skip.md` に記録（完了）
- focused vitest 12 PASS、実リポジトリ shell 実行、typecheck/lint/shellcheck/YAML green を `manual-test-result.md` に集約（完了）
