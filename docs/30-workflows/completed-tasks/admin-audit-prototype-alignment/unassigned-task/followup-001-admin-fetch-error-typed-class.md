# admin-audit-prototype-alignment FU-001 - AdminFetchError typed class 導入 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-audit-prototype-alignment-fu-001 |
| タスク名 | AdminFetchError typed class 導入による 404/500 切り分け強化 |
| 分類 | 改善（observability / debuggability） |
| 対象機能 | `apps/web/src/lib/admin/server-fetch.ts` admin API 呼び出し共通レイヤー |
| 優先度 | medium |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | Phase 12（admin-audit-prototype-alignment 親 workflow close-out） |
| 発見日 | 2026-05-27 |
| 親タスク | `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/`（移動後パス） |
| 親タスク状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 関連 area | web, admin-ui |
| wave | 2-plus |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親 workflow `admin-audit-prototype-alignment` Task B では、`apps/api` 側の `/admin/audit` 404 を root mount 結線で恒久解決した。一方 `apps/web` 側の admin fetch 共通レイヤー (`apps/web/src/lib/admin/server-fetch.ts`) は失敗時に `throw new Error("admin api ${path} failed: ${status}")` という **untyped Error** を投げているため、呼び出し側（page.tsx / error.tsx / safe-server-fetch.ts）で:

- `status` を抜き出すには message を正規表現 parse する必要がある
- 404 と 500 を構造的に区別できない
- response body snippet（再現用 debug 情報）が捨てられている

Task B 仕様 §B.4.1 では「通常はコード変更不要だが、将来同種の 404 mount regression が発生した際の切り分け強化として `AdminFetchError extends Error` の追加を推奨」と記載されており、後続 follow-up として残されている。

### 1.2 問題点・課題

1. 404 / 500 / network error の区別が message string parse に依存しており fragile
2. error.tsx 側で「mount 漏れ系 404」と「データ不在 404」を分離するロジックが書けない
3. observability tooling（Sentry tag 付与など）に渡せる構造化 metadata が無い

### 1.3 放置した場合の影響

- 将来 admin route の mount regression が再発した際、原因切り分けに前回（task-B）と同等の手作業 grep / staging tail が必要になる
- error boundary の表示分岐を増やそうとした際に message parse のコードが各所に散らばる

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/web/src/lib/admin/server-fetch.ts` の admin API 呼び出し失敗を `AdminFetchError extends Error` として throw し、`status` / `path` / `responseBodySnippet`（PII 流入防止のため 500 文字切り）を構造化フィールドとして提供する。

### 2.2 最終ゴール

- 既存呼び出し側のコードは変更不要（既存 `Error.message` フォーマット `admin api ${path} failed: ${status}` は維持）
- 型としては `AdminFetchError` で narrow できる
- 新規 vitest spec で typed error の throw / fields を検証

---

## 3. どう実装するか（How）

### 3.1 実装手順

1. `apps/web/src/lib/admin/server-fetch.ts` に下記クラスを追加:
   ```ts
   export class AdminFetchError extends Error {
     readonly status: number;
     readonly path: string;
     readonly responseBodySnippet: string | null;
     constructor(opts: { path: string; status: number; responseBodySnippet?: string | null }) {
       super(`admin api ${opts.path} failed: ${opts.status}`);
       this.name = "AdminFetchError";
       this.status = opts.status;
       this.path = opts.path;
       this.responseBodySnippet = (opts.responseBodySnippet ?? null)?.slice(0, 500) ?? null;
     }
   }
   ```
2. 既存 `throw new Error(...)` 箇所を `throw new AdminFetchError({ path, status: res.status, responseBodySnippet: await res.text().catch(() => null) })` に置換。response body 読み出しは 1 回のみ（既に他用途で読まれている場合は責務統一）。
3. `apps/web/src/lib/admin/safe-server-fetch.ts` で `error instanceof AdminFetchError ? error.status : null` の形で 404 reason 判定を構造化（既存 reason 値は維持）。
4. 新規 spec `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts` を追加し、typed throw / status / snippet 500 文字切りを検証。
5. 既存 `safe-server-fetch.spec.ts` の 404 reason 検証ケースに `instanceof AdminFetchError` assertion を追加。

### 3.2 受入基準（AC）

- [ ] `AdminFetchError` が `apps/web/src/lib/admin/server-fetch.ts` から export されている
- [ ] 既存 `Error.message` フォーマット（`admin api ${path} failed: ${status}`）が維持される（既存呼び出し側の正規表現が壊れない）
- [ ] `responseBodySnippet` が 500 文字以下に切られる
- [ ] `admin-fetch-error.spec.ts` で typed throw / fields / 500 文字切りが green
- [ ] `safe-server-fetch.spec.ts` 既存テスト群が引き続き green
- [ ] `pnpm typecheck && pnpm lint` green

---

## 4. 苦戦箇所 / 予想される困難（将来再利用可能ナレッジ）

| # | 困難 | 予防策 / 先例 |
| --- | --- | --- |
| 1 | response body の二重 read（`res.text()` を呼んだ後の再 `res.json()` ができない） | `Response.clone()` を fetch 直後に取り、本流は json、error 用には clone を `.text()` する。先例: 親 workflow Task B でも `safe-server-fetch` の response 再利用で同種の落とし穴あり |
| 2 | PII 流入リスク（admin API のレスポンスに memberEmail / handle が含まれる） | `slice(0, 500)` + 将来的に `mask-pii.ts` の `maskEmail`/`maskHandle` を pass する hook を残す。本タスクでは 500 文字切りのみ実装し、masking は別 follow-up |
| 3 | `instanceof AdminFetchError` が Cloudflare Workers の cross-module bundling で false になる事故 | `error.name === "AdminFetchError"` の string 判定 fallback を common util に置く（先例: identity-conflicts SafeFetch error の対処と同型） |
| 4 | 既存呼び出し側で `error instanceof Error` の網羅判定が AdminFetchError を inheritance で漏らす | `AdminFetchError extends Error` であることを spec で明示し、`instanceof Error` も true である assertion を入れる |
| 5 | error.tsx で `responseBodySnippet` をそのまま display すると XSS / PII リスク | error.tsx 側は数値 status と path のみを表示し、snippet は server log（console.error）のみに留める |

---

## 5. 関連先行事例

- `docs/30-workflows/completed-tasks/admin-tag-queue-ui-and-404-recovery/` — 同種 404 mount regression を扱った先行 workflow
- `docs/30-workflows/completed-tasks/admin-identity-conflicts/` — admin fetch 失敗時の error.tsx 表示パターン
- `apps/web/src/lib/admin/safe-server-fetch.ts` — 既存 404 reason 判定の実装。本タスクで `instanceof AdminFetchError` に置換する対象

---

## 6. スコープ外（明示）

- response body の PII masking（別 follow-up）
- error.tsx の表示分岐刷新（観測 evidence 取得後に別タスク化）
- `apps/api` 側の error response shape 変更

---

## GitHub Issue

- #991 https://github.com/daishiman/UBM-Hyogo/issues/991
