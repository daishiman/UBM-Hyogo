# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/api `/health/db` D1 疎通 endpoint 実装仕様化 (ut-06-followup-H-health-db-endpoint) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| タスク種別 | implementation / docs-only / NON_VISUAL / api_health |

## 目的

Phase 1 で確定した「不変条件 #5 侵害なし + 503/Retry-After 運用境界 + UT-22 完了前提 + AC-1〜AC-9」の要件を、Hono Bindings ジェネリクス / D1 binding 型 / endpoint ハンドラの擬似シーケンス / レスポンス schema / 状態所有権 / 認証方針 4 案 / smoke 期待値テンプレ同期方針 に分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。本 Phase の成果は仕様レベルであり、実コード適用は Phase 5 以降に委ねる。

## 依存タスク順序（UT-22 完了必須）— 重複明記 2/3

> **UT-22（D1 migration SQL 適用）が completed であることが本 Phase の必須前提である。**
> UT-22 未完了で本 Phase の設計を Phase 5 以降の実装に移すと、production / staging で D1 binding が有効化されていないため runtime で `c.env.DB` が `undefined` になり 500 エラーを返す。本 Phase は UT-22 完了を「設計の前提」として扱い、UT-22 未完了の場合は Phase 3 の NO-GO 条件で block される。

## 実行タスク

1. `Env` 型 / `Hono<{ Bindings: Env }>` ジェネリクス / `c.env.DB.prepare("SELECT 1").first()` の擬似シーケンスを固定する（完了条件: 擬似コードと型契約が `outputs/phase-02/main.md` に記述）。
2. レスポンス schema（成功 200 / 失敗 503 + Retry-After）を schema 定義として再固定する（完了条件: HTTP wire format と JSON shape が一致）。
3. ファイル変更計画を確定する（完了条件: 編集対象が `apps/api/src/index.ts` のみで、`apps/api/wrangler.toml` は確認のみ、`apps/web/*` は触らないことが明示）。
4. state ownership 表を作成する（完了条件: D1 binding / `Env` 型 / endpoint ハンドラ / レスポンス schema の 4 state について writer / reader が apps/api 内に閉じている）。
5. 認証 / WAF / IP allowlist 代替案 4 案（A: 完全 unauth / B: WAF rule / C: IP allowlist / D: 固定パス + X-Health-Token + WAF）を列挙する（完了条件: 4 案の利点 / 欠点が記述）。
6. base case として案 D（固定パス + X-Health-Token + WAF / IP allowlist の併用）を選定し理由を明記する（完了条件: 採用根拠が記述）。
7. Phase 11 smoke S-03 / S-07 期待値テンプレ同期方針を固定する（完了条件: 同期手順が Phase 11 へ引き継ぐ形で記述）。

## 設計対象の特定

### `Env` 型 / Hono Bindings ジェネリクス

```typescript
// apps/api/src/index.ts (擬似コード, Phase 5 で実装)
export interface Env {
  DB: D1Database;        // ← 本タスクで追加（AC-1）
  HEALTH_DB_TOKEN: string; // ← 案 D のヘッダ token 検証で使用（AC-6）
  // 他の既存 binding はそのまま
}

const app = new Hono<{ Bindings: Env }>();
```

### `c.env.DB.prepare("SELECT 1").first()` の擬似シーケンス

```typescript
app.get("/health/db", async (c) => {
  const token = c.req.header("X-Health-Token");
  if (token !== c.env.HEALTH_DB_TOKEN) {
    return c.json({ ok: false, db: "error", error: "Forbidden" }, 403);
  }
  try {
    const result = await c.env.DB.prepare("SELECT 1").first();
    if (!result) {
      throw new Error("SELECT 1 returned null");
    }
    return c.json({ ok: true, db: "ok", check: "SELECT 1" }, 200);
  } catch (err) {
    console.error("[/health/db] SELECT 1 failed", { reason: err instanceof Error ? err.name : "unknown" });
    c.header("Retry-After", "30");
    return c.json({ ok: false, db: "error", error: "DB health check failed" }, 503);
  }
});
```

> 本擬似コードは Phase 5 実装ランブックの起点として渡す。本 Phase では「型契約」「HTTP wire format」「Retry-After 値（30 秒仮置き）」の 3 点を仕様として固定する。

## ファイル変更計画

| パス | 操作 | 編集者 | 注意 |
| --- | --- | --- | --- |
| `apps/api/src/index.ts` | `Env.DB` 型追加 + `app.get("/health/db", ...)` ハンドラ追加 | Phase 5 lane 1 | 既存 `/health` ハンドラは触らない（FU-I の責務） |
| `apps/api/wrangler.toml` | 確認のみ（`[[d1_databases]]` の `binding = "DB"` が production / staging / development で有効） | Phase 5 lane 0 | 未設定の場合は仕様レベルで指示。本タスクでは編集しない方針 |
| `apps/web/*` | 変更しない | - | **不変条件 #5 を侵害しないため `apps/web` から D1 を直接叩く形にしない** |
| `outputs/phase-11/smoke-test-result.md` | S-03 / S-07 テンプレ同期 | Phase 11 lane | 期待値 drift を防ぐ |

