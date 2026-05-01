# Phase 4: 検証戦略

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 検証戦略 |
| 作成日 | 2026-05-01 |
| 前 Phase | 3（設計レビューゲート） |
| 次 Phase | 5（仕様 runbook 作成） |
| 状態 | spec_created |
| タスク分類 | implementation（test-strategy） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した 4 軸（partial UNIQUE index / Stage 1+2 責務分離 / 5 ケース HTTP contract / 10K-100K 行 fixture 実測計画）に対する検証戦略を、(1) **unit test**（repository / workflow の純粋ロジック）、(2) **route test**（Hono route の HTTP contract 境界）、(3) **workflow integration test**（vitest in-memory D1 + Cloudflare Workers integration）、(4) **staging 大規模実測**（10,000+ 行 fixture / Workers CPU 計測）の 4 層で構成する。collision / idempotent retry / CPU budget 超過 / dryRun / apply の 5 境界を網羅的に検証することを目標とする。

## 完了条件チェックリスト

- [ ] unit / route / workflow / staging 4 層の責務分離表が確定
- [ ] テストケース ID（T-U-* / T-R-* / T-W-* / T-S-*）と検証対象が表で列挙されている
- [ ] collision / idempotent retry / CPU budget 超過 / dryRun / apply の 5 境界がすべてのテスト層でカバーされている
- [ ] vitest in-memory D1（`@cloudflare/workers-types` + Miniflare D1 mock）と Cloudflare Workers integration test の責務分離が記述されている
- [ ] partial UNIQUE index が `__extra__:%` / `unknown` / NULL を除外する挙動を検証する SQL レベル test が記述されている
- [ ] AC-7（unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅）の根拠成果物が `outputs/phase-04/test-strategy.md` に紐付いている
- [ ] AC-5（10,000 行以上の staging 実測）の手順が staging 実測テンプレと連結している（Phase 11 に引き渡し）

## 実行タスク

1. テスト層責務分離表（unit / route / workflow integration / staging 実測）を起草する（完了条件: 各層の対象 / 環境 / モック範囲 / 出力形式が表で確定）。
2. テストケース一覧（T-U-* / T-R-* / T-W-* / T-S-*）を起草する（完了条件: 各境界 5 件 × 4 層で最低 20 件以上のテストケース ID と期待挙動が列挙）。
3. partial UNIQUE index の SQL 動作検証（`__extra__:%` / `unknown` / NULL 除外）の test シナリオを起草する。
4. idempotent retry の cursor 進行表（初回 / 2 回目 / 3 回目）を route test 観点で展開する。
5. staging 実測（10K / 50K / 100K 行）の計測表テンプレを Phase 11 へ引き渡す形で確定する。
6. 成果物 `outputs/phase-04/test-strategy.md` の章立て（4 層責務 / テストケース ID 一覧 / partial UNIQUE 検証 / idempotent 検証 / staging 実測連結）を確定する。

## 検証戦略詳細

### 1. テスト層責務分離

| 層 | 対象 | 環境 | モック範囲 | 出力形式 |
| --- | --- | --- | --- | --- |
| unit (T-U-*) | `apps/api/src/repository/schemaQuestions.ts` の pre-check 関数、`apps/api/src/workflows/schemaAliasAssign.ts` 内の純粋関数（cursor 計算 / batch サイズ計算 / status 遷移） | vitest pure（DB 不要） | DB I/O は完全モック | 関数戻り値の assert |
| route (T-R-*) | `apps/api/src/routes/admin/schema.ts` の `POST /admin/schema/aliases` HTTP contract（200 / 202 in_progress / 202 exhausted / 409 / 422） | vitest + Hono test client + in-memory D1 | D1 binding は in-memory（Miniflare D1） | HTTP status / response body の assert |
| workflow integration (T-W-*) | Stage 1（alias 確定）+ Stage 2（back-fill cursor 進行）の end-to-end、partial UNIQUE 物理制約の効き、`schema_diff_queue` への cursor / status 永続化 | vitest + Miniflare D1 + 実 migration apply | Workers runtime は Miniflare、Google Forms API は不要（admin 入力経路のみ） | DB state assert + log assert |
| staging 実測 (T-S-*) | 10,000 / 50,000 / 100,000 行 fixture での apply 応答時間 / batch 数 / Workers CPU 時間 / retry 回数 | staging Cloudflare Workers + staging D1 | 実環境（mock なし） | curl wallclock + response body + Workers Logs |

