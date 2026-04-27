# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 1 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | なし |
| 下流 Phase | 2 (設計) |
| 状態 | pending |

## 目的

D1 schema 化の真の論点（true issue）と依存境界、4 条件評価、不変条件マッピングを Phase 1 で固定し、Phase 2 で具体 SQL DDL に進む根拠を確定する。

## 真の論点

- **issue 1**: 16 主要テーブル（specs/08-free-database.md）を一気に migration 化すると、後続 02a/b/c の repository が前提とする schema が同時にロックされ、変更コストが跳ねる。**論点**: テーブルを「migration 単位の論理 group」にどう分割するか
- **issue 2**: `member_responses`（毎回保存）と `member_identities`（stable member）の 2 層構造を D1 で持つことが正しいか。同一 email の再回答で `current_response_id` を切替する設計を schema で正しく表現できるか
- **issue 3**: `tag_definitions` を 6 カテゴリで初期 seed する際、specs/12-search-tags.md の category 定義と整合するか
- **issue 4**: 無料枠（5GB / 500k reads / 100k writes）内で 50 人 × 月 4 回 × 12 ヶ月運用が成立する INDEX 設計か
- **issue 5**: 不変条件 #4 を守るため `profile_overrides` を作らない（specs/08 にも明記）

## 依存境界

- **schema 境界**: form-driven（`member_responses` / `response_sections` / `response_fields` / `schema_versions` / `schema_questions`）と admin-managed（`meeting_sessions` / `member_attendance` / `tag_definitions` / `tag_assignment_queue` / `admin_member_notes` / `admin_users`）を物理的に分離
- **layer 境界**: 回答層（`member_responses`）と stable member 層（`member_identities` + `member_status`）を別 PK
- **infra 境界**: D1 binding は `apps/api/wrangler.toml` のみ、`apps/web/wrangler.toml` には binding を持たない
- **secret 境界**: このタスクは secret を扱わない、`database_id` は non-secret

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 後続 02a/b/c の 3 並列 repository / 03a/b の同期が schema 確定で同時着手可能 |
| 払うコスト | 20 physical tables + 1 view + 7 INDEX + 6 カテゴリ seed の初期投資 |
| 払わないコスト | repository 実装 / sync logic / data migration |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 後続 5 タスクをブロック解除できるか | PASS | 02a/b/c + 03a/b が schema を消費 |
| 実現性 | 無料枠内で成立するか | PASS | 50 人 × 12 ヶ月運用試算で 5GB 未満（Phase 9 で詳細） |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | PASS | binding は apps/api のみ、staging/production で別 database_id |
| 運用性 | rollback / handoff / same-wave sync が成立するか | PASS | migration up/down、rollback migration 方針を Phase 5 で runbook、backup/restore は 09b に分離 |

## 実行タスク

1. 不変条件 #1, #2, #3, #4, #5, #7, #10, #15 のマッピング表を作成
2. 20 physical tables + 1 viewを「form-driven (8) / admin-managed (8) / 認証補助 (4)」3 group に分類
3. 必須 INDEX 7 種を確定
4. `tag_definitions` 6 カテゴリ（business / skill / interest / region / role / status）の seed 件数を仮確定
5. AC-1〜AC-9 を quantitative に確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 16 テーブル定義 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 ↔ schema 対応 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | tag カテゴリ根拠 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag 検索仕様 |
| 必須 | CLAUDE.md | 不変条件、無料枠 |

## 実行手順

### ステップ 1: 不変条件マッピング作成
### ステップ 2: テーブル group 分類
### ステップ 3: INDEX 一覧確定
### ステップ 4: seed カテゴリ確定
### ステップ 5: outputs/phase-01/main.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | テーブル group → migration ファイル分割の入力 |
| Phase 4 | AC → migration test の入力 |
| Phase 7 | AC matrix のトレース元 |
| Phase 9 | 無料枠見積もりの根拠 |

## 多角的チェック観点（不変条件参照）

