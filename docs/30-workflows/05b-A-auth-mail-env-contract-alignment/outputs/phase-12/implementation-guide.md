# Implementation Guide: auth mail env contract alignment

## Part 1: 中学生レベル

メールを送るための大事な設定名を、みんなで同じ呼び方にそろえる。

たとえば学校の係活動で、同じ紙をある人は「印刷用紙」、別の人は「コピー用紙」と呼ぶと、印刷係はどれを用意すればよいか迷う。このタスクも同じで、ログイン用メールを送るための「鍵」「差出人」「リンク先」の名前を、仕様書、運用手順、実装でそろえる。

なぜ必要か。名前がずれていると、正しい鍵を入れたつもりでもアプリが別の名前を探してしまい、ログイン用メールが届かない。だから、実装がすでに使っている `MAIL_PROVIDER_KEY`、`MAIL_FROM_ADDRESS`、`AUTH_URL` を正本にする。

何をするか。古い呼び方の `RESEND_API_KEY`、`RESEND_FROM_EMAIL`、`SITE_URL` は新しく増やさず、仕様書では正本名に置き換える。秘密の値そのものは書かない。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| 環境変数 | アプリが起動するときに受け取る設定メモ |
| Secret | 金庫にしまう鍵そのもの |
| Variable | 掲示板に書いてよい設定 |
| Cloudflare Secrets | クラウド上の金庫 |
| 1Password Vault | 手元で鍵を保管する金庫アプリの引き出し |
| Magic Link | クリックするとログインできる使い捨てリンク |
| fail-closed | 鍵がないときは無理に進まず止める動き方 |

## Part 2: 技術者レベル

### Adopted env names

| Name | Kind | Placement | Purpose |
| --- | --- | --- | --- |
| `MAIL_PROVIDER_KEY` | Secret | Cloudflare Secrets / 1Password `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY` | Mail provider API key |
| `MAIL_FROM_ADDRESS` | Variable | `apps/api/wrangler.toml` `[env.<env>.vars]` | Magic Link From address |
| `AUTH_URL` | Variable | `apps/api/wrangler.toml` `[env.<env>.vars]` | Magic Link callback base URL |

### API and runtime contract

- `POST /auth/magic-link` uses the existing mail sender factory and does not introduce a second env-name alias layer.
- Production with missing `MAIL_PROVIDER_KEY` returns 502 `MAIL_FAILED` at request time.
- Development/test may use no-op success, matching the existing Magic Link provider boundary.
- Values, hashes, provider response bodies, and `op read` output must not be copied into docs or evidence.

### Migration rule

Replace stale documentation names only:

| Old name | Canonical name |
| --- | --- |
| `RESEND_API_KEY` | `MAIL_PROVIDER_KEY` |
| `RESEND_FROM_EMAIL` | `MAIL_FROM_ADDRESS` |
| `SITE_URL` | `AUTH_URL` |

Do not add runtime fallback aliases for the old names. If Cloudflare already contains an old name, the downstream execution task must detect it by name only and delete it before inserting the canonical name.

### Delegation boundary

This workflow is `spec_created / docs-only / remaining-only`. Secret provisioning, staging smoke, production readiness, and PR creation remain gated by downstream tasks and user approval.

### Phase 11 evidence boundary

This workflow is NON_VISUAL. Screenshots are not required because there is no UI change. Phase 11 evidence is represented by the following readiness files:

- `outputs/phase-11/env-name-grep.md`
- `outputs/phase-11/secret-list-check.md`
- `outputs/phase-11/magic-link-smoke-readiness.md`

These files are readiness templates, not real staging or production smoke results. Actual `POST /auth/magic-link`, inbox receipt, and production fail-closed evidence belong to 09a / 09c.
