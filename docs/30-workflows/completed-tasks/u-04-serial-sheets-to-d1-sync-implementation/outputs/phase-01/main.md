# Phase 1 成果物: 要件定義（u-04 sheets-to-d1-sync-implementation）

> 状態: completed-design
> 上位仕様: `../../phase-01.md` / `../../index.md`
> 契約入力: 03 contract task `outputs/phase-02/data-contract.md` / `sync-flow.md`
> 既存実装ファクト: `apps/api/src/jobs/sync-sheets-to-d1.ts` / `sync-forms-responses.ts` / `sync-lock.ts` / `sheets-fetcher.ts`、`apps/api/src/routes/admin/sync.ts` / `responses-sync.ts`、`apps/api/wrangler.toml [triggers] crons`、`apps/api/migrations/0002_sync_logs_locks.sql`

## 1. 目的

Sheets → D1 sync 三系統（manual / scheduled / backfill）と audit writer を `apps/api/src/sync/*` に **正式実装** するための AC / FR / NFR / Ownership / 4 条件を確定する。03 contract が docs-only で凍結した契約に対し、本 Phase で「**実装の輪郭**」を定義し、Phase 2 設計と差分ゼロで接続する。

UT-01 と既存 UT-09 実装の差分（`sync_log` 論理 vs `sync_job_logs`/`sync_locks` 物理）が判明しているため、**新規 schema 追加は U-05 に委譲し、本タスクは writer ロジックを既存テーブルに統合する適応層を持つ**ことを Phase 1 の判断として明記する。

---

## 2. ステップ 0: P50 既実装状態の調査結果

| 観点 | 既存ファクト | 本タスクで取り扱う方針 |
| --- | --- | --- |
| `apps/api/src/sync/` 配下 | **存在しない** | 新規ディレクトリとして配備（AC-1） |
| sync core | `apps/api/src/jobs/sync-sheets-to-d1.ts`（`runSync`）| 中身を `apps/api/src/sync/` 配下へ責務分離 + audit writer 接続。コード重複を起こさず、jobs/ は薄い deprecation re-export に縮退（Phase 2 sync-module-design.md で扱う） |
| Forms API 系 sync | `apps/api/src/jobs/sync-forms-responses.ts`（`runResponseSync`）| **本タスク対象外**。`syncJobs` ledger を独自に持つ別系統。U-04 は Sheets sync core 側に集中 |
| sync lock | `apps/api/src/jobs/sync-lock.ts`（`sync_locks` テーブル）| 採用。DD-02 の単文 INSERT 排他として正本化 |
| audit ledger | `sync_job_logs` テーブル（migration 0002）| audit writer の物理接続先として採用。`sync_audit` は論理名 |
| manual endpoint | `POST /admin/sync` 既存（`SYNC_ADMIN_TOKEN` Bearer）| `POST /admin/sync/run` に正本化 + 既存 path も Phase 2 で「互換維持か削除か」を決定（既存テストが path に依存しているため互換 mount を推奨） |
| Cron Trigger | `wrangler.toml` で `0 */6 * * *`（prod）/ `0 * * * *`（staging）が既設定 | 本タスクで cron 表現を `sync-flow.md` 推奨の `0 * * * *` に統一する責任を負う。03b の `*/15` / 03a の `0 18 * * *` は別 owner のため触らない |
| scheduled handler | `apps/api/src/index.ts` の default export に `scheduled` | 既存 entry に Sheets sync 経路が mount されているか Phase 2 で確認、未配備なら追加 |

**結論**: `apps/api/src/sync/` 配下は未配備。既存 `apps/api/src/jobs/sync-*.ts` を新規 `apps/api/src/sync/*` に責務分離移植（モジュール境界の整理）し、ledger は既存テーブルに寄せる。

---

## 3. ステップ 1: 契約抽出

### 3.1 data-contract.md から抽出した writer 責務

| テーブル | 列・操作 | 本タスクの writer 責務 |
| --- | --- | --- |
| `member_responses` | 全列 upsert（PK=`response_id`）| AC-1 / AC-6 / AC-8 |
| `member_identities` | UNIQUE=`response_email`、`current_response_id` 最新化 | AC-6 |
| `member_status` | `public_consent` / `rules_consent` のみ反映 | AC-4 / AC-11 |
| `sync_audit`（論理）| 全列を `running` → `success/failed` 遷移 | AC-5 |
| `form_field_aliases` | reader（mapping 解決）| AC-8 / 不変条件 #1 |