### 2. テストケース一覧

#### unit (T-U-*) — 純粋ロジック

| ID | 検証対象 | 入力 | 期待挙動 |
| --- | --- | --- | --- |
| T-U-01 | `schemaQuestions.preCheckCollision` | 同一 revision_id + 既存 stable_key | `{ collision: true, code: 'stable_key_collision' }` |
| T-U-02 | `schemaQuestions.preCheckCollision` | 同一 revision_id + 新規 stable_key | `{ collision: false }` |
| T-U-03 | `schemaQuestions.preCheckCollision` | `__extra__:Q123` 重複 | `{ collision: false }`（暫定キーは pre-check 対象外） |
| T-U-04 | `backfill.computeNextCursor` | 直前 batch の last_id を input | `cursor = last_id` |
| T-U-05 | `backfill.shouldExhaust` | CPU budget remaining < threshold | `true`（exhausted 遷移） |
| T-U-06 | `backfill.deriveStatus` | updated=0 in last batch | `'completed'` |
| T-U-07 | `backfill.deriveStatus` | cursor 残あり + budget 残あり | `'in_progress'` |
| T-U-08 | `backfill.deriveStatus` | cursor 残あり + budget 枯渇 | `'exhausted'` |

#### route (T-R-*) — HTTP contract 境界

| ID | シナリオ | 期待 HTTP | 期待 body 抜粋 |
| --- | --- | --- | --- |
| T-R-01 | dryRun=true（衝突なし） | 200 | `{ "preview": {...}, "wouldUpdate": <n> }` |
| T-R-02 | dryRun=true（衝突あり） | 200 | `{ "preview": {...}, "collisions": [...] }` |
| T-R-03 | apply 完全成功（小規模） | 200 | `{ "alias": {...}, "backfill": { "status": "completed", "updated": <n> } }` |
| T-R-04 | apply alias 確定 + back-fill 継続中 | 202 | `{ "backfill": { "status": "in_progress", "cursor": "<id>", "remaining_estimate": <n> } }` |
| T-R-05 | apply alias 確定 + CPU budget 枯渇 | 202 | `{ "backfill": { "status": "exhausted", "code": "backfill_cpu_budget_exhausted", "retryable": true } }` |
| T-R-06 | retry: 既存 cursor を payload で送信 → 残件のみ処理 | 202 or 200 | `cursor` 進行 / 最終的に `completed` |
| T-R-07 | apply collision (DB UNIQUE 違反) | 409 | `{ "code": "stable_key_collision", "revision_id": "...", "stable_key": "..." }` |
| T-R-08 | apply collision (pre-check で検出) | 409 | 同上（DB に到達せず pre-check で reject） |
| T-R-09 | apply validation エラー（必須欠落） | 422 | `{ "code": "invalid_request", "details": [...] }` |
| T-R-10 | apply validation エラー（stable_key 形式不正） | 422 | 同上 |

#### workflow integration (T-W-*) — Miniflare D1 + 実 migration

