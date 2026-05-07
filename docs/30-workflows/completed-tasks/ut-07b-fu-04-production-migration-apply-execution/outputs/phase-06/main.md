# Phase 6: 単体検証（preflight） — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 6 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |

## 目的

read-only preflight (`d1 migrations list`) で「対象 DB が `ubm-hyogo-db-prod`」「対象 migration `0008_schema_alias_hardening` が既適用 fact と整合する」の二点を二重確認する。本 Phase は duplicate apply 禁止の単体検証に専念し、apply 自体は実施しない。

## 実行タスク

1. `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` を実行する。
2. 出力中の DB 名・env が期待値と一致することを目視確認する（DB ID / UUID は redact）。
3. `0008_schema_alias_hardening` が既適用 fact と整合することを確認する。未適用として見えた場合は apply せず `STALE_LEDGER_OR_ENV_MISMATCH` としてエスカレーションする。
4. 出力を redaction の上 `outputs/phase-11/preflight-list.log` に保存する。
5. 二重チェック: `bash scripts/cf.sh d1 list` で `ubm-hyogo-db-prod` が存在することの目視（必要なら）。

## 単体検証 PASS 条件

| 観点 | PASS 条件 |
| --- | --- |
| exit code | 0 |
| DB 名 | 出力中に `ubm-hyogo-db-prod` の文字列が存在 |
| env | コマンドが `--env production` で発行されていること |
| 既適用 migration | `0008_schema_alias_hardening` が既適用 fact と整合 |
| evidence redaction | account_id / UUID / token が redact 済み |

## 失敗ケースの扱い

| 失敗 | 対処 |
| --- | --- |
| auth 失敗 | `bash scripts/cf.sh whoami` で再確認、1Password の `.env` 参照を確認 |
| DB 名 mismatch | runtime verification に進まず BLOCKED 終了 |
| migration が未適用表示 | apply に進まず `STALE_LEDGER_OR_ENV_MISMATCH` としてエスカレーション |
| wrangler 直接実行誤発動 | 即時中止、wrapper 経由に修正 |

## 参照資料

- scripts/cf.sh
- apps/api/wrangler.toml
- .claude/skills/aiworkflow-requirements/references/database-schema.md

## 多角的チェック観点

- staging DB (`ubm-hyogo-db-staging`) と取り違えていないか
- 出力に raw secret が含まれていないか
- 未適用表示の場合でも apply に進まない設計になっているか

## サブタスク管理

- [ ] preflight 実行コマンドを spec 化
- [ ] PASS 条件表を作成
- [ ] 失敗ケース対処表を作成
- [ ] outputs/phase-06/main.md を作成

## 成果物

- outputs/phase-06/main.md

## 完了条件

- preflight 単体検証の PASS 条件と失敗ケース対処が明確
- evidence redaction 要件が明示

## タスク100%実行確認

- [ ] DB 名 / env が二重確認される手順
- [ ] 未適用表示時に apply へ進まない設計
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 7 へ、read-only post-check 手順を渡す。
## 統合テスト連携

preflight は runtime verification 承認後の CLI evidence として扱う。未承認時は `PENDING_RUNTIME_EVIDENCE` placeholder を Phase 11 に残す。
