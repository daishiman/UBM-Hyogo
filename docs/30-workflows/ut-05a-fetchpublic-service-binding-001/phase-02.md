# Phase 2: 設計 — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| phase | 2 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

local 実装済 `fetchPublic` の service-binding 優先 + HTTP fallback 二経路を、`fetchSessionResolve` と同一 pattern に揃えた最小の関数 signature / 分岐ロジック / header 伝搬 / `wrangler.toml` services 設定として確定し、Phase 11 evidence contract（curl 200 / tail log / local fallback）を実測値で満たすための実行設計を固める。

## 実行タスク

1. `fetchPublic` の関数 signature と分岐ルールを `fetchSessionResolve` と同等の構造で確定する。
2. service-binding 経由 / HTTP fallback 経由のそれぞれにおける header / cookie 伝搬と URL 構築規則を確定する。
3. `transport: 'service-binding'` / `transport: 'http-fallback'` のメタログ仕様を確定する。
4. `apps/web/wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]` 設定例を確定する。
5. Phase 11 evidence path / artifacts.json 更新差分を確定する。

## 参照資料

- apps/web/src/lib/fetch/public.ts（local 実装済差分の正本）
- apps/web/src/lib/auth.ts (`fetchSessionResolve`)
- apps/web/wrangler.toml / apps/api/wrangler.toml
- scripts/cf.sh / scripts/with-env.sh
- docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md

## 実行手順

- 既存 repo 配下のパス・コマンド名は実在確認してから記述する（仮置き禁止）。
- staging / production URL / secret / project 名は値ではなく key 名のみを設計に書く。
- 設計サンプルコードは構造を示す擬似定義に留め、実コード差分は local 実装済を正本として参照する。

## 設計ポイント

### 関数 signature

```ts
async function fetchPublic<T>(path: string, options?: FetchPublicOptions): Promise<T>
async function fetchPublicOrNotFound<T>(path: string, options?: FetchPublicOptions): Promise<T>
```

- `env` は `getCloudflareContext().env` から内部で取得し、既存呼び出し側の signature は変えない。
- `path` は `/public/stats` `/public/members` のような API 内部パス。
- 戻り値は呼び出し側で型付けされる JSON レスポンス。

### 分岐ルール

| 条件 | 経路 | 構築 Request |
| --- | --- | --- |
| `env.API_SERVICE` が定義されている | service-binding | `env.API_SERVICE.fetch("https://service-binding.local" + path, init)` |
| `env.API_SERVICE` が未定義かつ `env.PUBLIC_API_BASE_URL` がある | http-fallback | `fetch(env.PUBLIC_API_BASE_URL + path, init)` |
| `env.API_SERVICE` と `env.PUBLIC_API_BASE_URL` が未定義で `process.env.PUBLIC_API_BASE_URL` がある | http-fallback | `fetch(process.env.PUBLIC_API_BASE_URL + path, init)` |
| いずれも無い | local default fallback | `fetch("http://localhost:8787" + path, init)` |

### header / error contract

- 両経路で `Accept: application/json` と `next.revalidate` を維持する。
- `fetchPublic` は非 OK 応答で `Error("fetchPublic failed: ...")` を throw する。
- `fetchPublicOrNotFound` は 404 のみ `FetchPublicNotFoundError` を throw し、呼び出し側が `notFound()` に変換する。
- public read API は Auth.js session resolve と異なり cookie / `x-forwarded-*` を追加で組み立てない。

### transport メタログ

- 成功 / 失敗いずれも `console.log({ transport: 'service-binding' | 'http-fallback', path, status })` を出す。
- `path` は query string を除いた pathname のみを記録し、PII / search query を tail log に残さない。
- `wrangler tail` で staging / production の経路実測に使う。

### `apps/web/wrangler.toml` services 設定

```toml
[[env.staging.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api-staging"

[[env.production.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api"
```

- `service` 名は `apps/api/wrangler.toml` の env ごとの worker 名と一字違わぬよう grep で照合する。
- env 別 services の重複定義（同一 binding を別 service に向ける記述）が混入していないかをレビューで確認する。

### artifacts.json 更新差分

- 本タスク `artifacts.json` の Phase 11 status を実測 PASS / FAIL に更新する。
- Phase 12 の 7 固定成果物は spec 作成時点で実体を配置し、Phase 12 完了時に内容を確定する。

## 統合テスト連携

- `fetchSessionResolve` と同一 pattern を採ることで、service-binding 経路の不変条件を 1 箇所に揃える。
- `bash scripts/cf.sh tail` の `transport` ログを Phase 11 で evidence として保存する。

## 多角的チェック観点

- 仮想パスを設計に書かない（実在しない `apps/web/src/lib/fetch/internal.ts` 等の幻想ファイル禁止）。
- `wrangler` 直接呼出を設計に書かない（必ず `bash scripts/cf.sh` 経由）。
- env 値の貼付禁止、`op://` 参照のみ。
- service-binding 未注入時の HTTP fallback が壊れない分岐を必須で残す。
- `fetchSessionResolve` の header 伝搬と差を作らない。

## サブタスク管理

- [ ] 関数 signature と分岐ルールを確定する
- [ ] header / cookie 伝搬規則を確定する
- [ ] `transport` メタログ仕様を確定する
- [ ] `wrangler.toml` services 設定例を確定する
- [ ] artifacts.json 更新差分テンプレを作成する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 関数 signature / 二経路分岐 / header 伝搬 / transport ログ仕様が確定している
- `wrangler.toml` services 設定例が staging / production 双方で確定している
- evidence path が本タスク `artifacts.json` の Phase 11 `requiredOutputs` と一致している
- 仮置きパス / 仮置きコマンドが含まれていない

## タスク100%実行確認

- [ ] 仮置きパス / 仮置きコマンドが含まれていない
- [ ] secret 値が含まれていない
- [ ] `wrangler` 直接呼出が含まれていない
- [ ] `fetchSessionResolve` と整合する pattern になっている

## 次 Phase への引き渡し

Phase 3 へ、関数 signature / 二経路分岐 / header 伝搬 / transport ログ仕様、`wrangler.toml` services 設定例、artifacts.json 更新差分を渡す。
