# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 6 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 5 (実装ランブック) |
| 下流 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

migration apply / 制約違反 / 5xx に相当する D1 エラー / sync 失敗（`sync_jobs` への error 記録）を網羅し、対応方針を確定する。

## 実行タスク

1. failure case 一覧化（migration / 制約 / 容量超過 / network / sync 失敗）
2. 不変条件違反の意図 trigger（`profile_overrides` 追加、apps/web に binding 追加）
3. 修復手順
4. outputs/phase-06/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/migration-tests.md | constraint test |
| 必須 | outputs/phase-05/migration-runbook.md | step ごと sanity |

## 実行手順

### ステップ 1: failure case 表
### ステップ 2: 不変条件 trigger
### ステップ 3: 修復手順
### ステップ 4: outputs

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC matrix の異常系列 |
| Phase 9 | 無料枠超過対応 |

## 多角的チェック観点（不変条件参照）

- **#4**: `profile_overrides` テーブル追加を意図 trigger → review reject
- **#5**: apps/web/wrangler.toml に D1 binding 追加 → grep test fail
- **#7**: response_id を member_id として誤代入 → repository 層で型 error（02a で確認）
- **#10**: D1 storage 超過時の挙動

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure case | 6 | pending | 12 件以上 |
| 2 | 不変条件 trigger | 6 | pending | 4 件 |
| 3 | 修復手順 | 6 | pending | 各ケース |
| 4 | outputs | 6 | pending | outputs/phase-06/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases + 修復 |
| メタ | artifacts.json | Phase 6 を completed |

## 完了条件

- [ ] failure case 12 件以上
- [ ] 各ケースに修復手順

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-06/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 7
- 引き継ぎ事項: failure case
- ブロック条件: 未完成

## Failure Cases 一覧

| # | カテゴリ | ケース | 期待 / 検出 | 修復 |
| --- | --- | --- | --- | --- |
| 1 | migration | SQL syntax error | wrangler exit 1 | DDL 修正 |
| 2 | migration | 部分 apply 後 fail | `migrations list` で 一部済 | 修正 → 続き apply |
| 3 | constraint | attendance 重複 INSERT | UNIQUE constraint failed (#15) | upsert に書き換え（実装は 02b） |
| 4 | constraint | identities email 重複 | UNIQUE constraint failed | response sync で current_response_id 切替 |
| 5 | constraint | tag_definitions code 重複 | UNIQUE constraint failed | seed の uniqueness 確認 |
| 6 | sync 失敗 | Forms API 401 | sync_jobs.status='failed', error_json 記録 | secret 確認 |
| 7 | sync 失敗 | Forms API 5xx | sync_jobs に retry 状態 | retry 戦略（03a/b） |
| 8 | network | wrangler timeout | exit 1 | retry / Cloudflare ステータス確認 |
| 9 | network | D1 接続切れ | 5xx 相当 | apps/api 側 retry |
| 10 | 容量 | D1 storage 5GB 接近 | wrangler info で warning | Phase 9 で archive 戦略 |
| 11 | 容量 | reads 500k/day 超過 | 429 | cache 戦略（後続 Wave） |
| 12 | seed | INSERT IGNORE で skip | 行数 < 41 | seed SQL 確認 |
| 13 | invariant #4 | `profile_overrides` 追加 PR | code review reject | 削除 |
| 14 | invariant #5 | apps/web/wrangler.toml に binding | grep test fail | 削除 |
| 15 | invariant #7 | member_responses.response_id を `member_id` に rename | type test fail (02a) | rename 戻す |
| 16 | invariant #2 | member_status.consent カラム名 `ruleConsent` | spec drift | `rules_consent` に修正 |
