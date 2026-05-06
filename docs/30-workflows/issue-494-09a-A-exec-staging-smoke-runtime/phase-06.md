# Phase 6: 異常系検証 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Phase 5 ランブックの各 Step で発生し得る異常事象を、検出方法 / evidence 保存先 / escalation path / unassigned-task 起票テンプレで定義する。検出操作のうち redact 検証 / production read-only `PRAGMA` / `cf.sh rollback` は実環境への副作用が伴うため、CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| issue | #494 (`UT-09A-A-EXEC-STAGING-SMOKE-001`) |
| phase | 6 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 3 リスクマトリクスと Phase 5 ランブックの各 Step 失敗を網羅する 12 件の異常系シナリオ（S01〜S12）を定義し、(a) 検出方法 (b) evidence 保存先 (c) escalation path (d) unassigned-task 起票テンプレ を一意に紐付ける。

CONST_007: 「Phase XX で対応」と先送りせず、本 Phase もしくは `unassigned-task/` 起票で必ず処理境界を確定する。

## 異常系シナリオマトリクス

### S01 — deploy 失敗（api または web）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 2 で `cf.sh deploy` exit != 0、または log に `Deployed` 行が無い |
| evidence 保存先 | `evidence/deploy/deploy-{api,web}-staging.log`（失敗 log そのまま保存）+ `evidence/deploy/{api,web}-prev-version-id.txt` |
| escalation | `bash scripts/cf.sh rollback "$(cat $EVID/deploy/api-prev-version-id.txt)" --config apps/api/wrangler.toml --env staging` で旧 version へ戻す。原因分類（build error / binding 不整合 / token scope）を `outputs/phase-11/main.md` に記録 |
| revert 手順 | api 失敗時は web deploy を実行しない。web 失敗時は api 側の rollback 検討（contract 不整合がある場合） |
| unassigned-task 起票 | apps コード変更を要する場合、下記テンプレで起票 |
| 起票テンプレ | title: `task-09a-staging-deploy-failure-001` / scope: deploy 失敗の根本原因修正 / blocker: 09c production deploy / refs: 当該 deploy log path / AC: deploy 成功 + version_id 記録 |

### S02 — health 5xx

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 3.1 で `/health` 500/502/503 |
| evidence 保存先 | `evidence/curl/curl-public-health.log` + `evidence/wrangler-tail/api-30min.log` |
| escalation | wrangler tail で exception stack を抽出、binding (D1 / KV / Secrets) の不整合を疑う。直近 deploy version へ rollback |
| 起票テンプレ | title: `task-09a-staging-health-5xx-001` / scope: health 復旧 / blocker: 09c / refs: tail log + binding 設定 / AC: `/health` 200 |

### S03 — `/public/members` contract 不一致

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 3.1 で `/public/members*` JSON body の key set が 08a-B Phase 11 contract と不一致。`jq -S 'keys' file.json` 比較で diff |
| evidence 保存先 | `evidence/curl/curl-public-members-*.log` 全件 + 比較 diff を `outputs/phase-11/contract-diff.log` |
| escalation | 08a-B 仕様 owner へ差し戻し。本タスクで API 修正は実施しない（spec 越境禁止） |
| 起票テンプレ | title: `task-08a-B-contract-drift-from-staging-001` / scope: contract 不一致の解消 / blocker: 09a-A AC2 / refs: 08a-B Phase 11 contract + 本 evidence |

### S04 — D1 migration apply 中断 / 失敗

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 4 で apply コマンドが exit != 0、または apply 後 `migrations list` に pending が残存 |
| evidence 保存先 | `evidence/d1/d1-migrations-staging.log` / `evidence/d1/backup-pre-apply.sql` |
| 中断時手順 | 1) `backup-pre-apply.sql` を保持（削除しない） 2) `cf.sh d1 migrations list` で実 schema 状態を再評価 3) 部分適用された migration の row があれば手動評価 |
| escalation | D1 には自動 rollback CLI が存在しないため、復旧は別タスクで扱う。本 Phase では apply 中断状態の evidence を確保する |
| 起票テンプレ | title: `task-09a-d1-pending-migration-followup-001` / scope: pending 解消 + 部分適用 row の cleanup / blocker: 09c / refs: backup-pre-apply.sql + apply log |

