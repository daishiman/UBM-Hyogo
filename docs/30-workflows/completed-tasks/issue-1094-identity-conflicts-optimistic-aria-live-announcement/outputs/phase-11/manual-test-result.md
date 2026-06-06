# Phase 11: 手動テスト証跡

> **[実装区分: 実装仕様書 / NON_VISUAL]**

## NON_VISUAL 宣言 [Feedback 4 / WEEKGRD-03]

- **タスク種別**: NON_VISUAL
- **非視覚的理由**: 変更は sr-only `aria-live` live region とアナウンス挙動のみで画面ピクセル変化なし。`/admin/identity-conflicts` の一覧レイアウト・row 表示・confirm UI・配色・余白は不変。追加する region も撤去する row-local status node もいずれも sr-only であり、before/after で画面ピクセルは同一。
- **代替証跡（主ソース）**: focused Vitest（`IdentityConflictAnnouncer.spec.tsx` 6 tests / `IdentityConflictRow.spec.tsx` 20 tests・計 26 tests）+ `typecheck` + `lint` + `verify-design-tokens` + 撤去 grep（`optimisticStatusRef` 0 件 / `.focus()` 0 件）+ **手動 SR 検証（VoiceOver/NVDA）**。
- **スクリーンショット非作成理由**: sr-only・画面変化なし。aria-live の読み上げは聴覚挙動で screenshot に写らず、視覚回帰の証跡価値がない。よって `screenshots/` ディレクトリ・`.gitkeep`・`screenshot-plan.json` を作成しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-1094-identity-conflicts-optimistic-aria-live-announcement |
| タスク種別 | NON_VISUAL（実装仕様書 / implementation_mode: new） |
| 証跡の主ソース | **focused Vitest（2 files / 26 tests）** + typecheck + lint + verify-design-tokens + 撤去 grep |
| スクリーンショット非作成理由 | **sr-only・画面変化なし**（aria-live は聴覚挙動で screenshot 非対象） |
| 実施日 | 2026-06-05 |
| 実施者 | Codex（local implementation / source-level evidence）。commit/PR/手動 SR は user-gated |
| 環境 | ローカル（Node 24.15.0 / pnpm 10.33.2・`mise exec` 経由）/ staging（手動 SR 検証時） |
| **証跡の状態** | **source-level PASS / manual SR pending_user_gate** |

> **本サイクルのスコープ更新**: automation-30 改善により、コード実装・focused Vitest・typecheck・lint・design-token gate・撤去 grep まで local source-level evidence として取得済み。実機 screen reader（VoiceOver / NVDA）と staging 認証セッションを要する手動 SR 検証のみ user-gated pending。

## 証跡の主ソース（focused Vitest）

- **自動テスト 1**: `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx`（6 tests）
- **自動テスト 2**: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（20 tests）
- これに `typecheck` / `lint` / `verify-design-tokens` / 撤去 grep を加えた系統で、視覚証跡（スクリーンショット）の代替とする。

## 検証項目チェックリスト（自動・TC-ID 形式）

> 2026-06-05 にローカルで実走した source-level evidence。screen reader 実読み上げは手動 SR 欄に分離する。

| TC-ID | 検証内容 | 期待値 | 主ソース | 状態 |
| --- | --- | --- | --- | --- |
| TC-ANN-01 | live region が DOM に 1 つだけ存在 | `getAllByRole("status").length === 1`・`aria-live="polite"`・`className` に `sr-only` | Vitest（announcer） | PASS |
| TC-ANN-02 | `announce()` 2 回連続で child が 2 つ順番に追加（上書きされない） | child node 2 件が個別 DOM として保持 | Vitest（announcer） | PASS |
| TC-ANN-03 | `vi.advanceTimersByTime(ANNOUNCE_TTL_MS)` 後に child 除去 | TTL（1000ms）後に該当 child が DOM から消える | Vitest（announcer） | PASS |
| TC-ANN-04 | `announcementFor` が map から正しい文言を返す | `announcementFor("merge")` / `announcementFor("dismiss")` が各文言を返す | Vitest（announcer） | PASS |
| TC-ANN-05 | provider 外で `useIdentityConflictAnnounce()()` が no-op | throw せず副作用なし | Vitest（announcer） | PASS |
| TC-ANN-06 | unmount timer clear | unmount cleanup を provider 実装に固定 | Vitest（announcer） | PASS（cleanup 実装あり） |
| TC-ROW-01 | merge optimistic 確定で row が `return null` | row が DOM から消える | Vitest（row） | PASS |
| TC-ROW-02 | optimistic 確定後 `document.activeElement` が status node にならない（非 focus-steal） | focus が sr-only node へ移動しない | Vitest（row） | PASS |
| TC-ROW-03 | dismiss/merge optimistic hide が既存 rollback 経路と競合しない | `renderWithAnnouncer` 配下で既存 20 row tests PASS | Vitest（row） | PASS |
| TC-ROW-04 | rollback（reject）時に inline error（`role="alert"`）surface | row 復元 + alert 表示 | Vitest（row） | PASS |
| TC-ROW-05 | rollback 後の再試行成功 | 再確定で endpoint trigger が再度呼ばれる | Vitest（row） | PASS |
| TC-ROW-06 | dismiss optimistic 確定では row が先に非表示になり、mutation resolve 後に `announcementFor("dismiss")` 文言が live region へ入る | 応答前は成功文言なし、成功後だけ announce | Vitest（row） | PASS |
| TC-GATE-01 | typecheck green | `pnpm --filter @ubm-hyogo/web typecheck` exit 0 | typecheck | PASS |
| TC-GATE-02 | lint green | `pnpm --filter @ubm-hyogo/web lint` exit 0 | lint | PASS |
| TC-GATE-03 | OKLch token gate PASS | `pnpm verify:tokens` exit 0（91 tracked） | token gate | PASS |
| TC-GATE-04 | 撤去要素 grep 0 件 | `optimisticStatusRef` / `.focus()` / legacy hook / HEX / inline style 追加なし | grep | PASS |

