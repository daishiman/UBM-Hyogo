**[実装区分: 実装仕様書]**

# Phase 9: 実装後検証 / Gate-B 判定

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| Gate | Gate-B (implementation_review) |
| 入力 | Phase 5-8 |

## 1. 実装後検証コマンド suite

| # | 項目 | コマンド | 期待 |
|---|---|---|---|
| 1 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 / 違反 0 |
| 3 | メイン spec | `pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"` | exit 0 / A1..A8 + B1..B5 全 pass |
| 4 | hook 無回帰 | `pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | exit 0 / 既存 case 全 pass |
| 5 | DELETE caller 棚卸し | `rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web/app apps/web/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**' -g '!**/*.spec.ts' -g '!**/*.spec.tsx'` | production caller 0 件 |
| 6 | legacy import ガード | `mise exec -- rg -n 'from "@/lib/useAdminMutation"' apps/web` | 0 件（不変条件 10） |
| 7 | API 無改変ガード | `git diff dev -- apps/api/` | 空 diff |
| 8 | test 命名ガード | `mise exec -- rg -n -g '*.test.tsx' '' apps/web/app/\(admin\)/admin/meetings/` | 0 件（`.spec.tsx` 命名強制） |
| 9 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | exit 0 |
| 10 | phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| 11 | indexes drift | `mise exec -- pnpm indexes:rebuild && git status .claude/skills/aiworkflow-requirements/indexes/` | drift 0 |
| 12 | pr-ready wrapper | `bash scripts/verify-pr-ready.sh` | exit 0 |

## 2. spec 内 assertion 期待（A/B 詳細）

| TC | assertion 要点 | 期待 |
|---|---|---|
| A1..A8 | register 既存互換 | isDeleted 除外、登録成功 / 409 / 422 / 404 / 500、既登録 early return、data-testid 互換 |
| B1 | unregister 表示条件 | registered=true の候補だけ解除 button 表示 |
| B2 | unregister payload | body が `{ memberId, attended:false }` |
| B3 | unregister 200 | `出席を解除しました`、`data-registered=false`、解除 button 消滅 |
| B4 | unregister 404 | `既に解除済みです`、`data-registered=false`、解除 button 消滅 |
| B5 | unregister 500 | `解除に失敗 (500)`、`data-registered=true`、解除 button 維持 |

## 3. fail 時の対応マトリクス

| fail 種別 | 1 次対応 | 2 次対応 |
|---|---|---|
| typecheck fail | `mutateAsync` 戻り値の `undefined` narrowing を確認 | Phase 6 §3 戻り値整形ルール再適用 |
| lint fail | `pnpm lint --fix` | 残違反のみ手修正 |
| B4 fail | `treat404AsSuccess` option / `refreshOnSuccess: false` の渡し方を確認 | hook spec を参照し option 名 typo を排除 |
| register 404 fail | register 側 mutation に option が混入していないか確認 | mutation 宣言を 2 インスタンスに分離（Phase 6 §2） |
| #5 で DELETE caller 検出 | 同種 race の有無を確認 | 本 task に組込むか、unassigned task として記録 |
| #7 で API diff 検出 | API endpoint 変更が紛れ込んでいないか確認 | 変更を revert し、API 無改変を維持 |
| #8 で `.test.tsx` 検出 | git mv で `.spec.tsx` に rename | lefthook pre-commit を通す |
| indexes drift | `pnpm indexes:rebuild` 再実行 | 手動 ledger に差分を反映 |

## 4. Gate-B verdict 早見

| 条件 | 判定根拠 |
|---|---|
| #1 typecheck PASS | 戻り値 `undefined` を扱う caller の型整合 |
| #2 lint PASS | legacy import / 直 input ガードを違反しない |
| #3 メイン spec PASS | A1..A8 + B1..B5 全 pass |
| #4 hook 無回帰 PASS | 既存 `useAdminMutation.spec.ts` 全 pass |
| #5 DELETE caller 棚卸し | 0 件 or 既知 caller のみ、漏れなし |
| #6 legacy import 0 件 | 不変条件 10 遵守 |
| #7 API diff 空 | UI prototype alignment 不変条件 1 遵守 |
| #8 test 命名 OK | 不変条件 8 遵守 |
| #9-12 gate 系 PASS | artifacts.json / phase-12 / indexes 整合 |

## 5. Gate-B 提示

- 本 spec 時点は `implemented_local_evidence_captured`（実装 + focused evidence 取得済み）
- §1 の focused spec / hook spec / web typecheck / web lint / DELETE caller 棚卸しは Phase 11 logs に保存済み
- broader root gate / PR-ready wrapper は Phase 13 user-gated 操作前に再実行する

**Gate-B verdict: passed（local focused evidence captured）**

## 6. Phase 9 完了条件

- [x] 検証コマンド 12 件を確定
- [x] A1..A8 + B1..B5 の assertion 要点を確定
- [x] fail 時の対応マトリクスを記述
- [x] Gate-B 判定基準を明示
- [x] Gate-B 暫定 verdict を提示

## 7. 次 Phase への引き継ぎ

Phase 10 では本 Phase の検証結果と A/B assertion を踏まえ、AC-1..AC-N 最終 verdict 表と blocker 有無の判定を行う。
