# Phase 1 成果物 — 要件定義

## 1. 背景

UBM 兵庫支部会の本番デプロイワークフロー UT-06 は、Phase 11 smoke の S-03 / S-07 で「API 経由の D1 SELECT 疎通確認」を AC-4 として要求している。しかし現行 `apps/api/src/index.ts` には対応する `/health/db` endpoint が存在せず、また `Env.DB: D1Database` の型定義も付与されていない。Phase 12 の UNASSIGNED-H 検出（実行前ブロッカー B-2）でこの欠落が顕在化し、UT-06 本番実行が block された。

本ワークフロー（UT-06-FU-H）は、その実行ブロッカーを解消する `GET /health/db` 実装の **タスク仕様書整備**に閉じる。実コード適用は Phase 13 ユーザー承認後の別 PR に委ねる。Phase 1 の本成果物では、要件 / AC / 4 条件評価 / 苦戦箇所 / スコープ境界を確定し、Phase 2（設計）が一意に判断できる入力を作成する。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | `apps/api/src/index.ts` に `/health/db` が存在しない | UT-06 AC-4 が実行不能、Phase 11 smoke S-03 / S-07 が RED |
| C-2 | `Env.DB: D1Database` 型が未定義で `c.env.DB` が `any` または `undefined` | 実装時に型安全性が確保できず runtime エラーが検知不能 |
| C-3 | 失敗時 HTTP status の運用整合が未決定 | 503 を返すと UT-08 通知基盤が誤検知して暴走するリスク |
| C-4 | 認証 / WAF / IP allowlist 方針が未決定 | unauth で公開すると D1 ping を外部から打たれる懸念 |
| C-5 | Phase 11 smoke 期待値テンプレと実装の drift | S-03 / S-07 が再度 RED 化する継続リスク |

## 3. 真の論点 (true issue)

> **「`/health/db` の実装方針」ではなく、「不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害せず apps/api 側に D1 binding 型と health endpoint を閉じ込めること、および 503 + `Retry-After` で UT-08 通知基盤の誤検知を防ぐ運用境界の確立」**が本タスクの本質。

副次的論点:
1. `Hono<{ Bindings: Env }>` ジェネリクスによる D1 binding 型契約の境界確立
2. 失敗時 HTTP status の運用整合（503 + `Retry-After` で外部監視を暴走させない）
3. 認証 / WAF / IP allowlist 方針の意思決定
4. Phase 11 smoke S-03 / S-07 の期待値テンプレと実装の drift 防止

## 4. 受入条件（AC）

`index.md` §受入条件 と完全同期。

- **AC-1**: `Env.DB: D1Database` の型定義が `apps/api/src/index.ts`（または型 import 元）に追加されることが Phase 1 / 2 で固定されている。
- **AC-2**: `GET /health/db` が `SELECT 1` を実行する仕様が Phase 1（要件）/ Phase 2（設計）/ Phase 5（実装ランブック）で重複明記されている。
- **AC-3**: 成功時応答が `HTTP 200` + `{ ok: true, db: "ok", check: "SELECT 1" }` で確定している。
- **AC-4**: 失敗時応答が `HTTP 503` + `{ ok: false, db: "error", error: string }` + `Retry-After` ヘッダ付与で確定している。
- **AC-5**: `apps/api/wrangler.toml` の D1 binding が production / staging / development で確認されている（既存の場合は確認のみ、未設定の場合は仕様レベルで指示）。
- **AC-6**: 認証 / WAF / IP allowlist 方針（公開可否・`X-Health-Token` 要否）が Phase 1 で意思決定されドキュメントに記載されている。
- **AC-7**: Phase 11 S-03 / S-07 smoke 期待値が本 endpoint 実装と drift しないテンプレ更新方針が Phase 11 に固定されている。
- **AC-8**: タスク種別 `implementation` / `visualEvidence: NON_VISUAL` / `scope: api_health` が Phase 1 で固定され、`artifacts.json.metadata` と一致している。
- **AC-9**: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しないことが Phase 1 / 2 / 3 で確認されている。

## 5. レスポンス schema（仕様レベル）

### 成功時

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok": true,
  "db": "ok",
  "check": "SELECT 1"
}
```

### 失敗時

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
Retry-After: 30

{
  "ok": false,
  "db": "error",
  "error": "<exception message>"
}
```

> `Retry-After` の値は Phase 2 で 30 秒を仮置き、Phase 3 open question で最終確定。

## 6. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- AC-1〜AC-9 の Phase 1 固定
- レスポンス schema（成功 200 / 失敗 503 + Retry-After）の仕様レベル定義
- 認証 / WAF / IP allowlist 方針の意思決定論点の明文化
- UT-22 D1 migration 完了を必須前提とする依存順序の 3 重明記
- Phase 11 smoke S-03 / S-07 期待値テンプレ同期方針

