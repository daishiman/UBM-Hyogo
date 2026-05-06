# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias back-fill queue/cron split (UT-07B-FU-01) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-05 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | implementation（test-strategy） |
| taskType | implementation（条件付き：着手 gate 成立後実行） |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |

## 目的

Phase 11 で staging 10,000+ rows evidence による着手 gate が成立した前提で、UT-07B-FU-01 が固定すべき品質境界を 4 層 + 1 staging 実測の検証戦略に展開する。本 Phase の核は「alias 確定（API request 内）」と「back-fill 継続（queue/cron 駆動）」の責務分離後に、(1) duplicate enqueue dedupe / (2) batch idempotent update / (3) partial failure recovery / (4) HTTP contract 移行（旧 202+error → 新 200+confirmed/backfill.status）/ (5) staging 大規模実測 before/after evidence 比較 の 5 境界をすべて test ID で固定することにある。

親タスク UT-07B のテスト戦略（cursor 進行 / partial UNIQUE / 5 ケース HTTP contract）を上位互換として継承し、queue/cron の追加 binding と response 形状の breaking change に焦点を絞る。

## 完了条件チェックリスト

- [ ] unit / route / workflow integration / repository / staging 5 層の責務分離表が確定
- [ ] テストケース ID（T-U-* / T-R-* / T-W-* / T-Q-* / T-S-*）と検証対象が表で列挙されている
- [ ] duplicate enqueue / batch idempotent update / partial failure recovery / response contract 移行 / staging before-after の 5 境界がすべての層でカバーされている
- [ ] vitest in-memory D1 + Miniflare Queue mock + Cloudflare Workers staging integration の責務分離が記述されている
- [ ] queue consumer at-least-once 配送下での idempotency 検証（dedupe key + idempotent update）の SQL レベル test シナリオが記述されている
- [ ] before/after evidence の比較項目（batch 数 / Workers CPU 時間 / retry 回数 / queue lag / 完了時間）と PASS 基準が表化されている
- [ ] 検証コマンド（`mise exec -- pnpm --filter @ubm-hyogo/api test`、`scripts/cf.sh` 経由 staging deploy）が列挙されている
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が PASS 判定で根拠付き

## 実行タスク

1. テスト層責務分離表（unit / route / workflow / repository / staging）を起草する。
2. テストケース一覧（T-U-* / T-R-* / T-W-* / T-Q-* / T-S-*）を起草する（合計 30 件以上）。
3. queue consumer at-least-once + dedupe + idempotent update の SQL レベル検証シナリオを起草する。
4. response contract 移行（旧 202+`backfill_cpu_budget_exhausted` → 新 200+`confirmed:true`+`backfill.status:'pending'`）の境界 test を起草する。
5. staging 10,000 rows fixture の before/after evidence 比較表テンプレを Phase 11 へ引き渡す形で確定する。
6. 検証コマンド一覧と 4 条件評価を起草する。
7. 成果物 `outputs/phase-04/test-strategy.md` の章立てを確定する。

## 検証戦略詳細

### 1. テスト層責務分離

| 層 | 対象 | 環境 | モック範囲 | 出力形式 |
| --- | --- | --- | --- | --- |
| unit (T-U-*) | `apps/api/src/workflows/schemaAliasBackfillBatch.ts` の純粋関数（dedupe key 生成 / batch 結果解釈 / status 遷移）、`apps/api/src/repository/schemaDiffQueue.ts` の dedupe / remaining-scan helper | vitest pure（DB 不要） | DB / Queue は完全モック | 関数戻り値の assert |
| route (T-R-*) | `apps/api/src/routes/admin/schema.ts` の `POST /admin/schema/aliases` 新 contract（200 confirmed+pending / 200 confirmed+running / 200 confirmed+completed / 200 confirmed+exhausted / 409 / 422） | vitest + Hono test client + Miniflare D1 + Queue mock | Queue producer は spy / consumer は注入 | HTTP status / response body の assert |
| workflow integration (T-W-*) | alias 確定 → enqueue → batch consume → completion の end-to-end、partial failure recovery、status 遷移 | vitest + Miniflare D1 + Miniflare Queue（in-memory） | Workers runtime は Miniflare、Google Forms API 経路なし | DB state assert + queue message log assert |
| repository (T-Q-*) | `schemaDiffQueue` の dedupe key 一意性 / remaining-scan SQL / idempotent UPDATE | vitest + Miniflare D1 + 実 migration apply | 純粋 SQL 動作のみ | SQL 結果 assert |
| staging 実測 (T-S-*) | 10,000 / 50,000 行 fixture 投入後の queue throughput / CPU 時間 / retry 回数 / 完了時間 | staging Cloudflare Workers + staging D1 + staging Queue / Cron | 実環境（mock なし） | curl wallclock + Workers Logs + Queue dashboard |