### S05 — D1 schema drift（staging vs production）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 5 で `d1-schema-parity.json.summary.diffCount > 0` |
| evidence 保存先 | `evidence/d1/d1-schema-parity.json` |
| escalation | production 側に未適用 migration が存在 → production migration TODO 起票（本タスクで production apply は禁止） |
| 起票テンプレ | 下記参照 |

```markdown
# task-09a-d1-schema-parity-followup-001

## scope
staging と production の D1 schema 差分を解消する production migration TODO

## blocker
09c production deploy execution の前提を満たすため、production への migration apply を別タスクで扱う

## refs
- docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/d1/d1-schema-parity.json
- docs/00-getting-started-manual/specs/08-free-database.md
- apps/api/wrangler.toml の [env.production]

## AC
- production D1 へ不足 migration が apply され、再度 parity 取得で diffCount=0
- evidence: 新規 d1-schema-parity-after.json
```

### S06 — Forms quota 枯渇 / リトライ・スキップ判定

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 6 で 429、または response body の `quota_exceeded` / `RATE_LIMIT_EXCEEDED` |
| evidence 保存先 | `evidence/forms/forms-{schema,responses}-sync.log` |
| リトライ判定 | 429 を受領 → 翌日 09:00 JST に retry を `outputs/phase-11/main.md` に時刻指定で記録（先送りでなく retry 計画として明記） |
| スキップ判定 | schema sync 成功・responses sync のみ 429 の場合、responses sync を当日スキップして翌日 retry。両方 429 の場合は当日スキップで G3 を完了扱いとせず Phase 11 を中断 |
| escalation | 翌日 retry も枯渇継続なら quota 設計見直し起票 |
| 起票テンプレ | title: `task-09a-forms-quota-mitigation-001` / scope: quota 設計見直し（Forms API project 分割 / 同期間隔調整） / blocker: 09c / refs: 当該 forms-sync.log |

### S07 — wrangler tail 取得不能（token scope / quota 不足）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 3.3 で `cf.sh tail` exit != 0、または timeout 1800 内に出力ゼロ、または `Insufficient permissions` エラー |
| evidence 保存先 | `evidence/wrangler-tail/api-30min.log` の **冒頭に取得不能理由を必ず明記**（理由ログ要件）|
| 理由ログ要件（必須記載項目） | 1) 取得試行時刻（ISO 8601）2) `cf.sh tail` の exit code 3) stderr 末尾 5 行 4) `cf.sh whoami` の token scope 抜粋（実値は redact）5) 代替手段試行有無 |
| escalation | AC5 で「取得不能理由保存」を許容。代替: `analytics_engine_datasets` query を試行し、可能なら `evidence/wrangler-tail/analytics-fallback.log` に保存 |
| 起票テンプレ | title: `task-09a-wrangler-tail-scope-001` / scope: token scope 拡張または analytics fallback 整備 / blocker: AC5 永続的不能時のみ |

### S08 — secret leak / Cloudflare auth 再失敗

| 項目 | 内容 |
| --- | --- |
| 検出方法 (a) leak | redact 後 evidence に `Bearer\|token=\|sk-\|API_KEY=\|Cookie:` のパターン grep ヒット |
| 検出方法 (b) auth 再失敗 | Phase 5 Step 0 / 任意 Step で `cf.sh whoami` 失敗、または op:// 注入失敗 |
| 検証コマンド | `LEAK_PATTERNS='Bearer [A-Za-z0-9._-]+\|token=[A-Za-z0-9._-]+\|sk-[A-Za-z0-9]+\|API_KEY=[A-Za-z0-9._-]+\|Cookie: [^ ]+'; grep -REn "$LEAK_PATTERNS" "$EVID"` で hit 0 |
| evidence 保存先 | leak 検出時は **該当 evidence を即削除**し、redact pipeline 修正後に再取得（leak の二次拡散防止） |
| op:// 参照確認手順 | Phase 5「Cloudflare auth 再失敗時の op:// 参照確認手順」に従い、(1) `.env` の plaintext 値不在確認 (2) `op signin` 再実行 (3) `op run --env-file=.env -- ...` 注入確認 (4) 1Password 側 token rotation |
| escalation | leak 経路の修正が apps コード変更を伴う場合のみ起票 |
| 起票テンプレ | title: `task-09a-secret-leak-source-fix-001` / scope: leak 経路修正 / blocker: 任意 evidence 取得 |

