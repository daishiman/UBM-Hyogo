**[実装区分: 実装仕様書]**

# Phase 12 — System Spec Update Summary

## 1. 反映対象

`docs/00-getting-started-manual/specs/` 配下の正本仕様への反映有無を整理する。

| spec ファイル | 反映 | 理由 |
| --- | --- | --- |
| `00-overview.md` | なし | 全体構成変更なし |
| `01-api-schema.md` | 更新 | `schema_aliases` INSERT、stableKey regex、422/409/202 境界へ現行 API contract を同期 |
| `02-auth.md` | なし | 認証要件変更なし（既存 admin session 流用） |
| `08-free-database.md` | なし | D1 schema 変更なし |
| `13-mvp-auth.md` | なし | MVP 認証方針不変 |

## 2. 反映の必要が出るタイミング

下記のいずれかが発生した場合、本 step 完了後に system spec への追記を検討する。ただし本 step のスコープ外。

- `POST /api/admin/schema/aliases` の request shape 変更
- `stableKey` 命名規則変更
- alias 解決後の D1 schema migration 追加
- admin 権限ロールの細分化

## 3. ユビキタス言語の追記候補

将来的に system spec に取り込む候補語彙（本 step では未取り込み）:

| 用語 | 暫定定義 |
| --- | --- |
| schema diff | フォーム最新 schema とシステム既知 alias 集合との差分 |
| diffId | 個別 diff レコードの識別子 |
| stableKey | 質問に紐づく安定内部 ID（`/^[a-zA-Z][a-zA-Z0-9_]*$/`） |
| alias | フォーム questionId と stableKey の対応関係 |
| resolve | admin による diff の手動解決 |

## 4. 判定

本 wave では `docs/00-getting-started-manual/specs/01-api-schema.md` と `11-admin-management.md`、および aiworkflow 正本仕様を更新した。実装済み UI hardening が現行 API contract を露出するため、no-op 判定は撤回する。

## 5. Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは admin/schema resolve UI の local hardening を同梱する `implemented-local-runtime-pending` workflow である。
- API 正本は既存 `GET /api/admin/schema/diff` と `POST /api/admin/schema/aliases` を参照し、request / response shape を変更しない。
- 実装着手後に新規型を `apps/web` 側へ追加する場合は、Phase 12 再実行時に system spec update の要否を再判定する。
