# Phase 6: 異常系検証 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 5 ランブックの各 Step で発生し得る異常事象を、検出方法 / evidence 保存先 / escalation path / unassigned-task 起票テンプレで定義する。検出操作のうち redact 検証 / production read-only `PRAGMA` は実環境への副作用が伴うため、docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 6 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 3 リスクマトリクス R1〜R8 と Phase 5 ランブックの各 Step 失敗を網羅する 10 件以上の異常系シナリオ（S01〜S10）を定義し、(a) 検出方法 (b) evidence 保存先 (c) escalation path (d) unassigned-task 起票テンプレ を一意に紐付ける。CONST_007 に従い「Phase XX で対応」と先送りせず、本 Phase もしくは `unassigned-task/` 起票で必ず処理境界を確定する。

## 異常系シナリオマトリクス

### S01 — deploy 失敗（api または web）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 3 で `cf.sh deploy` exit != 0、または log に `Deployed` 行が無い |
| evidence 保存先 | `evidence/deploy/deploy-{api,web}-staging.log`（失敗 log そのまま保存） |
| escalation | rollback 実行 → 原因分類（build error / binding 不整合 / token scope）を `outputs/phase-11/main.md` に記録 |
| unassigned-task 起票 | 修正範囲が apps コード変更を要する場合、下記テンプレで起票 |
| 起票テンプレ | title: `task-09a-staging-deploy-failure-001` / scope: deploy 失敗の根本原因修正 / blocker: 09c production deploy / refs: 当該 deploy log path |

### S02 — health 5xx

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 6 で `/health` 500/502/503 |
| evidence 保存先 | `evidence/curl/curl-public-health.log` + `evidence/wrangler-tail/wrangler-tail.log` |
| escalation | wrangler tail で exception stack を抽出、binding (D1 / KV / Secrets) の不整合を疑う。直近 deploy version へ rollback |
| unassigned-task 起票 | `task-09a-staging-health-5xx-001` / scope: health 復旧 / blocker: 09c |

### S03 — `/public/members` contract 不一致

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 6 で `/public/members*` JSON body の key set が 08a-B Phase 11 contract と不一致。`jq -S 'keys' file.json` 比較 |
| evidence 保存先 | `evidence/curl/curl-public-members-*.log` 全件 + 比較結果 diff |
| escalation | 08a-B 仕様 owner へ差し戻し。本タスクで API 修正は実施しない |
| unassigned-task 起票 | `task-08a-B-contract-drift-from-staging-001` / scope: contract 不一致の解消 / blocker: 09a-A AC #2 / refs: 08a-B Phase 11 contract |

### S04 — D1 pending migration（staging）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 4 で `d1 migrations list` に `[ ]` 行 |
| evidence 保存先 | `evidence/d1/d1-migrations-list.txt` |
| escalation | G2 ゲートで user 承認を取得し apply。承認得られない場合は pending 理由を log 末尾にコメント追記し AC 評価へ送る（CONST_007 例外: 09c blocker として明示処理） |
| unassigned-task 起票 | apply 失敗時のみ `task-09a-d1-pending-migration-followup-001` / scope: pending 解消 / blocker: 09c |

### S05 — D1 schema drift（staging vs production）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 5 で `d1-schema-parity.json.summary.diffCount > 0` |
| evidence 保存先 | `evidence/d1/d1-schema-parity.json` |
| escalation | production 側に未適用 migration が存在 → production migration TODO 起票 |
| unassigned-task 起票テンプレ | 下記参照 |

```markdown
# task-09a-d1-schema-parity-followup-001

## scope
staging と production の D1 schema 差分を解消する production migration TODO

## blocker
09c production deploy execution の前提を満たすため、production への migration apply を別タスクで扱う

## refs
- docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/d1/d1-schema-parity.json
- docs/00-getting-started-manual/specs/08-free-database.md
- apps/api/wrangler.toml の [env.production]

## AC
- production D1 へ不足 migration が apply され、再度 parity 取得で diffCount=0
- evidence: 新規 d1-schema-parity-after.json
```

### S06 — Forms quota 枯渇

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 8 で 429、または response body の `quota_exceeded` |
| evidence 保存先 | `evidence/forms/forms-{schema,responses}-sync.log` |
| escalation | 翌日 retry を `outputs/phase-11/main.md` に schedule として記録（先送りでなく時刻指定の retry 計画）。本 Phase 完了は他 evidence のみで保留しない |
| unassigned-task 起票 | retry 翌日も枯渇継続なら `task-09a-forms-quota-mitigation-001` / scope: quota 設計見直し |

