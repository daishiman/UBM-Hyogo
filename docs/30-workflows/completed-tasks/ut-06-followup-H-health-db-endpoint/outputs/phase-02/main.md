# Phase 2 成果物 — 設計

## 1. 目的

Phase 1 で確定した「不変条件 #5 侵害なし + 503/Retry-After 運用境界 + UT-22 完了前提 + AC-1〜AC-9」の要件を、Hono Bindings ジェネリクス / D1 binding 型 / endpoint ハンドラの擬似シーケンス / レスポンス schema / 状態所有権 / 認証方針 4 案 / smoke 期待値テンプレ同期方針 に分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。

## 2. 依存タスク順序（UT-22 完了必須）— 重複明記 2/3

> **UT-22（D1 migration SQL 適用）が completed であることが本 Phase の必須前提である。**
>
> UT-22 未完了で本 Phase の設計を Phase 5 以降の実装に移すと、production / staging で D1 binding が有効化されていないため runtime で `c.env.DB` が `undefined` になり 500 エラーを返す。本 Phase は UT-22 完了を「設計の前提」として扱い、UT-22 未完了の場合は Phase 3 の NO-GO 条件で block される。Phase 1 §依存境界（1/3）/ 本 Phase（2/3）/ Phase 3 §NO-GO 条件（3/3）の 3 箇所で重複明記する。

## 3. 設計対象の特定

### 3.1 `Env` 型 / Hono Bindings ジェネリクス

```typescript
// apps/api/src/index.ts （擬似コード, Phase 5 で実装）
import { Hono } from "hono";

export interface Env {
  DB: D1Database;        // ← 本タスクで追加（AC-1）
  // 既存の他 binding はそのまま
}

const app = new Hono<{ Bindings: Env }>();
```

`Hono<{ Bindings: Env }>` ジェネリクスが付与されていることで、`c.env.DB` が `D1Database` 型として TypeScript compiler に認識される。これにより:

- `c.env.DB.prepare(...)` の型補完が効く
- `c.env.DB` が `undefined` の場合に compile error が出る（runtime 検証は別途）
- apps/web からは `Env` 型に到達できない（不変条件 #5 の型レベル境界）

### 3.2 `c.env.DB.prepare("SELECT 1").first()` の擬似シーケンス

```typescript
app.get("/health/db", async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT 1").first();
    if (!result) {
      throw new Error("SELECT 1 returned null");
    }
    return c.json({ ok: true, db: "ok", check: "SELECT 1" }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.name : String(err);
    c.header("Retry-After", "30");
    return c.json({ ok: false, db: "error", error: message }, 503);
  }
});
```

擬似シーケンス図（処理フロー）:

```
[client]
   │ GET /health/db
   ▼
[Cloudflare WAF / IP allowlist] ── (案 D により制御)
   │ allow
   ▼
[apps/api Worker]
   │ Hono router → /health/db handler
   ▼
[c.env.DB.prepare("SELECT 1").first()]
   │
   ├─ success → return 200 { ok: true, db: "ok", check: "SELECT 1" }
   │
   └─ failure (D1 down 等)
      → set header "Retry-After: 30"
      → return 503 { ok: false, db: "error", error: <message> }
```

## 4. ファイル変更計画

| パス | 操作 | 編集者 | 注意 |
| --- | --- | --- | --- |
| `apps/api/src/index.ts` | `Env.DB: D1Database` 型追加 + `app.get("/health/db", ...)` ハンドラ追加 | Phase 5 lane 1 | 既存 `/health` ハンドラは触らない（FU-I の責務） |
| `apps/api/wrangler.toml` | 確認のみ（`[[d1_databases]]` の `binding = "DB"` が production / staging / development で有効） | Phase 5 lane 0 | 未設定の場合は仕様レベルで指示。本タスクでは編集しない方針 |
| `apps/web/*` | 変更しない | - | **不変条件 #5 を侵害しないため `apps/web` から D1 を直接叩く形にしない** |
| `outputs/phase-11/smoke-test-result.md` | S-03 / S-07 テンプレ同期 | Phase 11 lane | 期待値 drift を防ぐ |

## 5. レスポンス schema 定義

### 5.1 成功時

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok": true,
  "db": "ok",
  "check": "SELECT 1"
}
```

### 5.2 失敗時

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json
Retry-After: 30

{
  "ok": false,
  "db": "error",
  "error": "<exception message string>"
}
```

### 5.3 `Retry-After` 値の根拠

- `30`（秒）: D1 障害は通常 30 秒〜数分で復旧することが多く、UT-08 通知基盤側で「30 秒待ってから再 probe」を 2〜3 回繰り返してもなお失敗の場合のみ alert を上げる閾値合意を要請する。
- 最終値は Phase 3 open question で UT-08 通知基盤側の閾値合意を経て確定。

## 6. 状態所有権 (state ownership) 表

| state | 物理位置 | owner | writer | reader | TTL / lifecycle |
| --- | --- | --- | --- | --- | --- |
| `Env.DB` 型定義 | `apps/api/src/index.ts` | apps/api | Phase 5 PR | Hono / TypeScript compiler | 永続。apps/web からは不可視 |
| D1 binding (`DB`) | `apps/api/wrangler.toml` の `[[d1_databases]]` | apps/api | UT-22 / 既存 wrangler 設定 | Cloudflare Workers runtime | 永続。production / staging / development 各 env |
| `/health/db` ハンドラ | `apps/api/src/index.ts` | apps/api | Phase 5 PR | 外部 HTTP client（smoke / WAF 経由） | 永続。`apps/api` 内に完全閉包 |
| レスポンス schema（成功 200 / 失敗 503） | wire format（JSON + Header） | apps/api | Phase 5 PR | 外部監視 / Phase 11 smoke / FU-I | 永続。FU-I と prefix 整合 |
| 認証トークン `HEALTH_DB_TOKEN` | 1Password + Cloudflare Secrets | apps/api | 運用（Phase 12 ドキュメント化） | Worker runtime | 永続。rotation 手順は Phase 12 |