### 2. テストケース一覧

#### unit (T-U-*) — 純粋ロジック

| ID | 検証対象 | 入力 | 期待挙動 |
| --- | --- | --- | --- |
| T-U-01 | `buildDedupeKey({aliasId, revisionId, stableKey})` | 同一 input 2 回 | 完全一致の dedupe key を返す（決定論的） |
| T-U-02 | `buildDedupeKey` | revisionId / stableKey の差異 | 異なる dedupe key を返す |
| T-U-03 | `interpretBatchResult({remaining, processed})` | remaining=0 | `status: 'completed'` |
| T-U-04 | `interpretBatchResult` | remaining>0 + cpu budget あり | `status: 'pending'`（次 batch を queue に再 enqueue） |
| T-U-05 | `interpretBatchResult` | remaining>0 + cpu budget 枯渇 | `status: 'exhausted'`（cron 再駆動待ち） |
| T-U-06 | `deriveBackfillStatus(queueRow)` | `processed_at IS NULL` | `'pending'` |
| T-U-07 | `deriveBackfillStatus` | `processed_at` 直近 / remaining>0 | `'running'` |
| T-U-08 | `deriveBackfillStatus` | retry_count >= max | `'exhausted'` |

#### route (T-R-*) — HTTP contract 境界（新 contract）

| ID | シナリオ | 期待 HTTP | 期待 body 抜粋 |
| --- | --- | --- | --- |
| T-R-01 | dryRun=true | 200 | `{ "preview": {...}, "wouldUpdate": <n> }` |
| T-R-02 | apply 完全成功（小規模 / 同期 batch で完了） | 200 | `{ "confirmed": true, "alias": {...}, "backfill": { "status": "completed", "remaining": 0, "lastProcessedAt": "..." } }` |
| T-R-03 | apply alias 確定 + enqueue 成功（pending） | 200 | `{ "confirmed": true, "alias": {...}, "backfill": { "status": "pending", "remaining": <n>, "lastProcessedAt": null } }` |
| T-R-04 | apply alias 確定 + 既に running | 200 | `{ "confirmed": true, "backfill": { "status": "running", "remaining": <n> } }` |
| T-R-05 | apply alias 確定 + 過去に exhausted（cron 再駆動待ち） | 200 | `{ "confirmed": true, "backfill": { "status": "exhausted", "remaining": <n> } }` |
| T-R-06 | apply collision | 409 | `{ "code": "stable_key_collision", ... }` |
| T-R-07 | apply validation エラー | 422 | `{ "code": "invalid_request", ... }` |
| T-R-08 | duplicate apply（同 alias 連続実行） | 200 | dedupe で 2 回目は同一 backfill row を返す（重複 enqueue 抑止） |
| T-R-09 | GET `/admin/schema/aliases/{id}/backfill-status` | 200 | `getBackfillStatus()` の戻り値 |

> 旧 contract（HTTP 202 + `error: 'backfill_cpu_budget_exhausted'`）は本タスクで撤廃。breaking change は Phase 5 api-contract-update.md で API consumer への移行手順として正本化する。

#### workflow integration (T-W-*) — Miniflare D1 + Miniflare Queue

| ID | 検証対象 | シナリオ | PASS 基準 |
| --- | --- | --- | --- |
| T-W-01 | alias 確定 + enqueue 成功 | small fixture / apply | DB に alias row + queue message 1 件 + response = `confirmed:true, status:'pending'` |
| T-W-02 | enqueue 失敗時の compensation | producer に強制例外 | alias は確定 / `backfill.status:'pending'` のまま残り、cron 再駆動で recover（同期 fallback ポリシー記録） |
| T-W-03 | batch consumer / 完走 | 1000 行 fixture / batch=200 | 5 batch で `remaining=0`, `status:'completed'` |
| T-W-04 | batch consumer / partial failure | 5 件中 2 件で UPDATE 例外 | tx は成功分のみ commit / 残件と未処理 2 件が次 batch へ持ち越される / status は `running` |
| T-W-05 | duplicate enqueue 抑止 | 同 dedupe key で 2 回 enqueue | 2 回目の insert が dedupe key UNIQUE で skip / queue message も dedupe id で 1 件に収束 |
| T-W-06 | at-least-once 再配送下の idempotency | 同一 message を consumer に 2 回投入 | 2 回目は remaining-scan の対象行が減少済みで no-op / DB 更新は 1 回分のみ |
| T-W-07 | cron handler 起動時に未完 row を発見 | 前回 exhausted で停止 | cron が status=exhausted/running の queue row を再 enqueue / batch 再開 |
| T-W-08 | max retry exceeded | retry_count >= 5 で再駆動 | internal DB status は failed 相当へ遷移し、公開 API は `backfill.status='exhausted'` + retry不可 metadata で明示 |
| T-W-09 | response contract 移行（旧 → 新） | 旧形式期待のクライアント mock | 新 200 を返却 / 旧 202 / `error` フィールドは含まない |

