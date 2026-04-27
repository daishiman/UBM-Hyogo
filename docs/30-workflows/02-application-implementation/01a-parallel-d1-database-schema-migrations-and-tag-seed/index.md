# 01a-parallel-d1-database-schema-migrations-and-tag-seed - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| ディレクトリ | doc/02-application-implementation/01a-parallel-d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | data |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

`doc/00-getting-started-manual/specs/08-free-database.md` 記載の 16 主要テーブル + 補助テーブル（合計 21 テーブル相当）を Cloudflare D1 migration 化し、`wrangler d1 migrations apply` で local / remote の両方に適用可能にする。`tag_definitions` の 6 カテゴリ初期 seed を投入し、無料枠（5GB / 500k reads / 100k writes）内で 50 人規模 MVP が運用できる構成を確定する。

## スコープ

### 含む
- D1 migration ファイル群（`apps/api/migrations/0001_init.sql` 等、論理単位で分割）
- 全 21 テーブル: `members`（= identities + status の集約 view）, `member_identities`, `member_status`, `member_responses`, `response_sections`, `response_fields`, `member_field_visibility`, `member_tags`, `tag_definitions`, `tag_assignment_queue`, `schema_versions`, `schema_questions`, `schema_diff_queue`, `meeting_sessions`, `member_attendance`, `admin_users`, `admin_member_notes`, `audit_log`, `deleted_members`, `magic_tokens`, `sync_jobs`
- 必須 INDEX（`idx_member_responses_email_submitted`, `idx_member_status_public`, `idx_member_attendance_session`, `idx_member_tags_member`, `idx_tag_queue_status`, `idx_admin_notes_member`, `idx_schema_diff_status` 等）
- `tag_definitions` 6 カテゴリ seed（business / skill / interest / region / role / status）
- `apps/api/wrangler.toml` の `[[d1_databases]]` binding 確定
- migration の up/down 戦略
- 無料枠見積もり表

### 含まない
- repository 層実装（02a/b/c に分離）
- seed の actual data（fixture data は 02c）
- D1 への production データ投入
- backup / restore runbook（09b で扱う）
- migration の cron 自動適用

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 00-serial-monorepo-shared-types-and-ui-primitives-foundation | apps/api scaffold が必要 |
| 下流 | 02a, 02b, 02c, 03a, 03b | repository / sync が DB schema を消費 |
| 並列 | 01b-parallel-zod-view-models-and-google-forms-api-client | 同 Wave 1、互いに独立 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 16 テーブル定義、INDEX、無料枠 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 ↔ schema 対応 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | tag_definitions のカテゴリ根拠 |
| 必須 | CLAUDE.md | 不変条件、無料枠 |
| 参考 | doc/00-getting-started-manual/specs/12-search-tags.md | tag カテゴリ定義 |
| 参考 | doc/00-getting-started-manual/specs/11-admin-management.md | admin_users / audit |

## 受入条件 (AC)

- AC-1: `wrangler d1 migrations apply ubm-hyogo-staging --local` が exit 0
- AC-2: `wrangler d1 migrations apply ubm-hyogo-staging --remote` が exit 0（CI ジョブで検証 placeholder）
- AC-3: 21 テーブルすべて `wrangler d1 execute ubm-hyogo-staging --command="SELECT name FROM sqlite_master WHERE type='table'"` で確認可能
- AC-4: 7 種以上の必須 INDEX が `wrangler d1 execute ... --command="SELECT name FROM sqlite_master WHERE type='index'"` で確認可能
- AC-5: `tag_definitions` に 6 カテゴリの seed が投入され、`SELECT category, COUNT(*) FROM tag_definitions GROUP BY category` で 6 行が返る
- AC-6: `member_attendance` の PRIMARY KEY (`member_id`, `session_id`) が重複登録を阻止する（unit test placeholder）
- AC-7: 無料枠見積もり表が「50 人 × 月 4 回 × 12 ヶ月 = 2,400 attendance, ≈100k member_responses 行」までで 5GB 未満を試算
- AC-8: `apps/api/wrangler.toml` に `[[d1_databases]] binding = "DB"` が定義され、`apps/web/wrangler.toml` には D1 binding が**ない**
- AC-9: migration ファイル名が `NNNN_<purpose>.sql` 形式で順序保証

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/main.md, schema-er.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md, migration-tests.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md, migration-runbook.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md, free-tier-estimate.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md ほか 6 種 |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/schema-er.md | Mermaid ER 図 |
| ドキュメント | outputs/phase-04/migration-tests.md | migration テスト戦略 |
| ドキュメント | outputs/phase-05/migration-runbook.md | apply / rollback 手順 |
| ドキュメント | outputs/phase-09/free-tier-estimate.md | 無料枠見積もり |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | canonical DB | 5GB / 500k reads / 100k writes 無料 |
| wrangler | D1 migration | 無料 |

## Secrets 一覧（このタスクで導入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| なし | - | - | このタスクは secret を扱わない |

D1 binding は wrangler.toml の non-secret 設定。`database_id` は Cloudflare Dashboard で発行された ID で、後続 Wave でも参照する。

## 触れる不変条件

- #1 実フォーム schema をコードに固定しすぎない（schema_questions の stableKey 抽象を維持）
- #2 consent キーは `publicConsent` と `rulesConsent` に統一（member_status カラム名）
- #3 `responseEmail` は system field（member_responses.response_email + member_identities.response_email として保存）
- #4 D1 override で本人プロフィール本文を編集しない（profile_overrides テーブルを作らない）
- #5 apps/web から D1 直接アクセス禁止（wrangler.toml で binding が apps/api 側のみ）
- #7 responseId / memberId 混同禁止（member_responses.response_id と member_identities.member_id を別 PK）
- #10 無料枠（5GB / 500k reads / 100k writes）内
- #15 meeting attendance 重複登録不可（PRIMARY KEY 制約）

## 完了判定

- 13 phase の状態が artifacts.json と一致
- AC-1〜AC-9 が Phase 7 / 10 で完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 不変条件 #1, #2, #3, #4, #5, #7, #10, #15 がすべて schema 設計に組み込み
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- Wave 設計: ../_design/phase-2-design.md
- 共通テンプレ: ../_templates/phase-template-app.md
