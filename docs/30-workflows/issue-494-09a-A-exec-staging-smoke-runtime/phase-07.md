# Phase 7: AC マトリクス — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: Issue #494「完了条件チェックリスト」13 項目と「必須証跡パス」表に対し、Phase 4 テスト項目 / Phase 5 ステップ / Phase 6 異常系 / 不変条件を機械検証可能な合否判定式で定義する。判定式は exit code / 文字列 grep / row count / file 存在 / hash 一致のいずれかに帰着し、Phase 11 実測時に自動評価可能な粒度に落とすため、CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| issue | #494 (`UT-09A-A-EXEC-STAGING-SMOKE-001`) |
| phase | 7 / 13 |
| wave | 9a-fu |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Issue #494 本文の 13 完了条件チェックリストを 1 行 1 AC のマトリクスに展開し、(a) 検証 Phase / Step、(b) evidence path、(c) 機械検証可能な合否判定式、(d) 失敗時 follow-up（Phase 6 シナリオ）、(e) DoD 状態を一意に定める。

さらに必須証跡パス × AC のクロスリファレンスと、不変条件 #5 / #6 / #14 のチェック行、「未実装/未実測を PASS と扱わない」 2 段ゲートを全 AC に適用する。

## 共通変数

```bash
TASK=docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime
EVID=$TASK/outputs/phase-11/evidence
SPEC_PARENT=docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime
WORKFLOW_ACTIVE=.claude/skills/aiworkflow-requirements/references/task-workflow-active.md
BLOCKER_DOC=docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md
```

## AC マトリクス（13 完了条件チェックリスト × 必須証跡パス）

Issue #494 本文の 13 項目をそのまま AC1〜AC13 にマップする。

