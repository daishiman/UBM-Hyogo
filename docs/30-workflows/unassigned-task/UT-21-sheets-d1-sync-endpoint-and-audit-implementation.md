# UT-21: Sheets→D1 sync endpoint 実装と audit logging

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-21 |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | legacy / close-out 済（`task-ut21-forms-sync-conflict-closeout-001` により現行 Forms sync 正本へ吸収。単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は本タスクで新設しない） |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | 03a / 03b / 04c / 09b（有効品質要件のみ移植。Sheets direct implementation としては進めない） |
| 組み込み先 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/` |
| 検出元 | doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) |

> **Legacy / historical context only**: 以下の本文は UT-21 当初案の履歴証跡であり、現時点の実装指示として使用しない。現行正本は `docs/30-workflows/ut21-forms-sync-conflict-closeout/` と `.claude/skills/aiworkflow-requirements/references/task-workflow.md` の Forms sync 方針である。単一 `POST /admin/sync`、`GET /admin/sync/audit`、`sync_audit_logs`、`sync_audit_outbox`、Sheets direct 実装、`apps/api/src/sync/{core,manual,scheduled,audit}.ts` 新設は本タスクから実施しない。

## 目的

> **Legacy note**: 本節は履歴であり、実装 ToDo ではない。実装可否・移植先は close-out 仕様書と UT21-U02/U04/U05 を参照する。

03-serial-data-source-and-storage-contract で確定した Sheets→D1 sync の契約 (data-contract / sync-flow / runbook) に基づき、`apps/api/src/sync/*` 配下に manual sync endpoint・scheduled handler・audit logger の実コードを実装し、契約 (docs-only) と実装 (code) の境界を解消する。

## スコープ

> **Legacy note**: 本節の `含む` は当初案の範囲であり、現行ブランチでの実装指示ではない。

### 含む
- `apps/api/src/sync/manual.ts`（仮）: 管理者用 manual sync エンドポイント実装。CLAUDE.md の認証要件に従い Auth.js セッション + admin role チェック必須
- `apps/api/src/sync/scheduled.ts`（仮）: Cloudflare Cron Triggers 用 scheduled handler 実装。`wrangler.toml` の `[triggers]` 設定と整合
- `apps/api/src/sync/audit.ts`（仮）: 同期実行ごとの audit log writer。phase-02 の data-contract.md で定義された audit テーブルへ書き込み
- 03-serial の sync-flow.md にある状態遷移 (start → fetch → upsert → audit → complete) の忠実な実装
- リトライ / timeout / batch サイズ等の constants 定義（U-03 で別途チューニング想定）
- 本タスク完了後、03-serial の `outputs/phase-05/sync-deployment-runbook.md` の手順で deploy 可能な状態にする

### 含まない
- 同期方式の再設計（03-serial で確定済み・契約変更しない）
- D1 schema 変更（UT-04 / UT-22 のスコープ）
- Cron スケジュール最終チューニング（U-03 → 05a-observability で対応）
- 通知連携（UT-07）・モニタリング（UT-08）連携
- backfill 専用ジョブ（03-serial の sync-flow.md で別経路として定義済み・別タスク化）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | sync 契約 (data-contract / sync-flow / runbook) が source-of-truth |
| 上流 | UT-03（Sheets API 認証方式設定） | Service Account 認証フローの実装が前提 |
| 上流 | UT-04 / UT-22（D1 schema・migration 適用） | upsert 対象テーブル・audit テーブルが D1 に存在していること |
| 上流 | 02-serial-monorepo-runtime-foundation | `apps/api` ランタイム基盤・Hono ルーティングが整備済み |
| 下流 | UT-07（通知基盤） | sync 失敗通知の上流 |
| 下流 | UT-08（モニタリング） | sync メトリクスの計測対象 |
| 下流 | 05a-observability-and-cost-guardrails | constants 最終チューニング (U-03) と metrics 詳細 (U-02) |
| 下流 | 05b-smoke-readiness-and-handoff | smoke シナリオで本実装を行使する |

## 着手タイミング

> **着手前提**: 03-serial-data-source-and-storage-contract が main にマージされ、UT-22 (D1 migration SQL 実体) が完了していること。本タスクは Wave 1 後半。

| 条件 | 理由 |
| --- | --- |
| 03-serial マージ済み | 契約ドキュメントが正本として参照可能であること |
| UT-22 完了 | D1 に audit テーブル含む schema が適用済みでないと upsert / audit 書き込みが失敗 |
| UT-03 完了 | Sheets API 認証なしでは fetch が実行できない |

## 苦戦箇所・知見

**03-serial セッションで基本実装済み（2026-04-26）**
03-serial フェーズ中に基本実装を先行作成した。実際のファイル構成は spec の提案（core.ts / manual.ts / scheduled.ts / audit.ts）とは異なる：
- `apps/api/src/sync/types.ts` — Env, SheetRow, SyncResult 等の型定義
- `apps/api/src/sync/sheets-client.ts` — Workers-compatible JWT + Sheets API fetch クライアント
- `apps/api/src/sync/mapper.ts` — COL 定数 / mapRowToSheetRow / generateResponseId（SHA-256 冪等キー）
- `apps/api/src/sync/worker.ts` — `runSync` / `runBackfill` + `upsertRow` + `writeAuditLog`
- `apps/api/src/index.ts` — POST /sync/manual, POST /sync/backfill, GET /sync/audit ルート追加

残作業: Auth.js admin role ガード・Vitest ユニットテスト・backfill テスト（Sheet に実回答が必要）。

**TypeScript exactOptionalPropertyTypes=true の落とし穴**
`tsconfig.json` に `"exactOptionalPropertyTypes": true` が設定されているため、`field?: string` ではなく `field: string | undefined` と明示しないとコンパイルエラーになる。SheetRow の全フィールドを `string | undefined` で宣言し直す必要があった。DB バインドパラメータも `row.field ?? null` の null 合体が必須。

**Workers での crypto.subtle RS256 署名**
googleapis は Workers ランタイムで動作しない。JWT 署名を `crypto.subtle.importKey`（`extractable: false`、`sign` algorithm `{name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}`）で実装する必要がある。PEM の `---BEGIN PRIVATE KEY---` ヘッダを除去して base64 デコードしてから `importKey` に渡すこと。

**1Password vault 名の確認**
`op read "op://Environments/..."` は vault が存在せず失敗する。実際の vault 名は **Employee**、item 名は **ubm-hyogo-env**。すべての op:// 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式を使うこと。

**SA 名の確認**
Service Account 名は `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`（`ubm-sheets-reader` ではない）。

**契約 (docs-only) と実装 (code) の境界**
03-serial では「contract-only / docs-only」原則を貫いたため、phase-12 で sync コード本体が `apps/api/src/sync/*` に存在しないことが unassigned-task として検出された (U-04)。実装段階では 03-serial の `outputs/phase-02/sync-flow.md` を「コードコメントへ転記しない」運用ルール（CLAUDE.md 不変条件「実フォームの schema をコードに固定しすぎない」と同趣旨）を守り、契約変更時は 03-serial を直接編集してから実装を追従させること。

**Cloudflare Workers の scheduled handler 単体テスト困難性**
`wrangler dev` では Cron Triggers がデフォルト起動しない（UT-09 でも記録）。本タスクではさらに manual / scheduled の2系統が同じコアロジックを呼ぶため、コア処理を `runSync(env, options)` のような pure function に切り出し、handler は薄いラッパに留める設計で単体テストを担保する。現状の `worker.ts` の `runSync` がそのパターンに相当する。

**audit log の書き込み失敗時の扱い**
sync 本体が成功して audit 書き込みのみ失敗した場合、ロールバックすると主データが失われ、放置すると監査性が破綻する。03-serial の data-contract.md にある「audit は best-effort + 失敗を別 outbox に蓄積」方針に厳密に従い、勝手にトランザクション化しないこと。

**manual endpoint の認可漏れリスク**
現状の `/sync/manual` と `/sync/backfill` は認証ガードなし。Auth.js セッション検証 + admin role チェック + CSRF 対策の3点を必ず実装すること。Hono の middleware で集約し、ルートごとに付け忘れない構成にする。

## 実行概要

- `apps/api/src/sync/` ディレクトリを新設し、`core.ts` (pure runSync), `manual.ts` (Hono route), `scheduled.ts` (ScheduledController handler), `audit.ts` (writer + outbox) に分離
- 03-serial `outputs/phase-02/sync-flow.md` の状態遷移をコード上の関数境界と1:1 対応させる
- `wrangler.toml` `[triggers]` に Cron 追加（dev / production で間隔分離）
- Vitest で `runSync` の冪等性 / batch 分割 / audit best-effort をユニットテスト
- 03-serial `outputs/phase-05/sync-deployment-runbook.md` の手順を README として `apps/api/src/sync/README.md` に集約

## 完了条件

> **Legacy note**: 以下は当初案の完了条件であり、現行 close-out 後の実行チェックリストではない。未完・要否判定・境界整理は 03a / 03b / 04c / 09b および UT21-U02/U04/U05 に委譲する。

- [x] sync コアロジックが実装済み（`apps/api/src/sync/worker.ts` の `runSync` / `runBackfill`）— 03-serial で完了
- [x] `apps/api/src/index.ts` に POST /sync/manual, POST /sync/backfill, GET /sync/audit ルート追加 — 03-serial で完了
- [x] `wrangler.toml` に `[triggers] crons = ["0 * * * *"]` 追加 — 03-serial で完了
- [ ] Auth.js admin role + CSRF ミドルウェアを `/sync/*` ルートに適用（現状は認証なし）
- [ ] `runSync` の冪等性テスト（同一データ2回同期で重複なし）を Vitest で pass
- [ ] audit log 成功時書き込み・失敗時挙動のテストを Vitest で pass
- [ ] 03-serial の data-contract / sync-flow / runbook と差分がないことを5点同期チェックで確認
- [ ] dev 環境で Cron Triggers 経由の scheduled 実行が観測できること（backfill テストを兼ねる）
- [ ] `wrangler.toml` の Cron スケジュールを dev / production で分離（現状は両環境 `"0 * * * *"`）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 同期状態遷移の正本 |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit / upsert 仕様 |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | deploy 手順 |
| 必須 | doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) | 検出原典 |
| 参考 | UT-09 の苦戦箇所セクション | Cron / batch / Service Account の知見再利用 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |
