# Phase 3: Design Review

## 3.1 リスクと対策

| # | リスク | 対策 |
|---|-------|------|
| R1 | `MeetingPanel` 削除で既存 E2E `attendance.spec.ts` が落ちる | data-testid（`attendance-toast` / `attendance-select-<id>` / `add-attendance-<id>` / `remove-attendance-<id>` / `attendance-attendee-<id>` / `attendance-list-session-<id>`）を新 components で 1:1 引き継ぐ。Task A 内で test 互換テーブルを管理。 |
| R2 | 楽観 UI の attended Set が分割後に壊れる | `MeetingsClientShell` を単一の state owner にし、子は props のみ受け取る（pure-fn 派生）。 |
| R3 | drawer の confirm flow が `useConfirmDialog` の kind 単数化で衝突 | 既存と同じ kind 文字列（`"remove"` / `"delete"`）を維持し、ctx 型も変更しない。 |
| R4 | KPI 計算で 0 件時の avgAttendees の NaN | `computeMeetingStats` で `items.length === 0` のとき `avg=0` を返す純関数仕様にし、unit spec で確認。 |
| R5 | プロトタイプ `Drawer` に直接相当する primitive が無い | `apps/web/src/components/ui/` 配下に `Drawer.tsx` が無ければ Task A 内で MIN 実装（aside + backdrop + focus trap）を `_meetings/MeetingAttendanceDrawer.tsx` に inline で持つ。スコープ拡大を避けるため共有 `Drawer` 化はしない。 |
| R6 | `/admin/meetings` の staging 404 が UI 改修で解消しないことが誤解される | Phase 11 manual test で「auth gate 通過後に再現確認」を明示。404 は本 workflow スコープ外と Phase 1.4 で明言。 |
| R7 | OKLch token 直書きを忘れて HEX 残存 | `scripts/verify-design-tokens` (or `grep -E '#[0-9a-fA-F]{3,6}'` ad-hoc) を Phase 5 ゲートに必須化。 |

## 3.2 既存 admin/members（Task C 完了済）との整合

- `AdminPageHeader` 使い方 / breadcrumb shape を完全に揃える
- `_shared` primitive 採用方針（fail-soft / Section エラー UI）を完全に踏襲
- `_members/` 配下と `_meetings/` 配下のディレクトリ構造を rhyme させる（`*ClientShell.tsx` を state owner にする pattern）

## 3.3 Approval Gate

Phase 4 へ進むための条件:

- [x] AC（Phase 1.3）が全項目 grep / spec で検証可能になっている
- [x] 新規 / 編集 / 削除ファイルが Phase 2.2 で網羅されている
- [x] 既存 API endpoint surface 変更 0 を明文化
- [x] data-testid 互換が R1 で担保される
