# Phase 7: AC マトリクス — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: index.md AC 8 項目に対し、Phase 4 テスト項目 / Phase 5 ステップ / Phase 6 異常系 / 13 evidence の対応関係を機械検証可能な合否判定式で定義する。判定式は exit code / 文字列 grep / row count / file 存在 / hash 一致のいずれかに帰着し、Phase 11 実測時に自動評価できる粒度に落とすため、docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 7 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

index.md の AC 8 項目を 1 行 1 AC のマトリクスに展開し、(a) 検証 Phase、(b) evidence path、(c) 機械検証可能な合否判定式、(d) 失敗時 follow-up を一意に定める。さらに 13 evidence と AC のクロスリファレンス、および「未実装/未実測を PASS と扱わない」 2 段ゲートを全 AC に適用する。

## 共通変数

```bash
EVID=docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence
PARENT=docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation
```

## AC マトリクス

| AC ID | 内容 | 検証 Phase | evidence path | 合否判定式（機械検証） | 失敗時 follow-up |
| --- | --- | --- | --- | --- | --- |
| AC1 | 09a Phase 11 の `NOT_EXECUTED` が実 evidence に置換される | Phase 11 / 12 | `$PARENT/outputs/phase-11/*.md` | `! grep -RE '\bNOT_EXECUTED\b' "$PARENT/outputs/phase-11"` が exit 0（hit 0） | 残存箇所を本タスク evidence への参照リンクに置換、CONST_007 に従い該当 evidence を Phase 11 で取得し直す |
| AC2 | `/members` search/filter smoke が 08a-B Phase 11 contract に沿って取得される | Phase 5 Step 6 / Phase 4 T04・T05 | `$EVID/curl/curl-public-members-{base,q,zone,status,tag,sort,density}.log` | `for f in "$EVID"/curl/curl-public-members-*.log; do head -1 "$f" \| grep -q 'HTTP/[12]\(\.[01]\)\? 200' \|\| exit 1; done` が exit 0、かつ JSON body の key set が 08a-B contract と `jq -S 'keys'` 比較で一致 | 08a-B 仕様 owner へ差し戻し（S03 起票テンプレで `task-08a-B-contract-drift-from-staging-001` 起票） |
| AC3 | UI / authz / admin route smoke evidence が保存される | Phase 5 Step 6・7 / Phase 4 T06-T13 | `$EVID/screenshots/*.png`、`$EVID/playwright/`、`$EVID/curl/curl-authz-*.log` | `test -s "$EVID/screenshots/public-members-staging.png" && test -s "$EVID/screenshots/login-staging.png" && test -s "$EVID/screenshots/me-staging.png" && test -s "$EVID/screenshots/admin-staging.png" && test -d "$EVID/playwright" && grep -q 'HTTP/[12]\(\.[01]\)\? 401\|HTTP/[12]\(\.[01]\)\? 403' "$EVID/curl/curl-authz-me-unauth.log"` | 不足 screenshot を Step 7 で再撮影、authz 不一致は S02 escalation |
| AC4 | Forms schema/responses sync evidence が保存される | Phase 5 Step 8・9 / Phase 4 T16-T19 | `$EVID/forms/forms-{schema,responses}-sync.log`、`$EVID/forms/sync-jobs-staging.json`、`$EVID/forms/audit-log-staging.json` | `test -s "$EVID/forms/forms-schema-sync.log" && test -s "$EVID/forms/forms-responses-sync.log" && jq -e '.[0].results \| length > 0' "$EVID/forms/sync-jobs-staging.json" && jq -e '.[0].results \| length > 0' "$EVID/forms/audit-log-staging.json"` | S06 シナリオに従い翌日 retry、構造的失敗時は `task-09a-forms-quota-mitigation-001` 起票 |
| AC5 | `wrangler-tail.log` に staging ログまたは取得不能理由が保存される | Phase 5 Step 10 / Phase 4 T20 | `$EVID/wrangler-tail/wrangler-tail.log` | `test -s "$EVID/wrangler-tail/wrangler-tail.log" && ! grep -E 'Bearer [A-Za-z0-9._-]+\|token=[A-Za-z0-9._-]+\|sk-[A-Za-z0-9]+\|API_KEY=[A-Za-z0-9._-]+' "$EVID/wrangler-tail/wrangler-tail.log"`（取得成功 OR 冒頭に取得不能理由文字列を含む） | S07 シナリオで `analytics_engine_datasets` fallback、永続的不能なら `task-09a-wrangler-tail-scope-001` 起票 |
| AC6 | 09c blocker が実測結果で更新される | Phase 5 Step 11 / Phase 12 | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` および `$PARENT/artifacts.json` | `grep -q '09a-A 実測完了\|09a-A staging deploy smoke completed' docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md && jq -e '.phases[] \| select(.id=="phase-11") \| .state == "complete"' "$PARENT/artifacts.json"` | G4 を再取得し commit を再作成（S09 race の場合は main 同期後 retry） |
| AC7 | D1 staging migration list が Applied のみ、または pending の理由 evidence が残る | Phase 5 Step 4 / Phase 4 T14 | `$EVID/d1/d1-migrations-list.txt` | `test -s "$EVID/d1/d1-migrations-list.txt" && { ! grep -E '^\s*\[\s*\]' "$EVID/d1/d1-migrations-list.txt" \|\| grep -q 'pending reason:' "$EVID/d1/d1-migrations-list.txt"; }` | S04 シナリオで G2 取得 → apply、apply 失敗時は `task-09a-d1-pending-migration-followup-001` 起票 |
| AC8 | D1 schema parity (staging vs production) 差分 0、または production 側 migration TODO が unassigned-task に発行 | Phase 5 Step 5 / Phase 4 T15 | `$EVID/d1/d1-schema-parity.json` | `jq -e '.summary.diffCount == 0 or (.summary.productionMigrationTodo \| test("docs/30-workflows/unassigned-task/.+\\.md"))' "$EVID/d1/d1-schema-parity.json"` | S05 シナリオで `task-09a-d1-schema-parity-followup-001` 起票し JSON の `productionMigrationTodo` に path を記録 |

## 13 evidence × AC クロスリファレンス

| Evidence # | 物理パス | 満たす AC |
| --- | --- | --- |
| #1 deploy-api-staging.log | `$EVID/deploy/deploy-api-staging.log` | AC1（NOT_EXECUTED 置換）、AC6 間接（09c へ引き継ぐ deploy 実測） |
| #2 deploy-web-staging.log | `$EVID/deploy/deploy-web-staging.log` | AC1、AC6 |
| #3 curl-public-* (9 ファイル) | `$EVID/curl/curl-public-{health,members-base,members-q,members-zone,members-status,members-tag,members-sort,members-density}.log` | AC2、AC3 |
| #4 curl-authz-* (3 ファイル) | `$EVID/curl/curl-authz-{me-unauth,admin-unauth,admin-member-role}.log` | AC3 |
| #5 screenshots/*.png (4 ファイル) | `$EVID/screenshots/{public-members,login,me,admin}-staging.png` | AC3 |
| #6 playwright/ | `$EVID/playwright/` | AC3 |
| #7 forms-schema-sync.log | `$EVID/forms/forms-schema-sync.log` | AC4 |
| #8 forms-responses-sync.log | `$EVID/forms/forms-responses-sync.log` | AC4 |
| #9 sync-jobs-staging.json | `$EVID/forms/sync-jobs-staging.json` | AC4 |
| #10 audit-log-staging.json | `$EVID/forms/audit-log-staging.json` | AC4 |
| #11 wrangler-tail.log | `$EVID/wrangler-tail/wrangler-tail.log` | AC5 |
| #12 d1-migrations-list.txt | `$EVID/d1/d1-migrations-list.txt` | AC7 |
| #13 d1-schema-parity.json | `$EVID/d1/d1-schema-parity.json` | AC8 |

逆引き（AC → evidence）:

- AC1: 全 evidence 経由で NOT_EXECUTED を物理的に置換（#1〜#13）
- AC2: #3
- AC3: #3 / #4 / #5 / #6
- AC4: #7 / #8 / #9 / #10
- AC5: #11
- AC6: 親タスク `artifacts.json` + 09c blocker doc（evidence ではなく更新対象 doc）
- AC7: #12
- AC8: #13

## 「未実装/未実測を PASS と扱わない」 2 段ゲート

全 AC に対し、本 Phase は以下 2 段ゲートを適用する。両者通過した evidence のみが AC 評価の対象となる。

### Gate-A: evidence file size > 0

```bash
# 13 evidence 物理パスを列挙し size > 0 を一括検証
PATHS=(
  "$EVID/deploy/deploy-api-staging.log"
  "$EVID/deploy/deploy-web-staging.log"
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
  "$EVID/wrangler-tail/wrangler-tail.log"
  "$EVID/d1/d1-migrations-list.txt"
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

### Gate-B: placeholder 文字列 NOT_EXECUTED を含まない

```bash
PLACEHOLDER='NOT_EXECUTED|TODO_EVIDENCE|PLACEHOLDER'
grep -REn "$PLACEHOLDER" "$EVID" \
  && { echo "PLACEHOLDER REMAINS"; exit 1; } \
  || echo "Gate-B PASS"
```

期待: hit 0、exit 0。

両ゲートが通過しない限り、AC1〜AC8 の合否判定式は評価しない（fail-fast）。

## 機械検証スクリプト統合（Phase 11 完了判定）

Phase 11 実測者は以下を順に実行し、全 exit 0 を確認する。1 つでも fail なら Phase 11 未完了として再取得。

```bash
# 1. Gate-A
bash -c "$(上記 Gate-A スクリプト)"
# 2. Gate-B
bash -c "$(上記 Gate-B スクリプト)"
# 3. AC1〜AC8 の判定式を順に実行
# (省略 — 上表「合否判定式」列のコマンドを 1 行ずつ評価)
# 4. secret leak ゲート（Phase 6 S08）
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]+|token=[A-Za-z0-9._-]+|sk-[A-Za-z0-9]+|API_KEY=[A-Za-z0-9._-]+'
! grep -REn "$LEAK_PATTERNS" "$EVID"
# 5. production 副作用ゼロゲート（Phase 6）
! history | grep -E '\-\-env production' \
  | grep -vE 'whoami|d1 execute.*PRAGMA|d1 execute.*SELECT|d1 export'
```

すべて exit 0 で Phase 11 完了 → Phase 12 サマリ作成 → G4 → Phase 13 PR。

## 失敗時 follow-up 一覧（クロスリファレンス）

| AC | 失敗パターン | 起票先（Phase 6 S0X 由来） |
| --- | --- | --- |
| AC1 | NOT_EXECUTED 残存 | S12 → `task-09a-evidence-gap-001` |
| AC2 | contract 不一致 | S03 → `task-08a-B-contract-drift-from-staging-001` |
| AC3 | screenshot/playwright 失敗 | S10 → `task-09a-playwright-staging-config-001` |
| AC4 | Forms quota 枯渇 | S06 → `task-09a-forms-quota-mitigation-001` |
| AC5 | tail 取得不能継続 | S07 → `task-09a-wrangler-tail-scope-001` |
| AC6 | blocker 更新 race | S09 → `task-09c-blocker-update-coordination-001` |
| AC7 | D1 pending apply 失敗 | S04 → `task-09a-d1-pending-migration-followup-001` |
| AC8 | schema drift 検出 | S05 → `task-09a-d1-schema-parity-followup-001` |

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/index.md`（AC 8 項目）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-04.md`（テスト項目 T01〜T20）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-05.md`（ステップ 0〜11）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-06.md`（S01〜S12 異常系）
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`

## 統合テスト連携

- 上流: 08a / 08a-B / 08b
- 下流: 09c production deploy execution（本 Phase の AC 全 PASS が 09c 着手の必要条件）

## 多角的チェック観点

- AC 8 件すべてが機械検証可能な合否判定式（exit code / grep / jq / file 存在）に帰着している
- Gate-A（file size > 0）と Gate-B（NOT_EXECUTED 不在）が全 AC の前提として適用されている
- 13 evidence と AC のクロスリファレンスが両方向（AC→evidence / evidence→AC）で取れる
- 失敗時 follow-up が Phase 6 シナリオと 1:1 対応している（CONST_007）
- 不変条件 #5/#6/#14 を担保する evidence が AC2/AC3/AC8 に明示マップされている

## サブタスク管理

- [ ] AC1〜AC8 の合否判定式を機械検証可能な形に確定
- [ ] 13 evidence × AC クロスリファレンスを両方向で記述
- [ ] Gate-A / Gate-B の検証スクリプトを記載
- [ ] 失敗時 follow-up を Phase 6 シナリオと結線
- [ ] `outputs/phase-07/main.md` を作成

## 成果物

- `outputs/phase-07/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- index.md AC 8 項目すべてが 1 行 1 AC のマトリクスとして展開されている
- 各 AC に検証 Phase / evidence path / 合否判定式 / 失敗時 follow-up が揃っている
- Gate-A / Gate-B の 2 段ゲートが全 AC に適用される構造になっている
- 13 evidence と AC のクロスリファレンス表が両方向で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 「未実装/未実測を PASS と扱わない」 2 段ゲートが機械検証可能な形で記述されている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない

## 次 Phase への引き渡し

Phase 8（DRY 化）以降に渡す:
- AC1〜AC8 の合否判定式（Phase 11 実測時に bash スクリプト化する元）
- Gate-A / Gate-B の 2 段ゲート（Phase 9 品質保証で CI 化を検討する元）
- 13 evidence × AC クロスリファレンス（Phase 10 最終レビュー時の漏れチェック表）
- 失敗時 follow-up 8 件（Phase 12 ドキュメント更新で 09c blocker に転記する元）

## 実行タスク

- [ ] phase-07 の既存セクションに記載した手順・検証・成果物作成を実行する。