### 3.2 sync-flow.md から抽出した発火・冪等条件

| flow | 発火 | 冪等性条件 |
| --- | --- | --- |
| manual | `POST /admin/sync/run` | responseId upsert |
| scheduled | Cron Trigger（既定 `0 * * * *`）| `submittedAt > last_success.finished_at` の差分取得 + responseId upsert |
| backfill | `POST /admin/sync/backfill` | D1 transaction 内 truncate-and-reload、responseId upsert |
| recovery | Sheets を真として再 backfill | 不変条件 #7 |

### 3.3 不変条件 #4（admin 列分離）の AC 明文化

backfill 含むすべての sync 経路は `member_status.publish_state` / `is_deleted` / `hidden_reason` / `meeting_sessions` / `member_attendance` / `member_tags` / `tag_assignment_queue` / `magic_tokens` に **書き込みも削除も行わない**。これを AC-4 として明文化、Phase 4 の lint / test で違反を防止する。

---

## 4. ステップ 2: 受入条件 AC-1〜AC-12

| ID | 条件 | 出典 |
| --- | --- | --- |
| AC-1 | `apps/api/src/sync/{manual,scheduled,backfill,audit}.ts` 4 ファイルが配備される | index.md / phase-01.md |
| AC-2 | `POST /admin/sync/run` が `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer 必須で 200 + `{ auditId }` を返す | Decision Log 2026-04-30 |
| AC-3 | scheduled handler が wrangler.toml Cron Trigger（既定 `0 * * * *`）から起動し全件 upsert sync を実行 | sync-flow.md §2 |
| AC-4 | backfill が D1 トランザクション内で truncate-and-reload を行い、admin 列に**触らない** | data-contract.md §5 / 不変条件 #4 |
| AC-5 | 全 sync 経路で audit ledger row が作成され、`running` → `success/failed` に finalize される | sync-flow.md §5 |
| AC-6 | 同 responseId への再実行で副作用が発生しない（upsert 冪等性）| sync-flow.md §1 |
| AC-7 | 採用 ledger に `running` 相当の row が存在する間、新規 sync が拒否される（mutex）| sync-flow.md §6 |
| AC-8 | data-contract.md mapping table に対する contract test が pass（差分ゼロ）| index.md AC-8 |
| AC-9 | apps/web から D1 直接アクセスを行わない（不変条件 #5）。sync コードは `apps/api/src/sync/` に閉じる | CLAUDE.md |
| AC-10 | Workers 非互換依存（`googleapis` Node SDK 等）を導入しない（fetch + crypto.subtle のみ）| 不変条件 #6 |
| AC-11 | consent キーは `publicConsent` / `rulesConsent` のみ受理。それ以外は unmapped 扱い | 不変条件 #2 |
| AC-12 | Sheets API rate limit 時に exponential backoff（最大 3 回）が動作し、超過時 `failed` で記録 | sync-flow.md §6 |

---

## 5. ステップ 3: FR / NFR 分類と優先度

| 区分 | 要件 | 優先度 | 関連 AC |
| --- | --- | --- | --- |
| FR-1 | manual sync endpoint（`POST /admin/sync/run`）| 高 | AC-1, AC-2 |
| FR-2 | scheduled handler（Cron Trigger）| 高 | AC-1, AC-3 |
| FR-3 | backfill flow（truncate-and-reload）| 高 | AC-1, AC-4 |
| FR-4 | audit ledger writer（共通基盤）| 高 | AC-5 |
| FR-5 | Sheets fetch + JWT 認証（Workers 互換）| 高 | AC-3, AC-10 |
| FR-6 | mapping（Sheets row → stableKey → D1）| 高 | AC-8, AC-11 |
| FR-7 | upsert（member_responses / member_identities / member_status）| 高 | AC-6 |
| FR-8 | `GET /admin/sync/audit?limit=N`（直近 audit 一覧）| 中 | AC-5 |
| NFR-1 | 冪等性（responseId upsert）| 高 | AC-6 |
| NFR-2 | mutex（並行実行抑止）| 高 | AC-7 |
| NFR-3 | Workers 互換 | 高 | AC-10 |
| NFR-4 | 失敗時 backoff | 中 | AC-12 |
| NFR-5 | D1 writes 上限内（100K writes/day）| 中 | sync-flow.md §2 |
| NFR-6 | observability（audit row 観測 + Phase 09b で metrics 化）| 中 | AC-5 |
| NFR-7 | テスタビリティ（DI 境界 + contract test）| 高 | AC-8 |
| 制約-1 | apps/web から D1 直接アクセス禁止 | 高 | AC-9（不変条件 #5）|
| 制約-2 | admin 列分離（sync writer は触らない）| 高 | AC-4（不変条件 #4）|
| 制約-3 | `googleapis` Node SDK 禁止 | 高 | AC-10（不変条件 #6）|
| 制約-4 | consent enum 統一 | 高 | AC-11（不変条件 #2）|
| 制約-5 | sync 認可は `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer | 高 | AC-2 |

