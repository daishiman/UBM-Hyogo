# 05a: Auth.js Google OAuth + admin gate 実装の苦戦箇所

> 対象タスク: `docs/30-workflows/05a-parallel-authjs-google-oauth-provider-and-admin-gate/`
> 同期日: 2026-04-29
> 実装範囲: Auth.js v5 Google OAuth provider / `GET /auth/session-resolve` / 共有 HS256 JWT session / `apps/web/middleware.ts` / `apps/api/src/middleware/{internal-auth,require-admin}.ts` / `packages/shared/src/auth.ts`

---

## L-05A-001: Auth.js v5 cookie session resolver を internal endpoint で繋ぐ設計

### 苦戦点

不変条件 #5（`apps/web` から D1 直接アクセス禁止）により、Auth.js v5 の `signIn` / `jwt` callback の中で
直接 `member_identities` / `member_status` / `admin_users` を参照できない。
Auth.js の標準パターン（DB Adapter）も `apps/web` の Worker から D1 binding を経由させると不変条件違反になる。

### 採用解

`apps/api` 側に **内部 endpoint** `GET /auth/session-resolve?email=<email>` を新設し、
Auth.js callback から Worker-to-Worker fetch する設計とした。
endpoint の認可は **`X-Internal-Auth: <INTERNAL_AUTH_SECRET>`** ヘッダ比較のみで、
public 公開しない（email 列挙攻撃を避ける）。

- `INTERNAL_AUTH_SECRET` は両 Worker（apps/web / apps/api）の Cloudflare Secrets に同値で登録
- middleware は `apps/api/src/middleware/internal-auth.ts` に集約
- `D1 を直接触らない` ことを `apps/web` 側のレビュー観点として明文化

### 教訓

- Auth.js callback 内から D1 を引かない設計は、HTTP 経由の internal endpoint で繋ぐのが最小コスト
- internal endpoint には **常に shared secret + 単一責務 middleware** を最初から付ける（後付けで public 露出させない）
- secret は CF Secrets / 1Password の op 参照に揃える（`.env` 平文に書かない）

---

## L-05A-002: 二段防御の責務分離と bypass 試行検証 (F-15 / F-16)

### 苦戦点

admin gate を `apps/web/middleware.ts` の matcher だけに頼ると、以下の bypass 経路が成立してしまう。

- F-15: `apps/web` middleware の matcher 漏れ（rewrite / API route / CSR fetch 等）
- F-16: cookie 改竄 / `Authorization: Bearer` 偽装で API を直接叩く

### 採用解

**二段防御** を不変条件として固定:

| 段 | 実装 | 責務 |
|---|------|------|
| 第1段 (UI gate) | `apps/web/middleware.ts`（matcher: `/admin/:path*`） | 未ログイン / 非 admin の SSR ブロック → `/login?gate=admin_required` redirect |
| 第2段 (API gate) | `apps/api/src/middleware/require-admin.ts` | `/admin/*` route mount に独立適用、`claims.isAdmin !== true` は 403 |

両段とも **D1 を一切触らない**（JWT verify のみ）。`admin_users` の active 判定は session 発行時の `/auth/session-resolve` で済ませている。

### 教訓

- UI gate / API gate は **同一 verify ロジック（`verifySessionJwt`）を共有しつつ、独立に 401/403 を返す責務分離** が必要
- bypass 試行（cookie 改竄 / Bearer 偽装 / matcher 漏れ）は実装中に **テストとして書く**（`require-admin.test.ts` / 手動 curl）
- sync 系 cron 経路（`/admin/sync*`）は別の `requireSyncAdmin`（`SYNC_ADMIN_TOKEN` Bearer）を維持し、人間向けと混ぜない

---

## L-05A-003: admin 剥奪の即時反映 (B-01) を MVP では「次回ログイン反映」で許容

### 苦戦点

