# Phase 11: 手動テスト（NON_VISUAL）

`[実装区分: 実装仕様書 / NON_VISUAL]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

> **automation-30 改善後の補正**: 本 Phase 作成時点では仕様書作成のみを前提にしていたが、今回の改善でコード実装・focused Vitest・typecheck・lint・token gate・撤去 grep まで local source-level evidence を取得済み。手動 SR 検証のみ user-gated pending。

## NON_VISUAL 宣言 [WEEKGRD-03 / Feedback 4]

- **タスク種別**: **NON_VISUAL**
- **非視覚的理由**: 変更は **sr-only live region とアナウンス挙動のみで画面ピクセル変化なし**。`/admin/identity-conflicts` の一覧レイアウト・row 表示・merge/dismiss confirm UI・色・余白は一切変わらない。追加する `IdentityConflictAnnouncer` の region は `className="sr-only"` であり視覚的に不可視。撤去する row-local status node も sr-only であったため before/after で画面ピクセルは同一。
- **代替証跡（主ソース）**: focused Vitest（`IdentityConflictAnnouncer.spec.tsx` TC-ANN-01〜06 / `IdentityConflictRow.spec.tsx` TC-ROW-01〜06）+ `typecheck` + `lint` + `verify-design-tokens` + 撤去要素 grep。これに**手動 SR 検証（VoiceOver/NVDA）**を実装後 user-gated で加える。
- **スクリーンショットを作らない理由**: 画面変化が一切ないため。視覚回帰を撮っても before/after が同一であり証跡価値がない。aria-live の読み上げは screenshot に写らない（聴覚的挙動）。よって `screenshots/` ディレクトリ・`.gitkeep`・`screenshot-plan.json` を作成しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1094-identity-conflicts-optimistic-aria-live-announcement` |
| issue | #1094（FU-AIDC-008・CLOSED） |
| phase | Phase 11（手動テスト・NON_VISUAL） |
| route | `/admin/identity-conflicts` |
| 対象 component | `IdentityConflictAnnouncer.tsx`（新規）/ `IdentityConflictRow.tsx`（編集） |
| evidence 方針 | **focused Vitest 主証跡 + 手動 SR 検証ノート**（screenshot なし） |
| 証跡の状態 | **source-level PASS / manual SR pending_user_gate** |

## 目的

本タスクの変更は sr-only live region 経由のアナウンス挙動であり、**画面ピクセル変化を伴わない NON_VISUAL 区分**である。視覚証跡（screenshot）では「focus stealing しない」「複数 row 連続でも各メッセージが読み上げられる」「文言が単一導出される」という挙動を担保できない。そのため証跡は (1) focused Vitest（DOM 構造・announce 配線・append-children・TTL の機械検証）を主ソースとし、(2) 実 screen reader での読み上げ確認を手動 SR 検証手順として定義する（実装後・user-gated）。

## 実行タスク

### 1. NON_VISUAL 区分の宣言

本タスクは **NON_VISUAL タスク**である（`VISUAL` / `VISUAL_ON_EXECUTION` ではない）。
- **根拠**: 変更は sr-only `aria-live` region の追加と row-local sr-only status node の撤去、focus stealing 撤去、文言の単一導出化のみ。いずれも視覚レイアウト・配色・余白に影響しない。merge/dismiss 後に row が消える挙動自体は既存（optimistic 除去）から不変であり、本タスクで変わるのは「**どう読み上げるか（aria-live 経路）**」のみ。
- よって screenshot を取得しない（§NON_VISUAL 宣言の理由参照）。

### 2. 証跡の主ソース（focused Vitest）

| spec | テスト名（TC-ID） | 件数 | 検証内容 |
| --- | --- | --- | --- |
| `IdentityConflictAnnouncer.spec.tsx` | TC-ANN-01〜06 | 6 | 単一 region / append-children 連続非競合 / TTL 除去 / `announcementFor` 単一導出 / context fallback no-op / unmount timer clear |
| `IdentityConflictRow.spec.tsx` | TC-ROW-01〜06 | 6 | announce 1 回 / 非 focus-steal（`document.activeElement` 非 status）/ 連続非競合 / rollback 非アナウンス / rollback 再アナウンス可 / dismiss 同経路 announce |

- **合計 26 tests**を主証跡とする。これに `typecheck` / `lint` / `verify-design-tokens` / 撤去 grep（`optimisticStatusRef` 0 件 / `.focus()` 0 件）を加える。
- **スクリーンショットを作らない理由（再掲）**: aria-live の読み上げは聴覚挙動で screenshot に写らず、画面ピクセルは before/after で同一。視覚回帰の証跡価値がない（Feedback 4）。

### 3. 実地操作の代替 — 手動 SR 検証手順（実装後・user-gated）

> 実機 screen reader での読み上げ確認は未実行。CI（Playwright headless）では実 SR 読み上げを検証できない（恒久制約・Phase 10 §10.5）ため手動で代替する。

