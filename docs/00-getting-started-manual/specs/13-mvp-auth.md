# MVP 認証方針

## MVP で採用するもの

```text
公開ページ
  -> 認証不要

会員ページ
  -> Google OAuth を主導線
  -> Magic Link を補助導線

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