| AC ID | Issue チェック項目 | 検証 Phase / Step | evidence path（必須証跡） | 合否判定式（機械検証） | DoD 状態 | 失敗時 follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| AC1 | Cloudflare auth: `bash scripts/cf.sh whoami` PASS evidence 保存 | Phase 5 Step 0 / Phase 4 T01 | `$EVID/preflight/cf-whoami.log` | `test -s "$EVID/preflight/cf-whoami.log" && grep -qE 'account_id\|Account ID' "$EVID/preflight/cf-whoami.log"` | PASS = log 存在 + Account ID 行 | S08（auth 再失敗 → op:// 参照確認手順） |
| AC2 | D1 migration list（staging/prod）と schema parity evidence 保存 | Phase 5 Step 4・5 / Phase 4 T15・T16・T18 | `$EVID/d1/d1-migrations-staging.log` / `$EVID/d1/d1-migrations-prod.log` / `$EVID/d1/d1-schema-parity.json` | `test -s "$EVID/d1/d1-migrations-staging.log" && test -s "$EVID/d1/d1-migrations-prod.log" && jq -e '.summary \| has("diffCount")' "$EVID/d1/d1-schema-parity.json"` | PASS = 3 ファイル存在 + parity JSON 構造妥当 | S05（diff>0 → schema-parity-followup 起票）/ S04（apply 失敗）|
| AC3 | G1 deploy 完了: API/Web Worker version id が deploy log に記録 | Phase 5 Step 2 / Phase 4 T02・T03 | `$EVID/deploy/deploy-api-staging.log` / `$EVID/deploy/deploy-web-staging.log` / `$EVID/deploy/{api,web}-version-id.txt` | `for f in "$EVID/deploy/deploy-api-staging.log" "$EVID/deploy/deploy-web-staging.log"; do grep -qE 'Current Version ID\|Deployed' "$f" \|\| exit 1; done && test -s "$EVID/deploy/api-version-id.txt" && test -s "$EVID/deploy/web-version-id.txt"` | PASS = 両 log に Deployed + version_id ファイル非空 | S01（deploy 失敗 → rollback + 起票）|
| AC4 | G2 D1 apply 完了 or pending 0 skip 理由記録 | Phase 5 Step 4 / Phase 4 T15・T17 | `$EVID/d1/d1-migrations-staging.log`（または `-after.log`） | `test -s "$EVID/d1/d1-migrations-staging.log" && { ! grep -E '^\s*\[\s*\]' "$EVID/d1/d1-migrations-staging.log" \|\| grep -qE 'pending reason:\|skip reason:\|pending=0' "$EVID/d1/d1-migrations-staging.log"; }` | PASS = pending 行 0、または pending/skip 理由文字列を含む | S04（apply 失敗 → backup 保持 + pending-migration-followup 起票）|
| AC5 | G3 Forms sync 完了: `sync_jobs` / `audit_log` dump 保存 | Phase 5 Step 6・7 / Phase 4 T19〜T22 | `$EVID/forms/forms-schema-sync.log` / `$EVID/forms/forms-responses-sync.log` / `$EVID/forms/sync-jobs-staging.json` / `$EVID/forms/audit-log-staging.json` | `test -s "$EVID/forms/forms-schema-sync.log" && test -s "$EVID/forms/forms-responses-sync.log" && jq -e '(.[0].results // .results // .) \| length > 0' "$EVID/forms/sync-jobs-staging.json" && jq -e '(.[0].results // .results // .) \| length >= 0' "$EVID/forms/audit-log-staging.json"` | PASS = 2 sync log 非空 + sync_jobs 行 1 件以上 + audit_log SELECT 成功 | S06（quota 枯渇 → 翌日 retry / forms-quota-mitigation 起票）|
| AC6 | Playwright report + 4 staging screenshots 保存 | Phase 5 Step 3.2 / Phase 4 T09〜T13 | `$EVID/screenshots/{public-members,login,me,admin}-staging.png` / `$EVID/playwright/` | `for f in public-members login me admin; do test -s "$EVID/screenshots/$f-staging.png" \|\| exit 1; done && test -d "$EVID/playwright" && test -s "$EVID/playwright/index.html"` | PASS = 4 png 非空 + report html 存在 | S10（環境差分 → playwright-staging-config 起票 / fallback で screenshot のみ）|
| AC7 | `wrangler-tail/api-30min.log` 取得または取得不能理由保存 | Phase 5 Step 3.3 / Phase 4 T14 | `$EVID/wrangler-tail/api-30min.log` | `test -s "$EVID/wrangler-tail/api-30min.log" && { grep -qE 'INFO\|REQUEST\|wrangler tail' "$EVID/wrangler-tail/api-30min.log" \|\| grep -qE '取得不能理由\|unavailable reason\|exit code:\|stderr:' "$EVID/wrangler-tail/api-30min.log"; }` | PASS = log 非空 + 実 tail 行 OR 理由ログ 5 項目 | S07（永続不能 → wrangler-tail-scope 起票 / analytics fallback）|
| AC8 | secret 値・PII の redaction 確認 | Phase 5 全 Step / Phase 6 S08 | `$EVID/` 配下全 evidence | `LP='Bearer [A-Za-z0-9._-]+\|token=[A-Za-z0-9._-]+\|sk-[A-Za-z0-9]+\|API_KEY=[A-Za-z0-9._-]+\|Cookie: [^ ]+'; ! grep -REn "$LP" "$EVID"` | PASS = leak grep ヒット 0 | S08（leak 検出 → 該当 evidence 削除 + redact pipeline 修正後再取得 + secret-leak-source-fix 起票）|
| AC9 | `outputs/phase-11/main.md` / `manual-smoke-log.md` の `NOT_EXECUTED` 全置換 | Phase 5 Step 8 / Phase 4 T24 | `$TASK/outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | `! grep -RE 'NOT_EXECUTED\|TODO_EVIDENCE\|PLACEHOLDER' "$TASK/outputs/phase-11"` | PASS = placeholder grep ヒット 0 | S12（evidence-gap 起票 → 不足 evidence 再取得）|
| AC10 | `artifacts.json` ↔ `outputs/artifacts.json` parity | Phase 5 Step 8 / Phase 4 T23 | `$TASK/artifacts.json` / `$TASK/outputs/artifacts.json` | `diff <(jq -S . "$TASK/artifacts.json") <(jq -S . "$TASK/outputs/artifacts.json") \| wc -l \| grep -qx 0` | PASS = diff 0 行 | S09（race → main 同期 + 再 G4）|
| AC11 | `references/task-workflow-active.md` 09a-A 行 `runtime_evidence_captured` 昇格 | Phase 5 Step 8 / Phase 4 T26 | `$WORKFLOW_ACTIVE` | `awk '/09a-A/,/^$/' "$WORKFLOW_ACTIVE" \| grep -q 'runtime_evidence_captured'` | PASS = 09a-A セクションに該当文字列 | S09 派生（手動視認も併用）|
| AC12 | 09c blocker 状態を実測結果で更新 | Phase 5 Step 8 / Phase 4 T25 | `$BLOCKER_DOC` | `grep -qE '09a-A 実測完了\|09a-A staging deploy smoke completed\|09a-A runtime_evidence_captured' "$BLOCKER_DOC"` | PASS = blocker doc に該当行 | S09（race → main 同期 + 再 G4）|
| AC13 | G4 PR 作成完了 | **本タスク範囲外（別タスク）** / 本ランブックは draft commit まで | （本タスクでは） `$TASK/outputs/phase-13/main.md` に G1〜G4 承認 timestamp / 別タスクで PR URL を追記 | `grep -cE 'G[1-4] OK \| approved at' "$TASK/outputs/phase-13/main.md" \| awk '$1>=4{exit 0}{exit 1}'`（本タスク内 DoD は draft commit + 4 承認 timestamp）。PR 作成は別タスク Phase 13 で `gh pr view` URL を追記 | PASS（本タスク内）= 4 承認 timestamp 揃う / PASS（別タスク後）= PR URL 記録 | S09（race） |

## 不変条件チェック行

| 不変条件 | 検証 Phase / Step | 合否判定式 | DoD |
| --- | --- | --- | --- |
| #5 公開／会員／管理境界 | Phase 5 Step 3.1 / Phase 4 T05〜T08, T11, T12 | `grep -qE 'HTTP/[12](\.[01])? 401' "$EVID/curl/curl-authz-me-unauth.log" && grep -qE 'HTTP/[12](\.[01])? (401\|403)' "$EVID/curl/curl-authz-admin-unauth.log" && grep -qE 'HTTP/[12](\.[01])? 403' "$EVID/curl/curl-authz-admin-member-role.log" && test -s "$EVID/screenshots/me-staging.png" && test -s "$EVID/screenshots/admin-staging.png"` | PASS = 401/401or403/403 すべて取得 + /me と /admin screenshot 取得 |
| #6 D1 直接アクセスは `apps/api` のみ | Phase 5 Step 4・5・7（全 D1 操作） | `! history \| grep -E 'wrangler d1' \| grep -v 'scripts/cf.sh'`（履歴に `wrangler d1` 直叩きが無い）+ Phase 11 の D1 全アクセスが `bash scripts/cf.sh d1` 経由であること（Phase 5 ランブック確認） | PASS = `wrangler` 直接呼び出し履歴 0 |
| #14 Forms quota 観測 | Phase 5 Step 6・7 / Phase 4 T19・T20・T21 | `jq -e '(.[0].results // .results // .) \| map(select(.kind \| test("schema\|responses"))) \| length <= 2' "$EVID/forms/sync-jobs-staging.json"`（直近 sync が 1 cycle 内に収まる） + Step 6 で 2 cycle 以上を実行していない | PASS = 直近 schema/responses kind の sync_jobs 行が 1 ペア（不要な再 sync 無し） |

## 必須証跡パス × AC クロスリファレンス

Issue #494「必須証跡パス」表の各行が、どの AC を満たすかを両方向で記述する。

### 順引き（必須証跡 → AC）

| 必須証跡パス | 満たす AC |
| --- | --- |
| `outputs/phase-11/evidence/preflight/cf-whoami.log` | AC1 |
| `outputs/phase-11/evidence/d1/d1-migrations-{staging,prod}.log` | AC2, AC4 |
| `outputs/phase-11/evidence/d1/d1-schema-parity.json` | AC2, 不変条件 #6 |
| `outputs/phase-11/evidence/deploy/deploy-{api,web}-staging.log` | AC3 |
| `outputs/phase-11/evidence/forms/{forms-schema-sync,forms-responses-sync,sync-jobs-staging,audit-log-staging}.{log,json}` | AC5, 不変条件 #14 |
| `outputs/phase-11/evidence/playwright/` | AC6 |
| `outputs/phase-11/evidence/screenshots/{public-members,login,me,admin}-staging.png` | AC6, 不変条件 #5 |
| `outputs/phase-11/evidence/wrangler-tail/api-30min.log` | AC7 |
| `outputs/phase-13/main.md` | AC13 (G1-G4 承認 timestamp) |
| `artifacts.json` / `outputs/artifacts.json` | AC10 |

### 逆引き（AC → 必須証跡）

| AC | evidence |
| --- | --- |
| AC1 | preflight/cf-whoami.log |
| AC2 | d1/d1-migrations-{staging,prod}.log + d1/d1-schema-parity.json |
| AC3 | deploy/deploy-{api,web}-staging.log + deploy/{api,web}-version-id.txt |
| AC4 | d1/d1-migrations-staging.log（pending=0 or 理由）|
| AC5 | forms/forms-{schema,responses}-sync.log + forms/sync-jobs-staging.json + forms/audit-log-staging.json |
| AC6 | screenshots/*.png（4 件）+ playwright/ |
| AC7 | wrangler-tail/api-30min.log |
| AC8 | $EVID 配下全体（leak 検査対象） |
| AC9 | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| AC10 | artifacts.json + outputs/artifacts.json |
| AC11 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md |
| AC12 | docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md |
| AC13 | outputs/phase-13/main.md（4 承認 timestamp）+ 別タスクで PR URL |

## 「未実装/未実測を PASS と扱わない」 2 段ゲート

全 AC に対し、本 Phase は以下 2 段ゲートを適用する。両者通過した evidence のみが AC 評価の対象となる。

### Gate-A: evidence file size > 0

```bash
PATHS=(
  "$EVID/preflight/cf-whoami.log"
  "$EVID/deploy/deploy-api-staging.log"
  "$EVID/deploy/deploy-web-staging.log"
  "$EVID/deploy/api-version-id.txt"
  "$EVID/deploy/web-version-id.txt"
  "$EVID/curl/curl-public-health.log"
  "$EVID/curl/curl-public-members-base.log"
  "$EVID/curl/curl-public-members-q.log"
  "$EVID/curl/curl-public-members-zone.log"
  "$EVID/curl/curl-public-members-status.log"
  "$EVID/curl/curl-public-members-tag.log"
  "$EVID/curl/curl-public-members-sort.log"
  "$EVID/curl/curl-public-members-density.log"
  "$EVID/curl/curl-authz-me-unauth.log"
  "$EVID/curl/curl-authz-admin-unauth.log"
  "$EVID/curl/curl-authz-admin-member-role.log"
  "$EVID/screenshots/public-members-staging.png"
  "$EVID/screenshots/login-staging.png"
  "$EVID/screenshots/me-staging.png"
  "$EVID/screenshots/admin-staging.png"
  "$EVID/forms/forms-schema-sync.log"
  "$EVID/forms/forms-responses-sync.log"
  "$EVID/forms/sync-jobs-staging.json"
  "$EVID/forms/audit-log-staging.json"
  "$EVID/wrangler-tail/api-30min.log"
  "$EVID/d1/d1-migrations-staging.log"
  "$EVID/d1/d1-migrations-prod.log"
  "$EVID/d1/d1-schema-parity.json"
)
fail=0
for p in "${PATHS[@]}"; do
  test -s "$p" || { echo "EMPTY or MISSING: $p"; fail=1; }
