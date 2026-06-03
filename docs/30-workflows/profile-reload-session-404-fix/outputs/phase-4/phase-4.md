# Phase 4: I/O 契約

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 3 で確定した T01〜T03 の修正方針を、HTTP / 関数 I/O / テスト期待値の契約表へ落とし込み、Phase 5 の実装仕様書本体（task-01..03）がそのまま実装・検証できる粒度の契約を固定する。

## 実行タスク

### 4.1 T01: API Worker `/me` ルート解決 HTTP 契約（修正後）

対象は `apps/api/src/index.ts` の `app`（フルアプリ）。`createMeRoute` のサブアプリ単体ではなく、mount 経由の解決結果を契約とする。すべて認証なし（cookie / Authorization / `x-ubm-dev-session` を一切付けない）で叩いた場合の期待。

| メソッド + path | 修正前 | 修正後（契約） | 根拠 |
| --- | --- | --- | --- |
| `GET /me` | 200 を期待していたが mount + サブ `get("/")` の組合せで再発時 404 が露出しうる | `401`（`sessionGuard` 未解決）。**404 ではない** | AC-4 / AC-5 |
| `GET /me/`（末尾スラッシュ） | `404`（`notFoundHandler`） | `308` Permanent Redirect。`Location: /me`（search あり時は `/me?<search>`） | AC-4 |
| `GET /me/profile/`（末尾スラッシュ） | `404` | `308`。`Location: /me/profile` | AC-4（同種 route 共通正規化の網羅性） |
| `GET /`（ルートのみ） | 200 | `200`（変化なし。pathname が `/` のときは正規化対象外） | 非回帰 |
| `OPTIONS /me/`（CORS preflight） | `corsFromEnv` が `204` | `204`（変化なし。正規化 middleware は非 OPTIONS のときのみ発火） | 設計（Phase 3 §3.2） |

> 308 後のリダイレクト追従は Worker 間 fetch（web proxy → API）が標準で行うため、`/me/` も最終的に `GET /me` → 401（未認証）/ 200（正規セッション）へ到達する。

### 4.2 T01: trailing-slash 正規化 middleware の関数 I/O 契約

新規 `apps/api/src/middleware/trailing-slash.ts`。

| 区分 | 内容 |
| --- | --- |
| export | `export const trailingSlashRedirect: () => MiddlewareHandler<{ Bindings: Env }>` |
| 入力 | Hono `Context`（`c.req.url` / `c.req.method`）+ `next` |
| 発火条件 | `c.req.method !== "OPTIONS"` かつ `URL(c.req.url).pathname !== "/"` かつ `pathname.endsWith("/")` |
| 出力（発火時） | `c.redirect(<末尾スラッシュ除去後の pathname + search>, 308)`（`next()` を呼ばず即 return） |
| 出力（非発火時） | `await next()` のみ（レスポンス非改変） |
| 副作用 | なし（D1・外部 I/O 非接触） |

### 4.3 T02: web proxy upstream URL 構築 I/O 契約（修正後）

対象 `apps/web/app/api/me/[...path]/route.ts` の `proxy()` 内 `target` 構築。

| 受信 path（`/api/me/...`） | `path`（params） | 修正前 target | 修正後 target（契約） |
| --- | --- | --- | --- |
| `/api/me` | `[]` | `${api}/me/`（末尾スラッシュ→ API 側 404） | `${api}/me` |
| `/api/me/visibility-request` | `["visibility-request"]` | `${api}/me/visibility-request` | `${api}/me/visibility-request`（不変） |
| `/api/me/profile?x=1` | `["profile"]` | `${api}/me/profile?x=1` | `${api}/me/profile?x=1`（不変） |

`requireSession()`（cookie / Authorization / `x-ubm-dev-session` 透過）・HTTP メソッド・body 転送ロジックは不変。

### 4.4 T03: `/profile` Server Component の error code → 表示分岐契約

`safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` の `meResult` を起点とする。

| 状態 | `meResult` | 表示 / 遷移（契約） |
| --- | --- | --- |
| `/me` 401 | `AuthRequiredError` rethrow → catch | `redirect("/login?redirect=/profile")`（AC-3・不変） |
| `/me` 404 | `meResult.ok=false` / `error.code === "MEMBER_SESSION_404"` | `SectionError`（`title="セッション情報を取得できませんでした"`・`detail="アカウント情報を確認できませんでした。再ログインしてください。"`・`actionHref="/login?redirect=/profile"`・`actionLabel="再ログイン"`）。生 `error.message` を露出しない（AC-1） |
| `/me` その他非 2xx（5xx 等） | `meResult.ok=false` / `error.code !== "MEMBER_SESSION_404"` | `SectionError`（`title="セッション情報を取得できませんでした"`・`detail="時間をおいて再読み込みしてください。"`・`retryHref="/profile"`）。生 `error.message` を露出しない（AC-2） |
| `/me` 200 | `meResult.ok=true` | 既存の本文描画（不変） |

### 4.5 T03: `SectionError` props I/O 契約（後方互換拡張）

| props | 型 | 既定 | 挙動 |
| --- | --- | --- | --- |
| `title` | `string?` | `"読み込みに失敗しました"` | 既存 |
| `detail` | `string?` | `"時間をおいて再読み込みしてください。"` | 既存 |
| `retryHref` | `string?` | `undefined` | 既存。あれば `<a data-role="retry">再読み込み</a>` を描画 |
| `actionHref` | `string?`（追加） | `undefined` | `actionLabel` と両方あるとき `<a data-role="action" href={actionHref}>{actionLabel}</a>` を描画 |
| `actionLabel` | `string?`（追加） | `undefined` | 同上。`actionHref` と両方揃ったときのみ描画 |
| `className` | `string?` | `undefined` | 既存 |

`actionHref` / `actionLabel` のいずれか一方のみの場合は action リンクを描画しない（両方 truthy が描画条件）。`retryHref` と `actionHref` が両方ある場合は両リンクを並べて描画する。

## 完了条件

- [x] T01 の `/me` / `/me/` mount 経由 HTTP 期待値（401 / 308 / Location）を契約表で確定
- [x] T01 正規化 middleware の関数シグネチャ・発火条件・副作用を確定
- [x] T02 の upstream URL 構築の入出力対応表（空 path / 非空 path）を確定
- [x] T03 の error code → 表示分岐契約と `SectionError` props 契約を確定

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | セッション / `/me` 解決 / session 境界の正本 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | authGateState / session 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス項目（不変であることの確認） |

- `outputs/phase-1/phase-1.md`（AC・真因）
- `outputs/phase-3/phase-3.md`（修正方針・代替案）

## 統合テスト連携

本契約を Phase 5 の task-01..03 の `## 5. テスト方針` 表（TC-ID）へ展開し、Phase 6（fail path / 回帰 guard）・Phase 7（カバレッジ）で再利用する。