---

## 6. ステップ 4: 1.X Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | `apps/api/src/sync/*`（新規）、`apps/api/src/jobs/sync-*.ts`（responsibility 分離 / 互換 wrapper 化）、`apps/api/src/routes/admin/sync.ts`（path リネーム + 互換 mount）、`apps/api/wrangler.toml [triggers] crons`、audit ledger writer（schema 定義は U-05 owner） |
| 本タスクが ownership を持つか | yes（sync writer 全責務 / Cron Trigger 設定 / audit writer / `/admin/sync*` route） |
| 他 wave への影響 | U-05 producer（schema 提供）、U-04 consumer。05b smoke readiness と 09b cron monitoring は consumer |
| 競合リスク | `wrangler.toml` triggers セクションを 09b（監視）と 03a / 03b（schema sync / forms response sync）が同時編集する可能性 → 09b は監視 / observability のみ追加し triggers 定義は U-04 owner で固定。03a / 03b の既存 cron expression（`0 18 * * *` / `*/15 * * * *`）には触れない |
| migration 番号 / exports 改名の予約 | D1 migration は U-05 owner のため本タスクで予約しない。`apps/api/src/sync/index.ts` を新規 export hub として予約。既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` の `runSync` export は Phase 2 で deprecation 経路を確定 |
| 認可境界 | `/admin/sync/run`（manual）/ `/admin/sync/backfill`（backfill）/ `GET /admin/sync/audit`（audit）はすべて `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer 必須。人間向け `requireAdmin`（admin JWT）と混ぜない |

---

## 7. ステップ 5: 1.X 外部 SaaS 無料枠仕様調査

| 項目 | 値 | 出典 / 再確認 Phase |
| --- | --- | --- |
| Google Sheets API quota | 60 read req/min/user, 300 read req/min/project（既定）| Sheets API v4 公式。Phase 5 着手直前に再確認 |
| Cloudflare Workers Cron Trigger | 無料枠 5 cron/account、CPU time 10 ms/invocation | deployment-cloudflare.md。Phase 5 着手直前に再確認 |
| D1 writes | 100,000 writes / day（Free） | specs/08-free-database.md |
| D1 reads | 5,000,000 reads / day（Free） | specs/08-free-database.md |
| 推定消費（50 名 MVP）| 1 sync につき writes 数件〜数十件、24 sync/day = 数百〜数千 writes/day（上限の 1〜3%）| sync-flow.md §2 |
| upgrade path | Workers Paid（$5/month）で CPU time 50 ms 拡張 / D1 Paid で writes 制限緩和 | deployment-cloudflare.md |
| Cron 既存利用状況 | 現 wrangler.toml で 3 cron 使用中（`0 */6 * * *`, `0 18 * * *`, `*/15 * * * *`）。本タスクで既設 6 hour を `0 * * * *` に統一する場合は 3 cron 維持で free tier 内 | wrangler.toml |

不確定な値（Sheets quota の最新値 / Workers 無料枠 CPU time）は **Phase 5 実装直前ゲート** で再確認する。

---

## 8. ステップ 6: 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 03 contract が docs-only で閉じた sync flow を稼働状態に昇格できるか | PASS | manual / scheduled / backfill 三系統 + audit writer を実装、05b smoke readiness と 09b cron 監視に観測可能な状態を渡せる |
| 実現性 | Cloudflare Workers + Hono + D1 + Cron + Sheets API（Service Account JWT）で成立するか | PASS | 既存 `sheets-fetcher.ts` で `crypto.subtle` RS256 が既に動作している事実を確認、deployment-cloudflare.md と整合 |
| 整合性 | data-contract.md / sync-flow.md と差分ゼロにできるか | PASS | contract test を AC-8 に固定、不変条件 #1〜#7 を AC に紐付け、UT-01 既存 facts に対応表（Phase 2）で寄せる |
| 運用性 | D1 writes 100K/day 上限内、Cron 5 件/account 内で運用できるか | PASS | 1h 周期 24 回 × 数十件 = 数百〜数千 writes/day（上限 1〜3%）、cron 3 件で free tier 内 |

