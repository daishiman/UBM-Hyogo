# スコープ定義 — admin-meeting-bulk-attendance-select

## In Scope（本サイクルで完結 / CONST_007）

- `apps/web` のみの実装で「複数会員同時選択 → 一括追加」を実現。
- ドロワー内チェックリスト（主経路）+ 大量選択モーダル（補助経路）の両 UI。
- 既存一括取込 endpoint の web 配線（web client `importAttendance`）。
- Checkbox primitive 新規追加。
- 選択ロジックの hook 集約（両 UI で共有）。
- all-or-nothing commit セマンティクスの UX 対応。
- レイアウト CSS（OKLch トークン）。
- focused unit/component test。

## Out of Scope（理由付き）

| 項目 | 分離理由（CONST_007 例外該当） | 実施時期/場所 |
| --- | --- | --- |
| CSV ファイルアップロード一括取込 UI | 別 UX（ファイル parse / email 解決 / dryRun preview）。今回の「候補多選択」と機能が別。今回サイクルに含めると 2 機能混在で整合性が落ちる | 未タスク化（Phase 12 baseline・将来 Issue 候補） |
| attendance route 二系統（meetings.ts plural toggle / attendance.ts singular+import）の統合 | API 変更を伴い不変条件 #1 抵触・回帰リスク大 | 本タスク非対象（現行 endpoint をそのまま利用） |
| 出席記録の編集（メモ/出席日時の手修正） | 現行スコープ外の別要望 | 未対応 |

> 「分量が多い」等の理由による先送りはしていない。上記はいずれも API 変更必須 / UX 別物 = 技術的・整合性的に同一サイクル完結が不適な CONST_007 例外。

## 影響範囲

- 変更: `apps/web/src/features/admin/components/_meetings/*`, `apps/web/src/components/ui/Checkbox.tsx`, `apps/web/src/lib/admin/api.ts`, `apps/web/src/styles/globals.css`。
- 非変更（厳守）: `apps/api/**`, `packages/**`, Google Form schema, D1 migration。
