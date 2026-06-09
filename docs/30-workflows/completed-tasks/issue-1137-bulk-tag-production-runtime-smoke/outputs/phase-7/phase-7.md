# Phase 7: カバレッジ確認 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

本タスクで変更した範囲のみを対象に、concern（受入条件 AC）と dependency edge（runner → CI job → secret / runner → cf.sh → D1）の coverage を可視化する。
全件一律のカバレッジ計測ではなく、**変更したファイル/ブロック**（`runtime-tag-bulk.sh` の新規・変更ブランチ、production seed/cleanup SQL の各 DELETE/INSERT）に焦点を当てる。

> shell runner は行カバレッジ計測ツール（istanbul 等）を持たないため、ここでは「分岐（branch）が local test で踏まれるか」を手動トレースで保証する。
> production real D1 への書き込みを伴う経路（seed/POST/cleanup の正常系）は本サイクルでは実走しない（user 二重承認後・Phase 11）。本 Phase が責任を持つのは **guard / 分岐選択 / SQL 文の静的正当性** の coverage である。

## 対象範囲（変更したブロックのみ）

### `scripts/smoke/runtime-tag-bulk.sh`（編集）

| ブロック | 種別 | カバレッジ対象 |
| -------- | ---- | -------------- |
| `parse_args` の `case "$ENVIRONMENT"`（staging / production / *）| 変更 | env 受理拡張の 3 分岐すべて |
| `configure_environment`（env 値の一元確定）| 変更 | staging 値が現状と完全一致し、production 変数群も確定すること |
| `assert_production_guard`（新規）| 新規 | D1 名チェック / 二重承認 marker / allowlist regex の 3 exit 2 経路 |
| `main()` の guard 呼び分け（staging→`assert_staging_guard` / production→`assert_production_guard`）| 変更 | env に応じた guard 選択の 2 分岐 |
| `run_d1`（`--env "$ENVIRONMENT"` 一般化）| 変更 | ENVIRONMENT=staging / production の双方で正しい `--env` を渡す |
| `assert_staging_guard` | 不変（AC-6）| 逐語変更なし。既存 test PASS で非退化を確認 |

### `apps/api/migrations/seed/bulk-tag-production-seed.sql`（新規）

| 文 | カバレッジ対象 |
| -- | -------------- |
| `DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_prod_tagbulk_%'` | 再実行安全性（既存 prefix 行の先行削除）|
| `DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_prod_tagbulk_%'` | 同上（audit の再実行安全）|
| `INSERT OR REPLACE INTO member_responses (...)` ×2 | seed member 2 件 |
| `INSERT OR REPLACE INTO member_identities (...)` ×2 | member 解決対象 2 件 |
| `INSERT OR REPLACE INTO member_status (...)` ×2（`publish_state='member_only'`, `is_deleted=0`）| 公開面非露出・有効 member |
| `INSERT OR REPLACE INTO tag_definitions (..., active=1)` ×2 | 有効 tag 2 件 |

### `apps/api/migrations/seed/bulk-tag-production-cleanup.sql`（新規）