> **重要**: writer / reader 列に `apps/web` が一切現れない。これが**不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）を侵害しない設計の核心境界**であり、Phase 1 / 2 / 3 すべてで整合性 PASS の根拠となる。

## 7. 認証 / WAF / IP allowlist 代替案 4 案

### 7.1 案 A: 完全 unauth（公開 endpoint）

| 項目 | 内容 |
| --- | --- |
| 概要 | 一切の認証 / WAF を掛けず、誰でも `/health/db` を叩ける |
| 利点 | 実装ゼロ。外部監視 SaaS から無条件に叩ける |
| 欠点 | D1 ping を外部から無制限に打てる。DoS / probing リスク |
| 判定 | 整合性 / 運用性 **MAJOR** |

### 7.2 案 B: WAF rule（Cloudflare WAF で IP / rate 制御）

| 項目 | 内容 |
| --- | --- |
| 概要 | Cloudflare WAF で `/health/db` への access を rate limit + 既知 IP のみ許可 |
| 利点 | endpoint パス自体は素直（`/health/db`）。WAF dashboard で制御状況が可視化 |
| 欠点 | WAF rule の運用負荷あり。設定漏れで一時的に open になるリスク |
| 判定 | 運用性 **MINOR** |

### 7.3 案 C: IP allowlist（Workers 内で IP 検査）

| 項目 | 内容 |
| --- | --- |
| 概要 | ハンドラ内で `cf-connecting-ip` header を検査し、allowlist 外なら 403 |
| 利点 | コードレベルで制御、WAF 不要 |
| 欠点 | allowlist の管理が apps/api 内のコード or env var に紐付く。CI / smoke で IP が動的だと運用しづらい |
| 判定 | 運用性 **MINOR** |

### 7.4 案 D: 固定パス + X-Health-Token + WAF / IP allowlist の併用（base case = 採用案）

| 項目 | 内容 |
| --- | --- |
| 概要 | endpoint パスは `GET /health/db` に固定し、`X-Health-Token` ヘッダ検証と Cloudflare WAF / IP allowlist の併用で外部公開制御を行う。運用は WAF 側で制御し、ヘッダ token は最小限の defense in depth |
| 利点 | route 登録時に runtime Secret を使わないため Hono 実装が安定する。WAF rule が誤って解除されても token gate が残る |
| 欠点 | 認証トークンの管理が必要（環境変数 or 1Password 経由）。Phase 11 smoke 期待値テンプレで token を抽象化する必要あり |
| 判定 | **PASS（採用）** |

### 7.5 採用根拠

- 案 A は MAJOR で却下（D1 ping を unauth で打たれる）
- 案 B / C はそれぞれ単独では MINOR が残る
- 案 D は **WAF（運用制御）+ ヘッダ token（コード制御）の併用で defense in depth を成立**させ、不変条件 #5 を侵害せずに「unauth で D1 ping を打たれる」リスクを実質的に排除する
- 認証トークンは 1Password で管理し、Cloudflare Secrets として Worker に注入。Phase 11 smoke 期待値テンプレ上では `${HEALTH_DB_TOKEN}` placeholder で抽象化することで drift を防ぐ

## 8. smoke 期待値テンプレ同期方針

| 同期対象 | 同期内容 | 担当 Phase |
| --- | --- | --- |
| `outputs/phase-11/smoke-test-result.md` の S-03 期待値 | 成功時 `HTTP 200` + 成功 JSON shape をテンプレ化 | Phase 11 lane |
| `outputs/phase-11/smoke-test-result.md` の S-07 期待値 | production 成功時 `HTTP 200` + 成功 JSON shape をテンプレ化 | Phase 11 lane |
| 認証トークン | テンプレ上は `${HEALTH_DB_TOKEN}` 等の placeholder で抽象化 | Phase 11 lane |
| FU-I（/health）との整合 | prefix `{ ok: ... }` を共通 | Phase 12 ドキュメント更新 |

## 9. 環境変数 / Secret

| 項目 | 値 | 管理場所 |
| --- | --- | --- |
| `HEALTH_DB_TOKEN` | 案 D で導入する認証トークン | 1Password `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` |
| binding `DB` | D1 database | `apps/api/wrangler.toml` |

実 secret 値はリポジトリにコミットしない（CLAUDE.md §シークレット管理 準拠）。

## 10. 引き渡し

Phase 3（設計レビュー）へ:
- base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）
- 代替案 4 案（A〜D）の利点 / 欠点
- レスポンス schema（成功 200 / 失敗 503 + `Retry-After: 30`）
- state ownership 表（apps/web 不在）
- 擬似コード / 擬似シーケンス
- UT-22 完了前提（Phase 3 §NO-GO 条件 で 3 重目明記を要請）
- open question:
  1. `Retry-After` 値の最終合意（30 秒で良いか）
  2. 認証トークンの初期値生成手順（Phase 12 ドキュメント化）
  3. 案 D のヘッダ token文字列の決定タイミング
