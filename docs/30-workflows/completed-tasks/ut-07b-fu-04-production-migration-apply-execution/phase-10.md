# Phase 10: production 切替準備 — ut-07b-fu-04-production-migration-apply-execution

[実装区分: 実装仕様書（operations verification + evidence writing）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #424 (CLOSED) |
| execution_allowed | false until explicit_user_instruction |

## 目的

production already-applied verification の直前ゲートとして、(1) ユーザー明示承認の取得、(2) 対象 DB 名・env 再確認、(3) duplicate apply 禁止、(4) forward-fix / fact correction 方針の明記、を満たすことを確認する。

## 実行ゲート（production-readiness）

| Gate | 確認 | PASS 条件 |
| --- | --- | --- |
| G10-1 current spec | FU-04 current workflow が already-applied verification に再分類済み | `index.md` と Phase 11 が duplicate apply forbidden |
| G10-2 user approval | ユーザーから「production read-only verification 実行」明示承認 | テキスト記録を `outputs/phase-11/user-approval-record.md` に保存予定 |
| G10-3 DB / env 二重確認 | `ubm-hyogo-db-prod` / `production` | wrangler.toml と runbook 両方で確認 |
| G10-4 wrapper auth | `bash scripts/cf.sh whoami` PASS | exit 0 |
| G10-5 rollback policy | forward-fix のみ許容 | 本仕様書内に明記 |
| G10-6 staging parity | Phase 9 PASS | staging applied state 再確認済み |

## DB / env 再確認手順

```bash
# wrangler.toml 側
grep -n "ubm-hyogo-db-prod" apps/api/wrangler.toml
grep -n "\[env.production\]" apps/api/wrangler.toml

# inventory / consumed task 側
grep -n "ubm-hyogo-db-prod" .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
```

両方で `ubm-hyogo-db-prod` / `production` が一貫していることを確認する。

## rollback（forward-fix）戦略

- Cloudflare D1 は physical rollback / point-in-time-restore を提供しない（本タスク執筆時点）
- post-check FAIL 時は以下のいずれかを **新規 Issue / 新規 task** で対応:
  1. forward-fix migration（`0009_*.sql` 以降）を作成する
  2. アプリケーション側でカラム / index 不在を吸収する暫定実装
- 本タスク内で `DROP TABLE` / `DROP INDEX` を独自に実行しない
- forward-fix 起票候補は Phase 12 `unassigned-task-detection.md` に記録（FAIL 時のみ）

## ユーザー承認文言テンプレート

承認取得時に以下の確認事項をユーザーに提示する:

```
[production already-applied verification 確認]
- 対象 DB: ubm-hyogo-db-prod
- environment: production
- migration: 0008_schema_alias_hardening
- 許可対象: read-only migrations list / hardening post-check
- 禁止対象: d1 migrations apply / production D1 mutation
- post-check scope: schema_diff_queue.backfill_cursor / backfill_status
上記を確認のうえ、production read-only verification 実行を承認しますか?
```

承認テキスト（"承認します" 等）と日時を `outputs/phase-11/user-approval-record.md` に記録する。

## 参照資料

- apps/api/wrangler.toml
- .claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md
- scripts/cf.sh
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」

## 多角的チェック観点

- 承認文言に read-only 境界と duplicate apply 禁止が明記されているか
- DB / env 取り違えを構造的に防げるか
- forward-fix 方針が明示されているか

## サブタスク管理

- [ ] G10-1〜G10-6 を確定
- [ ] DB / env 再確認手順を spec 化
- [ ] rollback（forward-fix）戦略を確定
- [ ] ユーザー承認文言テンプレートを作成
- [ ] outputs/phase-10/main.md を作成

## 成果物

- outputs/phase-10/main.md

## 完了条件

- 全 6 ゲートが定義済み
- 承認文言テンプレートが本仕様書内に存在
- forward-fix 戦略が明示

## タスク100%実行確認

- [ ] ユーザー承認なしに Phase 11 へ進む導線がない
- [ ] DB / env 取り違え防止策がある
- [ ] secret 値を含めていない

## 次 Phase への引き渡し

Phase 11 へ、production read-only verification + duplicate apply prohibition evidence 取得手順を渡す。
## 実行タスク

1. 既適用 verification path を承認対象として提示する。
2. duplicate apply command を実行禁止として明記する。
3. ユーザー承認がない場合は Phase 11 を `blocked_until_user_approval` に固定する。

## 統合テスト連携

本 Phase では runtime command を実行しない。承認文と対象 DB / migration / no-duplicate-apply gate を Phase 11 に渡す。
