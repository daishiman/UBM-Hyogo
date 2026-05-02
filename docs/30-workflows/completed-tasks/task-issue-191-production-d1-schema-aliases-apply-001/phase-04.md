# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

production-operation タスクとしての検証戦略を、(A) 静的検査 / (B) local re-verification / (C) production verification (Phase 13) の 3 層に整理する。

## 実行タスク

- static checks / local re-verification / production verification の責務を分離する。
- Phase 13 承認前に production write を実行しない検証順序を固定する。
- 各検証の expected output と evidence path を定義する。

## (A) 静的検査（Phase 9 で実行）

| ID | 検査内容 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| S-1 | migration ファイル存在 | `ls apps/api/migrations/0008_create_schema_aliases.sql` | exit 0 |
| S-2 | 必須 column 含有 | `rg -n "id\s+TEXT PRIMARY KEY\|stable_key\|alias_question_id\|alias_label\|source\|created_at\|resolved_by\|resolved_at" apps/api/migrations/0008_create_schema_aliases.sql` | 全 column hit |
| S-3 | 必須 index 含有 | `rg -n "idx_schema_aliases_stable_key\|idx_schema_aliases_revision_stablekey_unique\|idx_schema_aliases_revision_question_unique" apps/api/migrations/0008_create_schema_aliases.sql` | 3 index hit |
| S-4 | wrangler 直叩き禁止 | `rg -n "wrangler d1 migrations apply" scripts/ apps/ packages/` | 0 件。docs hit は禁止記述または検査コマンド文字列なので actual invocation から除外 |
| S-5 | production env 固定 | `rg -n "ubm-hyogo-db-prod\|--env production" apps/api/wrangler.toml` | hit あり |

## (B) DDL static re-verification（Phase 9 で実行）

先行タスクで local D1 apply 済みであることを前提に、本タスクでは DDL ソースを再確認する。`apps/api/wrangler.toml` には `[env.development]` がないため、`ubm-hyogo-db-prod-local --env development` の local PRAGMA 手順は正本手順から外し、Phase 13 の production PRAGMA を実測 evidence とする。

| ID | 検査内容 | コマンド |
| --- | --- | --- |
| L-1 | DDL column再確認 | S-2 と同じ |
| L-2 | DDL index再確認 | S-3 と同じ |

## (C) production verification（Phase 13 でユーザー承認後に実行）

| ID | 検査内容 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| P-1 | apply 前 migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` | `0008_create_schema_aliases.sql` のみ unapplied。他 pending があれば NO-GO |
| P-2 | apply 前 table 不在確認 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production --command "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases';"` | 0 行 |
| P-3 | apply 実行 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` | 成功 |
| P-4 | apply 後 table_info | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production --command "PRAGMA table_info(schema_aliases);"` | 9 column |
| P-5 | apply 後 index_list | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production --command "PRAGMA index_list(schema_aliases);"` | 3 index |
| P-6 | apply 後 migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` | `0008_create_schema_aliases.sql` が applied。実際に applied になった migration 差分が target 1件のみ |

## 非対象テスト

- API contract test / web E2E：本タスクは D1 schema apply のみで code deploy しないため対象外。
- データ書き込みテスト：apply 直後の table は空であることが期待される。INSERT 検証は別タスクで扱う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| design review | `phase-03.md` | risk / gate 観点 |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | static check 対象 |
| Phase 11 NON_VISUAL template | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | evidence path 設計 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| test strategy | `phase-04.md` | S/L/P checks と Phase 13 境界 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 9 | S-1〜S-5 / L-1〜L-2 を実行 | `outputs/phase-11/*.md` |
| Phase 13 | P-1〜P-6 を承認後に実行 | `outputs/phase-13/*.txt` |

## 完了条件

- [ ] S-1〜S-5 / L-1〜L-2 / P-1〜P-6 が網羅されている
- [ ] P-1 で target 以外の pending migration があれば NO-GO とする条件が明示されている
- [ ] production verification は Phase 13 承認後にのみ実行される境界が明示されている
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 5: 実装計画