`admin_users.active = 0` への変更は **既発行 JWT に即時反映されない**。
JWT は `apps/web` の Auth.js cookie に乗っており、TTL（24h）満了まで `isAdmin: true` のまま動く。

「即時失効」を実現するには D1 / KV ベースの revocation list か session table が必要だが、
無料枠（D1 500k reads/day）を session lookup で消費するのは MVP 規模では割に合わない。

### 採用解

- **MVP では「次回ログインで反映」** を明示的に許容（`13-mvp-auth.md` § B-01）
- 緊急時は `AUTH_SECRET` rotate で全 session 一括 invalidate（運用例外）
- 即時失効を将来必要にするなら **KV ベース revocation list** を別タスクで導入（D1 sessions テーブルは復活させない）

### 教訓

- 「即時反映」を諦めるかどうかは **無料枠制約と運用規模の照らし合わせで決める**
- 諦める場合は spec / lessons / unassigned-task の 3 箇所に明文化し、忘却を防ぐ
- 追跡 follow-up: `unassigned-task-001`（実 OAuth screenshot smoke）と並んで session revocation 検討を unassigned に残す

---

## L-05A-004: Google OAuth verification (B-03) を testing user 運用で MVP 許容

### 苦戦点

Google OAuth Provider の本番化には Google の **OAuth verification** 申請が必要。
特に `email` / `profile` scope のみでも、unverified の状態では「未確認の警告画面」が出る。
50 人規模の MVP で全員に警告画面を経由させるか、testing user 登録で済ませるかの判断が必要。

### 採用解

- MVP 期間は **Google Cloud Console の OAuth consent screen を testing 状態のまま運用**
- 対象会員（最大 50 人）を **testing user として明示登録**
- 本番 verification 申請は MVP 卒業後の follow-up（unassigned-task-002 で追跡）
- 警告画面回避が目的の独自 domain verification / privacy policy ページ整備は MVP scope 外

### 教訓

- OAuth verification は **準備リードタイムが長い**（Google 審査 4〜6 週間）。MVP scope に含めない判断を初期に固める
- testing user 上限（100 名）は MVP 50 人想定で十分余裕がある
- MVP 卒業判定の checklist に「OAuth verification 申請完了」を入れる

---

## L-05A-005: Phase 11 staging smoke の実 OAuth 接続不能で証跡が placeholder

### 苦戦点

05a Phase 11 は本来 staging Cloudflare 環境で `/login` → Google OAuth 同意画面 → callback → `/me` までの
実 OAuth screenshot を要求する。しかし以下の理由で実接続不能だった:

- staging Cloudflare 環境への OAuth credentials 配備が未完了（09a 系タスクで実施予定）
- `apps/web` の `@opennextjs/cloudflare` deploy が staging で未確立
- VISUAL smoke の前提となる UI ルーティングが apps/web 完成待ち

### 採用解

- **screenshot smoke を 09a に委譲**（task-workflow-active で `VISUAL smoke deferred` と明示）
- 代替証跡として:
  - `packages/shared/src/auth.test.ts`（JWT sign / verify / encode / decode）
  - `apps/api/src/routes/auth/session-resolve.test.ts`（gateReason 列挙網羅）
  - `apps/api/src/middleware/require-admin.test.ts`（cookie / Bearer / 401 / 403）
  - `apps/api/src/routes/admin/*.test.ts`（admin route gate）
- Phase 11 outputs の placeholder は `unassigned-task-001`（実 OAuth screenshot smoke）で上書き予定

### 教訓

- VISUAL smoke を別 wave に委譲する場合は **代替証跡（自動テスト）を明示列挙し、placeholder を残す**
- placeholder のままにしないため **必ず unassigned-task で追跡**
- 「実環境接続不能」は早期に判定し、Phase 11 の途中で気づくと sunk cost が大きい

---

## L-05A-006: session JWT 構造を memberId / isAdmin のみに最小化、D1 sessions 不採用と整合

### 苦戦点