#### repository (T-Q-*) — `schemaDiffQueue` SQL レベル

| ID | 検証対象 | SQL シナリオ | PASS 基準 |
| --- | --- | --- | --- |
| T-Q-01 | dedupe key UNIQUE 制約 | 同 dedupe key で INSERT 2 回 | 2 回目が SQLITE_CONSTRAINT |
| T-Q-02 | remaining-scan idempotency | `WHERE alias_id=? AND processed_at IS NULL` で count | dedupe / batch 完了で 0 になる |
| T-Q-03 | idempotent UPDATE | 同一 message 再処理時 remaining-scan 対象が 0 で skip | 2 回目の rowsAffected=0 |
| T-Q-04 | remaining-scan 進行 | batch ごとに残件 COUNT を再評価 | 次 batch の `WHERE key='__extra__:<questionId>'` が effective |
| T-Q-05 | retry_count 増加 | partial failure ごとに +1 | retry_count が record に永続化 |

#### staging 実測 (T-S-*) — Phase 11 引き渡し（before/after）

| ID | fixture | 計測項目 | PASS 基準 |
| --- | --- | --- | --- |
| T-S-01 (before) | 10,000 行 / 旧同期 apply | apply 応答時間 / `backfill_cpu_budget_exhausted` 発生回数 / retry 回数 / 完了までの累計時間 | 着手 gate 判定の数値が記録される |
| T-S-02 (after / 10K) | 10,000 行 / 新 queue/cron 経路 | apply 応答時間 / queue throughput / batch 数 / Workers CPU 時間 / 完了時間 | apply 応答 < 5s / cpu_budget_exhausted を再発させずに完走 |
| T-S-03 (after / 50K) | 50,000 行 | 同上 | apply 応答 < 5s / 完了時間が線形にスケールする / queue lag が許容範囲（< 5min） |

### 3. queue at-least-once + dedupe + idempotent update の検証シナリオ

```sql
-- T-Q-01: dedupe key UNIQUE
INSERT INTO schema_diff_queue (id, alias_id, revision_id, stable_key, dedupe_key, processed_at)
  VALUES (1, 'a-1', 'rev-1', 'name_kanji', 'a-1:rev-1:name_kanji', NULL); -- OK
INSERT INTO schema_diff_queue (id, alias_id, revision_id, stable_key, dedupe_key, processed_at)
  VALUES (2, 'a-1', 'rev-1', 'name_kanji', 'a-1:rev-1:name_kanji', NULL); -- SQLITE_CONSTRAINT 期待

-- T-Q-03: idempotent UPDATE（同 message 2 回処理）
-- 1 回目: remaining-scan 対象を stableKey へ置換
UPDATE response_fields
   SET key = 'name_kanji'
 WHERE revision_id = 'rev-1' AND key = '__extra__:q-name';
-- → rowsAffected>0
-- 2 回目（at-least-once 再配送）
UPDATE response_fields
   SET key = 'name_kanji'
 WHERE revision_id = 'rev-1' AND key = '__extra__:q-name';
-- → rowsAffected=0（idempotent 達成）
```

### 4. response contract 移行 境界 test

| 試行 | 旧 contract（撤廃） | 新 contract |
| --- | --- | --- |
| 同期完走 | 200 / `backfill.status:'completed'` | 200 / `confirmed:true, backfill.status:'completed'` |
| CPU 枯渇 | 202 / `error:'backfill_cpu_budget_exhausted', retryable:true` | 200 / `confirmed:true, backfill.status:'pending' or 'exhausted'`（alias 確定済み） |
| collision | 409 / `code:'stable_key_collision'` | 同（変更なし） |
| validation | 422 / `code:'invalid_request'` | 同（変更なし） |

### 5. staging before/after evidence 比較表テンプレ

| 計測項目 | before（旧同期） | after（queue/cron） | PASS 基準 |
| --- | --- | --- | --- |
| apply API p95 応答時間 | （Phase 11 で記録） | （Phase 11 で記録） | after が before の 1/5 以下 |
| `backfill_cpu_budget_exhausted` 再発回数 | （ベースライン） | 0 | 0 件で完走 |
| retry 回数（同一 alias） | （ベースライン） | （計測） | 不要 retry が削減 |
| 完了までの累計時間 | （ベースライン） | （計測） | queue lag を加味して許容範囲内 |
| Workers CPU 時間（合計） | （ベースライン） | （計測） | request 単位 CPU が分散 |