## 手動 SR 検証チェックリスト（実装後に実施・現状 pending）

> 実機 screen reader（VoiceOver / NVDA）で実施する。CI（Playwright headless）では実 SR 読み上げを検証できない恒久制約のため手動で代替する（Phase 10 §10.5）。**source-level evidence は実行済み・manual SR は user-gated。**

| SR-ID | 操作 | 期待 | 対応 AC | 状態 |
| --- | --- | --- | --- | --- |
| SR-1 | `/admin/identity-conflicts` を認証済みで開き VoiceOver/NVDA 起動 | conflict row が 1 件以上読み上げられる | — | ⏳ pending |
| SR-2 | merge を二段階 confirm で確定 | 「merge を実行しました。候補を一覧から非表示にしました。」が **1 回だけ** polite に読み上げられる | AC-1 / AC-4 | ⏳ pending |
| SR-3 | SR-2 直後の focus 位置を確認 | focus が sr-only node へ移動せず list/row 近傍に留まる（`document.activeElement` ≠ status node） | AC-2 | ⏳ pending |
| SR-4 | 別 row を dismiss 確定 | 「別人として確定しました。候補を一覧から非表示にしました。」が 1 回読み上げられる | AC-4 | ⏳ pending |
| SR-5 | 複数 row を短間隔で連続 merge/dismiss | 各アナウンスが順番に欠落なく読み上げられる（後続が前を上書きしない） | AC-3 | ⏳ pending |
| SR-6 | 失敗を誘発して merge（rollback） | row 復元 + inline error（`role="alert"`）が assertive に読み上げられ、成功文言は読み上げられない | AC-5 | ⏳ pending |
| SR-7 | DevTools で DOM 確認 | `role="status"` + `aria-live="polite"` の sr-only region が list 親に 1 つだけ存在し、row-local status node が存在しない | AC-1 | ⏳ pending |

## 3層評価

| 層 | 評価 | 状態 |
| --- | --- | --- |
| Semantic（意味） | optimistic 消失が確定的に読め、merge/dismiss 文言が action 別に正しく、rollback が alert で読み上げられる | source-level PASS（SR 実読み上げのみ pending） |
| Visual（視覚） | **N/A（NON_VISUAL）** — sr-only のため視覚変化なし。screenshot 取得なし | N/A |
| AI UX（操作体感） | 操作直後に focus が飛ばず作業位置を保て、連続処理を読み上げで追え、多重発火がない | source-level PASS（SR 実読み上げのみ pending） |

## source-level PASS と環境ブロッカーの分離 [WEEKGRD-01]

- **source-level（実測 PASS）**: TC-ANN / TC-ROW の focused Vitest は 2 files / 26 tests PASS。typecheck / lint / verify:tokens / 撤去 grep も PASS。`optimisticStatusRef` / `.focus()` は対象ファイルから撤去済み。
- **環境ブロッカー**: 手動 SR 検証は実機 screen reader（VoiceOver/NVDA）と staging 認証セッションが必要であり、user-gated。Vitest 側のリスクは esbuild runtime（arch / worktree isolation）のみで、発生時は `pnpm verify:vitest-runtime` で切り分ける（本タスク固有の欠陥ではなく環境要因として分離記録）。

## 結論

NON_VISUAL タスクとして、視覚証跡の代替に **focused Vitest 26 tests + typecheck + lint + verify-design-tokens + 撤去 grep** を主ソースとして取得済み。実機 screen reader による手動 SR 検証（SR-1〜SR-7）は補強証跡として user-gated pending。スクリーンショットは sr-only・画面変化なしのため作成しない。commit / push / PR / Issue mutation も user-gated。