done
test -d "$EVID/playwright" || { echo "MISSING: $EVID/playwright"; fail=1; }
exit $fail
```

期待: exit 0。

### Gate-B: placeholder 文字列を含まない

```bash
PLACEHOLDER='NOT_EXECUTED|TODO_EVIDENCE|PLACEHOLDER'
grep -REn "$PLACEHOLDER" "$TASK/outputs/phase-11" \
  && { echo "PLACEHOLDER REMAINS"; exit 1; } \
  || echo "Gate-B PASS"
```

期待: hit 0、exit 0。

両ゲートが通過しない限り、AC1〜AC13 の合否判定式は評価しない（fail-fast）。

## 機械検証スクリプト統合（Phase 11 完了判定）

Phase 11 実測者は以下を順に実行し、全 exit 0 を確認する。1 つでも fail なら Phase 11 未完了として再取得。

```bash
# 1. Gate-A
bash -c "<上記 Gate-A スクリプト>"
# 2. Gate-B
bash -c "<上記 Gate-B スクリプト>"
# 3. AC1〜AC13 の判定式を順に実行（上表「合否判定式」列を 1 行ずつ評価）
# 4. 不変条件 #5 / #6 / #14 の判定式を実行
# 5. secret leak ゲート（Phase 6 S08）
LP='Bearer [A-Za-z0-9._-]+|token=[A-Za-z0-9._-]+|sk-[A-Za-z0-9]+|API_KEY=[A-Za-z0-9._-]+|Cookie: [^ ]+'
! grep -REn "$LP" "$EVID"
# 6. production 副作用ゼロゲート（Phase 6 S11）
! ( history | grep -E '\-\-env production' \
  | grep -vE 'whoami|d1 execute.*PRAGMA|d1 execute.*SELECT|d1 export|migrations list' )
