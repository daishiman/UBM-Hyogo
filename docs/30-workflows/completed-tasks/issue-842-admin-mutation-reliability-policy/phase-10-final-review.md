# Phase 10: 最終レビュー

> Phase 5（実装）/ Phase 6（テスト拡充）完了後に、Phase 1 §4 の AC-1〜AC-15 を 1 件ずつ判定するゲート。
> **実装サイクル完了（2026-05-24）**: 判定欄を全件確定済み。

## 1. AC 判定マトリクス（AC-1〜AC-15）

| AC | 内容（Phase 1 §4 / Phase 2 参照） | 判定基準 | 判定欄 |
|---|---|---|---|
| AC-1 | `useAdminMutation` に `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` を追加（型 + JSDoc） | Phase 2 §2 の `UseAdminMutationOptions` / `UseAdminMutationIdempotentOptions` が実装され JSDoc が揃う | **PASS** — `useAdminMutation.ts:33-56` に 4 オプション + JSDoc を実装 |
| AC-2 | timeout 経過で `AbortController.abort()` 発火・AbortError は silent（toast / onError なし） | Phase 2 §4 catch 分岐で `e.name === "AbortError"` を握り `setError(null)`・toast/onError 未呼び出し | **PASS** — `useAdminMutation.ts:266-269`（raw `e.name` 判定で `setError(null)`・原 error 再 throw）。TC-11/23/25/26 で検証 |
| AC-3 | `retry` は idempotent method（`PUT`/`DELETE`）でのみ型レベルで受け付け、`POST`/`PATCH` では渡せない | Phase 2 §3 の overload 2 本で POST/PATCH に `retry` を渡すと typecheck error | **PASS** — `useAdminMutation.ts:123-133` の overload + TC-TY-01（`@ts-expect-error`）で検証 |
| AC-4 | `treat404AsSuccess` が `false \| 'silent' \| { toast: string }` の 3 値で型表現・既定 `false` | Phase 2 §2 `Treat404AsSuccess` 型と §4 の 404 分岐が 3 値を網羅 | **PASS** — `useAdminMutation.ts:31`（型）/ `:237-243`（分岐）。TC-20/21/22 で 3 値検証 |
| AC-5 | `useConfirmDialog` に `onCancelMutation?` 追加・`closeConfirm` で呼ぶ。focus restore は `ConfirmDialog.tsx` 責務のまま | Phase 2 §5 の `closeConfirm` 改修が入り `ConfirmDialog.tsx` は無変更 | **PASS** — `useConfirmDialog.ts:78-87`。`ConfirmDialog.tsx` diff 0。U10/U11/U12 で検証 |
| AC-6（最適化） | `treat404AsSuccess` は汎用 policy として実装。強制移行 caller ゼロ。`MeetingAttendancePanel.tsx` は POST 404 を既定 `false` で維持 | hook に 404 policy 基盤あり・`MeetingAttendancePanel.tsx` の diff が 0 行 | **PASS** — `MeetingAttendancePanel.tsx` は git status 未出現（diff 0 行） |
| AC-7（最適化） | legacy `lib/useAdminMutation.ts` と `lib/__tests__/useAdminMutation.spec.tsx` を物理削除。削除前に production 参照 0 件を証跡化 | `grep -rn "lib/useAdminMutation" apps/web`（テスト除く）0 件・両ファイル削除済 | **PASS** — production 参照 0 件確認後 `git rm` で両ファイル削除（git status に `deleted` 表示） |
| AC-8 | 本タスクで触る caller は新基盤のみ参照・legacy 参照を増やさない | 変更 caller の import が `@/features/admin/hooks/useAdminMutation` のみ | **PASS** — caller 変更なし。legacy 参照は削除済 |
| AC-9 | `apps/api` endpoint surface 追加なし | `apps/api/src/routes/` の diff が 0 | **PASS** — `apps/api` は git status 未出現（diff 0） |
| AC-10 | D1 schema 変更なし | migration / schema の diff が 0 | **PASS** — migration/schema diff 0 |
| AC-11 | `apps/web` から D1 直接アクセス追加なし | `apps/web` に D1 binding 参照の新規追加なし | **PASS** — fetch ベースのまま。D1 binding 参照追加なし |
| AC-12 | `useAdminMutation.spec.ts` に timeout / retry / idempotency-key / 404 三値 / abort の 5 観点追加し PASS | Phase 6 で 5 観点の `TC-NN` が追加され全 PASS | **PASS** — TC-11..29 / TC-12b / TC-TY-01 追加。useAdminMutation 33 tests PASS |
| AC-13 | `mise exec -- pnpm typecheck` 0 error | typecheck exit 0 | **PASS** — 全 6 package typecheck Done（0 error） |
| AC-14 | `mise exec -- pnpm lint` 0 error / 0 warning（baseline 維持） | lint exit 0・warning baseline 不変 | **PASS** — 0 violation（1692 modules cruised） |
| AC-15 | 該当 vitest が 0 fail で完走 | `useAdminMutation.spec.ts` / `useConfirmDialog.spec.ts` 0 fail | **PASS** — hooks 46 tests PASS（33+13）。web 全体 953 passed \| 1 skipped |