### 6. vitest in-memory D1 / Miniflare Queue / staging Workers 責務分離

| 観点 | vitest + Miniflare D1 (T-W-*) | Miniflare Queue (T-W-*/T-U-*) | staging Cloudflare (T-S-*) |
| --- | --- | --- | --- |
| 環境 | Miniflare D1（better-sqlite3） | Miniflare Queue（in-memory） | staging Workers + staging D1 + staging Queue / Cron |
| 速度 | 高速 | 高速 | 低速（fixture 投入含め分単位） |
| 用途 | dedupe / cursor / status 遷移 | producer-consumer 統合 | 実 throughput / queue lag / cron 起動 |
| 実行頻度 | CI 全 commit | CI 全 commit | Phase 11 着手 gate 成立後 1 回 + before/after 比較時 |

### 7. 検証コマンド一覧

```bash
# 単体・結合テスト（unit / route / workflow / repository 全層）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test src/workflows/schemaAliasBackfillBatch.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/repository/schemaDiffQueue.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/admin/schema.test.ts

# staging deploy（着手 gate 成立後のみ）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# staging 実測（10K / 50K fixture）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --file scripts/fixtures/seed-10k-response-fields.sql
# apply API 実行
curl -X POST "https://api-staging.ubm-hyogo.workers.dev/admin/schema/aliases" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "revisionId": "rev-1", "questionId": "Q1", "stableKey": "name_kanji" }'
# Workers Logs / Queue dashboard で throughput / lag を採取
```

### 8. AC との対応

| AC | 検証手段 | テストケース ID |
| --- | --- | --- |
| AC-1 (before evidence) | staging | T-S-01 |
| AC-3 (責務分離) | route / workflow | T-R-02〜05, T-W-01〜03 |
| AC-4 (response contract) | route / workflow | T-R-02〜05, T-R-08, T-R-09, T-W-09 |
| AC-5 (idempotent batch) | unit / repository / workflow | T-U-03〜05, T-Q-01〜05, T-W-04〜06 |
| AC-7 (duplicate / partial failure / boundary 網羅) | 全層 | T-U-* + T-R-* + T-W-* + T-Q-* |
| AC-8 (after evidence で収束) | staging | T-S-02, T-S-03 |
| AC-9 (D1 直接アクセス apps/api 内) | grep（Phase 9） | apps/api の queue consumer 全 import |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 5 境界（duplicate / idempotent / partial failure / contract 移行 / before-after）を全層でカバーすることで AC-3〜AC-8 の達成可否が test 駆動で判定可能になる |
| 実現性 | PASS | Miniflare Queue / D1 mock + staging fixture 投入の経路が既存（UT-09 / UT-07B 親タスク）で確立済み |
| 整合性 | PASS | 親タスク UT-07B の T-U/T-R/T-W ID 体系を継承し、queue/cron 固有の T-Q-* を追加するのみで衝突なし |
| 運用性 | PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` 1 コマンドで CI gate に乗る。staging 実測のみ Phase 11 で manual |

## 受入条件（AC）

本 Phase は AC-7（route / workflow / repository tests が duplicate enqueue / partial failure recovery / batch boundary を網羅）の test 戦略を確定する責務に対応する。AC-1 / AC-8（staging before/after evidence）は Phase 11 引き渡しのテンプレを確定する責務として本 Phase で予約する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md` | Queue vs Cron 設計判断 / batch contract |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-03.md` | 設計レビューゲート PASS 結果 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-04.md` | 親タスクの T-U/T-R/T-W 体系（上位互換） |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | unit / workflow integration test 対象（Stage 1 alias 確定） |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | repository test 対象 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | route test 対象 |
| 必須 | `apps/api/wrangler.toml` | binding 検証起点 |
| 参考 | Miniflare Queue（`@cloudflare/workers-types` + miniflare） | in-memory queue test ヘルパ |

## 苦戦箇所【記入必須】

- 旧 contract（HTTP 202 + `backfill_cpu_budget_exhausted`）と新 contract（200 + `confirmed:true, backfill.status`）の並存期間をどう test するかは、route test を新 contract のみで固定し、旧 contract は親タスク UT-07B 配下の retire-only test として保持する。
- Miniflare Queue の at-least-once 再配送の挙動は実 Cloudflare Queue と完全一致しないため、T-W-06 は「同一 message 2 回投入で idempotent」までを保証し、配送順序の保証は staging T-S-* に委ねる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 5 層責務分離 / テストケース ID 一覧（T-U/T-R/T-W/T-Q/T-S）/ dedupe + idempotent SQL 検証 / contract 移行境界 / staging before-after テンプレ / 検証コマンド / AC 対応表 |
| メタ | artifacts.json | Phase 4 状態の更新 |

