# Unassigned Task Detection — Issue #749

## メタ情報

| 項目 | 値 |
| --- | --- |
| 検出日 | 2026-05-17 |
| 親タスク | issue-749-primitive-adoption-tracker |
| 検出件数 | 0 件 |

## 検出された未タスク

なし。

## 検出候補の同一サイクル解消

| 候補 | 判断 | 解消内容 |
| --- | --- | --- |
| legacy `apps/web/src/lib/useAdminMutation.ts` cleanup | 未タスク化しない | 本タスクの目的は admin panel から canonical `@/features/admin/hooks/useAdminMutation` へ寄せ、legacy admin 参照を grep gate で 0 にすること。legacy file の物理削除は既存外部参照の破壊リスクがあり、Issue #749 の AC ではない。 |
| CLAUDE.md 不変条件追補 | 同一サイクルで完了 | CLAUDE.md `重要な不変条件` に FormField / canonical useAdminMutation の標準化を追記済み。 |

## 3 ステップ確認

| Step | 結果 |
| --- | --- |
| 1. 候補洗い出し | 2 件を検出候補として確認 |
| 2. 今回サイクル内処理可否 | 2 件とも今回サイクル内で解消または非要件化可能 |
| 3. 未タスク化要否 | 0 件。`docs/30-workflows/unassigned-task/` への新規ファイル作成なし |
