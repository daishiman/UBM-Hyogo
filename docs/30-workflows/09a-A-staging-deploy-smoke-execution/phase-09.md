# Phase 9: 品質保証 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 11 で取得する 13 evidence・4 approval gate の品質ゲートを定義する。実コマンドで evidence の整合性 / secret 漏洩 / sync_jobs / D1 migration parity を検証する手順を含むため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 9 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 で取得する 13 evidence と 4 approval gate の取得結果に対し、(a) 形式整合性 / (b) secret 漏洩ゼロ / (c) free-tier / (d) D1 migration parity / (e) sync_jobs / audit_log 増分 / (f) governance（branch protection）を機械的に検証するための品質ゲートを確定する。

## 品質ゲートマトリクス

| # | ゲート名 | 検証コマンド | 期待結果 | blocker 種別 | Phase 11 evidence path |
| --- | --- | --- | --- | --- | --- |
| Q1 | lint（ドキュメント） | `mise exec -- pnpm lint` | exit 0 | hard | `outputs/phase-11/evidence/qa-lint.log` |
| Q2 | typecheck | 該当なし（実装コード変更なし。markdown のみ） | スキップ理由を記録 | n/a | `outputs/phase-11/evidence/qa-typecheck.log`（スキップ宣言文のみ） |
| Q3 | branch protection 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq '{required_pull_request_reviews, required_status_checks, required_linear_history, required_conversation_resolution, lock_branch, enforce_admins}'` | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | hard | `outputs/phase-11/evidence/qa-branch-protection.json` |
| Q4 | secret leak gate | `grep -nE 'Bearer\|token=\|sk-\|API_KEY=\|password=' outputs/phase-11/evidence/ -r` | 0 hit | hard | `outputs/phase-11/evidence/qa-secret-leak.log`（grep 出力 0 行） |
| Q5 | evidence 完備 gate（存在 + size > 0） | `for f in <13 evidence path>; do test -s "$f" \|\| echo "MISSING:$f"; done` | `MISSING:` 行が 0 件 | hard | `outputs/phase-11/evidence/qa-evidence-presence.log` |
| Q6 | placeholder 不在 gate | `grep -rn 'NOT_EXECUTED' outputs/phase-11/evidence/` | 0 hit | hard | `outputs/phase-11/evidence/qa-placeholder.log` |
| Q7 | sync_jobs 増分 gate | deploy/smoke 前後の `SELECT COUNT(*) FROM sync_jobs` の diff | diff > 0（schema sync 1 件 + responses sync 1 件以上） | hard | `outputs/phase-11/evidence/qa-sync-jobs-diff.log` |
| Q8 | audit_log 増分 gate | 同上で `audit_log` | diff > 0 | hard | `outputs/phase-11/evidence/qa-audit-log-diff.log` |
| Q9 | D1 migration parity gate | `outputs/phase-11/evidence/d1-migrations-staging.log` 内の pending 行 = 0、または pending 残存時に follow-up unassigned-task が起票済 | pending=0 OR follow-up file 存在 | hard | `outputs/phase-11/evidence/qa-d1-migration.log` |
| Q10 | D1 schema parity diff gate | `jq '.summary.diffCount' outputs/phase-11/evidence/d1-schema-parity.json` | `0`、または `productionMigrationTodo` フィールドに unassigned-task パスが入っている | hard | `outputs/phase-11/evidence/qa-d1-schema-parity.log` |
| Q11 | curl smoke status gate | 各 `curl-public-*.log` / `curl-authz-*.log` の HTTP status を grep（`HTTP/1.1 200` / `HTTP/1.1 401` / `HTTP/1.1 403`） | 期待 status と一致 | hard | `outputs/phase-11/evidence/qa-curl-status.log` |
| Q12 | deploy 成功 gate | `grep -E 'Deployed (ubm-hyogo-(api\|web)-staging\|to https)' outputs/phase-11/evidence/deploy-{api,web}-staging.log` | 各 1 hit 以上 + version ID 抽出可 | hard | `outputs/phase-11/evidence/qa-deploy-success.log` |
| Q13 | wrangler tail 取得 OR 取得不能理由 gate | `outputs/phase-11/evidence/wrangler-tail.log` の 1 行目に「観測開始時刻」または「取得不能理由」テキスト | どちらか必須 | soft（取得不能は AC で許容） | 同 evidence ファイル先頭で兼用 |
| Q14 | free-tier 観測 gate | Phase 11 取得時の Cloudflare ダッシュボード手動確認結果（Workers req / D1 read / Forms quota） | free-tier 上限の 80% 未満。超過時は 09c blocker に記録 | soft | `outputs/phase-11/evidence/qa-free-tier.md` |
| Q15 | 09c blocker 更新 gate | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` の更新差分 | 「09a-A 実測完了済 / 残課題: ...」セクション存在 | hard | `outputs/phase-11/evidence/qa-blocker-update.diff` |

