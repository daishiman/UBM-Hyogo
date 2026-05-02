# manual-smoke-log.md — staging UI smoke 実行ログ

| 項目 | 値 |
| --- | --- |
| 実行日時 | 2026-05-02 |
| 実行者 | Claude Code (automated) |
| 実行結果 | BLOCKED |
| 実行可否判定 | 実行不能 (Cloudflare 認証情報未注入) |

## 実行ステップ実測

### Step 1: secret 存在確認

```
$ bash scripts/cf.sh whoami
⛅️ wrangler 4.85.0
Getting User settings...
You are not authenticated. Please run `wrangler login`.
```

→ `CLOUDFLARE_API_TOKEN` が `op run --env-file=.env` 経由で注入されていない。
詳細は `wrangler-tail.log` 参照。

### Step 2: UI smoke (Playwright staging profile)

実行不能。staging deploy 不可のため staging 公開 URL を確定できず、
`apps/web/playwright.config.ts` の `staging` profile 起動条件を満たさない。

| 検証対象画面 | URL (target) | 取得状態 |
| --- | --- | --- |
| 公開ランディング `/` | https://staging.example/ | NOT_CAPTURED — staging URL 未確定 |
| 公開ディレクトリ `/members` | https://staging.example/members | NOT_CAPTURED |
| 公開詳細 `/members/[id]` | https://staging.example/members/{seed} | NOT_CAPTURED |
| ログイン `/login` (Magic Link) | https://staging.example/login | NOT_CAPTURED |
| ログイン (Google OAuth) | https://staging.example/login | NOT_CAPTURED |
| プロフィール `/profile` (logged-in) | https://staging.example/profile | NOT_CAPTURED |
| 管理 `/admin` (admin) | https://staging.example/admin | NOT_CAPTURED |
| 管理 `/admin/members` | https://staging.example/admin/members | NOT_CAPTURED |
| 認可境界: 一般 user で /admin → 403/redirect | (above) | NOT_CAPTURED |

### Step 3: Forms sync (schema / responses)

実行不能。`apps/api` staging endpoint へ届かないため
`POST /admin/sync/schema` / `POST /admin/sync/responses` を staging 経路で叩けない。
詳細は `sync-jobs-staging.json` 参照。

### Step 4: wrangler tail 30 分相当

実行不能。`wrangler-tail.log` 冒頭に取得不能理由を記録済み。

## 判定

- AC-1: FAIL — placeholder 置換対象 (09a 配下) が当該 worktree に存在せず、置換も実測 evidence も成立せず
- AC-2: FAIL — Playwright report / screenshot 未取得
- AC-3: FAIL — Forms sync staging 実行未成立
- AC-4: FAIL — wrangler tail 未取得（取得不能理由は記録済み）
- AC-5: 部分対応 — 本タスク `artifacts.json` Phase 11 status は `blocked` に更新する。09a parity は target 不在のため対象外
- AC-6: 部分対応 — 09c blocker は実測 PASS が出ない以上 GO に上げない（現状維持）

## 09c blocker 影響

`task-workflow-active.md` 上の 09c は「09a staging green と 09b release runbook 引き渡し」を
gate としており、本タスクで実測 PASS が出ない限り 09c は引き続き blocked。
PASS が必要な場合は user による Cloudflare 認証復旧後に本タスクを再実行する。