## 多角的チェック観点

- **境界網羅**: duplicate enqueue / batch idempotent / partial failure / contract 移行 / before-after の 5 境界が unit / route / workflow / repository / staging すべての層で 1 つ以上の ID にマップされているか。
- **層責務の重複排除**: unit と repository、route と workflow integration で同一観点を二重カバーしていないか（DRY）。
- **不変条件 #5**: テストコードが `apps/api/**` に閉じているか。`apps/web` から D1 / Queue binding を参照する経路を含まないか。
- **Phase 11 連結**: T-S-* before/after 計測表テンプレが Phase 11 で実測値だけを埋めれば evidence が成立する粒度か。
- **idempotent 証明**: dedupe key UNIQUE + remaining-scan UPDATE の 2 段で「at-least-once 配送下でも 1 回しか処理されない」を物理的に証明する形式か。
- **HTTP semantic**: 新 contract の 200 / 409 / 422 が route test ID と 1:1 で対応しているか（旧 202 は参照のみ）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | テスト層責務分離表起草 | 4 | pending | unit / route / workflow / repository / staging |
| 2 | T-U-* 列挙 | 4 | pending | 8 件 |
| 3 | T-R-* 列挙 | 4 | pending | 9 件（新 contract） |
| 4 | T-W-* 列挙 | 4 | pending | 9 件 |
| 5 | T-Q-* 列挙 | 4 | pending | 5 件 |
| 6 | T-S-* before/after 列挙 | 4 | pending | 3 件 / Phase 11 引き渡し |
| 7 | dedupe + idempotent SQL シナリオ | 4 | pending | T-Q-01 / T-Q-03 中心 |
| 8 | response contract 移行境界 test | 4 | pending | 旧 → 新の対応表 |
| 9 | 検証コマンド + 4 条件評価 | 4 | pending | mise exec + scripts/cf.sh |
| 10 | AC 対応表 | 4 | pending | AC-1/3/4/5/7/8/9 |

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created` へ遷移
- テストケース ID が unit + route + workflow + repository + staging で合計 30 件以上列挙
- duplicate enqueue / batch idempotent / partial failure / contract 移行 / before-after の 5 境界がすべての層でカバー
- 旧 contract（HTTP 202 + `backfill_cpu_budget_exhausted`）の撤廃と新 contract への移行 test が独立列挙
- artifacts.json の `phases[3].status` が `spec_created`

## 実行手順

1. 親タスク UT-07B `phase-04.md` の 4 層構造を読み、本 Phase の 5 層に拡張する差分のみ起草する。
2. T-Q-* 系（repository SQL レベル）を新規追加し、dedupe key + remaining-scan を SQL レベルで証明する。
3. T-S-* を before/after 形式に再構成し、Phase 11 で実測値だけを埋めれば成立する粒度に揃える。
4. 検証コマンドは `mise exec` 経由 + `scripts/cf.sh` 経由のみを列挙し、`wrangler` 直接呼び出しは含めない。
5. 4 条件評価を独立節として記述し、PASS 判定の根拠成果物パスを紐付ける。

## 次 Phase への引き渡し

- 次 Phase: 5（仕様 runbook 作成 / binding / Queue/Cron / response contract / migration）
- 引き継ぎ事項:
  - 5 層責務分離表（unit / route / workflow / repository / staging）
  - 30+ テストケース ID とその検証対象
  - dedupe key + remaining-scan の SQL レベル証明手順
  - response contract 移行（旧 202 撤廃 → 新 200）の境界 test 仕様
  - staging before/after evidence 比較表テンプレ（Phase 11）
- ブロック条件:
  - 5 境界のいずれかがカバーされていない
  - dedupe / idempotent の SQL レベル証明が欠落
  - response contract 移行 test が単独で存在しない
  - AC-1/3/4/5/7/8/9 の対応表が成立していない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration / repository test に接続する。
- queue producer / consumer / cron handler / dedupe key / idempotent UPDATE / response contract 移行 / before-after evidence は Phase 5 仕様 runbook、Phase 9 品質保証、Phase 11 staging 実測へ連結する。
- 不変条件 #5（D1 直接アクセスは `apps/api` 限定）は Phase 9 grep ベース機械検査で再確認する。