### S07 — wrangler tail 取得不能

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 10 で `cf.sh tail` exit != 0、または timeout 60 内に出力ゼロ |
| evidence 保存先 | `evidence/wrangler-tail/wrangler-tail.log` の冒頭に取得不能理由（token scope / quota / Workers tail 制限）を明記 |
| escalation | AC で取得不能理由の保存を許容（index.md AC #5）。代替として `analytics_engine_datasets` query を試行し、可能なら `evidence/wrangler-tail/analytics-fallback.log` に保存 |
| unassigned-task 起票 | 構造的に取得不能（scope 不足永続）なら `task-09a-wrangler-tail-scope-001` / scope: token scope 拡張 |

### S08 — secret leak 検出

| 項目 | 内容 |
| --- | --- |
| 検出方法 | redact 後 evidence ディレクトリ全体を以下で grep し、ヒット 0 を gate |
| 検証コマンド | `git diff --no-index /dev/null "$EVID" \| grep -EH 'Bearer [A-Za-z0-9._-]+\|token=[A-Za-z0-9._-]+\|sk-[A-Za-z0-9]+\|API_KEY=[A-Za-z0-9._-]+'` で hit 0 |
| evidence 保存先 | leak 検出時は該当 evidence を即削除し、redact pipeline 修正後に再取得。検出ログは保存せず（leak の二次拡散防止） |
| escalation | 検出時は本 Phase の他 evidence もすべて redact pipeline 確認後に再評価。Phase 11 で得た secret は op 経由で rotate 検討 |
| unassigned-task 起票 | leak 経路（log 出力箇所）の修正が apps コード変更を伴う場合 `task-09a-secret-leak-source-fix-001` / scope: leak 経路修正 |

### S09 — 09c blocker 更新 race（親タスク同時更新）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 11 で `task-09c-production-deploy-execution-001.md` を編集中に他 worktree からも編集が入り conflict |
| evidence 保存先 | `outputs/phase-11/main.md` に conflict 発生時刻と相手 PR 番号を記録 |
| escalation | `pnpm sync:check` で他 worktree の遅れを確認、main 同期後に再度 G4 取得して merge |
| unassigned-task 起票 | 同時更新が頻発するなら `task-09c-blocker-update-coordination-001` / scope: blocker 更新フローの整理 |

### S10 — Playwright 環境差分

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 7 で staging 用 spec が手元 chromium で再現せず、または `playwright.staging.config.ts` 不在 |
| evidence 保存先 | `evidence/playwright/` の trace（`trace.zip`）と HTML report |
| escalation | flaky なら最大 2 回 retry。config 不在なら手動 chromium 撮影に fallback し screenshot のみ保存。Playwright fixture 整備は scope 外 |
| unassigned-task 起票 | config 整備が必要なら `task-09a-playwright-staging-config-001` / scope: staging 用 Playwright config 作成 |

### S11 — production 側 D1 への意図せぬ mutation

| 項目 | 内容 |
| --- | --- |
| 検出方法 | コマンド履歴で `--env production` と `migrations apply` / `INSERT` / `UPDATE` / `DELETE` が同時に出現していないかを `history \| grep -E '\-\-env production.*(apply\|INSERT\|UPDATE\|DELETE)'` で検証 |
| evidence 保存先 | `outputs/phase-11/main.md` に検証結果（hit 0 を expect）を記録 |
| escalation | hit 検出時は即停止し、影響範囲を `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output prod-snapshot.sql` で記録 |
| unassigned-task 起票 | `task-09a-production-mutation-incident-001` / scope: production 影響調査と復旧 / blocker: 09c |

### S12 — evidence 不足（13 evidence のうち未取得が残存）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 7 AC ゲートの `evidence file size > 0` と `NOT_EXECUTED 不在` チェックでヒット |
| evidence 保存先 | 該当 evidence path（空ファイルまたは placeholder） |
| escalation | 該当 Step を再実行。S06/S07 由来の許容理由がある場合のみ理由 evidence で AC 通過 |
| unassigned-task 起票 | 構造的に取得不能なら `task-09a-evidence-gap-001` / scope: 不足 evidence の代替取得 |

## production への副作用ゼロ確認手順

