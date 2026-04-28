# UT-06 Follow-up H: apps/api `/health/db` D1 疎通 endpoint 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06-FU-H |
| タスク名 | apps/api に `/health/db` endpoint を実装 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1（UT-06 本番実行ブロッカー） |
| 作成日 | 2026-04-27 |
| 種別 | implementation |
| 状態 | unassigned |
| 由来 | UT-06 Phase 12 UNASSIGNED-H / 実行前ブロッカー B-2 |
| 親タスク | docs/30-workflows/ut-06-production-deploy-execution |

## 目的

UT-06 AC-4「API 経由 D1 SELECT smoke」を実行可能にするため、`apps/api` に `GET /health/db` を実装する。現行 `apps/api/src/index.ts` には対応 endpoint と `DB` binding 型が存在しない。

## スコープ

### 含む

- `Env.DB: D1Database` の型定義追加
- `GET /health/db` 実装（`SELECT 1` を実行し成功時 200、失敗時 503）
- レスポンス schema: `{ ok: true, db: "ok", check: "SELECT 1" }` / `{ ok: false, db: "error", error: string }`
- `apps/api/wrangler.toml` の D1 binding 確認（既に追加済の場合スキップ）
- API contract docs 更新
- Phase 11 S-03 / S-07 smoke での疎通確認

### 含まない

- D1 schema 変更
- `/health` 既存 endpoint の変更（FU-I で扱う）
- D1 migration 実行（UT-22 別タスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-22 D1 migration SQL 適用 | `SELECT 1` は migration 不要だが D1 binding が必要 |
| 関連 | UT-06-FU-I（/health 期待値同期） | レスポンス形式の整合 |
| 下流 | UT-06 Phase 11 smoke S-03 / S-07 | AC-4 実行の前提 |

## 苦戦箇所・知見

**1. D1 binding 型の付与**
Hono + Cloudflare Workers では `Hono<{ Bindings: Env }>` のジェネリクスで binding 型を付ける必要がある。binding が `c.env.DB` で参照可能になっているか runtime で確認する。

**2. 失敗時の HTTP status 設計**
`SELECT 1` が失敗する状況は D1 ダウン時のみ。503 を返すと外部監視（UT-08 通知基盤）が誤検知する可能性があるため、503 + `Retry-After` ヘッダ付与等で運用と整合する。

**3. 認証要否**
`/health/db` は内部 health check 想定だが、unauth で公開すると D1 ping を外部から打てる。Cloudflare WAF / IP allowlist で制御するか、endpoint パスを難読化するかを意思決定する。

**4. smoke 期待値と実装の同期**
Phase 11 docs が期待する形式と実装が drift しないよう、本タスク内で `outputs/phase-11/smoke-test-result.md` テンプレもまとめて更新する。

## 受入条件

- [ ] `Env.DB: D1Database` の型定義が追加済み
- [ ] `GET /health/db` が実装され `SELECT 1` を実行
- [ ] 成功時 HTTP 200 + `{ ok: true, db: "ok", check: "SELECT 1" }`
- [ ] 失敗時 HTTP 503 + `{ ok: false, db: "error", error: string }`
- [ ] Phase 11 S-03 / S-07 が PASS
- [ ] API contract docs / smoke-test-result.md が更新済み
- [ ] 認証 / WAF 方針が docs に記載

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md | UNASSIGNED-H |
| 必須 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | 型契約・実行ブロッカー B-2 |
| 必須 | apps/api/src/index.ts | 編集対象 |
| 必須 | apps/api/wrangler.toml | D1 binding |
| 参考 | docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-11/smoke-test-result.md | 期待値テンプレ |