### S09 — 09c blocker 更新 race（親タスク同時更新）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 8 で `task-09c-production-deploy-execution-001.md` を編集中に他 worktree からも編集が入り conflict、または `git commit` 直前 `pnpm sync:check` で他 worktree が先行 |
| evidence 保存先 | `outputs/phase-11/main.md` に conflict 発生時刻と相手 PR/branch 番号を記録 |
| escalation | `pnpm sync:check` で他 worktree の遅れを確認、main 同期後に再度 G4 を取得して merge |
| 起票テンプレ | title: `task-09c-blocker-update-coordination-001` / scope: blocker 更新フロー整理 / blocker: 09c |

### S10 — Playwright 環境差分

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 3.2 で staging 用 spec が手元 chromium で再現せず、または `playwright.staging.config.ts` 不在 |
| evidence 保存先 | `evidence/playwright/` の trace（`trace.zip`）と HTML report |
| escalation | flaky なら最大 2 回 retry。config 不在なら手動 chromium fallback で screenshot のみ保存（Phase 5 Step 3.2 fallback 手順）|
| 起票テンプレ | title: `task-09a-playwright-staging-config-001` / scope: staging 用 Playwright config 作成 |

### S11 — production 側 D1 への意図せぬ mutation

| 項目 | 内容 |
| --- | --- |
| 検出方法 | コマンド履歴で `--env production` と `migrations apply` / `INSERT` / `UPDATE` / `DELETE` が同時に出現していないかを `history \| grep -E '\-\-env production.*(apply\|INSERT\|UPDATE\|DELETE)'` で検証 |
| evidence 保存先 | `outputs/phase-11/main.md` に検証結果（hit 0 を expect）を記録 |
| escalation | hit 検出時は即停止し、影響範囲を `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output prod-snapshot.sql` で記録 |
| 起票テンプレ | title: `task-09a-production-mutation-incident-001` / scope: production 影響調査と復旧 / blocker: 09c / SEV: high |

### S12 — evidence 不足（必須証跡パス未取得）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 7 Gate-A（file size > 0）/ Gate-B（NOT_EXECUTED 不在）でヒット |
| evidence 保存先 | 該当 evidence path（空ファイルまたは placeholder） |
| escalation | 該当 Step を再実行。S06/S07 由来の許容理由がある場合のみ理由 evidence で AC 通過 |
| 起票テンプレ | title: `task-09a-evidence-gap-001` / scope: 不足 evidence の代替取得 |

## production への副作用ゼロ確認手順

以下を Phase 11 完了時に必ず実行し、`outputs/phase-11/main.md` に結果を記録する。

```bash
# 1. production 系コマンドが read-only に限定されていることの履歴検証
history | grep -E '\-\-env production' \
  | grep -vE 'whoami|d1 execute.*PRAGMA|d1 execute.*SELECT|d1 export|migrations list' \
  && echo "MUTATION DETECTED" || echo "production read-only OK"

# 2. production D1 への変更検出（snapshot diff）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --json \
  --command "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name" \
  > /tmp/prod-schema-after.json
# Step 5 開始時に取得した /tmp/parity/prod-*.json を集約して diff
node -e '
const fs=require("fs");
const tables=process.argv[1].split(",");
const before=tables.map(t=>JSON.parse(fs.readFileSync(`/tmp/parity/prod-${t}.json`,"utf8")));
const after=JSON.parse(fs.readFileSync("/tmp/prod-schema-after.json","utf8"));
console.log(JSON.stringify({before:before.length,after:(after[0]?.results||[]).length}));
' "$TABLES_CSV"
```

期待: `MUTATION DETECTED` / schema row count 変化のいずれも出力されない。
出力された場合: S11 シナリオに沿って即停止 + 起票。

## secret leak 検出ゲート（S08 の機械検証手順）