| 文 | カバレッジ対象 |
| -- | -------------- |
| `DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 1/6 |
| `DELETE FROM audit_log WHERE target_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 2/6 |
| `DELETE FROM member_status WHERE member_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 3/6 |
| `DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 4/6 |
| `DELETE FROM member_responses WHERE response_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 5/6 |
| `DELETE FROM tag_definitions WHERE tag_id LIKE 'e2e_test_prod_tagbulk_%'` | cleanup table 6/6 |

## テストケース → AC → コードブランチ 対応表（concern coverage）

| テストケース（local / `runtime-tag-bulk.test.sh`）| 検証 AC | 踏むコードブランチ | 種別 |
| ------------------------------------------------- | ------- | ------------------ | ---- |
| production-no-approval-refused | AC-3 | `assert_production_guard` の APPROVAL_1 marker チェック → exit 2 | 新規分岐 |
| production-single-approval-refused | AC-3 | `assert_production_guard` の APPROVAL_2 欠落チェック → exit 2 | 新規分岐 |
| production-wrong-host-refused | AC-1 | `assert_production_guard` の allowlist regex 不一致 → exit 2 | 新規分岐 |
| production-wrong-d1-refused | AC-1 / I-4 | `assert_production_guard` の `CF_D1_DATABASE != ubm-hyogo-db-prod` → exit 2 | 新規分岐 |
| production-missing-base-refused | — | `configure_environment` の `PRODUCTION_API_BASE` 未設定 → exit 2 | 新規分岐 |
| production-config-selected | AC-2 / AC-8 | `case staging\|production)` → `configure_environment` で PREFIX/D1/SQL/MEMBER_IDS/TAG_IDS が production 値に確定 | 新規分岐 |
| unknown-env-refused | — | `case *)` → exit 2 | 変更分岐 |
| staging-guard-non-regression（既存）| AC-6 / I-7 | `assert_staging_guard` 既存ケースが PASS（production-env-refused / production-url-refused / d1-database-refused）| 不変分岐 |
| seed-sql-prefix-grep（SQL gate）| AC-2 | seed SQL の全文に `e2e_test_prod_tagbulk_` のみ・staging prefix 不在 | 静的検査 |
| cleanup-sql-prefix-grep（SQL gate）| AC-2 / AC-4 | cleanup SQL の 6 DELETE すべてが `e2e_test_prod_tagbulk_%` | 静的検査 |

> AC-4（cleanup 残件 0 assert）/ AC-5（audit parity）/ AC-7（redaction）の **正常系実走** は real D1 接続を要するため Phase 11（user 二重承認後）で証跡取得する。本 Phase ではそれらを実装する runner ブロック（`count_by_table` / `audit_count` / `write_summary` / `redact`）が env 非依存で production 値を受けて動作する設計上の整合だけを確認する（Phase 2 設計済み・コード変更不要）。

## production guard の分岐カバレッジ目標（exit 2 経路の全踏破）

`assert_production_guard` の各 refuse 経路を local test が**すべて**踏むこと。

| # | refuse 条件 | 対応テストケース | 踏破 |
| - | ----------- | ---------------- | ---- |
| 1 | `CF_D1_DATABASE != ubm-hyogo-db-prod` | production-wrong-d1-refused | ✓ 必須 |
| 2 | `BULK_TAG_PRODUCTION_SMOKE_APPROVAL != issue-1137-production-bulk-tag-smoke` | production-no-approval-refused | ✓ 必須 |
| 3 | `BULK_TAG_PRODUCTION_SMOKE_CONFIRM` 空 | production-single-approval-refused | ✓ 必須 |
| 4 | `BASE` が allowlist regex 不一致 | production-wrong-host-refused | ✓ 必須 |

→ **目標: 上記 4 経路すべてに対応する local test ケースが存在し、`runtime-tag-bulk.test.sh` 実行で各々が exit 2 を確認すること**。1 つでも未踏破なら Phase 6（テスト拡充）へ差し戻す。

加えて `configure_environment` の production 必須 env 欠落経路（`PRODUCTION_API_BASE` / `PRODUCTION_ADMIN_BEARER` 未設定 → exit 2）も local test で踏む（production-missing-base-refused）。

## dependency edge coverage（contract の3層断絶チェック）

| edge | 検証手段 | 本 Phase での担保 |
| ---- | -------- | ------------------ |
| runner → cf.sh → D1（`run_d1` が `--env "$ENVIRONMENT"` で production を渡す）| `run_d1` 定義の grep + production env で ENVIRONMENT=production になる configure を test | ✓ 静的＋local test |
| runner → endpoint（`POST /admin/members/tags/bulk`）| endpoint 不変（issue-1036 landed）。runner の URL 構築が `$BASE + path` | ✓ 既存 contract spec が endpoint shape を保証 |
| CI job → secret（`PRODUCTION_API_BASE` / `PRODUCTION_ADMIN_BEARER` / `BULK_TAG_PRODUCTION_SMOKE_APPROVAL`）| `verify required production secrets` step が欠落で exit 1 | Phase 9 の actionlint + secret 検証 step で担保 |
| CI job → runner（production env + dual marker 受け渡し）| dual marker env マッピングを actionlint で検証 | Phase 9 |

## 完了判定チェックリスト

- [ ] 変更した runner ブロック（`parse_args` case / `configure_environment` / `assert_production_guard` / `main` guard 呼び分け / `run_d1`）を対象範囲として列挙した
- [ ] production seed/cleanup SQL の各 DELETE/INSERT を対象範囲として列挙した
- [ ] テストケース → AC → コードブランチ の対応表で全 AC（AC-1〜AC-8）に最低 1 ケースが紐づく
- [ ] `assert_production_guard` の 4 つの exit 2 経路すべてに local test ケースが対応する（分岐カバレッジ目標）
- [ ] `configure_environment` の production 必須 env 欠落経路に local test ケースが対応する
- [ ] staging guard 非退化（AC-6 / I-7）が既存 local test の PASS で担保される
- [ ] AC-4 / AC-5 / AC-7 の正常系実走は Phase 11（user 二重承認後）に委譲する境界が明記されている
- [ ] dependency edge（runner → cf.sh → D1 / CI job → secret / CI job → runner）の coverage 手段を特定した