- **#1**: schema_questions / schema_versions で stableKey を抽象化、列に `question_id` を直書きしない
- **#2**: `member_status.public_consent` / `member_status.rules_consent` で命名統一
- **#3**: `member_responses.response_email` + `member_identities.response_email` を column 化、PK にしない
- **#4**: `profile_overrides` テーブルを作らない（specs/08 §保存ルール）
- **#5**: `apps/web/wrangler.toml` に D1 binding を一切記載しない
- **#7**: `member_responses.response_id`（PK）と `member_identities.member_id`（PK）を別列名
- **#10**: 50 人 × 12 ヶ月運用で 5GB 未満を試算
- **#15**: `member_attendance` の PRIMARY KEY (`member_id`, `session_id`) で重複阻止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 不変条件マッピング | 1 | pending | 8 不変条件 |
| 2 | テーブル group 分類 | 1 | pending | 3 group |
| 3 | INDEX 一覧 | 1 | pending | 7 種 |
| 4 | seed カテゴリ | 1 | pending | 6 件 |
| 5 | AC quantitative 化 | 1 | pending | 9 件 |
| 6 | outputs 作成 | 1 | pending | outputs/phase-01/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 真の論点 / 依存境界 / 価値とコスト / 4 条件 / 不変条件マッピング |
| メタ | artifacts.json | Phase 1 を completed |

## 完了条件

- [ ] 真の論点 5 件、不変条件マッピング 8 件、4 条件 PASS、AC 9 件 quantitative が outputs に明記
- [ ] テーブル 20 件が 3 group に分類済み
- [ ] 必須 INDEX 7 種が列挙

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] outputs/phase-01/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: テーブル group → migration 分割、INDEX 一覧 → DDL
- ブロック条件: outputs/phase-01/main.md 未作成

## テーブル group 分類

### Group A: form-driven（同期で書き換え）
1. `schema_versions`
2. `schema_questions`
3. `schema_diff_queue`
4. `member_responses`
5. `response_sections`
6. `response_fields`
7. `member_field_visibility`
8. `member_identities`

### Group B: admin-managed（運用で書き換え）
1. `member_status`
2. `meeting_sessions`
3. `member_attendance`
4. `tag_definitions`
5. `member_tags`
6. `tag_assignment_queue`
7. `admin_member_notes`
8. `deleted_members`

### Group C: 認証 / 補助
1. `admin_users`
2. `magic_tokens`
3. `sync_jobs`
4. （`form_field_aliases` 相当は schema_diff_queue で吸収）

## 必須 INDEX 7 種

| INDEX 名 | テーブル | 列 | 用途 |
| --- | --- | --- | --- |
| `idx_member_responses_email_submitted` | member_responses | (response_email, submitted_at) | 同 email の最新検索 |
| `idx_member_status_public` | member_status | (public_consent, publish_state, is_deleted) | 公開一覧 filter |
| `idx_member_attendance_session` | member_attendance | (session_id) | 開催別参加者 |
| `idx_member_tags_member` | member_tags | (member_id) | profile タグ取得 |
| `idx_tag_queue_status` | tag_assignment_queue | (status, created_at) | resolve queue |
| `idx_admin_notes_member` | admin_member_notes | (member_id, updated_at) | drawer note 表示 |
| `idx_schema_diff_status` | schema_diff_queue | (status, created_at) | alias 割当 queue |

## tag_definitions 6 カテゴリ

| category | 例 | 件数（仮） |
| --- | --- | --- |
| business | 飲食 / IT / 製造 / コンサル / 金融 | 10 |
| skill | デザイン / マーケ / 営業 / 開発 | 10 |
| interest | 0to1 / 1to10 / 10to100 | 5 |
| region | 神戸 / 西宮 / 姫路 / 阪神 / 北播磨 | 8 |
| role | 経営者 / 個人事業主 / 会社員 | 5 |
| status | active / observer / candidate | 3 |

合計初期 seed 約 41 行（Phase 5 で確定）。
