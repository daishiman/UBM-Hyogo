# issue-402 staging runtime evidence 取得

## メタ情報

```yaml
issue_number: 402
```

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | task-issue-402-staging-runtime-evidence-001                       |
| タスク名     | retention purge job staging runtime evidence (Phase-11) 取得      |
| 分類         | runtime-evidence / verification                                   |
| 対象機能     | admin request retention physical delete (cron purge)              |
| 優先度       | High                                                              |
| 見積もり規模 | 中規模                                                            |
| ステータス   | 未実施（user-gate 後に実行）                                      |
| 発見元       | issue-402 Phase 12 unassigned-task-detection / Phase 11 user-gate |
| 発見日       | 2026-05-06                                                        |

---

## 1. 概要

issue-402 の retention purge cron 実装に対する **Phase-11 staging runtime evidence 7 ファイル** の実取得タスク。Gate B（不可逆 destructive apply 含む）に該当するため、user 承認後にしか実行できない。本タスクは spec 化のみ完了しており、実 staging 実行は未着手。

## 2. 背景

issue-402 では `RETENTION_PURGE_MODE=dry-run|apply` の cron 経由物理削除を実装し、Phase-10 までで unit / integration / contract test は緑化済み。Phase-11 で要求される runtime evidence は **staging D1 への実 destructive apply（1 件 only）** を含むため、Phase 12 closeout 時点では取得していない。Phase 13 PR 取り込み前に user-gate を経て取得する必要がある。

## 3. 目的

staging 環境で retention purge job の **dry-run / 1 件 apply / audit / cron 発火** が仕様どおり動作することを 7 種の evidence ファイルで証跡化し、production apply 切替（別タスク）への前提条件を満たす。

## 4. スコープ

### 含むもの (in)

`docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-11/` 配下に以下 7 ファイルを取得・配置:

1. `seed-fixture.sql` — staging に投入する purge 対象 1 件分の seed (deleted_at が retention 期限を超過した固定 UUID 行)
2. `pre-apply-bookmark.txt` — apply 直前の D1 session bookmark（rollback 起点）
3. `dry-run-report.json` — `RETENTION_PURGE_MODE=dry-run` 実行時の cron 出力 (対象 ID 列挙)
4. `apply-result.json` — `RETENTION_PURGE_MODE=apply` 実行時の cron 出力 (削除行数 / 子テーブル連鎖件数)
5. `audit-log-diff.json` — apply 前後の `audit_log` 差分（PII 非混入の検証含む）
6. `invariant-check.log` — 不変条件 (#15 削除済み除外 / 子テーブル orphan ゼロ等) 再検査ログ
7. `cron-trigger-log.txt` — `wrangler cron trigger` 経由の発火ログ（deployment id / timestamp）

### 含まないもの (out)

- production への apply 切替（`task-issue-402-production-apply-enable-001` で扱う）
- audit_log 自体への retention 適用（`task-issue-402-audit-log-retention-followup-001`）
- approve email 文言反映（`task-issue-402-approve-email-template-001`）

## 5. 苦戦箇所として想定される観点

| 項目         | 内容                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 不可逆操作   | apply モードは staging とはいえ実 D1 row を物理削除する。bookmark 取得前に apply すると rollback 不能。順序 (seed → bookmark → dry-run → apply → diff) を厳守しないと evidence 不整合 |
| user-gate 境界 | Phase-11 evidence 取得は user 承認 (Gate B) 必須。Claude が独断で staging apply を発火させない運用境界が SSOT 上で必要                                                              |
| seed 冪等性  | 連続再実行で seed UUID が衝突する。1 回 apply すると同 UUID は次回再投入が必要 → seed-fixture.sql は INSERT OR REPLACE 形にするか、UUID を実行毎に再採番する手順を残す                |
| cron timing  | `wrangler cron trigger` は同期発火だが、内部の D1 batch コミットが非同期に見えるケースがある。bookmark と apply-result の timestamp 整合をどう取るか                                  |
| audit PII    | audit-log-diff.json に member の email / 氏名等が混入していないか、Phase-12 の SSOT (`data-retention-policy.md` §10) 規定どおり member_id ハッシュのみで残っていることを目視+grep      |

## 6. リスクと対策

| リスク                                                                | 影響度 | 発生確率 | 対策                                                                                                              |
| --------------------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| user-gate 前に staging apply を誤発火                                 | 高     | 低       | 実行手順書の冒頭に user 承認確認チェックボックスを必須化。Claude 自律実行は dry-run までに限定                    |
| bookmark 未取得のまま apply し rollback 不能                          | 高     | 中       | apply 直前に必ず `bash scripts/cf.sh d1 ... --json` で bookmark を出力し pre-apply-bookmark.txt に固定するゲート  |
| seed が production と整合しない fake UUID で残存                      | 中     | 中       | seed 用 UUID は `purge-evidence-` prefix で予約し、apply 後に staging から消える前提を invariant-check で確認     |
| audit_log diff に PII 混入                                            | 高     | 低       | invariant-check.log に `rg -n "@|氏名|name" audit-log-diff.json` の結果 0 件を完了条件として埋め込む              |
| cron trigger の実行 ID と Phase-11 evidence の timestamp 不一致       | 中     | 中       | cron-trigger-log.txt に `wrangler` 出力をそのまま貼り、apply-result.json と timestamp 差分を表で残す              |

## 7. 検証方法

### 受け入れ基準

- 7 ファイルがすべて `phase-11/` 配下に存在し、空でない
- dry-run-report.json / apply-result.json の対象 ID が一致（dry-run と apply の同期性）
- audit-log-diff.json に PII 文字列を含まない
- invariant-check.log で不変条件 #15 を含む全項目が PASS
- 実行前後の D1 整合性が pre-apply-bookmark.txt から復元可能（rollback 試験は staging で 1 度だけ実施）

### 実行手順（概要）

```bash
# 1. 承認後 staging seed 投入
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file docs/.../phase-11/seed-fixture.sql

# 2. bookmark 取得
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT 1" \
  | jq -r '.[].meta.served_by_region // .[].results' > .../phase-11/pre-apply-bookmark.txt

# 3. dry-run cron
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --var RETENTION_PURGE_MODE:dry-run
wrangler cron trigger --env staging > .../phase-11/dry-run-report.json

# 4. apply (Gate B)
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --var RETENTION_PURGE_MODE:apply
wrangler cron trigger --env staging > .../phase-11/apply-result.json

# 5. audit diff / invariant
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM audit_log WHERE created_at > '<bookmark時刻>'" > .../phase-11/audit-log-diff.json
```

## 8. 関連

- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/index.md`
- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-11/main.md`
- `docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/data-retention-policy.md`
- `apps/api/src/jobs/` (retention purge job 実装)
- `apps/api/wrangler.toml` (`RETENTION_PURGE_MODE` 環境変数)

## 9. 備考

| 項目 | 内容 |
| ---- | ---- |
| 苦戦箇所 | Phase-11 で 7 ファイルすべてを揃えるには user 承認 → staging apply まで連続発火が必要だが、Phase-12 closeout は user-gate 前に到達するため evidence 未取得のまま spec_created で止める運用境界が必要だった |
| 原因 | 不可逆 apply を Claude 自律で発火させない方針 (Gate B) と、Phase-11 完了判定の同居 |
| 対応 | spec のみ作成し、本タスクとして separation。実取得は user 承認後に着手 |
| 再発防止 | issue-402 system-spec-update-summary.md に「Phase-11 runtime evidence 取得は別 unassigned-task で扱う」と明記 |