---

## 9. 不変条件 #1〜#7 への対応マッピング

| # | 不変条件 | 反映 AC / 設計箇所 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | mapping は `form_field_aliases` 駆動 / `extra_fields_json` への退避 → AC-8 |
| #2 | consent キーは `publicConsent` / `rulesConsent` 統一 | AC-11、mapping 段で正規化 |
| #3 | `responseEmail` は system field | mapping table §3.1、`member_responses.response_email` / `member_identities.response_email` に格納 |
| #4 | admin-managed data は sync 対象外 | AC-4、backfill が admin 列に touch しない（Phase 4 で lint / test 化） |
| #5 | apps/web から D1 直接アクセス禁止 | AC-9、sync コードは `apps/api/src/sync/` に閉じる |
| #6 | GAS prototype 不昇格 | AC-10、Workers 互換 fetch + `crypto.subtle` の継続 |
| #7 | MVP では Sheets を真として backfill | AC-4、sync-flow.md §3 / §4 と整合 |

---

## 10. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | AC を sync-module-design / audit-writer-design / cron-config / d1-contract-trace に展開 |
| Phase 4 | contract test / unit test / mutex 試験設計 |
| Phase 7 | AC マトリクス源 |
| Phase 11 | manual smoke の入力（NON_VISUAL evidence） |
| 下流 05b | smoke readiness の前提が AC-1〜AC-5 で確定 |
| 下流 09b | Cron 監視 / runbook 化の前提が AC-3 で確定 |

| 判定項目 | 基準 | 結果（Phase 1 時点）|
| --- | --- | --- |
| ユニットテストLine | 80%+ | TBD（Phase 4）|
| ユニットテストBranch | 60%+ | TBD |
| ユニットテストFunction | 80%+ | TBD |
| 結合テストAPI（manual / scheduled / backfill）| 100% | TBD |
| 結合テスト正常系 | 100% | TBD |
| 結合テスト異常系（rate limit / mutex / consent unknown 等）| 80%+ | TBD |

---

## 11. サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 契約抽出（data-contract / sync-flow） | completed | §3 |
| 2 | AC-1〜AC-12 確定 | completed | §4 |
| 3 | FR / NFR 分類 | completed | §5 |
| 4 | Ownership 宣言 | completed | §6 |
| 5 | 無料枠調査 | completed | §7 |
| 6 | 4 条件評価 | completed | §8 |

---

## 12. 真の論点（Phase 2 / 3 で確定）

- DD-01: audit ledger 採用（`sync_job_logs` 既存 vs `sync_audit` 新規）→ Phase 2 で対応表確定
- DD-02: mutex 実装（DB 排他 / Durable Object / KV）→ Phase 3 alternative
- DD-03: backfill transaction（D1 batch 一括 vs 分割）
- DD-04: scheduled 差分検出キー（`submittedAt >=` + responseId upsert）
- DD-05: Workers `crypto.subtle` RS256 spike（既存実装で動作実績あり、Phase 5 に再検証ゲート）
- DD-06: 認可（`requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer）

---

## 13. 完了条件チェック

- [x] AC-1〜AC-12 が記述されている（§4）
- [x] FR / NFR 分類と優先度が表化されている（§5）
- [x] Schema / 共有コード Ownership 宣言が完了している（§6）
- [x] 外部 SaaS 無料枠の確認結果が記載されている（§7）
- [x] 4 条件評価が PASS（4 件、§8）
- [x] 不変条件 #1〜#7 への対応が AC に紐付いている（§9）
- [x] artifacts.json の `metadata.taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` が確定（既存値で整合）
- [x] 本 Phase 内の全タスクを 100% 実行完了

---

## 14. 次 Phase 引き継ぎ事項

- manual handler（Hono ルート）/ scheduled handler（Workers default export）/ backfill handler の Server / Client 境界
- audit writer の共通基盤化（前後フック startRun / finishRun / failRun）
- mutex 実装方式の DB 排他採用（既存 `sync_locks` をベースとする）と Phase 3 alternative
- mapping.ts と `form_field_aliases` テーブルの結合方式（既存 `apps/api/src/jobs/mappers/` の再利用評価）
- 既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` の `runSync` から新 `apps/api/src/sync/` への責務移植戦略
