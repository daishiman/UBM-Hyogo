# MVP 認証方針

## MVP で採用するもの

```text
公開ページ
  -> 認証不要

会員ページ
  -> Magic Link を主導線
  -> Google OAuth を補助導線

管理ページ
  -> 会員認証 + admin_users
```

実装先は `apps/web` の認証導線と `apps/api` の照合処理に分かれる。

---

## MVP の前提

1. 実フォームは 31 項目・6 セクション
2. formId は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
3. メールは Google 自動収集の `responseEmail`
4. consent キーは `publicConsent` / `rulesConsent`
5. 本人更新は Google Form 再回答または edit URL
6. GAS prototype は UI 参照であり、本番認証の正本ではない

---

## Issue #958 publicConsent update boundary

`issue-958-h3-public-filter-ux` keeps the MVP auth/update boundary unchanged.

- `publicConsent` の正式更新経路は Google Form 再回答または edit URL であり、member self-service toggle API は追加しない。
- `/profile` は `publicConsent` 状態を説明し、Google Form CTA を出すだけにする。
- `/admin/members` は `publishState` の republish のみ扱い、`publicConsent` を直接変更しない。
- Phase 11 local static visual evidence is present; staging visual capture remains pending.

---

## MVP ログイン条件

1. `responseEmail` が登録済み
2. `rulesConsent = "consented"`
3. `isDeleted = false`

これを満たさない場合は、別ページに飛ばすのではなく `/login` の状態として扱う。

| 状態 | 対応 |
|------|------|
| 未登録 | Google Form 登録へ誘導 |
| 規約未同意 | 再回答へ誘導 |
| 削除済み | 管理者連絡を案内 |

---

## MVP `/login` UI 契約（2026-05-23 prototype alignment）

`/login` の認証機能 contract は維持し、画面構造は
`docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` の
LoginPage を正本として整合する。

| 要素 | 正本 |
| --- | --- |
| shell | `.auth-shell` full-page centered layout |
| card | `.auth-card` 420px max panel |
| brand | `.brand-mark` の「兵」 + `.brand-title` の `UBM兵庫支部会` / `Member Portal` |
| h1 | `会員ログイン` |
| subtitle | `Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。` |
| primary CTA | Magic Link form。email placeholder `you@example.com`、button `マジックリンクを送る`、send icon、block lg |
| separator | OR divider。両端 hairline + uppercase `OR` |
| secondary CTA | `Googleでログイン` ghost button、google icon、block lg |
| register CTA | `会員でない方は メンバー登録 から` |
| sent state | 56px inbox icon block、`メールをご確認ください`、email 強調、`戻る` link |

実装 wave: `docs/30-workflows/login-page-prototype-alignment/`。
Auth.js / Magic Link API / D1 access boundary は変更しない。

## `/profile` session transport observability（2026-06-11）

`/profile` の初回 `/me` server fetch は `fetchAuthed()` → `resolveApiFetch()` → `safeServerFetch()` の境界で扱う。staging / production では `API_SERVICE` service binding を優先し、`ENVIRONMENT` が明示されず service binding / internal base URL も無い場合は localhost fallback せず fail-closed する。

`server_fetch_failed` log は `{ code, path, status, transportKind, baseHost }` を出す。これにより実機 staging で、失敗が 410（削除済み member）、5xx、または transport failure のどれかを切り分けられる。ログは host と status のみで、memberId / responseId / cookie / token / secret は出さない。

この観測性強化は UI 文言、`/me` API response、session JWT claims、D1 schema、Google Form schema を変更しない。

### `/login` balance / brand-icon fix（2026-05-26）

後続 wave `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/` で、`.auth-card .ui-input[data-size="lg"]` は button と同じ 44px 高さ / `--ubm-space-4` horizontal padding に揃えた。`legacy-public.css` の汎用 `[data-size]` 円形スタイルは `data-component="google-brand-icon"`、`.ui-input`、`.ui-button` を除外し、Google 公式 4 色 SVG を CSS で改変しない。

---

## MVP 公開条件

1. `publicConsent = "consented"`
2. `publishState = "public"`
3. `isDeleted = false`

公開条件とログイン条件は別。

---

## MVP でやらないこと

1. `/no-access` 専用画面依存
2. D1 `profile_overrides` ベースの本人編集
3. GAS `localStorage` をそのまま本番保存方式にすること
4. 会合・参加履歴を Google Form schema に含めること

