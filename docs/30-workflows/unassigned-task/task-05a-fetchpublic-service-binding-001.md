# 05a follow-up: fetchPublic service-binding rewrite

## メタ情報

```yaml
issue_number: 387
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-fetchpublic-service-binding-001 |
| タスク名 | `apps/web` `fetchPublic` を service-binding 経路に統一して staging `/` `/members` 500 を解消 |
| 分類 | bug-fix |
| 対象機能 | apps/web → apps/api 間の public fetch routing |
| 優先度 | High |
| ステータス | 実装済（local 未 deploy） — verify 待ち |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 |
| 発見日 | 2026-05-01 |
| 前提 | `task-05a-build-prerender-failure-001` 完了 |

## 背景

staging で `/` および `/members` が **500** を返す。原因は web worker の `fetchPublic` が `/public/stats` `/public/members` を **404** で受け取って throw すること。`apps/web/wrangler.toml` の `[env.staging.vars]` に `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` を追加して redeploy したが解消せず（同URLを直叩きすると API は 200 を返す）。同一 Cloudflare account の workers.dev への loopback subrequest が 404 になる仕様の可能性。

session-resolve は既に service-binding 経由（`API_SERVICE.fetch(...)`）で正常動作していることを `wrangler tail` で確認済み (`transport: 'service-binding'`)。

## 目的

`fetchPublic` を `c.env.API_SERVICE.fetch(...)` の service-binding 経路に統一し、loopback subrequest 問題を回避して `/` `/members` を 200 に戻す。

## スコープ

含む:

- `apps/web/src/lib/fetch/public.ts` を service-binding 経由に書き換え（**実装済 — deploy 待ち**）
- `apps/web/wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]` に `binding = "API_SERVICE"` が設定されていることの確認
- local dev では HTTP fetch fallback（`PUBLIC_API_BASE_URL` 環境変数）を維持
- staging / production redeploy 後の `/` `/members` 200 evidence 取得

含まない:

- API 側のルーティング変更
- session-resolve の経路変更

## 受け入れ条件

- staging `/` が 200 を返す
- staging `/members` が 200 を返す
- production deploy 後も同様に 200
- local `pnpm dev` でも regression 無し（`PUBLIC_API_BASE_URL` 経由で API に到達）
- `wrangler tail` で `transport: 'service-binding'` の log が確認できる

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-003`
- 前提タスク: `task-05a-build-prerender-failure-001`
- 既存実装参照: `apps/web/src/lib/auth.ts` の `fetchSessionResolve` (service-binding pattern)

## 苦戦箇所【記入必須】

- 対象:
  - `apps/web/src/lib/fetch/public.ts`（service-binding + local HTTP fallback に書き換え済 — deploy 待ち）
  - `apps/web/wrangler.toml`（`[[env.staging.services]]` / `[[env.production.services]]` の `binding = "API_SERVICE"` 設定）
- 症状: 同一 Cloudflare account の workers.dev への loopback subrequest が 404 を返し、`fetchPublic` 経由の `/public/stats` `/public/members` が web 側 500 として表面化。直叩きでは API 200。`PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` を staging vars に追加しても解消せず
- 参照:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-003`
  - 前提タスク: `task-05a-build-prerender-failure-001`
  - GitHub Issue #387

## リスクと対策

| リスク | 対策 |
| --- | --- |
| service-binding が staging / production の `wrangler.toml` で未設定だとランタイムで `env.API_SERVICE` undefined | deploy 前に `[[env.<env>.services]]` の `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-<env>"` を grep 確認 |
| local dev で service-binding は使えないため fallback 漏れで `pnpm dev` が壊れる | `PUBLIC_API_BASE_URL` の HTTP fetch fallback を維持し、`env.API_SERVICE` 未注入時のみ HTTP 経路を選ぶ分岐を保つ |
| build-prerender-failure-001 未解消のため deploy できず verify がブロックされる | 前提タスク完了後に staging redeploy → evidence 取得の順で進める |
| service-binding 経由で request header / cookie 伝搬が崩れて auth 系で regression | `wrangler tail` で `transport: 'service-binding'` log を確認し、session-resolve（同じ pattern）と同一の header 構成にする |

## 検証方法

- 実行コマンド:
  - `mise exec -- pnpm --filter web typecheck`
  - `mise exec -- pnpm --filter web build:cloudflare`
  - `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/members`
  - `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging`（`transport: 'service-binding'` 確認）
- 期待結果:
  - staging `/` `/members` が 200
  - production deploy 後も 200
  - `wrangler tail` で `transport: 'service-binding'` log が確認できる
  - local `pnpm dev` で `PUBLIC_API_BASE_URL` 経由の HTTP fetch が成功
- 失敗時の切り分け:
  1. `env.API_SERVICE` undefined → `wrangler.toml` の services 設定と deploy 環境名を確認
  2. service-binding 経由でも 4xx/5xx → API 側 route ハンドラのログを `wrangler tail --env staging`（apps/api 側）で取得
  3. local fallback が壊れる → `.dev.vars` の `PUBLIC_API_BASE_URL` 設定と分岐ロジックを確認