> hard: 失敗時に Phase 13 PR 作成を停止 / soft: 失敗時に `outputs/phase-11/main.md` で理由記録のうえ続行可

## 実行順序と blocking / non-blocking 区分

```
[order]                                [blocking?]
Q1  lint                                blocking（hard）
Q3  branch protection                   blocking（hard）
   --- Phase 11 evidence 取得 ---
Q5  evidence presence                   blocking（hard）
Q6  placeholder 不在                    blocking（hard）
Q4  secret leak                         blocking（hard）
Q11 curl smoke status                   blocking（hard）
Q12 deploy success                      blocking（hard）
Q9  D1 migration parity                 blocking（hard）
Q10 D1 schema parity                    blocking（hard）
Q7  sync_jobs 増分                      blocking（hard）
Q8  audit_log 増分                      blocking（hard）
Q13 wrangler tail                       non-blocking（soft、AC 許容）
Q14 free-tier                           non-blocking（soft、超過は 09c へ）
Q15 09c blocker 更新                    blocking（hard、Phase 13 PR 直前）
Q2  typecheck                           skip（実装コード変更なし）
```

`Q1` と `Q3` は Phase 11 evidence 取得の前段で実施し、CI gate との整合を担保する。`Q5`〜`Q12` は evidence 取得後に順次実施。`Q15` は G4 approval gate と同時に確認する。

## 失敗時の自動修復可否

| ゲート | 自動修復可否 | 失敗時の分岐 |
| --- | --- | --- |
| Q1 lint | ◯（`mise exec -- pnpm lint --fix` を 1 回試行） | 再失敗時は手修正、CONST_007 で先送り禁止 |
| Q3 branch protection | × | drift があれば `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` に従い手動修正 |
| Q4 secret leak | × | 該当 evidence を redact し直して保存。元の差分は破棄 |
| Q5 evidence presence | × | 不足 evidence を Phase 6 異常系シナリオに分岐し再取得 |
| Q6 placeholder 不在 | × | placeholder の混入経路を Phase 6 で特定 |
| Q7 / Q8 sync_jobs / audit_log 増分 | × | Forms sync 再実行（G3 再承認）。429 の場合は Phase 6 異常系に分岐 |
| Q9 / Q10 D1 parity | × | follow-up unassigned-task 起票で blocker を移譲 |
| Q11 curl status | × | api/web deploy 後の伝播待ち（最大 60 秒）→ 再実行 1 回 |
| Q12 deploy success | × | rollback 候補 version ID を取得済のため、Phase 6 rollback 手順に分岐 |
| Q13 wrangler tail | △ | 取得不能理由を evidence 先頭に記録すれば soft pass |
| Q14 free-tier | × | 超過時は 09c blocker に「production deploy 前に free-tier 残量確認」を追記 |
| Q15 09c blocker 更新 | × | 更新漏れは Phase 13 PR 直前で必ず追加 |

> 自動修復は基本不可。`Q1` の `--fix` のみが例外。それ以外は Phase 6 の異常系シナリオに分岐させる。

## evidence の整合性検証手順

Phase 11 evidence 取得後、以下の順で機械チェックを行う。

### Step A: ファイル数検証

```
EVIDENCE_DIR=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence
EXPECTED=13
ACTUAL=$(find "$EVIDENCE_DIR" -maxdepth 2 -type f \
  \( -name 'deploy-*.log' -o -name 'curl-*.log' -o -name 'forms-*.log' \
     -o -name 'sync-jobs-staging.json' -o -name 'audit-log-staging.json' \
     -o -name 'wrangler-tail.log' -o -name 'd1-migrations-staging.log' \
     -o -name 'd1-schema-parity.json' \) | wc -l)
test "$ACTUAL" -ge "$EXPECTED" || echo "EVIDENCE_COUNT_BELOW:$ACTUAL/$EXPECTED"
```

