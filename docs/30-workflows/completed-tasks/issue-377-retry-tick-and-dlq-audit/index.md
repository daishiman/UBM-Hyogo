# issue-377-retry-tick-and-dlq-audit — タスク仕様書 index

[実装区分: 実装仕様書]

判定根拠: 本タスクは scheduled cron / queue consumer 経路で `incrementRetryWithDlqAudit` / `moveToDlqWithAudit` を駆動し、DLQ 移送時に `admin.tag.queue_dlq_moved` audit を残す **コード実装** を伴う。`apps/api/src/index.ts` の `scheduled` handler への新 cron 分岐追加、`apps/api/src/workflows/` への新ファイル作成、`apps/api/wrangler.toml` の cron triggers 追加、unit / D1 fixture test 追加を伴うため、CONST_004 デフォルトの実装仕様書として作成する。Issue #377 は 2026-05-05 時点 CLOSED（`gh issue view 377 --json state,closedAt` で `closedAt=2026-05-04T23:32:18Z` 確認）のため、再オープン/クローズ操作は行わず `Refs #377` としてPR連携する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-377-retry-tick-and-dlq-audit |
| ディレクトリ | docs/30-workflows/issue-377-retry-tick-and-dlq-audit |
| Issue | #377 |
| Issue 状態 | CLOSED（2026-05-05 `gh issue view 377 --json state,closedAt` 確認: `closedAt=2026-05-04T23:32:18Z`）。再オープン/クローズ操作は行わず、Phase 13 PR で `Refs #377` を付与する |
| 親タスク | issue-109-ut-02a-tag-assignment-queue-management（completed-tasks 配下） |
| 関連 task spec | docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md |
| Wave | 2-plus（follow-up: UT-02A repository contract → operational tick 昇格） |
| 実行種別 | sequential |
| 作成日 | 2026-05-05 |
| 担当 | api / queue runtime owner |
| 状態 | implemented-local |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL（cron ログ・audit_log row・DB state を evidence とする） |
| priority | medium（issue label `priority:medium`） |

## purpose

UT-02A で実装済の repository contract（`incrementRetry` / `moveToDlq` / `listPending` / `listDlq` in `apps/api/src/repository/tagQueue.ts`）は **同期的 API には組込み済みだが、retryable error が時間経過で自動再試行され DLQ に到達する operational loop が存在しない**。本タスクは Cloudflare Workers の scheduled cron を使い、`status='queued'` かつ retry tick 対象条件（`reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL`）を満たす row だけを batch で処理する。plain human-review queue は skip し、上限超過時は `status='dlq'` 移送 + `admin.tag.queue_dlq_moved` audit を D1 batch で同時記録する。これにより不変条件 #5（admin-managed data の audit 完備）と #13（queue lifecycle の完結性）を runtime で保証する。

## scope in / out

### scope in

- 新 workflow `apps/api/src/workflows/tagQueueRetryTick.ts`（scheduled tick 本体: `runTagQueueRetryTick(env, deps)`）
- `apps/api/src/index.ts` の `scheduled` handler への新 cron 分岐追加（`*/5 * * * *` 推奨、batch=20 / maxRuntime=20s）
- `apps/api/wrangler.toml` の `[triggers] crons` への retry tick 用 cron 追記（dev / staging / production それぞれ）
- DLQ 移送時の `admin.tag.queue_dlq_moved` audit log 挿入（`audit_log` テーブル, `actor_email = 'system@retry-tick'` 相当）
- 設定値の constants 化（`TAG_QUEUE_TICK_BATCH_SIZE` / `TAG_QUEUE_TICK_MAX_RUNTIME_MS` / `TAG_QUEUE_TICK_CRON`）
- unit test: `tagQueueRetryTick.test.ts`（retry 成功 / DLQ 移送 / batch 上限 / maxRuntime 中断 / audit 記録 各ケース）
- D1 fixture test: `apps/api` の Miniflare D1 テストに retry tick → DLQ → audit log 連鎖を追加
- error 分類ポリシー（retryable: D1 transient / network；non-retryable: validation → 即 DLQ）の決定と仕様書化
- aiworkflow-requirements への cron / queue lifecycle 記述更新