> 判定欄を全件 `PASS` で確定済み（`FAIL` / 未確定なし）。

## 2. partial fix / consumer wiring 断絶の確認観点

実装が「型は足したが内部フローが追従していない」「hook は直したが consumer 配線が切れている」状態を残さないことを確認する。

| 観点 | 確認内容 | 根拠 |
|---|---|---|
| 型と内部フローの一致 | `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` の各オプションが Phase 2 §4 の `trigger` 内部フローで実際に消費されている（型だけ追加して未配線でない） | Phase 2 §4 |
| overload と実装シグネチャの整合 | Phase 2 §3 の 2 本の overload + 実装シグネチャが一致し、POST/PATCH 経路で `retry` が型エラーになる | Phase 2 §3 |
| abort 連携の双方向配線 | `useAdminMutation.abort()` の返却と `useConfirmDialog.onCancelMutation` の受け口が一方向 callback で接続される（hook 間循環なし） | Phase 2 §5 / Phase 3 §3 |
| `mutationFn` 経路の意図的非適用 | `mutationFn` 経路で timeout/retry が **適用されない**ことが意図通り（後方互換）であり、JSDoc に明記されている | Phase 2 §4 / §8 |
| 既定 timeout の波及 | 既存 caller（POST/PATCH・policy 未指定）に timeout=10s が新規適用される以外の挙動変化がない | Phase 2 §7 |
| legacy 削除の完全性 | legacy 本体・専用テスト双方が削除され、barrel / import auto-suggest 経路に残骸がない | Phase 2 §6 |

## 3. MINOR 指摘の扱い（未タスク化ルール）

最終レビューで検出した指摘は重大度で分岐する。

- **CRITICAL / MAJOR**（AC 不充足・wiring 断絶・回帰）: 本サイクル内で修正してから Go する。先送り不可。
- **MINOR**（AC に影響しない改善余地・命名の好み・将来拡張余地）: 本サイクルでは修正せず、Phase 12 の未タスク検出（`outputs/phase-12/unassigned-task-detection.md`）に候補として記録する。**ただし新規 backlog 起票は行わず**、index.md §スコープ外の方針（新規バックログ化しない）に従って「起票しない / 再評価条件」を併記する。

## 4. Go / No-Go 判定基準

**Go 条件（全て満たす）:**

- §1 の AC-1〜AC-15 判定欄が全て `PASS`（または正当な `N/A`）
- §2 の partial fix / consumer wiring 観点に断絶なし
- Phase 9 QA（typecheck / lint / build）が全 PASS
- Phase 11 代替証跡（vitest source-level PASS）が記録済み

**No-Go 条件（いずれか該当）:**

- AC のいずれかが `FAIL`
- legacy 削除後に隠れた参照が壊れている（typecheck / build fail）
- AbortError が silent にならず失敗 toast / onError が発火する
- 既存 caller（POST/PATCH）に意図しない型エラーまたは挙動変化が出る
- `MeetingAttendancePanel.tsx` に意図しない diff が混入している（AC-6 最適化違反）

## 5. 完了条件（Phase 10 DoD）

- [x] AC-1〜AC-15 の判定欄を全件確定（`実装後に確認` を残さない）→ 全 15 件 PASS
- [x] partial fix / consumer wiring 断絶がないことを §2 観点で確認 → 型と内部フロー一致 / overload 整合 / abort 双方向配線 / mutationFn 非適用 / 既定 timeout 波及 / legacy 削除完全性 すべて確認
- [x] MINOR 指摘を未タスク検出に記録（起票はしない）→ `outputs/phase-12/unassigned-task-detection.md`
- [x] Go / No-Go を §4 基準で判定し記録 → **Go**（AC 全 PASS・wiring 断絶なし・QA 全 PASS・Phase 11 代替証跡記録済）
