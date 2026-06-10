# UI Sanity / Visual Review（計画） — admin-meeting-bulk-attendance-select

workflow_state: `implemented_local_evidence_captured` / generated_at: 2026-06-09

本タスクは VISUAL の apps/web 実装完了タスクである。本書は DOM/state evidence と local fixture pixel screenshot で確認済みの観点、ならびに user-gated の staging baseline 観点を分離して記録する。

## レビュー対象画面

| 画面 / 状態 | route | 主要 primitive |
| --- | --- | --- |
| ドロワー内チェックリスト（主経路） | `/(admin)/admin/meetings`（ドロワー展開） | `Checkbox`（新規）/ `FormField` + `Input` / `Button` |
| 大量選択モーダル（補助経路） | 同上（モーダル起動） | `Modal` / `Checkbox` / `FormField` + `Input` / `Button` |
| 成功 / 失敗 toast | 同上 | `Toast` |

## Apple UI/UX 観点チェック（実装後に判定）

| 観点 | チェック内容 | 判定（実装後） |
| --- | --- | --- |
| 視覚階層 | チェックリストの候補 / 選択件数 / アクションボタンの優先順位が明確 | PASS_PIXEL |
| 一貫性 | 既存 `_meetings` ドロワーの余白・角丸・surface トークンと整合 | PASS_PIXEL |
| 選択強調 | `aria-checked=true` の行が背景色で識別でき、未選択と区別できる | PASS_PIXEL |
| フィードバック | 一括追加後の toast（成功 tone / 失敗 tone）が即時表示され役割が分かる | PASS_PIXEL |
| 操作コスト | N 名を 1 回の選択 → 1 ボタンで追加でき、N 回の往復が不要 | PASS_PIXEL |
| disabled 表現 | 選択 0 件時の送信ボタン disabled、出席済候補の除外が視覚的に自然 | PASS_PIXEL |
| モーダル overlay | モーダルが開き、検索 / 全選択 / 一括追加 / 閉じる操作が破綻しない | PASS_PIXEL |
| トークン遵守 | 色は `var(--ubm-color-*)` のみ。HEX 直書き / `bg-[#xxx]` なし（AC-11） | PASS_DOM |

## 既存 primitive との整合（再利用方針）

- `Checkbox` は新規 primitive だが、既存 `Switch.tsx` / `Select.tsx` と同じ `ui-*` クラス命名・FormField 互換を踏襲する。
- モーダルは既存 `Modal.tsx` / `ConfirmDialog.tsx` の overlay パターンを流用し、新規 overlay primitive を生やさない（不変条件 #3）。
- toast は既存 `Toast.tsx` を Shell 経由で利用する。

## Evidence 境界

local fixture screenshot 7 枚は `screenshots/` に生成済み。DOM/state/API 境界は focused tests で PASS 済みで、staging authenticated visual baseline は user-gated とする。

## 参照資料

| 種別 | Path |
| --- | --- |
| Phase 11 手動テスト計画 | `../../phase-11-manual-test.md` |
| 設計 | `../../phase-2-design.md` |
| design-tokens | `docs/00-getting-started-manual/specs/design-tokens.md` |