### scope out

- manual requeue API（`POST /admin/tags/queue/:id/requeue`）— 別 issue
- DLQ row の手動 redrive UI / route — 別 issue（admin UI 側スコープ）
- `incrementRetry` / `moveToDlq` repository 本体ロジックの改修（既に UT-02A で実装済・本タスクでは呼び出すのみ）
- Cloudflare Queues（`[[queues.consumers]]`）への移行 — 現サイクルでは scheduled cron に閉じる
- branch protection / CI 構成の変更

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-109-ut-02a repository contract | `incrementRetry` / `moveToDlq` / `listPending` を呼び出す |
| 上流 | `apps/api/src/repository/_shared/brand.ts#auditAction` | repository 専用 brand helper 経由で `admin.tag.queue_dlq_moved` を audit action として記録する |
| 上流 | `apps/api/src/index.ts` scheduled handler | 既存 `*/15 * * * *` / `0 * * * *` / `0 18 * * *` 分岐との衝突回避 |
| 関連 | aiworkflow-requirements / queue lifecycle docs | runtime fact の正本同期 |
| external | Cloudflare Workers free plan cron 上限 | production triggers 本数を超えない設計 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md | 元 unassigned-task 正本 |
| 必須 | docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-12/implementation-guide.md | 親タスク実装ガイド・残課題 |
| 必須 | apps/api/src/repository/tagQueue.ts | 呼び出し対象 repository |
| 必須 | apps/api/src/index.ts | scheduled handler 追加対象 |
| 必須 | apps/api/wrangler.toml | cron triggers 追加対象 |
| 必須 | apps/api/src/workflows/tagQueueResolve.ts | audit 挿入パターン参考 |
| 必須 | apps/api/src/repository/_shared/brand.ts | `auditAction` brand 追加 |
| 参考 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #5 / #13 |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 制約 |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/workflows/tagQueueRetryTick.ts` が新規作成され、`runTagQueueRetryTick(env, { now, batchSize, maxRuntimeMs })` を export する。`listPending` で取得した row のうち retry tick 対象条件を満たすものだけを処理し、default scheduled path でも repository primitive 経由で retryable row の `attempt_count` / `next_visible_at` を更新し、上限超過時は DLQ 移送と `admin.tag.queue_dlq_moved` audit を同じ D1 batch で記録する。
- AC-2: `apps/api/src/index.ts` の `scheduled` handler に `cron === TAG_QUEUE_TICK_CRON` 分岐が追加され、`ctx.waitUntil(runTagQueueRetryTick(env, deps))` を呼び、既存 cron 分岐（`*/15`、`0 *`、`0 18`）と衝突しない。
- AC-3: `apps/api/wrangler.toml` の top-level / staging / production triggers に retry tick cron が追加される。legacy Sheets hourly cron は手動限定へ寄せ、各 env の cron 本数を 3 本以内に維持する。
- AC-4: `auditAction("admin.tag.queue_dlq_moved")` 経由で、DLQ 移送 1 件につき `audit_log` row 1 件が `action = 'admin.tag.queue_dlq_moved'` / `target_type = 'tag_queue'` / `target_id = queueId` / `actor_email = 'system@retry-tick'` で挿入される。
- AC-5: `TAG_QUEUE_TICK_BATCH_SIZE`（既定 20）/ `TAG_QUEUE_TICK_MAX_RUNTIME_MS`（既定 20000）/ `TAG_QUEUE_TICK_CRON`（既定 `"*/5 * * * *"`）が `apps/api/src/repository/tagQueue.ts` または `apps/api/src/workflows/tagQueueRetryTick.ts` に named export として定義される。
- AC-6: `apps/api/src/workflows/tagQueueRetryTick.test.ts` が追加され、(1) retry 成功で attempt_count++ / (2) default scheduled path が実 retry を進める / (3) max retry 超過で DLQ + audit 1 行 / (4) batch 上限で打ち切り / (5) maxRuntime 経過で残行を次回に持ち越し / (6) non-retryable error の即時 DLQ / (7) human-review queued skip — の 7 ケースが green。
- AC-7: Miniflare D1 fixture test で retry tick → DLQ → `audit_log` の row 出現を検証。
- AC-8: `pnpm --filter @ubm-hyogo/api typecheck` / `pnpm --filter @ubm-hyogo/api test` / focused Vitest がローカルで pass。root `pnpm lint` は必要時に追加実行し、実行結果を Phase 11 に記録する。
- AC-9: aiworkflow-requirements の queue lifecycle / cron 記述に retry tick 追加が反映される。
- AC-10: Phase 12 で実装ガイドと未タスク検出レポートが作成され、本タスクのスコープ外項目（manual requeue / Queues 移行）が未タスクとして明示される。