| ID | 検証対象 | シナリオ | PASS 基準 |
| --- | --- | --- | --- |
| T-W-01 | partial UNIQUE index 効果 | 同一 revision + 同一確定 stable_key で 2 行 INSERT | 2 行目が SQLITE_CONSTRAINT で reject |
| T-W-02 | partial UNIQUE 除外（`__extra__:%`） | 同一 revision + 同一 `__extra__:Q123` で 2 行 INSERT | 両方 INSERT 成功 |
| T-W-03 | partial UNIQUE 除外（`unknown`） | 同一 revision + `unknown` 重複 | 両方 INSERT 成功 |
| T-W-04 | partial UNIQUE 除外（NULL） | 同一 revision + stable_key NULL 重複 | 両方 INSERT 成功 |
| T-W-05 | Stage 1 即時 commit | alias 確定後に Stage 2 で例外を発生させる | Stage 1 の `schema_questions.stable_key` 更新と `audit_log` レコードが残る |
| T-W-06 | Stage 2 idempotent retry | `__extra__:Q1` の 1000 行 fixture / batch=500 / 1 回目で cursor=500 / 2 回目で cursor=1000 | 同一行が 2 回 UPDATE されないこと（id > cursor 走査の証明） |
| T-W-07 | CPU budget 強制枯渇シミュレーション | mock の `cpuTimeBudgetRemaining()` を強制 false | `backfill_status='exhausted'` で抜けて 202 retryable |
| T-W-08 | `schema_diff_queue` cursor 永続化 | exhausted 後に再 apply | 既存 cursor を SELECT し残件のみ走査 |
| T-W-09 | `deleted_members` JOIN 除外 | back-fill 対象に soft-deleted member の row を含む | 該当行は UPDATE されないこと |
| T-W-10 | dryRun 副作用ゼロ | dryRun=true 後に DB 状態確認 | `schema_questions` / `response_fields` / `schema_diff_queue` / `audit_log` 全て unchanged |

#### staging 実測 (T-S-*) — Phase 11 引き渡し

| ID | fixture | 計測項目 | PASS 基準 |
| --- | --- | --- | --- |
| T-S-01 | 10,000 行 / `__extra__:Q###` 分布 / 5% deleted | apply 応答時間 / batch 数 / CPU 時間 / retry 回数 | 1 retry 以下で `completed` |
| T-S-02 | 50,000 行 同上 | 同上 | 3 retry 以下で `completed` |
| T-S-03 | 100,000 行 同上 | 同上 | 3 retry 以下: PASS / 5 retry 以上 or `failed` 多発: queue / cron 分割 follow-up 起票 |

### 3. partial UNIQUE index SQL 動作検証

`apps/api/migrations/00NN_schema_questions_partial_unique.sql` 適用後の Miniflare D1 で次を確認する。

```sql
-- T-W-01: 確定済 stable_key 重複 → reject
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', 'name_kanji'); -- OK
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', 'name_kanji'); -- SQLITE_CONSTRAINT 期待

-- T-W-02: __extra__:* 重複 → 許容
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', '__extra__:Q123'); -- OK
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', '__extra__:Q123'); -- OK

-- T-W-03: unknown 重複 → 許容
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', 'unknown'); -- OK
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', 'unknown'); -- OK

-- T-W-04: NULL 重複 → 許容
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', NULL); -- OK
INSERT INTO schema_questions (revision_id, stable_key) VALUES ('rev-1', NULL); -- OK
```

### 4. idempotent retry cursor 進行表（route test 観点）

| 試行 | 入力 cursor | 入力 status | DB UPDATE 件数 | 出力 cursor | 出力 status | HTTP |
| --- | --- | --- | --- | --- | --- | --- |
| 初回 | NULL | NULL | 500 | 500 | in_progress | 202 |
| 2 回目 | 500 | in_progress | 500 | 1000 | exhausted（CPU 枯渇） | 202 (retryable) |
| 3 回目 | 1000 | exhausted | 残件 < batch | 1500 | completed | 200 |

PASS 基準: 同一行が 2 試行以上で UPDATE されないこと（`id > cursor` 走査の物理的保証）。

### 5. vitest in-memory D1 と Cloudflare Workers integration test の責務分離

| 観点 | vitest in-memory D1 (T-W-*) | Cloudflare Workers integration (T-S-*) |
| --- | --- | --- |
| 環境 | Miniflare D1 (better-sqlite3 backed) | staging Cloudflare Workers + staging D1 |
| 速度 | 高速（数秒以内） | 低速（fixture 投入含め分単位） |
| 用途 | partial UNIQUE 物理制約 / Stage 分離 / cursor idempotent / DB state assert | CPU budget / 大規模 batch / 実 D1 latency |
| CPU budget 計測 | mock（`cpuTimeBudgetRemaining` を強制 false） | 実測（Workers Logs から CPU time 収集） |
| 実行頻度 | CI 全 commit | Phase 11 手動 + 重要変更時のみ |

