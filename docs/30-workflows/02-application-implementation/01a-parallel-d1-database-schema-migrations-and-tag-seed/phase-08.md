# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 8 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 7 (AC マトリクス) |
| 下流 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

column 名・table 名・migration 名の重複や命名揺れを Before / After で整理。後続 02a/b/c の repository 命名と整合させる。

## 実行タスク

1. column 命名 Before / After
2. table 命名 Before / After
3. migration ファイル名 Before / After
4. seed code 命名 Before / After
5. outputs

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | DDL |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 ↔ column |

## 実行手順

### Before / After 表化

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 9 | DDL 命名最終確認 |
| 12 | implementation-guide で命名表転記 |

## 多角的チェック観点（不変条件参照）

- **#1**: stable_key を column 名で固定（question_id 直書き禁止）
- **#2**: public_consent / rules_consent
- **#7**: response_id / member_id

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | column 命名 | 8 | pending |
| 2 | table 命名 | 8 | pending |
| 3 | migration 命名 | 8 | pending |
| 4 | seed code | 8 | pending |
| 5 | outputs | 8 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-08/main.md |
| メタ | artifacts.json |

## 完了条件

- [ ] Before / After 4 軸完了

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 9
- 引き継ぎ事項: 命名表
- ブロック条件: 衝突あり

## Before / After

### Column 命名

| Before | After | 理由 |
| --- | --- | --- |
| `consent_public` | `public_consent` | 不変条件 #2 |
| `consent_rules` / `rule_consent` | `rules_consent` | 不変条件 #2 |
| `email` | `response_email` | 不変条件 #3 (system field 識別) |
| `id` | `member_id` / `response_id` / `session_id` 等 | 不変条件 #7 |
| `key` | `stable_key` | 不変条件 #1 |

### Table 命名

| Before | After | 理由 |
| --- | --- | --- |
| `members` | `member_identities` (+ `member_status`) | 2 層分離 |
| `responses` | `member_responses` | 名前空間 |
| `tags` | `member_tags` (+ `tag_definitions`) | 辞書と付与の分離 |
| `notes` | `admin_member_notes` | 不変条件 #12 |
| `manifests` | `schema_versions` | revision/version の概念統一 |

### Migration ファイル名

| Before | After |
| --- | --- |
| `001-tables.sql` | `0001_init.sql` |
| `002-admin.sql` | `0002_admin_managed.sql` |
| `003-auth.sql` | `0003_auth_support.sql` |
| `004-seed.sql` | `0004_seed_tags.sql` |

4 桁 zero-pad で順序保証。

### Seed code 命名

| Before | After |
| --- | --- |
| `cat-1`, `cat-2` | `biz_food`, `biz_it` 等 category prefix + slug |
| `t1`, `t2` | `tag_b_food` 等 tag_id |

## endpoint（このタスクでは 0 件）

なし。
