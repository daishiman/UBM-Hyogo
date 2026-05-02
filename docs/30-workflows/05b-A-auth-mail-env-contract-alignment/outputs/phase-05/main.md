# Output Phase 5: 実装ランブック

## 委譲方針

| 区分 | 本タスク (05b-A) | 別タスク委譲先 |
| --- | --- | --- |
| 仕様書作成 | 完結 | — |
| spec / aiworkflow Markdown 修正 | Phase 12 で `Edit` 適用 | — |
| `wrangler.toml [vars]` 追記 | 本レビューで反映 | 09a / 09c が runtime smoke で検証 |
| Cloudflare Secrets `secret put` | 委譲（user 承認後） | 09a staging smoke / 09c production readiness |
| 1Password Vault item 作成 | 委譲（user 承認後） | user operation + 09a / 09c |
| `apps/api` ソース変更 | 不要 | — |

## Step 1-7 ランブック

### Step 1: 1Password Vault path 命名

- Vault `UBM-Hyogo` / Item `auth-mail` / Field 名 = env 名そのまま
- 完全形: `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY`
- Notes は `Last-Updated: YYYY-MM-DD` のみ。値ハッシュ / provider 名 / 課金プランを書かない
- staging / production で値が異なる場合は **別 Item** (`auth-mail-staging` / `auth-mail-production`) に分離

### Step 2: `.env` の op:// 参照（実値禁止）

```
MAIL_PROVIDER_KEY=op://UBM-Hyogo/auth-mail-local/MAIL_PROVIDER_KEY
MAIL_FROM_ADDRESS=op://UBM-Hyogo/auth-mail-local/MAIL_FROM_ADDRESS
AUTH_URL=op://UBM-Hyogo/auth-mail-local/AUTH_URL
```

`scripts/with-env.sh` が `op run --env-file=.env` で動的注入。`.env` を `cat` / `Read` / `grep` で表示しない。

### Step 3: `wrangler.toml [vars]` 追記（Variable のみ）

```toml
[env.staging.vars]
MAIL_FROM_ADDRESS = "noreply@staging.ubm-hyogo.example"
AUTH_URL = "https://api-staging.ubm-hyogo.workers.dev"

[env.production.vars]
MAIL_FROM_ADDRESS = "noreply@ubm-hyogo.example"
AUTH_URL = "https://api.ubm-hyogo.workers.dev"
```

`MAIL_PROVIDER_KEY` は `[vars]` に書かない（Secret 専用）。

### Step 4: Cloudflare Secrets 投入（user 承認後）

```bash
bash scripts/cf.sh whoami

# staging-first 必須
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY \
      --config apps/api/wrangler.toml --env staging

bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
# → staging smoke (Phase 11) を通過後 production
```

禁止: `--body "実値"` / 一時ファイル保存 / log・evidence・PR への値転記 / `wrangler login` でのトークン保持 / `wrangler` 直接実行。

### Step 5: spec docs / aiworkflow refs 差し替え（Phase 12）

```bash
rg -l 'RESEND_API_KEY|RESEND_FROM_EMAIL|\bSITE_URL\b' \
  docs/00-getting-started-manual/specs \
  .claude/skills/aiworkflow-requirements/references
```

置換対応: `RESEND_API_KEY → MAIL_PROVIDER_KEY` (Secret) / `RESEND_FROM_EMAIL → MAIL_FROM_ADDRESS` (Variable) / `SITE_URL → AUTH_URL` (Variable)。`Edit` で逐語、`sed -i` 禁止。種別列追加 + 502 脚注追加。

### Step 6: テスト実装は別タスク委譲

- L1: `apps/api/src/services/mail/__tests__/magic-link-mailer.test.ts`
- L2: `apps/api/src/env.test.ts` または既存 env-focused test への追加（存在しない仮置きパスは参照しない）
- L3: `scripts/doc-grep-legacy-env.sh`（CI / lefthook 統合）

### Step 7: deploy

本 runbook では指示せず。09a / 09c で user 承認後実施。

## CLI ラッパー使用ルール

| 操作 | 正 | 禁止 |
| --- | --- | --- |
| 認証 | `bash scripts/cf.sh whoami` | `wrangler whoami` |
| Secret put | `op read ... \| bash scripts/cf.sh secret put ...` | `wrangler secret put --body "実値"` |
| Secret list | `bash scripts/cf.sh secret list --env <env>` | 直 `wrangler` |
| Deploy | `bash scripts/cf.sh deploy --config ... --env <env>` | 直 `wrangler` |
| Rollback | `bash scripts/cf.sh rollback <ID> ...` | 直 `wrangler` |

## approval gate（自走禁止 6 項目）

1. `op read` の値出力経路
2. `bash scripts/cf.sh secret put` 実行
3. `bash scripts/cf.sh deploy` (staging / production)
4. Magic Link 実送信 smoke
5. 旧 env 名の Cloudflare / 1Password 新規投入
6. spec / aiworkflow / runbook 以外への commit / push / PR

## 次 Phase への引き渡し

- Step 1-7 詳細手順
- approval gate 6 項目
- 委譲方針（spec / runbook 確定まで本タスク、実装は別タスク）
- staging-first 順序 / production fail-closed deploy readiness 条件
- CLI ラッパー必須（`wrangler` 直接禁止）