screenshot は `screenshots/` 配下に 4 枚（public-members / login / me / admin）。Playwright report は `playwright-staging/` 配下にディレクトリ存在で OK。これら UI evidence は別途 Step B で個別検証。

### Step B: size > 0 検証

```
for f in $(find "$EVIDENCE_DIR" -type f); do
  test -s "$f" || echo "EMPTY:$f"
done
```

### Step C: hash 記録（後続 09c での再利用に備えた監査用）

```
( cd "$EVIDENCE_DIR" && find . -type f -print0 \
    | xargs -0 sha256sum ) > "$EVIDENCE_DIR/qa-hash.txt"
```

### Step D: mtime 確認（deploy 後に取得されているか）

```
DEPLOY_MTIME=$(stat -f '%m' "$EVIDENCE_DIR/deploy-api-staging.log")
for f in "$EVIDENCE_DIR"/curl-*.log "$EVIDENCE_DIR"/sync-jobs-staging.json; do
  M=$(stat -f '%m' "$f")
  test "$M" -ge "$DEPLOY_MTIME" || echo "MTIME_BEFORE_DEPLOY:$f"
done
```

deploy より前に取得された smoke は無効（古い version の観測）として再取得対象。

### Step E: secret leak grep（Q4 と同じ）

```
grep -rEn 'Bearer|token=|sk-|API_KEY=|password=' "$EVIDENCE_DIR" \
  > "$EVIDENCE_DIR/qa-secret-leak.log" || true
test ! -s "$EVIDENCE_DIR/qa-secret-leak.log"
```

### Step F: placeholder grep（Q6 と同じ）

```
grep -rn 'NOT_EXECUTED' "$EVIDENCE_DIR" \
  > "$EVIDENCE_DIR/qa-placeholder.log" || true
test ! -s "$EVIDENCE_DIR/qa-placeholder.log"
```

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-03.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-08.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`
- `CLAUDE.md`（branch protection / Cloudflare CLI ルール）

## 統合テスト連携

- 上流: 08a coverage gate, 08a-B `/members` search/filter coverage, 08b E2E evidence
- 下流: 09c production deploy execution（Q15 で blocker 更新済 evidence を引き渡す）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 を Q11 / Q12 / Q14 で機械的に確認
- secret 漏洩ゼロ（Q4 / Step E）
- production への副作用なし（Q9 / Q10 は read-only `PRAGMA` のみ）
- placeholder と実測 evidence が物理パス分離（Q6 / Step F）
- coverage 概念は本タスクで適用外（実コード変更なし。Q2 でスキップ宣言）
- CONST_007: 失敗ゲートは Phase 6 / unassigned-task 起票で必ず処理を完結させる

## サブタスク管理

- [ ] Q1〜Q15 を Phase 5 ランブックの step 番号と対応付ける
- [ ] Step A〜F の検証コマンドを Phase 5 ランブックの最終 step に組み込む
- [ ] 失敗時の分岐（Phase 6 異常系シナリオ / unassigned-task 起票）を確定
- [ ] `outputs/phase-09/main.md` を作成

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 品質ゲートマトリクス Q1〜Q15 が evidence path と blocker 種別とともに確定している
- blocking / non-blocking 区分と実行順序が定義されている
- 失敗時の自動修復可否と分岐先が確定している
- evidence 整合性検証 Step A〜F が機械実行可能なコマンドとして揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実装、deploy、commit、push、PR を実行していない
- [ ] coverage 概念が誤用されていない（適用外であることを Q2 で明記）
- [ ] CONST_007 違反（「Phase XX で QA」型の先送り）が無い

## 次 Phase への引き渡し

Phase 10 へ:
- 品質ゲートマトリクス Q1〜Q15
- evidence 整合性検証 Step A〜F のコマンド契約
- soft pass / hard fail の境界（Q13 / Q14 が soft）
- 失敗時に Phase 6 異常系へ戻すか unassigned-task 起票するかの判定基準

## 実行タスク

- [ ] phase-09 の既存セクションに記載した手順・検証・成果物作成を実行する。