---

## MVP 受け入れ条件

1. 未ログインでも公開一覧・公開詳細を閲覧できる
2. `responseEmail` 一致の会員だけログインできる
3. `rulesConsent` 未同意ではログインできない
4. マイページから Google Form 更新導線へ行ける
5. 管理者は公開状態、削除、開催日、参加履歴、タグキューを扱える

---

## MVP session JWT 構造（05a 確定）

Auth.js v5 の cookie session は **HS256 JWT** を `AUTH_SECRET` で sign / verify する。
JWT claims は **以下に固定** し、provider 不問の最小構造とする（不変条件 #4 / #11 強化）。

```ts
// packages/shared/src/auth.ts
type SessionJwtClaims = {
  sub: string;        // = memberId
  memberId: MemberId; // branded MemberId
  isAdmin: boolean;   // admin gate 判定
  email: string;      // 表示・log 用
  name?: string;      // OAuth profile.name
  iat: number;
  exp: number;        // iat + 24h
};
```

固定ルール:

- ログイン後 UI の sign-out は `apps/web/src/components/auth/SignOutButton.tsx` に集約し、Auth.js v5 client API `signOut({ redirectTo: "/login" })` を使う。
- `/profile` と `/admin` のログアウト後は `/login` に戻す。session cookie / OAuth token 値は screenshot / log / docs に保存しない。

1. **`memberId` のみ含める**（不変条件 #7: `responseId` と混同しない）
2. **プロフィール本文 / `responseId` / `authGateState` を含めない**（不変条件 #4: form schema 外 admin-managed data 分離）
3. **`isAdmin` は session 発行時に `admin_users.active` を `/auth/session-resolve` で確認した結果**を埋める。API 側 `requireAdmin` は再 lookup せず claim を信頼する（不変条件 #5: D1 直接アクセス禁止の徹底）
4. **TTL は 24 時間**（`SESSION_JWT_TTL_SECONDS = 24 * 60 * 60`）
5. **`apps/web` の Auth.js cookie と `apps/api` の `verifySessionJwt` は同じ `AUTH_SECRET` を共有**し、`encodeAuthSessionJwt` / `decodeAuthSessionJwt` を経由する

### admin 剥奪の反映ポリシー（MVP 制約 / B-01）

- `admin_users.active = 0` への変更は **既発行 session の JWT には即時反映されない**。
- 反映は **次回ログイン**（OAuth 再認証で `/auth/session-resolve` が再評価される）または **JWT 自然失効（24h 後）** で行う。
- 緊急失効が必要な場合は `AUTH_SECRET` rotate で全 session を一括 invalidate する（運用例外）。
- MVP では「admin 剥奪の即時反映」を採用しない。session 失効の追跡は follow-up（unassigned-task）として扱う。

### MVP では採用しない（D1 sessions テーブル不採用）

Cloudflare D1 無料枠（500k reads/day）を圧迫するため、
**`sessions` テーブルを D1 に作らず、JWT-only session** を採用する（`08-free-database.md` と整合）。

- session lookup を D1 read 0 で済ませる
- session 失効・admin 剥奪の即時反映は犠牲にする
- 必要なら次フェーズで KV ベースの revocation list を導入する（MVP では不要）

---

## B-03: testing user 以外ログイン不能（解除前 / follow-up spec_created）

Google OAuth verification は本番公開前の外部制約であり、05a 本体では MVP 期間の testing user 運用を許容した。解除作業は `ut-05a-followup-google-oauth-completion` に統合し、staging smoke → production verification 申請 → external Gmail login smoke の順で実行する。

現時点の状態:

| 項目 | 状態 |
| --- | --- |
| follow-up workflow | `docs/30-workflows/ut-05a-followup-google-oauth-completion/` |
| workflow_state | `spec_created` |
| 解除条件 a | Google verification `verified` + 外部 Gmail production smoke PASS |
| 解除条件 b | Google verification `submitted` + 暫定運用方針を Phase 12 に反映 |
| 解除条件 c | testing user 拡大運用（退避路。恒久完了扱いにしない） |

B-03 を解除済みに更新できるのは、`outputs/phase-11/production/verification-submission.md` と `outputs/phase-11/production/login-smoke.png` が実 evidence として保存され、Phase 12 の system spec update が実行された後に限る。