| 手順 | 操作 | 期待（読み上げ / focus） |
| --- | --- | --- |
| SR-1 | staging で `/admin/identity-conflicts` を認証済みセッションで開き、VoiceOver（macOS）または NVDA（Windows）を起動 | identity conflict row が 1 件以上読み上げられる |
| SR-2 | 1 件目の merge を二段階 confirm（merge → 次へ → 理由 → 「merge 実行」）で確定 | 「merge を実行しました。候補を一覧から非表示にしました。」が **1 回だけ** polite に読み上げられる |
| SR-3 | SR-2 直後にキーボード focus 位置を確認（VoiceOver カーソル / Tab 位置） | **focus が sr-only node へ移動しない**（操作した row 近傍 / list に留まる。`document.activeElement` が status node にならない・AC-2） |
| SR-4 | 別 row の dismiss を確定 | 「別人として確定しました。候補を一覧から非表示にしました。」が 1 回読み上げられる（merge と文言が action 別に正しい・AC-4） |
| SR-5 | 複数 row を連続で merge / dismiss（短間隔） | 各操作のアナウンスが**順番に欠落なく**読み上げられる（後続が前を上書きしない・AC-3） |
| SR-6 | ネットワークを遮断 / 失敗を誘発して merge を実行（rollback 誘発） | row が復元し inline error（`role="alert"`）が assertive に読み上げられる。**この時アナウンス（成功文言）は読み上げられない**（AC-5） |
| SR-7 | DevTools で DOM を確認 | `role="status"` + `aria-live="polite"` の sr-only region が **list 親に 1 つだけ**存在し、row-local の status node が**存在しない**（AC-1） |

> region は永続描画のため、SR は region の child 追加（DOM mutation）を検知して読み上げる。focus 移動は不要（AC-2）。

### 4. 3層評価観点

| 層 | 評価観点 | 対応 | 本タスクでの扱い |
| --- | --- | --- | --- |
| **Semantic（意味）** | optimistic 消失が「処理中」ではなく「確定的に非表示にした」と読めること。merge / dismiss で文言が action 別に正しいこと。rollback が `role="alert"`（assertive）で読み上げられること | SR-2 / SR-4 / SR-6 / TC-ROW-04・06 / TC-ANN-04 | 主証跡（Vitest）+ 手動 SR で確認 |
| **Visual（視覚）** | — | — | **N/A（NON_VISUAL）**。sr-only のため視覚変化なし。screenshot を取得しない |
| **AI UX（操作体感）** | 操作直後に focus が飛ばず作業位置を保てること（迷子にならない）。連続処理で「どの操作が反映されたか」がアナウンスで追えること。過度な読み上げ（多重発火）がないこと | SR-3 / SR-5 / TC-ROW-01・03 | focus 非依存 + append-children + 1 回保証で担保 |

> Visual 層は NON_VISUAL のため **N/A** を明示する。Semantic / AI UX を focused Vitest（機械）+ 手動 SR（聴覚）で評価する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF SSOT | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/index.md` | NON_VISUAL 区分根拠 / 設計方針 / AC-1〜AC-8 / 主要シグネチャ |
| 本WF Phase 9 | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/outputs/phase-9/phase-9.md` | focused Vitest ケース（TC-ANN/TC-ROW）/ 撤去 grep |
| 本WF Phase 10 | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/outputs/phase-10/phase-10.md` | partial fix（cross-component 配線）/ Playwright 実 SR 不可（§10.5） |
| NON_VISUAL テンプレート | `docs/30-workflows/issue-1065-shell-collapse-cookie-doc-naming-drift-reconciliation/outputs/phase-11/manual-test-result.md` | NON_VISUAL 宣言 / 証跡主ソース / screenshot 非作成理由の書式 |

## 成果物

| 成果物 | path | 役割 |
| --- | --- | --- |
| 本 phase 仕様 | `outputs/phase-11/phase-11.md` | NON_VISUAL 宣言 / 主証跡（focused Vitest）/ 手動 SR 検証手順 / 3層評価（Visual=N/A） |
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | NON_VISUAL テンプレート証跡（主ソース明記 + 手動 SR チェックリスト・現状 pending） |

> **screenshot / `screenshot-plan.json` / `screenshots/` ディレクトリ / `.gitkeep` は作成しない**（NON_VISUAL・画面変化なし）。

## 統合テスト連携

- 主証跡（focused Vitest）: Phase 4/6 の `IdentityConflictAnnouncer.spec.tsx`（TC-ANN-01〜06）/ `IdentityConflictRow.spec.tsx`（TC-ROW-01〜06）で region 単一性・append-children・非 focus-steal・rollback 非アナウンスを検証。
- 手動 SR 検証（補強）: 実装後 user-gated で VoiceOver/NVDA により読み上げ・focus 非移動を確認し `manual-test-result.md` へ記録。
- Playwright（任意・軽微）: 「単一 `aria-live` region 存在 + row-local status node 非存在」の非回帰のみ確認（screenshot は撮らない）。

## 完了条件（Phase 11）

- NON_VISUAL 区分を冒頭で宣言し、非視覚的理由（sr-only live region・画面ピクセル変化なし）と代替証跡を明記した。
- 証跡の主ソース（focused Vitest 2 files / 26 tests）と「screenshot を作らない理由」を明記した。
- 実地操作の代替として手動 SR 検証手順（SR-1〜SR-7・ページレベル region が 1 回ずつ読み上げ / focus が移動しない）を手順として記述した（source-level evidence は実行済み・手動SRのみ user-gated）。
- 3層評価（Semantic / Visual=N/A / AI UX）を定義し、Visual を NON_VISUAL で N/A 明記した。
- `screenshots/` ディレクトリ・`.gitkeep`・`screenshot-plan.json` を作成しないことを明記した。
- 本サイクルは spec 作成のみ・証跡取得は実装後 user-gated である旨を冒頭に明記した。