### 含まない

- 実 `apps/api/src/index.ts` への endpoint 実装（Phase 13 ユーザー承認後の別 PR）
- D1 schema 変更（UT-22 別タスク）
- `/health` 既存 endpoint の改修（UT-06-FU-I で扱う）
- D1 migration 実行（UT-22 別タスク）
- Cloudflare WAF / IP allowlist の実適用（運用タスク）
- 外部監視（UT-08 通知基盤）側の閾値変更

## 7. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-06 AC-4 ブロッカー B-2 が解消し、本番デプロイ実行が再開可能。SLO 分離による監視粒度向上 |
| 実現性 | PASS | Hono Bindings ジェネリクス / `c.env.DB.prepare("SELECT 1").first()` はすべて既存 Cloudflare Workers + D1 + Hono の範囲。新規依存ゼロ |
| 整合性 | PASS | **不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない**。本 endpoint は `apps/api` 内部に閉じ、`apps/web` から D1 を直接叩く形には変質しない |
| 運用性 | PASS | 失敗時 503 + `Retry-After` で UT-08 通知基盤の誤検知を抑制。WAF / IP allowlist による外部公開制御の意思決定を Phase 1 で完了 |

## 8. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| workflow_mode | docs-only |
| visualEvidence | NON_VISUAL |
| scope | api_health |

`artifacts.json.metadata` と完全一致。

## 9. 苦戦箇所サマリ（原典 §苦戦箇所より）

1. **D1 binding 型の付与**: Hono + Cloudflare Workers では `Hono<{ Bindings: Env }>` のジェネリクスで binding 型を付ける必要がある。`c.env.DB` で参照可能か runtime で確認する。
2. **失敗時の HTTP status 設計**: `SELECT 1` が失敗する状況は D1 ダウン時のみ。503 を返すと外部監視（UT-08 通知基盤）が誤検知する可能性があるため、503 + `Retry-After` ヘッダ付与等で運用と整合する。
3. **認証要否**: `/health/db` は内部 health check 想定だが、unauth で公開すると D1 ping を外部から打てる。Cloudflare WAF / IP allowlist と `X-Health-Token` で制御するかを意思決定する。
4. **smoke 期待値と実装の同期**: Phase 11 docs が期待する形式と実装が drift しないよう、本タスク内で `outputs/phase-11/smoke-test-result.md` テンプレもまとめて更新する。

## 10. 命名規則チェックリスト

- endpoint パス: `/health/db`（既存 `/health` の直下にネスト）
- binding 名: `DB`（既存 wrangler 規約）
- 型名: `Env.DB: D1Database`
- 成功 schema: `{ ok: true, db: "ok", check: "SELECT 1" }`
- 失敗 schema: `{ ok: false, db: "error", error: string }` + `Retry-After`
- smoke 期待値ファイル: `outputs/phase-11/smoke-test-result.md` の S-03 / S-07 セクション

## 11. 不変条件 #5 への適合性

> 不変条件 #5: **D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）**

本タスクは:
- `apps/api/src/index.ts` 内のみで `c.env.DB.prepare("SELECT 1").first()` を実行する
- `apps/web` 側は本 endpoint を fetch する側に留まる（D1 binding を `apps/web` の wrangler に追加しない）
- レスポンスは JSON serialized であり、D1 の row 構造を `apps/web` に直接渡さない

→ 不変条件 #5 を侵害しない。整合性 PASS の根拠。

## 12. 依存タスク順序（UT-22 完了必須）— 重複明記 1/3

> **UT-22（D1 migration SQL 適用）が completed であることが本ワークフロー Phase 5 以降の必須前提である。**
> UT-22 未完了で `/health/db` を実装しても、production / staging で D1 binding が有効化されていないため runtime で `c.env.DB` が `undefined` になり 500 エラーを返す。本前提は Phase 1 §依存境界（本 Phase）/ Phase 2 §依存タスク順序 / Phase 3 §NO-GO 条件 の 3 箇所で重複明記する。

## 13. 引き渡し

Phase 2（設計）へ:
- 真の論点 = 不変条件 #5 侵害なし + 503/Retry-After 運用境界
- AC-1〜AC-9
- レスポンス schema（成功 200 / 失敗 503 + Retry-After）
- 4 条件 PASS の根拠
- スコープ境界（仕様書整備に閉じる）
- UT-22 完了前提（Phase 2 で 2 重目明記を要請）
- 認証 / WAF / IP allowlist 方針の意思決定論点（Phase 2 で 4 案比較）
