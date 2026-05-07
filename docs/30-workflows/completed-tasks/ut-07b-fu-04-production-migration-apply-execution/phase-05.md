# Phase 5: 主要実装手順（runbook execution dry-run） — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |
| execution_allowed | false until explicit_user_instruction |

## 目的

Phase 11 で既適用検証 するときに迷わないよう、runbook 由来の実行手順を本仕様書内に再掲・dry-run 形式で固定する。spec_created 段階では既適用検証 を行わない。

## 実装ランブック（実行手順）

### Step 0: 事前確認

```bash
# Phase 13 PR が main に merge 済みであることを確認
git fetch origin main
git log --oneline origin/main | head -5

# Cloudflare 認証
bash scripts/cf.sh whoami
```

期待: PR merge 済み記録 + auth OK（値は redact）。

### Step 1: preflight（既適用確認）

```bash
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production \
  --migration 0008_schema_alias_hardening --expect applied --json \
  | tee outputs/phase-11/preflight-list.log.raw
```

期待: `0008_schema_alias_hardening` が既適用または正本既適用 fact と一致する。未適用表示の場合は apply せずエスカレーションする。

PASS 条件:
- exit code 0
- `0008_schema_alias_hardening` が既適用 fact と整合し、duplicate apply が不要である
- 既に適用済みの場合は「既適用」として evidence に記録し、duplicate apply prohibition path へ進む

### Step 2: ユーザー明示承認の取得

ユーザーに対し以下を明示:
- 対象 DB: `ubm-hyogo-db-prod`
- 対象 environment: `production`
- 対象 migration: `0008_schema_alias_hardening`
- 許可対象: read-only preflight と post-check のみ
- 禁止対象: duplicate migration apply と production D1 mutation

ユーザーの承認テキストを `outputs/phase-11/user-approval-record.md` に記録（個人情報・連絡先は redact）。

### Step 3: duplicate apply prohibition

```text
FORBIDDEN - duplicate production migration apply is not executed.
Reason: production ledger already records 0008_schema_alias_hardening.sql as applied.
```

PASS 条件:
- `d1 migrations apply` を実行していない
- `outputs/phase-11/apply.log` に禁止理由と no-op 判定を記録している
- 未適用表示が出た場合も apply せず、正本 fact drift としてエスカレーションする

### Step 4: post-check

```bash
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production \
  | tee -a outputs/phase-11/post-check.log.raw
```

PASS 条件:
- `schema_diff_queue.backfill_cursor` が存在する
- `schema_diff_queue.backfill_status` が存在する

FAIL 時: forward-fix migration または正本 fact correction の判断をユーザーにエスカレーションし、本タスクは現状を evidence に記録して BLOCKED 終了。D1 physical rollback は行わない。

### Step 5: redaction & 保存

- `*.log.raw` をローカルで開き、account_id / DB UUID / token / OAuth / 個人情報を `<redacted-*>` に置換
- 置換後を `*.log` として保存
- `outputs/phase-11/redaction-checklist.md` に各ファイルの redaction 結果（PASS / FAIL）を記録
- `*.log.raw` は git に含めない（`.gitignore` または手動削除）

## dry-run 確認項目（spec_created 段階）

- [ ] 各コマンドの DB 名 / env / migration 名がすべて `ubm-hyogo-db-prod` / `production` / `0008_schema_alias_hardening` で一貫
- [ ] `tee` のリダイレクト先が `outputs/phase-11/` 配下
- [ ] `wrangler` 直接呼び出しがない
- [ ] `--no-verify` を含まない
- [ ] redaction 手順が含まれる

## 参照資料

- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- apps/api/migrations/0008_schema_alias_hardening.sql
- scripts/cf.sh

## 多角的チェック観点

- duplicate apply 禁止
- forward-fix のみが許される rollback 方針
- redaction を経ない raw log を `outputs/phase-11/` に永続化しない
- ユーザー承認なしで Cloudflare runtime verification に進まない

## サブタスク管理

- [ ] Step 0〜5 を確定
- [ ] PASS / FAIL 条件を各 Step に明記
- [ ] forward-fix 方針を Step 4 に明記
- [ ] outputs/phase-05/main.md を作成

## 成果物

- outputs/phase-05/main.md

## 完了条件

- Step 0〜5 が dry-run 形式で完全に書かれている
- 各 Step に PASS/FAIL/BLOCKED 条件がある
- forward-fix 方針が明示されている

## タスク100%実行確認

- [ ] 既適用検証 を spec_created 段階で実行していない
- [ ] secret 値を含めていない
- [ ] wrapper 経由のみ

## 次 Phase への引き渡し

Phase 6 へ、preflight Step 1 の単体検証手順を渡す。
## 実行タスク

1. FU-03 runbook の wrapper 利用方針を再確認する。
2. production ledger が既適用なら apply step を実行しない。
3. post-check / redaction / system sync の順序を already-applied verification path に合わせる。
4. blocked_until_user_approval の evidence placeholder を作成する。

## 統合テスト連携

runtime command はユーザー承認まで実行しない。`scripts/d1/apply-prod.sh` の既存 wrapper contract を参照し、既適用検証 は禁止 path として扱う。
