# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 9 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 1-8 完了 |

## 目的

landed 実装（PR #1064）が typecheck / lint / test green、coverage AC、不変条件を全て満たすことを
品質ゲートとして固定する。再実装者が本 Phase の検証コマンドを実行すれば同一の green に収束する。

## 実行タスク

1. 検証コマンド（typecheck / test / lint / coverage-guard）を実在 script 名で固定する。
2. coverage AC（apps/web 既定閾値 >= 80%）を宣言する。
3. 不変条件チェックリスト（#5 / #10 / §2 / §3 / #8 / #9）を検証する。

## 検証コマンド（実在 script のみ）

| 検証 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| 単体テスト | `mise exec -- pnpm --filter @ubm-hyogo/web test` | TC-A1..A7 / TC-B1..B4 を含み全 pass |
| lint（inline style 禁止 / HEX 禁止含む） | `mise exec -- pnpm lint` | exit 0 |
| coverage gate | `bash scripts/coverage-guard.sh` | exit 0 |

> coverage-guard は merge commit を含む push かつ `--changed` モードでは自動スキップ（solo dev ポリシー）。
> 通常の feature コミットでは閾値判定が有効。

## coverage AC

- apps/web の既定 coverage 閾値 **>= 80%** を本タスクの AC とする。
- 対象テスト:
  - `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx`（TC-A1..A7）
  - `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（TC-B1..B4）
- パネルの分岐（dry-run 表示 / apply 表示 / apply disabled / confirm キャンセル / skipped 行 / pending disabled / HTTP error / parseError / onApplied 通知）を TC が網羅し、schema 分岐（valid / policy reject / 負数 reject / skipped 欠落 reject）を TC-B が網羅する。

## テストケース一覧（landed）

| TC | 内容 | 対応 AC |
|----|------|---------|
| TC-A1 | dry-run 実行 → scanned/candidates と dryRun モード表示 | AC-A1 |
| TC-A2 | apply 実行 → applied 件数と apply モード表示 | AC-A2 |
| TC-A2b | dry-run 前は apply が disabled | AC-A2（ガード） |
| TC-A2c | apply は confirm キャンセル時に実行しない | AC-A2（ガード） |
| TC-A3 | skipped 内訳（adminExplicit / deleted）を各行に表示 | AC-A3 |
| TC-A4 | pending 中は両ボタン disabled（二重起動防止） | AC-A4 / RF-1 |
| TC-A5 | HTTP error 時は結果非描画 + error 文言 | R-6 |
| TC-A6 | schema mismatch 時は parseError 表示 + 結果非描画 | RF-5 |
| TC-A7 | apply 成功時 onApplied を検証済み結果で呼ぶ | AC-A2 |
| TC-B1 | endpoint 準拠 object を受理 | RF-5 |
| TC-B2 | 想定外 policy は reject | RF-5 |
| TC-B3 | nonnegative 違反は reject | RF-5 |
| TC-B4 | skipped.deleted 欠落は reject | RF-5 |

## 不変条件チェックリスト

| # | 不変条件 | 検証方法 | 判定 |
|---|---------|---------|------|
| #5 | D1 直接アクセス禁止（web から binding なし） | panel/backfill.ts は proxy `/api/admin/sync/backfill-publish-state` 経由のみ。D1 binding 参照 0 | PASS |
| #10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | panel import が `../../hooks/useAdminMutation`。legacy `@/lib/useAdminMutation` 不参照 | PASS |
| §2 | OKLch トークン正本（HEX / `bg-[#xxx]` / inline style 禁止） | `text-[var(--ubm-color-danger)]` / `text-[var(--ubm-color-text-muted)]` のみ。HEX・inline style 無 | PASS |
| §3 / #9 | 新規 primitive を生やさない / `<input>` を増やさない | 既存 `Button` / `AdminSectionCard` のみ。input 追加 0 | PASS |
| #8 | 新規 test は `*.spec.{ts,tsx}` のみ | `BackfillPublishStatePanel.spec.tsx` / `sync-schemas.spec.ts`。`*.test.*` 無 | PASS |

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 5 成果物 | `./phase-5.md` |
| テスト（panel） | `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` |
| テスト（schema） | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` |
| coverage gate | `scripts/coverage-guard.sh` |
| 設計 validation matrix | `./phase-2.md` |

## 実行手順

1. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` を実行し exit 0 を確認。
2. `mise exec -- pnpm --filter @ubm-hyogo/web test` を実行し TC-A1..A7 / TC-B1..B4 全 pass を確認。
3. `mise exec -- pnpm lint` を実行し exit 0（HEX / inline style 違反 0）を確認。
4. `bash scripts/coverage-guard.sh` を実行し exit 0（>= 80%）を確認。
5. 不変条件チェックリスト #5 / #10 / §2 / §3 / #8 / #9 を全 PASS で確認。

## 統合テスト連携

- web 側 2 spec + endpoint 側 `sync-backfill-publish-state.spec.ts`（D1 in-memory・変更不要）で 3 層整合。
- 契約 drift は web `safeParse`（TC-A6）+ schema spec（TC-B1..B4）で検出。

## 多角的チェック観点（AIが判断）

- coverage が 80% 未満になる未テスト分岐が残っていないか（特に `parseError` → `mutation.error` の表示優先順位）。
- lint が `text-[var(--ubm-color-*)]` を OKLch トークンとして許可し HEX のみ reject しているか。
- `confirm` モック（`vi.spyOn(globalThis, "confirm")`）漏れで apply 系 TC が flaky にならないか。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| QA-1 | typecheck green | PASS |
| QA-2 | test green（TC-A / TC-B） | PASS |
| QA-3 | lint green（OKLch / inline style） | PASS |
| QA-4 | coverage >= 80% | PASS |
| QA-5 | 不変条件 #5/#10/§2/§3/#8/#9 | PASS |

## 成果物

- 本品質保証ファイル（検証コマンド / coverage AC / 不変条件チェックリスト）。

## 完了条件

- [x] 4 検証コマンドを実在 script 名で固定。
- [x] coverage AC（>= 80%）を宣言。
- [x] TC-A1..A7 / TC-B1..B4 を AC へ写像。
- [x] 不変条件 #5/#10/§2/§3/#8/#9 を全 PASS で記述。

## タスク100%実行確認【必須】

- [x] typecheck / lint / test / coverage の 4 ゲートを記述。
- [x] 不変条件を 1 つも省略せず検証。

## 次Phase

Phase 10（最終レビュー）。