Auth.js v5 の session callback には profile.name / image / responseId / authGateState など多くの値を入れたくなる。
しかし以下と矛盾する:

- 不変条件 #4（admin-managed data 分離）: profile 本文 / 公開状態は session に乗せない
- 不変条件 #7（responseId / memberId 混同禁止）: `responseId` は session に入れない
- 不変条件 #11（admin gate 強化）: API 側の `requireAdmin` が claim を信頼するため、最小化が安全

さらに D1 `sessions` テーブルを採用すれば「session 拡張」は容易だが、
無料枠 500k reads/day を session lookup で消費するのは MVP 50 人規模では非合理。

### 採用解

JWT claims を以下に固定（`packages/shared/src/auth.ts`）:

```ts
type SessionJwtClaims = {
  sub: string;        // = memberId
  memberId: MemberId;
  isAdmin: boolean;
  email: string;
  name?: string;
  iat: number;
  exp: number;        // iat + 24h
};
```

- `responseId` / プロフィール本文 / `authGateState` を含めない
- `isAdmin` は session 発行時 `/auth/session-resolve` の結果を埋める
- D1 `sessions` テーブルを **作らない**（`08-free-database.md` § "D1 sessions テーブル不採用"）
- `apps/web` Auth.js cookie ↔ `apps/api` `verifySessionJwt` は **同じ `AUTH_SECRET`** を共有

### 教訓

- session JWT は **最小化** が常に正解（追加情報は API 経由で都度取得）
- 「JWT-only session を採用する」決定は **無料枠制約 / 運用規模 / 即時失効の必要性** をセットで判断する
- spec 整合のため `13-mvp-auth.md` / `08-free-database.md` / `02-auth.md` / `06-member-auth.md` / `11-admin-management.md` を **同 wave で更新** する

---

## 関連リソース