以下を Phase 11 完了時に必ず実行し、`outputs/phase-11/main.md` に結果を記録する。

```bash
# 1. production 系コマンドが read-only に限定されていることの履歴検証
history | grep -E '\-\-env production' \
  | grep -vE 'whoami|d1 execute.*PRAGMA|d1 execute.*SELECT|d1 export' \
  && echo "MUTATION DETECTED" || echo "production read-only OK"

# 2. production D1 への変更検出（snapshot diff）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --json \
  --command "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name" \
  > /tmp/prod-schema-after.json
# Step 5 開始時に取得した /tmp/parity/prod-*.json と diff
diff <(jq -S . /tmp/parity/prod-member_responses.json) <(jq -S . /tmp/prod-schema-after.json) \
  && echo "no schema mutation" || echo "schema mutation DETECTED"
```

期待: `MUTATION DETECTED` / `schema mutation DETECTED` のいずれも出力されないこと。
出力された場合: S11 のシナリオに沿って即停止 + 起票。

## secret leak 検出ゲート（S08 の機械検証手順）

```bash
# evidence ディレクトリ全体を redact パターンで grep
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]+|token=[A-Za-z0-9._-]+|sk-[A-Za-z0-9]+|API_KEY=[A-Za-z0-9._-]+|Cookie: [^ ]+'
grep -REn "$LEAK_PATTERNS" "$EVID" \
  && { echo "LEAK DETECTED: 該当 evidence を削除し redact pipeline 修正後に再取得"; exit 1; } \
  || echo "secret leak gate: PASS"
```

このゲートは Phase 11 完了直前および G4 commit 直前の 2 回実行する（多重防御）。

## 検出ヌケ防止のクロスチェック

| Phase 3 リスク | 紐付き異常系 |
| --- | --- |
| R1 secret 漏洩 | S08 |
| R2 D1 schema drift 放置 | S05 |
| R3 staging 枯渇 | S01 / S07 |
| R4 wrangler tail 取得不能 | S07 |
| R5 Forms quota | S06 |
| R6 production read-only 範囲超過 | S11 |
| R7 PII 混入 | S08（PII redact ルール含む） |
| R8 NOT_EXECUTED 混在 | S12 |

追加 2 件: S09 / S10 / S11（合計 11 シナリオ）。

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-03.md`（リスクマトリクス）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-05.md`（Step 別失敗分岐）
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b
- 下流: 09c production deploy execution（本 Phase で起票した unassigned-task が 09c の blocker 解除条件になる）

## 多角的チェック観点

- Phase 3 リスク R1〜R8 のすべてに対応シナリオが紐付いている
- production への mutation 経路が全て検出可能（履歴 grep + schema snapshot diff の二重）
- secret leak が 2 回ゲート（Phase 11 完了直前 / G4 直前）で検証される
- 起票テンプレが title / scope / blocker / refs / AC の 5 項目で揃っている
- CONST_007 に従い「先送り」表現を排除（必ず本 Phase 内処理 or 起票で完結）

## サブタスク管理

- [ ] S01〜S12 の検出方法・evidence path・escalation・起票テンプレを確定
- [ ] secret leak ゲート 2 回実行ポイント（Phase 11 完了直前 / G4 直前）を runbook に伝達
- [ ] production 副作用ゼロ確認手順を Phase 11 完了条件に組み込む指示
- [ ] `outputs/phase-06/main.md` を作成

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 異常系シナリオが 10 件以上定義されている（本 Phase は 12 件）
- 各シナリオに 検出方法 / evidence 保存先 / escalation / 起票テンプレ が揃っている
- secret leak 検出ゲートが機械検証可能なコマンドで提示されている
- production への副作用ゼロ確認手順が機械検証可能な形で提示されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] CONST_007: 「Phase XX で対応」の先送り表現が含まれていない
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない

## 次 Phase への引き渡し

Phase 7 へ:
- 異常系シナリオと AC のクロス対応（特に AC #5 wrangler tail 取得不能許容、AC #7 D1 pending 理由 evidence、AC #8 schema parity diff 起票）
- secret leak ゲート / production 副作用ゼロゲートを AC に組み込む指示
- 起票テンプレ 8 件（S01/S02/S03/S04/S05/S06/S07/S08/S09/S10/S11/S12 のうち成立条件があるもの）

## 実行タスク

- [ ] phase-06 の既存セクションに記載した手順・検証・成果物作成を実行する。