```

すべて exit 0 で Phase 11 完了 → Phase 12 サマリ作成 → G4 → Phase 13 PR（別タスク）。

## 失敗時 follow-up 一覧（AC × Phase 6 シナリオ × 起票）

| AC | 失敗パターン | Phase 6 シナリオ | 起票先 |
| --- | --- | --- | --- |
| AC1 | cf.sh whoami fail / op:// 注入失敗 | S08 | （ローテ手順実施・再試行で解決すれば起票不要）|
| AC2 / AC4 | D1 pending apply 失敗 / migration list 取得不能 | S04 | `task-09a-d1-pending-migration-followup-001` |
| AC2 | schema drift diffCount > 0 | S05 | `task-09a-d1-schema-parity-followup-001` |
| AC3 | deploy 失敗 | S01 | `task-09a-staging-deploy-failure-001` |
| AC5 | Forms quota 枯渇 | S06 | `task-09a-forms-quota-mitigation-001`（永続時のみ）|
| AC6 | screenshot/playwright 失敗 | S10 | `task-09a-playwright-staging-config-001` |
| AC7 | tail 取得不能継続 | S07 | `task-09a-wrangler-tail-scope-001` |
| AC8 | secret leak 検出 | S08 | `task-09a-secret-leak-source-fix-001`（経路修正必要時）|
| AC9 | NOT_EXECUTED 残存 | S12 | `task-09a-evidence-gap-001` |
| AC10 / AC11 / AC12 | parity diff / blocker 更新 race | S09 | `task-09c-blocker-update-coordination-001` |
| AC13 | G4 timestamp 不足 | S09 派生 | （手順遵守で解決） |
| 不変条件 #5 違反 | authz 境界が公開 | S03 派生 | `task-09a-authz-boundary-incident-001`（要時のみ） |
| 不変条件 #6 違反 | wrangler 直叩き履歴あり | S11 派生 | `task-09a-cf-wrapper-bypass-incident-001`（要時のみ） |
| 不変条件 #14 違反 | Forms quota 過剰消費 | S06 派生 | `task-09a-forms-quota-mitigation-001` |
| production mutation 検出 | S11 | `task-09a-production-mutation-incident-001`（SEV: high） |

## 参照資料

- Issue #494（GitHub）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/index.md`（13 完了条件 + 必須証跡パス）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-04.md`（テスト項目 T01〜T27）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-05.md`（Step 0〜8）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-06.md`（S01〜S12 異常系）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/`（spec 確定版・内包元）
- `docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b / PR #493 spec 確定
- 下流: 09c production deploy execution（本 Phase の AC 全 PASS が 09c 着手の必要条件）

## 多角的チェック観点

- AC 13 件すべてが機械検証可能な合否判定式（exit code / grep / jq / file 存在）に帰着している
- Gate-A（file size > 0）と Gate-B（NOT_EXECUTED 不在）が全 AC の前提として適用されている
- 必須証跡パス × AC のクロスリファレンスが両方向（必須証跡→AC / AC→必須証跡）で取れる
- 失敗時 follow-up が Phase 6 シナリオ S01〜S12 と 1:1 対応している（CONST_007）
- 不変条件 #5 / #6 / #14 が独立行で AC マトリクスに含まれている
- production への副作用ゼロが履歴 grep + schema snapshot diff の二重で検証される
- secret leak が 2 回ゲート（Phase 11 完了直前 / G4 直前）で検証される
- AC13 のスコープ境界（本タスクは draft commit まで / PR 作成は別タスク）が明示されている

## サブタスク管理

- [ ] AC1〜AC13 の合否判定式を機械検証可能な形で確定
- [ ] 不変条件 #5/#6/#14 のチェック行を AC マトリクスに含める
- [ ] 必須証跡パス × AC クロスリファレンスを両方向で記述
- [ ] Gate-A / Gate-B の検証スクリプトを記載
- [ ] 失敗時 follow-up を Phase 6 シナリオと結線
- [ ] `outputs/phase-07/main.md` を Phase 11 で作成

## 成果物

- `outputs/phase-07/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- Issue #494 の 13 完了条件チェックリストすべてが 1 行 1 AC のマトリクスとして展開されている
- 各 AC に検証 Phase / Step / evidence path / 合否判定式 / DoD / 失敗時 follow-up が揃っている
- 不変条件 #5 / #6 / #14 のチェック行がマトリクスに含まれている
- Gate-A / Gate-B の 2 段ゲートが全 AC に適用される構造になっている
- 必須証跡パス × AC のクロスリファレンス表が両方向で揃っている
- AC13 のスコープ境界（draft commit まで / PR 別タスク）が明示されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 「未実装/未実測を PASS と扱わない」 2 段ゲートが機械検証可能な形で記述されている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] secret / PII の実値を仕様書本文に書いていない（op:// 参照のみ）

## 次 Phase への引き渡し

Phase 8（DRY 化）以降に渡す:
- AC1〜AC13 の合否判定式（Phase 11 実測時に bash スクリプト化する元）
- 不変条件 #5/#6/#14 のチェック行
- Gate-A / Gate-B の 2 段ゲート（Phase 9 品質保証で CI 化を検討する元）
- 必須証跡パス × AC クロスリファレンス（Phase 10 最終レビュー時の漏れチェック表）
- 失敗時 follow-up 13 件（Phase 12 ドキュメント更新で 09c blocker に転記する元）

## 実行タスク

- [ ] phase-07 の既存セクションに記載した手順・検証・成果物作成を Phase 11 で実行する。
