# Phase 6 サマリ — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

## 確定事項

- 実装対象 6 ファイル（C1〜C6）と依存順 + commit 戦略を確定
- C1: Block Kit JSON template（プレースホルダ 7 種 `mode` / `releaseVersion` / `deployedAt` / `oncallHandle` / `runbookPermalink` / `commitSha` / `runbookOwnerPath`）
- C2: `save-slack-evidence.ts`（`assertNoToken` で xox[b]-/xox[p]-/xapp-REDACTED-/Bearer マスク検証）
- C3: `slack-incident-runbook.ts` — 主要関数 `parseArgs` / `loadEnv` / `resolveChannelId` / `loadRunbookPermalink` / `renderTemplate` / `postIncidentRunbook` のシグネチャと疑似コード
- C4: `slack-incident-runbook.sh`（`scripts/with-env.sh` 経由 op + tsx ラッパー）
- C5: `incident-runbook-slack-delivery.yml`（`workflow_dispatch` + `workflow_run`、production mode で `environment: production-slack-delivery` gate）
- C6: `deployment-secrets-management.md` 末尾に Slack secret 表追記 + `pnpm indexes:rebuild`

## 主要設計判断

- token 値は `WebClient` コンストラクタにのみ渡す。Error message は `xox[bpa]-...` を `***REDACTED***` で置換
- channel 分離は `resolveChannelId` で production==dryrun 同値を throw
- runbook permalink は `git rev-parse HEAD` の commit SHA で pin
- production gate は `PRODUCTION_APPROVAL_TOKEN` 環境変数で fail-fast（GitHub Actions environment 経由でのみ注入）

## Phase 7 へ引き渡し

各関数のシグネチャと疑似コードを単体テスト T1〜T15 にマップ。`vi.mock("@slack/web-api")` による WebClient モックを必須化。

## 実コード実装完了 (2026-05-06)

C1〜C6 は実コードベースに反映済:

| commit unit | path | 状態 |
| --- | --- | --- |
| C1 | `scripts/notify/slack-incident-runbook.template.json` | 配置済 |
| C2 | `scripts/notify/save-slack-evidence.ts` | 配置済 (`assertNoToken` / `saveEvidence`) |
| C3 | `scripts/notify/slack-incident-runbook.ts` | 配置済（`parseArgs` / `loadEnv` / `resolveChannelId` / `loadRunbookPermalink` / `renderTemplate` / `postIncidentRunbook` を export） |
| C4 | `scripts/notify/slack-incident-runbook.sh` | 配置済（`scripts/with-env.sh` 経由 `op run` ラップ） |
| C5 | `.github/workflows/incident-runbook-slack-delivery.yml` | 配置済（production mode は environment `production-slack-delivery` gate） |
| C6 | `references/deployment-secrets-management.md` の Slack secret 表 | 既に追記済（事前 commit）/ aiworkflow indexes 再生成済 |

加えて `package.json` の dependencies に `@slack/web-api ^7.10.0` を追加し、`pnpm install` で `pnpm-lock.yaml` を更新済。

