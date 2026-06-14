# Phase 1: 要件定義 — issue-1198 admin-audit dead table CSS cleanup

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（dead CSS 3 ブロックは未削除で現存） | 通常の実装 Phase とする（`implementation_mode: new`） |
| upstream（main）にマージ済み | N/A（local 実装は本ワークツリー内、commit/PR は user-gated） | — |
| 前提タスク（依存タスク）が完了済み | Yes（親 `admin-audit-log-ux-clarity-and-reduce-error-fix` の #1202 カード化完了済み） | 依存解消済み・カード移行は landed |

`implementation_mode: new`（dead CSS 3 ブロックを物理削除する新規変更）。ただし規模は CSS 3 ブロックの純減のみで極小。

## 1. タスク分類

| 項目 | 値 |
| --- | --- |
| タスク種別 | UI task（apps/web 表現層 CSS）/ ただし dead code 削除のため視覚出力は不変 |
| visualEvidence | **NON_VISUAL**（削除対象 CSS は未参照＝未適用。削除しても描画は 1px も変わらない。スクリーンショット不要） |
| 実装区分 | 実装仕様書（CONST_004・root cause がコード変更を要する） |

## 2. 真の論点

- **主問題（1 文）**: `/admin/audit` のカード型タイムライン化（#1202）で参照ゼロになった旧テーブル系 CSS 3 ブロックが `globals.css` に残置し、コード衛生（dead code 不在）の SSOT を侵している。
- **why now**: 親 workflow Phase 8 OOS-4 の grep が CSS 定義ファイル自身のヒットを「参照」と誤カウントし「残置（参照あり）」へ誤分類したため削除が見送られた。`.tsx`/`.ts` 限定の再 grep で参照 0 件が 2 回独立検証で確定したため、削除可へ確定。
- **why this way**: 削除のみ（追加なし）の最小差分が根本解決。doc 注記や grep ロジック訂正では dead code は消えない。

## 3. 現行コード命名規則の分析（FB-01: 仕様書 vs 実装の名前ズレ検出）

| セレクタ（削除対象） | 現行位置 | コンポーネント参照 |
| --- | --- | --- |
| `.admin-audit-filter` | `globals.css:2023` | 0（置換: `.admin-audit-applied-filters`） |
| `.admin-audit-table-scroll` | `globals.css:2031` | 0 |
| `.admin-audit-table` | `globals.css:2035` | 0（置換: `.admin-audit-card` / `.admin-audit-timeline`） |

- BEM 風命名（`block` + `block--modifier` + `block__element`）が `admin-audit-*` 系で一貫。削除対象は旧 `block` 単独セレクタ。
- 新規クラス追加は一切ない（削除のみ）ため命名規則の新規策定は不要。

## 4. 受入条件（AC）

[shared-context.md](shared-context.md) §5 を正本とする。要約:

- AC-1: 削除前ゼロ参照 grep 証跡（0 件）
- AC-2: 3 ブロック削除（`.admin-audit-guide` 以降保持）
- AC-3: `.tbl` / 新規カード系 CSS 無変更
- AC-4: typecheck / lint / verify:tokens 全 PASS
- AC-5: 監査ログ focused Vitest 回帰なし全 PASS
- AC-6: diff は globals.css の純減のみ・apps/api/D1/Form 無変更

## 5. スコープ inventory

| 区分 | 内容 |
| --- | --- |
| 変更ファイル | `apps/web/src/styles/globals.css`（編集・行削除のみ） |
| 新規ファイル | なし |
| 削除ファイル | なし（CSS ブロック削除であってファイル削除ではない） |
| テスト | 新規追加なし。既存 focused Vitest 2 本で回帰確認（AuditLogPanel.component / AuditLogCard） |
| targeted run ファイルリスト（FB-UI-02-2） | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` / `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` |

## 6. carry-over 確認（前タスク成果物の棚卸し）

- 親 `admin-audit-log-ux-clarity-and-reduce-error-fix`（#1202）: カード化実装・`.admin-audit-card*` 系 CSS 追加 → 本タスクはその移行で残った dead CSS のみを除去する後続クリーンアップ。新規機能は持たない。
- 元 unassigned-task `task-admin-audit-dead-table-css-cleanup.md`: 本 canonical workflow root が後付け生成され、Phase 12 で consumed 化する。

## 7. CLOSED Issue 前提検証 gate（issue freshness）

issue #1198 本文の「行 1602-1618」は stale（現行 2023-2039）。行番号をアンカーにせず **セレクタ名**で範囲確定する方針を Phase 2 以降に固定する（[artifacts.json](artifacts.json) `metadata.issue_premise_correction` と同値）。

## 完了条件

- [x] P50 チェック記録
- [x] タスク分類（UI task / NON_VISUAL）固定
- [x] 命名規則分析（削除のみ＝新規命名なし）
- [x] AC 6 件確定（shared-context §5 と一致）
- [x] スコープ inventory（変更 1 ファイル）固定
- [x] CLOSED issue 前提訂正（行番号 stale → セレクタ名アンカー）
