# ut-06-followup-H-health-db-endpoint - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-H |
| タスク名 | apps/api に `GET /health/db` D1 疎通 endpoint を実装 |
| ディレクトリ | docs/30-workflows/ut-06-followup-H-health-db-endpoint |
| Wave | 1（UT-06 本番実行ブロッカー） |
| 実行種別 | serial（UT-22 D1 migration 適用後の単独 PR） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | completed（コード実装済み / 運用 secret・WAF・実環境 smoke 待ち） |
| タスク種別 | docs-plus-code（元仕様は docs-only 由来） |
| 実装ターゲット | implementation（`apps/api` の `GET /health/db` endpoint は本ワークツリーで実装済み） |
| visualEvidence | NON_VISUAL |
| scope | api_health |
| 由来 | UT-06 Phase 12 UNASSIGNED-H / 実行前ブロッカー B-2 |
| 親タスク | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution |
| GitHub Issue | #121（CLOSED の状態のままタスク仕様書を整備する） |

## 目的

UT-06 AC-4「API 経由 D1 SELECT smoke」を実行可能にするため、`apps/api` に `GET /health/db` を実装し、Phase 1〜13 のタスク仕様書を `docs/30-workflows/ut-06-followup-H-health-db-endpoint/` 配下に固定する。実装ターゲットは「`Env.DB: D1Database` 型定義 + `SELECT 1` を実行する `GET /health/db` ハンドラ + 200/503 応答 + 認証 / WAF 方針 + Phase 11 smoke S-03 / S-07 期待値同期」を運用合格ラインとする。2026-04-29 時点でコードと単体テストは本ワークツリーに実装済みで、残作業は `HEALTH_DB_TOKEN` Secret 投入、Cloudflare WAF 設定、staging/production deploy、実環境 smoke である。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase 1〜3 成果物本体（`outputs/phase-0N/main.md`）の作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- UT-22 D1 migration 適用 / D1 binding 確立を必須前提とする依存順序の明文化
- 受入条件 AC-1〜AC-9 の固定
- レスポンス schema（成功時 / 失敗時）の仕様レベル定義
- 認証 / WAF / IP allowlist 方針の意思決定論点の明文化
- UT-06-FU-I（`/health` 期待値同期）との境界明示
- Phase 11 smoke S-03 / S-07 期待値テンプレ同期の仕様化
- 苦戦箇所（D1 binding 型 / 失敗時 HTTP status / 認証要否 / smoke drift）の Phase 1 / 2 への取り込み

### 含まない

- D1 schema 変更（UT-22 別タスク）
- `/health` 既存 endpoint の改修（UT-06-FU-I で扱う）
- D1 migration 実行（UT-22 別タスク）
- Cloudflare WAF / IP allowlist の実適用（運用タスク）
- 外部監視（UT-08 通知基盤）側の閾値変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-22 D1 migration SQL 適用 | `SELECT 1` は migration 不要だが D1 binding が production / staging で有効化されている必要がある |
| 上流 | UT-06 Phase 12 UNASSIGNED-H / 実行前ブロッカー B-2 | 本タスクの起源。型契約・実行ブロッカーの確立元 |
| 関連 | UT-06-FU-I（/health 期待値同期） | レスポンス形式 / smoke 期待値の整合 |
| 下流 | UT-06 Phase 11 smoke S-03 / S-07 | AC-4 実行の前提となる本 endpoint |
| 下流 | UT-08 通知基盤 | 503 + Retry-After を解釈する監視側設計 |

## Phase ナビゲーション

| Phase | ファイル | 状態 | 成果物 |
| --- | --- | --- | --- |
| Phase 1 | [phase-01.md](phase-01.md) | completed | `outputs/phase-01/main.md` |
| Phase 2 | [phase-02.md](phase-02.md) | completed | `outputs/phase-02/main.md` |
| Phase 3 | [phase-03.md](phase-03.md) | completed | `outputs/phase-03/main.md` |
| Phase 4 | [phase-04.md](phase-04.md) | completed | `outputs/phase-04/main.md` |
| Phase 5 | [phase-05.md](phase-05.md) | completed | `outputs/phase-05/main.md` |
| Phase 6 | [phase-06.md](phase-06.md) | completed | `outputs/phase-06/main.md` |
| Phase 7 | [phase-07.md](phase-07.md) | completed | `outputs/phase-07/main.md` |
| Phase 8 | [phase-08.md](phase-08.md) | completed | `outputs/phase-08/main.md` |
| Phase 9 | [phase-09.md](phase-09.md) | completed | `outputs/phase-09/main.md` |
| Phase 10 | [phase-10.md](phase-10.md) | completed | `outputs/phase-10/main.md` |
| Phase 11 | [phase-11.md](phase-11.md) | completed | `outputs/phase-11/` の NON_VISUAL evidence |
| Phase 12 | [phase-12.md](phase-12.md) | completed | `outputs/phase-12/` |
| Phase 13 | [phase-13.md](phase-13.md) | spec_created | なし（user 承認後 PR） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-H-health-db-endpoint.md | 原典スペック（79 行）。本 workflow の Phase 1〜13 はこの内容の writable 版 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-H 検出根拠 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | 型契約 / 実行ブロッカー B-2 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | smoke S-03 / S-07 期待値テンプレ |
| 必須 | apps/api/src/index.ts | 実装対象（Phase 5 以降で参照） |
| 必須 | apps/api/wrangler.toml | D1 binding 設定 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 のテンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 1〜13 共通セクション順 |
| 必須 | .claude/skills/aiworkflow-requirements/references | 不変条件 #5 / repository 境界 / API 設計 |
| 参考 | https://developers.cloudflare.com/d1/ | D1 binding / API |
| 参考 | https://hono.dev/getting-started/cloudflare-workers#bindings | Hono Bindings ジェネリクス |