## 実装ファイル一覧（抜粋・Phase 5/6 で詳細確定）

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/workflows/tagQueueRetryTick.ts` | 新規 | tick 本体 `runTagQueueRetryTick` |
| `apps/api/src/workflows/tagQueueRetryTick.test.ts` | 新規 | unit test 5 ケース |
| `apps/api/src/index.ts` | 編集 | `scheduled` 分岐追加 |
| `apps/api/wrangler.toml` | 編集 | cron triggers 追加（3 環境） |
| `apps/api/src/repository/_shared/brand.ts` | 参照 | `auditAction("admin.tag.queue_dlq_moved")` helper |
| `apps/api/src/repository/tagQueue.ts` | 編集 | `TAG_QUEUE_TICK_*` constants と audit付き retry/DLQ repository primitive 追加 |
| `apps/api/src/workflows/tagQueueRetryTick.test.ts` | 新規 | Miniflare D1 fixture 連鎖テスト |

## Phase 一覧

各 Phase 詳細は `phase-NN.md` を参照。

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | outputs/phase-01/main.md |
| 2 | 既存実装調査 | outputs/phase-02/main.md |
| 3 | 設計（cron 設計 / error 分類 / audit shape） | outputs/phase-03/main.md |
| 4 | API / I/O 契約 | outputs/phase-04/main.md |
| 5 | データモデル / constants | outputs/phase-05/main.md |
| 6 | 関数シグネチャと擬似コード | outputs/phase-06/main.md |
| 7 | 整合性検証（既存 cron / repository / audit） | outputs/phase-07/main.md |
| 8 | エラーハンドリング / リトライ分類 | outputs/phase-08/main.md |
| 9 | テスト計画（unit / integration） | outputs/phase-09/main.md |
| 10 | デプロイ / cron 反映計画 | outputs/phase-10/main.md |
| 11 | 実行 evidence（NON_VISUAL: lint / typecheck / test / scheduled dry-run） | outputs/phase-11/main.md |
| 12 | 実装ガイド・未タスク・skill feedback | outputs/phase-12/* |
| 13 | PR 作成 | outputs/phase-13/main.md |

## DoD（Definition of Done・全 Phase 共通）

- [ ] AC-1〜AC-10 すべて満たす evidence が outputs/phase-11 配下に保存されている。
- [ ] `pnpm --filter @ubm-hyogo/api typecheck` exit 0。
- [ ] `pnpm --filter @ubm-hyogo/api test` exit 0。
- [ ] focused Vitest で新規 7 ケースが全 pass。
- [ ] `apps/api/wrangler.toml` の production cron 本数が 3 本以内。
- [ ] `audit_log` への `admin.tag.queue_dlq_moved` row 出現が Miniflare D1 fixture test で確認されている。
- [ ] Phase 12 の 7 必須ファイルが `outputs/phase-12/` 実体として存在する。
- [ ] PR 本文に `Refs #377` を含み、issue は閉じない（`Closes` を使わない）。