| 観点 | 参照先 |
|------|--------|
| 内部 endpoint 仕様 | `docs/00-getting-started-manual/specs/02-auth.md` § "内部 endpoint: `GET /auth/session-resolve`" |
| gateReason 命名共有（05b 連携） | `docs/00-getting-started-manual/specs/06-member-auth.md` § "gateReason 列挙値" |
| 二段防御 | `docs/00-getting-started-manual/specs/11-admin-management.md` § "管理者ゲート（admin gate）二段防御" |
| session JWT 構造 / B-01 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` § "MVP session JWT 構造" |
| D1 sessions 不採用 | `docs/00-getting-started-manual/specs/08-free-database.md` § "D1 `sessions` テーブル不採用" |
| API 早見 | `references/api-endpoints.md` § "認証セッション解決 API（apps/api / 05a）" |
| クイックリファレンス | `indexes/quick-reference.md` § "Auth.js Google OAuth / Admin Gate 早見（05a / 2026-04-29）" |

## Follow-up（unassigned-task）

| ID | 内容 |
|----|------|
| unassigned-task-001 | Phase 11 staging 実 OAuth screenshot smoke を 09a に委譲し placeholder を本物に上書き |
| unassigned-task-002 | Google OAuth verification 本番申請（MVP 卒業時） |
| unassigned-task-003 | admin 剥奪即時反映 (B-01) を将来必要にする際の KV revocation list 設計検討（D1 sessions 復活は禁止） |

---

## 追加教訓（2026-04 followup / staging 実装サイクル）

### L-05A-007: OpenNext Worker への環境変数 bridge 注入
- 発生フェーズ: 実装 / staging 検証
- 症状: `process.env.AUTH_SECRET` が edge runtime で undefined となり、Auth.js callback が fail
- 根本原因: OpenNext bundle が Cloudflare env を Next.js runtime context に直接渡さない
- 解決策: `scripts/patch-open-next-worker.mjs` で post-build patch を適用。`buildAuthEnv()` 関数を `.open-next/worker.js` に注入し、`globalThis` 書込 + request header (`x-ubm-*`) の二重経路で credentials を受渡す
- 同種課題で最初に確認すべき箇所: `.open-next/worker.js` の env layer、`apps/web/src/lib/auth.ts` の env() helper
- 関連: `scripts/patch-open-next-worker.mjs`、`apps/web/middleware.ts`

### L-05A-008: Cloudflare Workers 同一アカウント loopback subrequest 404
- 発生フェーズ: staging 検証
- 症状: `PUBLIC_API_BASE_URL` への外向き fetch が staging で 404
- 根本原因: 同一アカウントの workers.dev domain への loopback fetch が Cloudflare 側でルーティングされない
- 解決策: `apps/web/src/lib/fetch/public.ts` を service-binding (`env.API_SERVICE.fetch`) 主経路に統一し、外向き fetch は local fallback に降格。`apps/web/wrangler.toml` の `[[env.staging.services]]` で binding を定義
- 同種課題で最初に確認すべき箇所: `wrangler tail` の transport ログ、`wrangler.toml` の services binding 定義
- 関連: `apps/web/src/lib/fetch/public.ts`、`apps/web/wrangler.toml`

### L-05A-009: Next.js 16 + React 19 prerender useContext null
- 発生フェーズ: ビルド / Phase 11 直前
- 症状: `pnpm build` で `/_global-error` / `/_not-found` の SSG が `Cannot read properties of null (reading 'useContext')` で fail
- 根本原因: pending（next 16.2.4 + react 19.2.5 の strict SSR で context provider scope 不在の可能性）
- 解決策: 未解決。`apps/web/app/global-error.tsx` 追加で部分緩和を試したが prerender failure は継続
- 同種課題で最初に確認すべき箇所: `next.config.ts` の experimental flags、`app/error.tsx` / `app/global-error.tsx`、GitHub Issue #385、PR #271
- 関連: `docs/30-workflows/unassigned-task/task-05a-build-prerender-failure-001.md`（blocker）
- 2026-05-03 更新: Issue #385 は `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/` で `implemented-local / implementation / NON_VISUAL` に昇格。旧 first choice の `global-error.tsx` RSC 化は Next 16 仕様違反として撤回し、Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory、route/session helper の lazy access、`oauth-client.ts` dynamic import、`apps/web/package.json` の `NODE_ENV=production` build script 明示）を採用。Phase 11 は typecheck / lint / tests / build / build:cloudflare / worker.js / lazy-import-check が PASS。deploy・commit・push・PR・Issue reopen は user approval 後。

### L-05A-010: Google OAuth verification と privacy/terms 公開ページの上流依存
- 発生フェーズ: Phase 11 / OAuth verification 申請準備
- 症状: `/privacy` / `/terms` が 404、Google OAuth consent screen の URL 登録不能
- 根本原因: build prerender failure (L-05A-009) で deploy 不能、上流 blocker
- 解決策: `apps/web/app/privacy/page.tsx` / `terms/page.tsx` を暫定文面で実装済。法務レビュー後に本番文面更新。verification 申請は build 解消後
- 同種課題で最初に確認すべき箇所: Google Cloud Console OAuth client status、consent screen URLs
- 関連: `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md`

### L-05A-011: Auth.js session-resolve の env 層化（local / Cloudflare / globalThis / request header）
- 発生フェーズ: 実装 / staging 検証
- 症状: env 取得元の優先順位が複雑化、staging で credentials undefined のケース
- 根本原因: 4 種類の runtime context（processEnv / globalEnv / cloudflareEnv / requestEnv）を merge せずに layered fallback で取得していた
- 解決策: `apps/web/src/lib/auth.ts` で env() helper の優先順位を明示。staging では `console.log` で transport / response を可視化（production は disable）
- 同種課題で最初に確認すべき箇所: `apps/web/src/lib/auth.ts` の env() / fetchSessionResolve / signIn callback
- 関連: `apps/api` 側 `/auth/session-resolve`、`INTERNAL_AUTH_SECRET`
