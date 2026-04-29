# Phase 6 — 異常系検証 main

## 目的

公開 endpoint 4 本における 404 / 422 fallback / 5xx / 不正 query / sync 失敗 / 大量 query / leak リグレッション を網羅し、異常系でも leak ゼロ（不変条件 #2 / #3 / #11）と未認証 200（AC-9）が壊れないことを確認する。

## 公開境界の堅牢化方針

- `/public/*` の Hono router は session middleware を一切 import しない（`apps/api/src/routes/public/index.ts`）。
- handler は cookie / Authorization の有無で response を分岐させない。
- `app.route("/public", createPublicRouter())` は `index.ts` で `/public/healthz` の直後に mount し、admin / me 系 router と完全分離する。
- OPTIONS / preflight は Hono デフォルト挙動に委ね、独自 CORS middleware を public router に挿入しない（必要なら API gateway 層で吸収）。
- 422 は使わず、不正 query は AC-6 に従い default 値に fallback して 200 を返す。

## leak リグレッション方針 (R-1 + F-16)

- `view-models/public/*` の converter は `PublicMemberProfileResponseZ` / `PublicMemberListResponseZ` 等の `.strict()` で zod parse し、未知 key 混入で fail close。
- converter 内で `responseEmail / rulesConsent / adminNotes` を runtime delete してから zod parse（防御の二重化）。
- `toPublicMemberProfile` は `isPublicStatus(src.status)` の二重チェックを行い、SQL where 抜けがあっても `UBM-1404` で 404 に倒す。
- unit test (`public-member-profile-view.test.ts`) で leak key を含む input を渡し、結果 JSON に含まれないことを `JSON.stringify().not.toContain("leak@example.com")` で確認。

## SQL injection 対応 (F-9)

- D1 アクセスは全て `db.prepare(sql).bind(...)` の prepared statement を使用（`apps/api/src/repository/publicMembers.ts` 参照）。
- `q` は `LIKE '%' || ? || '%'` で bind し文字列結合しない。
- 検索対象列は `member_responses.search_text` のみ。`responseEmail` / `adminNotes` は対象外（不変条件 #3 / AC-10）。

## query 入力の堅牢化 (F-5 / F-6 / F-7 / F-10)

- `parsePublicMemberQuery` は zod `.catch()` で不正値を default に fallback（AC-6）。
- `limit` は `clampLimit` で 1〜100 に強制（AC-11 / F-7）。
- `q` は 200 文字で `truncateQ` により切り詰め（F-10）。
- `tag` は `dedup` で重複除去（F-8）。

## sync_jobs 異常への耐性 (F-13 / F-14 / F-15)

- `mapJobStatus(job)` で null → `never`、succeeded → `ok`、failed → `failed`、running → `running` にマップ。
- `lastSync` を 500 にせず必ず enum で返す。

## schema 不在への耐性 (F-12 / F-19 / F-20)

- `/public/form-preview` は active manifest が無い場合 `UBM-5500` を投げ ApiError 経由で構造化エラー。
- `responderUrl` 未設定時は `01-api-schema.md` 固定値 `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` にフォールバック。
- `/public/members/:memberId` の field 0 件時は 200 + `publicSections: []`、404 にしない。

## 完了条件チェック

- [x] failure case 22 件以上を `failure-cases.md` に列挙。
- [x] 各 case に期待挙動 / 関連不変条件 or AC / 検出手段を記述。
- [x] leak リグレッション (F-16) と SQL injection (F-9) の方針を明文化。
- [x] 公開境界の堅牢化（cookie 非依存 / OPTIONS 対応）を明文化。