## 受入条件 (AC)

- AC-1: `Env.DB: D1Database` の型定義が `apps/api/src/index.ts`（または型 import 元）に追加されることが Phase 1 / 2 で固定されている。
- AC-2: `GET /health/db` が `SELECT 1` を実行する仕様が Phase 1（要件）/ Phase 2（設計）/ Phase 5（実装ランブック）で重複明記されている。
- AC-3: 成功時応答が `HTTP 200` + `{ ok: true, db: "ok", check: "SELECT 1" }` で確定している。
- AC-4: 失敗時応答が `HTTP 503` + `{ ok: false, db: "error", error: string }` + `Retry-After` ヘッダ付与で確定している。
- AC-5: `apps/api/wrangler.toml` の D1 binding が production / staging / development で確認されている（既存の場合は確認のみ、未設定の場合は仕様レベルで指示）。
- AC-6: 認証 / WAF / IP allowlist 方針（公開可否・`X-Health-Token` 要否）が Phase 1 で意思決定されドキュメントに記載されている。
- AC-7: Phase 11 S-03 / S-07 smoke 期待値が本 endpoint 実装と drift しないテンプレ更新方針が Phase 11 に固定されている。
- AC-8: タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: api_health` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- AC-9: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しないことが Phase 1 / 2 / 3 で確認されている。

## 苦戦箇所・知見（原典より）

1. **D1 binding 型の付与**: Hono + Cloudflare Workers では `Hono<{ Bindings: Env }>` のジェネリクスで binding 型を付ける必要がある。`c.env.DB` で参照可能か runtime で確認する。
2. **失敗時の HTTP status 設計**: `SELECT 1` が失敗する状況は D1 ダウン時のみ。503 を返すと外部監視（UT-08 通知基盤）が誤検知する可能性があるため、503 + `Retry-After` ヘッダ付与等で運用と整合する。
3. **認証要否**: `/health/db` は内部 health check 想定だが、unauth で公開すると D1 ping を外部から打てる。Cloudflare WAF / IP allowlist と `X-Health-Token` で制御するかを意思決定する。
4. **smoke 期待値と実装の同期**: Phase 11 docs が期待する形式と実装が drift しないよう、本タスク内で `outputs/phase-11/smoke-test-result.md` テンプレもまとめて更新する。

## 多角的チェック観点

- 不変条件 #5 違反: `apps/web` から D1 を直接叩く形に変質していないか。
- 監視誤検知: 503 + `Retry-After` の組合せで UT-08 通知基盤が暴走しないか。
- 認証 bypass: unauth `/health/db` で D1 ping が外部から打てる状態を許容するか。
- smoke drift: 期待値テンプレと実装が乖離して S-03 / S-07 が再度 RED 化しないか。
- レスポンス schema の最終形が UT-06-FU-I（/health）と整合するか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 原典スペックの写経と AC-1〜AC-9 確定 | 1 | spec_created | 原典 79 行 |
| 2 | タスク種別 / scope / visualEvidence の固定 | 1 | spec_created | artifacts.json と一致 |
| 3 | 4 条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | UT-22 D1 migration 完了前提の 3 重明記 | 1〜3 | spec_created | Phase 1 / 2 / 3 |
| 5 | レスポンス schema の確定 | 1〜2 | spec_created | 成功 200 / 失敗 503 |
| 6 | 認証 / WAF 方針の意思決定 | 1〜3 | spec_created | base case 採用 |
| 7 | Phase 11 smoke 期待値テンプレ同期方針 | 11 | spec_created | drift 防止 |