## レスポンス schema 定義

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
  "error": "<exception message string>"
}
```

> `Retry-After: 30`（秒）を仮値として固定。Phase 3 open question で UT-08 通知基盤側の閾値合意を経て最終確定する。

## 状態所有権 (state ownership) 表

| state | 物理位置 | owner | writer | reader | TTL / lifecycle |
| --- | --- | --- | --- | --- | --- |
| `Env.DB` 型定義 | `apps/api/src/index.ts` | apps/api | Phase 5 PR | Hono / TypeScript compiler | 永続。apps/web からは不可視 |
| D1 binding (`DB`) | `apps/api/wrangler.toml` の `[[d1_databases]]` | apps/api | UT-22 / 既存 wrangler 設定 | Cloudflare Workers runtime | 永続。production / staging / development 各 env |
| `/health/db` ハンドラ | `apps/api/src/index.ts` | apps/api | Phase 5 PR | 外部 HTTP client（smoke / WAF 経由） | 永続。`apps/api` 内に完全閉包 |
| レスポンス schema（成功 200 / 失敗 503） | wire format（JSON + Header） | apps/api | Phase 5 PR | 外部監視 / Phase 11 smoke / FU-I | 永続。FU-I と prefix 整合 |

> **重要**: writer / reader 列に `apps/web` が一切現れないことが、不変条件 #5 を侵害しない設計の核心境界。

## 認証 / WAF / IP allowlist の代替案 4 案

### 案 A: 完全 unauth（公開 endpoint）

- 概要: 一切の認証 / WAF を掛けず、誰でも `/health/db` を叩ける。
- 利点: 実装ゼロ。外部監視 SaaS から無条件に叩ける。
- 欠点: D1 ping を外部から無制限に打てる。DoS / probing リスク。**整合性 / 運用性 MAJOR**。

### 案 B: WAF rule（Cloudflare WAF で IP / rate 制御）

- 概要: Cloudflare WAF で `/health/db` への access を rate limit + 既知 IP のみ許可。
- 利点: endpoint パス自体は素直（`/health/db`）。WAF dashboard で制御状況が可視化。
- 欠点: WAF rule の運用負荷あり。設定漏れで一時的に open になるリスク。**運用性 MINOR**。

### 案 C: IP allowlist（Workers 内で IP 検査）

- 概要: ハンドラ内で `cf-connecting-ip` header を検査し、allowlist 外なら 403。
- 利点: コードレベルで制御、WAF 不要。
- 欠点: allowlist の管理が apps/api 内のコード or env var に紐付く。CI / smoke で IP が動的だと運用しづらい。**運用性 MINOR**。

### 案 D: 固定パス + `X-Health-Token` + WAF / IP allowlist の併用（base case = 採用案）

- 概要: endpoint パスは `GET /health/db` に固定し、`X-Health-Token` ヘッダ検証と Cloudflare WAF / IP allowlist の併用で外部公開制御を行う。運用は WAF 側で制御し、ヘッダ token は最小限の defense in depth。
- 利点: route 登録時に runtime Secret を使わないため Hono 実装が安定する。WAF rule が誤って解除されても、token gate が残る。
- 欠点: 認証トークンの管理が必要（環境変数 or 1Password 経由）。Phase 11 smoke 期待値テンプレで token を抽象化する必要あり。
- **採用根拠**: 案 A は MAJOR で却下、案 B / C はそれぞれ単独では MINOR が残る。案 D は WAF（運用制御）+ `X-Health-Token`（コード制御）の併用で defense in depth を成立させ、不変条件 #5 を侵害せずに「unauth で D1 ping を打たれる」リスクを実質的に排除する。

## smoke 期待値テンプレ同期方針

| 同期対象 | 同期内容 | 担当 Phase |
| --- | --- | --- |
| `outputs/phase-11/smoke-test-result.md` の S-03 期待値 | 成功時 `HTTP 200` + 成功 JSON shape をテンプレ化 | Phase 11 lane |
| `outputs/phase-11/smoke-test-result.md` の S-07 期待値 | production 成功時 `HTTP 200` + 成功 JSON shape をテンプレ化 | Phase 11 lane |
| 認証トークン | `X-Health-Token: ${HEALTH_DB_TOKEN}` placeholder で抽象化 | Phase 11 lane |
| FU-I（/health）との整合 | prefix `{ ok: ... }` を共通 | Phase 12 ドキュメント更新 |

## 環境変数 / Secret

- `HEALTH_DB_TOKEN`（案 D で導入する認証トークン）: 1Password `op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN` で管理。`.env` / `wrangler.toml` の secrets binding として注入。
- 実 secret 値はリポジトリにコミットしない（CLAUDE.md §シークレット管理 準拠）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-01/main.md | Phase 1 AC / 依存境界 / 4 条件評価 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-12/implementation-guide.md | D1 binding 型契約 / 実行ブロッカー B-2 |
| 必須 | apps/api/src/index.ts | `Env.DB` 型と Hono handler の実装対象 |
| 必須 | apps/api/wrangler.toml | D1 binding `DB` の確認対象 |

## 実行手順

### ステップ 1: 型契約と擬似シーケンスの固定

- `Env.DB: D1Database` と `Hono<{ Bindings: Env }>` を擬似コードレベルで `outputs/phase-02/main.md` に固定する。

### ステップ 2: レスポンス schema の確定

- 成功 200 / 失敗 503 + Retry-After を HTTP wire format で記述する。

### ステップ 3: 認証方針 4 案比較と base case 選定

- 案 A〜D を列挙し、利点 / 欠点 / 判定を Phase 3 評価マトリクスに渡せる粒度で記述する。base case = 案 D。

### ステップ 4: state ownership とファイル変更計画

- writer / reader 列に `apps/web` が現れないことを確認し、不変条件 #5 を侵害しない境界を明示する。

### ステップ 5: smoke 期待値テンプレ同期方針の固定

- Phase 11 へ引き渡す同期手順を仕様レベルで記述する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計の代替案比較（4 案）/ base case PASS 判定の入力 |
| Phase 4 | レスポンス schema をテスト戦略のフィクスチャに渡す |
| Phase 5 | 擬似コードを実装ランブックの起点に渡す |
| Phase 6 | 異常系（D1 ダウン / binding 未注入 / Retry-After 欠落 / WAF 解除事故） |
| Phase 8 | 認証 / WAF / IP allowlist 方針（案 D 採用）をセキュリティ章へ |
| Phase 11 | smoke S-03 / S-07 期待値テンプレ同期方針 |

## 多角的チェック観点

- 不変条件 #5 違反: state ownership 表で writer / reader 列に `apps/web` が現れていないか。
- D1 binding 型契約: `Hono<{ Bindings: Env }>` ジェネリクスが擬似コードに反映されているか。
- 503 + Retry-After: UT-08 通知基盤の誤検知を抑制する仕様になっているか。
- 認証 bypass: 案 D（ヘッダ token + WAF）で unauth 公開リスクが defense in depth で排除されているか。
- smoke drift: Phase 11 期待値テンプレ同期方針が記述されているか。
- UT-22 完了前提: 本 Phase で 2 重明記されているか（Phase 1 / 本 Phase / Phase 3 の 3 重明記の 2/3）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `Env` 型 / Hono Bindings 擬似コード | 2 | completed | AC-1 / AC-2 |
| 2 | レスポンス schema 定義 | 2 | completed | AC-3 / AC-4 |
| 3 | ファイル変更計画 | 2 | completed | apps/api/src/index.ts のみ編集 |
| 4 | state ownership 表 | 2 | completed | apps/web 不在 |
| 5 | 認証方針 4 案比較 + base case D 選定 | 2 | completed | AC-6 |
| 6 | smoke 期待値テンプレ同期方針 | 2 | completed | AC-7 |
| 7 | UT-22 完了前提 2 重目明記 | 2 | completed | 重複明記 2/3 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/main.md | 型契約 / 擬似シーケンス / レスポンス schema / state ownership / 認証 4 案 / smoke 同期方針 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [x] `Env.DB: D1Database` と `Hono<{ Bindings: Env }>` の擬似コードが固定されている
- [x] レスポンス schema（成功 200 / 失敗 503 + Retry-After）が HTTP wire format で記述されている
- [x] ファイル変更計画で `apps/api/src/index.ts` のみが編集対象であることが明示されている
- [x] state ownership 表に writer / reader として `apps/web` が現れていない
- [x] 認証方針 4 案が列挙され、base case = 案 D（ヘッダ token + WAF）が選定されている
- [x] Phase 11 smoke 期待値テンプレ同期方針が記述されている
- [x] UT-22 完了前提が本 Phase で重複明記されている（3 重明記の 2/3）

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `completed`
- 全成果物が `outputs/phase-02/` 配下に配置済み
- 異常系（D1 ダウン / binding 未注入 / Retry-After 欠落 / WAF 解除事故 / UT-22 未完了）の対応観点が設計に含まれる
- artifacts.json の `phases[1].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - base case = 案 D（固定パス + X-Health-Token + WAF / IP allowlist 併用）
  - レスポンス schema（成功 200 / 失敗 503 + `Retry-After: 30`）
  - state ownership 表（apps/web 不在）
  - smoke 期待値テンプレ同期方針を Phase 11 へ
  - UT-22 完了を NO-GO 条件として Phase 3 へ
- ブロック条件:
  - 擬似コードに `Hono<{ Bindings: Env }>` が欠落
  - state ownership に `apps/web` writer / reader が混入
  - 認証方針が決定されていない（案 D 採用根拠が空）
  - Retry-After 値が未記述
  - UT-22 完了前提が記述されていない