```bash
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]+|token=[A-Za-z0-9._-]+|sk-[A-Za-z0-9]+|API_KEY=[A-Za-z0-9._-]+|Cookie: [^ ]+'
grep -REn "$LEAK_PATTERNS" "$EVID" \
  && { echo "LEAK DETECTED: 該当 evidence を削除し redact pipeline 修正後に再取得"; exit 1; } \
  || echo "secret leak gate: PASS"
```

このゲートは Phase 11 完了直前および G4 commit 直前の **2 回実行**（多重防御）。

## 検出ヌケ防止のクロスチェック（Phase 3 リスク → S0X）

| Phase 3 リスク | 紐付き異常系 |
| --- | --- |
| R1 secret 漏洩 | S08 |
| R2 D1 schema drift 放置 | S05 |
| R3 staging 枯渇 / deploy 不能 | S01 / S07 |
| R4 wrangler tail 取得不能 | S07 |
| R5 Forms quota | S06 |
| R6 production read-only 範囲超過 | S11 |
| R7 PII 混入 | S08（PII redact ルール含む） |
| R8 NOT_EXECUTED 混在 | S12 |
| R9 09c blocker 更新 race | S09 |
| R10 playwright staging config 未整備 | S10 |
| R11 health/contract 違反 | S02 / S03 |
| R12 D1 apply 中断 | S04 |

合計 12 シナリオ（S01〜S12）。

## 参照資料

- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-03.md`（リスクマトリクス）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-05.md`（Step 別失敗分岐）
- `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b / PR #493 spec 確定
- 下流: 09c production deploy execution（本 Phase で起票した unassigned-task が 09c の blocker 解除条件になる）

## 多角的チェック観点

- Phase 3 リスク R1〜R12 のすべてに対応シナリオが紐付いている
- production への mutation 経路が全て検出可能（履歴 grep + schema snapshot diff の二重）
- secret leak が 2 回ゲート（Phase 11 完了直前 / G4 直前）で検証される
- 起票テンプレが title / scope / blocker / refs / AC の 5 項目で揃っている
- CONST_007 に従い「先送り」表現を排除（必ず本 Phase 内処理 or 起票で完結）
- D1 apply の自動 rollback 不在を明示し、backup → unassigned-task 起票で復旧経路を確立
- wrangler tail 取得不能時の理由ログ要件（5 項目）が機械検証可能

## サブタスク管理

- [ ] S01〜S12 の検出方法・evidence path・escalation・起票テンプレを確定
- [ ] secret leak ゲート 2 回実行ポイント（Phase 11 完了直前 / G4 直前）を Phase 5 ランブックに伝達
- [ ] production 副作用ゼロ確認手順を Phase 11 完了条件に組み込む
- [ ] wrangler tail 理由ログ要件 5 項目を Phase 5 Step 3.3 に反映
- [ ] op:// 参照確認手順を Phase 5 末尾と本 Phase S08 で同期
- [ ] `outputs/phase-06/main.md` を Phase 11 で作成

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 異常系シナリオが 12 件定義されている（S01〜S12）
- 各シナリオに 検出方法 / evidence 保存先 / escalation / 起票テンプレ が揃っている
- secret leak 検出ゲートが機械検証可能なコマンドで提示されている
- production への副作用ゼロ確認手順が機械検証可能な形で提示されている
- D1 apply 中断時の復旧経路（backup + unassigned-task 起票）が明記されている
- wrangler tail 取得不能時の理由ログ要件（5 項目）が明記されている
- Cloudflare auth 再失敗時の op:// 参照確認手順が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] CONST_007: 「Phase XX で対応」の先送り表現が含まれていない
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] secret / PII の実値を仕様書本文に書いていない（op:// 参照のみ）

## 次 Phase への引き渡し

Phase 7 へ:
- 異常系シナリオと AC のクロス対応（特に AC5 wrangler tail 取得不能許容、AC7 D1 pending 理由 evidence、AC8 schema parity diff 起票）
- secret leak ゲート / production 副作用ゼロゲートを AC に組み込む指示
- 起票テンプレ 12 件（S01〜S12 のうち成立条件があるもの）

## 実行タスク

- [ ] phase-06 の既存セクションに記載した手順・検証・成果物作成を Phase 11 で実行する。