### 6. AC との対応

| AC | 検証手段 | テストケース ID |
| --- | --- | --- |
| AC-1 (二段防御) | partial UNIQUE 物理制約 + repository pre-check | T-U-01〜03, T-W-01〜04, T-R-07, T-R-08 |
| AC-3 (idempotent retry) | cursor 進行表 + Stage 分離 | T-U-04〜08, T-W-05, T-W-06, T-W-08, T-R-04〜06 |
| AC-4 (retryable contract) | 5 ケース HTTP contract | T-R-01〜10 |
| AC-5 (10K+ 実測) | staging fixture | T-S-01〜03（Phase 11 で実行） |
| AC-7 (collision / retryable / idempotent / CPU 超過 網羅) | 全テスト層 | unit + route + workflow + staging |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-02.md` | 4 軸 base case の検証対象 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-03.md` | 4 軸 PASS 判定 |
| 必須 | `apps/api/src/repository/schemaQuestions.ts` | unit test 対象 |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | unit / workflow integration test 対象 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | route test 対象 |
| 必須 | `apps/api/migrations/*.sql` | partial UNIQUE 適用後の SQL 動作検証 |
| 参考 | Miniflare D1 (`@miniflare/d1`) | in-memory D1 のテストヘルパ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 4 層責務分離 / テストケース ID 一覧（T-U/T-R/T-W/T-S）/ partial UNIQUE SQL 検証 / idempotent cursor 進行表 / staging 実測連結 / AC 対応表 |
| メタ | artifacts.json | Phase 4 状態の更新 |

## 多角的チェック観点

- **境界網羅**: collision / idempotent retry / CPU budget 超過 / dryRun / apply の 5 境界が unit / route / workflow / staging 4 層すべてでカバーされているか。
- **層責務の重複排除**: unit と workflow integration で同一観点を二重カバーしていないか（DRY）。
- **不変条件 #5**: テストコードが `apps/api/**` に閉じているか。`apps/web` から D1 binding を参照する経路を含まないか。
- **Phase 11 連結**: T-S-* の計測表テンプレが Phase 11 で実測値だけを埋めれば evidence が成立する粒度か。
- **idempotent 証明**: cursor 進行表が「同一行二重 UPDATE 不発生」を物理的に証明する形式か。
- **HTTP semantic**: 200 / 202 / 409 / 422 の各境界が route test ID と 1:1 で対応しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | テスト層責務分離表起草 | 4 | pending | unit / route / workflow / staging |
| 2 | T-U-* (unit) 列挙 | 4 | pending | 8 件 |
| 3 | T-R-* (route) 列挙 | 4 | pending | 10 件 |
| 4 | T-W-* (workflow integration) 列挙 | 4 | pending | 10 件 |
| 5 | T-S-* (staging 実測) 列挙 | 4 | pending | 3 件 / Phase 11 引き渡し |
| 6 | partial UNIQUE SQL 動作検証 | 4 | pending | 4 ケース |
| 7 | idempotent cursor 進行表 | 4 | pending | 3 試行で同一行二重 UPDATE 不発生 |
| 8 | AC 対応表 | 4 | pending | AC-1/3/4/5/7 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- テストケース ID が unit + route + workflow + staging で合計 30 件以上列挙
- collision / idempotent retry / CPU budget 超過 / dryRun / apply の 5 境界がすべての層でカバー
- partial UNIQUE 除外条件（`__extra__:%` / `unknown` / NULL）が SQL レベル test で網羅
- artifacts.json の `phases[3].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 5（仕様 runbook 作成）
- 引き継ぎ事項:
  - test 層責務分離表（unit / route / workflow integration / staging）
  - 30+ テストケース ID とその検証対象
  - partial UNIQUE 物理制約の SQL レベル動作検証手順
  - idempotent cursor 進行表（3 試行）
  - staging 実測テンプレ（Phase 11 で実測値を埋める）
- ブロック条件:
  - 5 境界のいずれかがカバーされていない
  - partial UNIQUE 除外条件のテストが欠落
  - idempotent 証明が cursor 進行で示されていない
  - AC-1/3/4/5/7 の対応表が成立していない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
