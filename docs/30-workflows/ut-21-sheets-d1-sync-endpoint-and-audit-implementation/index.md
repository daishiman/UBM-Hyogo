# ut-21-sheets-d1-sync-endpoint-and-audit-implementation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-21 |
| タスク名 | Sheets→D1 sync endpoint 実装と audit logging |
| ディレクトリ | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation |
| Wave | 1 |
| 実行種別 | parallel（UT-09 と API 契約整合・03-serial マージ後着手可能） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | blocked（現行 Forms sync 正本との矛盾検出） |
| タスク種別 | blocked / application_implementation / NON_VISUAL（Sheets API / 単一 `/admin/sync` / audit outbox 前提が現行 Forms sync 正本と衝突） |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | なし（UT-09 は contract / design レベル、本タスクは実装コード化） |
| 組み込み先 | - |
| GitHub Issue | #30 (CLOSED) |
| 検出元 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) |

## 正本語彙

この workflow では、以下を正本語彙として全 Phase で固定する。Phase 本文に異なる表現が出た場合は、この表を優先して修正する。

| 項目 | 正本 |
| --- | --- |
| API ルート | BLOCKED: `POST /admin/sync`, `GET /admin/sync/audit` は現行正本と衝突。現行正本は `POST /admin/sync/schema`, `POST /admin/sync/responses` |
| API 認可 | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` |
| Web 管理画面境界 | SYNC_ADMIN_TOKEN Bearer は Web 画面から API を呼ぶ場合の上位境界。API ルートの正本認可とは分ける |
| audit table | BLOCKED: `sync_audit_logs` は現行 `sync_jobs` ledger と衝突 |
| audit outbox table | BLOCKED: `sync_audit_outbox` は `sync_jobs` の不足分析後に再判定 |
| Service Account secret | `GOOGLE_SHEETS_SA_JSON` |
| 仕様状態 | `spec_created` は仕様作成済み。実装完了・smoke PASS・PR 作成は Phase 実行後に artifacts.json で更新する |

## 目的

03-serial-data-source-and-storage-contract で確定した Sheets→D1 sync 契約 (data-contract / sync-flow / runbook) に基づき、`apps/api/src/sync/*` 配下に manual sync endpoint・scheduled handler・audit logger の実コードを実装し、契約 (docs-only) と実装 (code) の境界を解消する。SYNC_ADMIN_TOKEN Bearer による API 認可境界、SHA-256 ベースの冪等キー、audit best-effort + 失敗 outbox の三位一体を担保する。

## スコープ

### 含む

- `apps/api/src/sync/types.ts` — Env / SheetRow / SyncResult 型定義（exactOptionalPropertyTypes=true 対応）
- `apps/api/src/sync/sheets-client.ts` — Workers 互換 JWT 署名 (crypto.subtle RS256) + Sheets API fetch クライアント
- `apps/api/src/sync/mapper.ts` — COL 定数 / mapRowToSheetRow / generateResponseId（SHA-256 冪等キー生成）
- `apps/api/src/sync/worker.ts` — `runSync` / `runBackfill` / `upsertRow` / `writeAuditLog` のコアロジック
- `apps/api/src/index.ts` — `POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` の Hono ルート登録
- SYNC_ADMIN_TOKEN Bearer middleware の `/admin/sync*` への一括適用（CSRF 含む）
- audit log の best-effort 書き込み + 失敗時の outbox 蓄積方針実装
- 03-serial `outputs/phase-02/sync-flow.md` の状態遷移 (start → fetch → upsert → audit → complete) と関数境界の 1:1 対応
- `wrangler.toml` `[triggers]` の dev / production 環境別 Cron スケジュール分離
- Vitest による `runSync` 冪等性 / batch 分割 / audit best-effort のユニットテスト

### 含まない

- 同期方式の再設計（03-serial で確定済み・契約変更しない）
- D1 schema 変更（UT-04 / UT-22 のスコープ）
- Cron スケジュール最終チューニング（U-03 → 05a-observability で対応）
- 通知連携（UT-07）・モニタリング（UT-08）連携
- backfill 専用ジョブ（03-serial の sync-flow.md で別経路として定義済み・別タスク化）
- Service Account JSON 認証フロー新規実装（UT-03 で確定済み・本タスクで `sheets-client.ts` から再利用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 03-serial-data-source-and-storage-contract | sync 契約 (data-contract / sync-flow / runbook) が source-of-truth |
| 上流 | UT-03（Sheets API 認証方式設定） | Service Account 認証フローの実装が前提 |
| 上流 | UT-04 / UT-22（D1 schema・migration 適用） | upsert 対象テーブル・audit テーブルが D1 に存在していること |
| 上流 | 02-serial-monorepo-runtime-foundation | `apps/api` ランタイム基盤・Hono ルーティングが整備済み |
| 並列 | UT-09（Sheets→D1 Cron 同期ジョブ） | Cron Trigger 設計と本タスクの scheduled handler 実装の API 契約整合 |
| 下流 | UT-07（通知基盤） | sync 失敗通知の上流（audit log がトリガ源） |
| 下流 | UT-08（モニタリング） | sync メトリクスの計測対象（audit log を集計） |
| 下流 | 05a-observability-and-cost-guardrails | constants 最終チューニング (U-03) と metrics 詳細 (U-02) |
| 下流 | 05b-smoke-readiness-and-handoff | smoke シナリオで本実装を行使する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md | 同期状態遷移の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md | audit / upsert 仕様（best-effort + outbox 含む） |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-05/sync-deployment-runbook.md | deploy 手順 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04) | 検出原典 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 原典 unassigned-task スペック |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名規約・認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Service Account JSON 取り扱い・Cloudflare Secrets |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | Cron / batch / Service Account の知見再利用 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | crypto.subtle RS256 署名仕様 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |

## 受入条件 (AC)

- AC-1: `apps/api/src/sync/worker.ts` の `runSync` / `runBackfill` がコアロジックとして実装され、scheduled / manual 双方から呼び出される（03-serial で完了済み）
- AC-2: `POST /admin/sync` / `POST /admin/sync/responses` / `GET /admin/sync/audit` の3ルートが `apps/api/src/index.ts` に登録されている（03-serial で完了済み）
- AC-3: `wrangler.toml` `[triggers]` で dev / production 環境別 Cron スケジュールが分離されている（現状は両環境 `"0 * * * *"` で残作業）
- AC-4: Authorization Bearer token 検証が `/admin/sync*` ルートに middleware として一括適用されている
- AC-5: 同一 Sheets 行データを2回同期しても D1 に重複が発生しない（SHA-256 ベース冪等キー `generateResponseId` による検証を Vitest で pass）
- AC-6: audit log 書き込み成功時 / 失敗時の挙動が 03-serial data-contract.md の best-effort + outbox 方針に従い、Vitest で pass する
- AC-7: 03-serial の data-contract / sync-flow / runbook と本実装の差分がない（5点同期チェックで確認）
- AC-8: dev 環境で Cron Triggers 経由の scheduled 実行が観測でき、backfill テストを兼ねている
- AC-9: Workers crypto.subtle による RS256 JWT 署名が `sheets-client.ts` で動作し、googleapis 依存が混入していない
- AC-10: `tsconfig.json` `exactOptionalPropertyTypes=true` 下で全 SheetRow フィールドが `string | undefined` で宣言され、DB バインドは `?? null` 合体されている
- AC-11: Service Account JSON / SHEETS_SPREADSHEET_ID / Auth.js secrets が 1Password (vault: Employee / item: ubm-hyogo-env) → Cloudflare Secrets 経由で注入され、コードにハードコードされていない
- AC-12: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | blocked | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | blocked | outputs/phase-02/sync-endpoint-design.md |
| 3 | 設計レビュー | phase-03.md | blocked | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | blocked | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | blocked | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | blocked | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | blocked | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | blocked | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | blocked | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | blocked | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | blocked | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | blocked | outputs/phase-12/implementation-guide.md |
| 13 | PR作成 | phase-13.md | blocked | outputs/phase-13/local-check-result.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・三位一体論点） |
| 設計 | outputs/phase-02/sync-endpoint-design.md | actual file structure・Mermaid・middleware 挿入点 |
| 設計 | outputs/phase-02/audit-best-effort-design.md | audit best-effort + outbox / 冪等キー (SHA-256) 設計 |
| レビュー | outputs/phase-03/main.md | 代替案比較 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | 冪等性 / audit best-effort / admin auth テスト設計 |
| 実装 | outputs/phase-05/implementation-runbook.md | ファイル一覧・middleware 配線・runbook |
| 異常系 | outputs/phase-06/failure-cases.md | audit 失敗 / JWT 署名失敗 / 認可漏れシナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 のトレーサビリティマトリクス |
| QA | outputs/phase-09/contract-sync-check.md | 03-serial との 5 点同期検証 |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・blocker 一覧 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | wrangler dev での scheduled / manual 実行ログ |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（技術者向け） |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api ランタイム / Cron Triggers / scheduled handler | 無料枠（1日100,000 requests） |
| Cloudflare D1 | DB（同期先 + audit テーブル + outbox） | 無料枠（5GB / 25M reads / 50K writes） |
| Cloudflare Secrets | Service Account JSON / Auth.js secrets 格納 | 無料 |
| Auth.js (NextAuth) | admin role / session 検証 | OSS |
| Google Sheets API v4 | 同期元データ取得 | 無料（300 req/min/project） |
| Web Crypto API (crypto.subtle) | RS256 JWT 署名 | Workers 標準 |
| 1Password (vault: Employee) | secrets 正本管理 | 既存契約 |

## Secrets 一覧（このタスクで導入・参照）

| Secret 名 | 用途 | 注入経路 | 1Password 参照 |
| --- | --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | Service Account JSON 文字列（`JSON.stringify` 済み）。SA 名: `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com` | Cloudflare Secret → Workers env | `op://Employee/ubm-hyogo-env/GOOGLE_SHEETS_SA_JSON` |
| `SHEETS_SPREADSHEET_ID` | 同期元シート ID | Cloudflare Variable / Secret | `op://Employee/ubm-hyogo-env/SHEETS_SPREADSHEET_ID` |
| `SYNC_ADMIN_TOKEN` | Auth.js セッション検証鍵 | Cloudflare Secret | `op://Employee/ubm-hyogo-env/SYNC_ADMIN_TOKEN` |
| `ADMIN_ROLE_EMAILS` | admin role 判定対象 email allowlist | Cloudflare Variable | `op://Employee/ubm-hyogo-env/ADMIN_ROLE_EMAILS` |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | Sheets schema は `mapper.ts` (COL 定数) に閉じ、`worker.ts` / `index.ts` には漏らさない。03-serial 契約を「コードコメントへ転記しない」 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | audit テーブル / outbox は admin-managed data として専用テーブルに分離 |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | sync endpoint・audit writer・outbox いずれも `apps/api/src/sync/*` 内のみ。`apps/web` から呼び出す設計を排除 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-12 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 03-serial の data-contract / sync-flow / runbook との 5 点同期チェックが Phase 9 で PASS
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. 03-serial セッションで基本実装済み（2026-04-26）**
03-serial フェーズ中に基本実装を先行作成した。actual file structure は spec の提案（core.ts / manual.ts / scheduled.ts / audit.ts）とは異なる：

- `apps/api/src/sync/types.ts` — Env, SheetRow, SyncResult 等の型定義
- `apps/api/src/sync/sheets-client.ts` — Workers-compatible JWT + Sheets API fetch クライアント
- `apps/api/src/sync/mapper.ts` — COL 定数 / mapRowToSheetRow / generateResponseId（SHA-256 冪等キー）
- `apps/api/src/sync/worker.ts` — `runSync` / `runBackfill` + `upsertRow` + `writeAuditLog`
- `apps/api/src/index.ts` — POST /admin/sync, POST /admin/sync/responses, GET /admin/sync/audit ルート追加

残作業は SYNC_ADMIN_TOKEN Bearer ガード、Vitest ユニットテスト、backfill テスト（Sheet に実回答が必要）、wrangler.toml の env 別 Cron 分離。

**2. TypeScript exactOptionalPropertyTypes=true の落とし穴**
`tsconfig.json` に `"exactOptionalPropertyTypes": true` が設定されているため、`field?: string` ではなく `field: string | undefined` と明示しないとコンパイルエラーになる。SheetRow の全フィールドを `string | undefined` で宣言し直す必要があった。DB バインドパラメータも `row.field ?? null` の null 合体が必須。

**3. Workers での crypto.subtle RS256 署名**
googleapis は Workers ランタイムで動作しない。JWT 署名を `crypto.subtle.importKey`（`extractable: false`、`sign` algorithm `{name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}`）で実装する必要がある。PEM の `-----BEGIN PRIVATE KEY-----` ヘッダを除去して base64 デコードしてから `importKey` に渡す。

**4. 1Password vault 名と SA 名の確認**
`op read "op://Environments/..."` は vault が存在せず失敗する。実際の vault 名は **Employee**、item 名は **ubm-hyogo-env**。すべての op:// 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式を使う。Service Account 名は `ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com`（`ubm-sheets-reader` ではない）。

**5. 契約 (docs-only) と実装 (code) の境界**
03-serial は「contract-only / docs-only」原則を貫いたため、phase-12 で sync コード本体が `apps/api/src/sync/*` に存在しないことが U-04 として検出された。実装段階では 03-serial の `sync-flow.md` を「コードコメントへ転記しない」運用ルール（CLAUDE.md 不変条件 #1 と同趣旨）を守り、契約変更時は 03-serial を直接編集してから実装を追従させる。

**6. Cloudflare Workers の scheduled handler 単体テスト困難性**
`wrangler dev` では Cron Triggers がデフォルト起動しない（UT-09 でも記録）。本タスクではさらに manual / scheduled の2系統が同じコアロジックを呼ぶため、コア処理を `runSync(env, options)` のような pure function に切り出し、handler は薄いラッパに留める設計で単体テストを担保する。現状の `worker.ts` の `runSync` がそのパターンに相当する。

**7. audit log の書き込み失敗時の扱い (best-effort + outbox)**
sync 本体が成功して audit 書き込みのみ失敗した場合、ロールバックすると主データが失われ、放置すると監査性が破綻する。03-serial の data-contract.md にある「audit は best-effort + 失敗を別 outbox に蓄積」方針に厳密に従い、勝手にトランザクション化しない。outbox は別 cron で再 drain する設計。

**8. manual endpoint の認可漏れリスク**
現状の `/admin/sync` と `/admin/sync/responses` は認証ガードなし。Authorization Bearer token 検証を必ず実装する。Hono の middleware で集約し、ルートごとに付け忘れない構成にする（middleware を `app.use('/admin/sync*', adminAuth)` の形でまとめて適用）。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/30
- 原典 unassigned-task: ../unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md
- 並列タスク: ../ut-09-sheets-to-d1-cron-sync-job/index.md
- 上流契約: docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/
