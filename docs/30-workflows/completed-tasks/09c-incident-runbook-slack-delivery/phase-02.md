# Phase 2: 設計 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 1 で確定した FR/NFR/AC を満たすため、(a) 配信経路アーキテクチャ、(b) Slack `chat.postMessage` 呼び出し契約、(c) Block Kit メッセージ JSON 構造、(d) 関数シグネチャと型、(e) evidence 永続化スキーマ、(f) エラーハンドリング、(g) 変更対象ファイル一覧 を確定する。`@slack/web-api` 依存追加、TypeScript スクリプト新規実装、GitHub Actions workflow 新規追加、外部 API 副作用（Slack `chat.postMessage`）が発生するため CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 2 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「Slack bot による incident runbook 自動配信＋ evidence 永続化」を、Phase 5 ランブックと Phase 6 実装がそのまま追従できる粒度（コード上の関数シグネチャ・型・JSON schema・YAML workflow 構造）に落とす。

## 配信経路の決定

| 候補 | 採否 | 理由 |
| --- | --- | --- |
| GitHub Actions `workflow_dispatch` + `workflow_run`（09c production deploy 完了 trigger） | **採用** | (1) 09c production deploy 自体が GitHub Actions で完了するため hook が同一 plane に閉じる、(2) 短時間処理（<10s）で Cron 不要、(3) `environment` による manual approval が標準機能で得られる、(4) `GITHUB_TOKEN` / `GITHUB_SHA` が natively 取れて permalink pinning が容易 |
| Cloudflare Workers Cron Trigger | 不採用 | deploy 完了 hook が Actions 側にしか存在しない。Cron は時間ベースで「deploy 直後」を捕捉できない。Workers Secrets 追加管理コストもかかる |
| 外部 incident bot SaaS | 不採用 | コストとベンダーロックイン、CONST_004（自前運用優先）と非整合 |

採用経路は **GitHub Actions 単独**。Cloudflare Workers / D1 への副作用なし。

## アーキテクチャ図

```
[09c production deploy succeeded]
        │ (workflow_run: completed=success)
        ▼
┌──────────────────────────────────────────────────────────┐
│ .github/workflows/incident-runbook-slack-delivery.yml    │
│                                                          │
│  job: dryrun (env: production-slack-delivery-dryrun)     │
│   ├ checkout (fetch-depth: 0)                            │
│   ├ setup-node (24) + pnpm install                       │
│   ├ resolve secrets (GitHub Secrets → process.env)       │
│   ├ tsx scripts/notify/slack-incident-runbook.ts         │
│   │     --mode dryrun                                    │
│   │     --release-version $RELEASE                       │
│   │     --deployed-at    $DEPLOYED_AT                    │
│   │     --runbook-path   docs/30-workflows/02-...        │
│   │     --oncall-handle  @ubm-hyogo-oncall               │
│   ├ verify message timestamp present                     │
│   └ upload-artifact: outputs/phase-11/evidence/*.json    │
│                                                          │
│  job: production (needs: dryrun, env: production-slack-  │
│                   delivery, manual approval required)    │
│   └ same script with --mode production                   │
└──────────────────────────────────────────────────────────┘
        │
        ▼
   Slack Web API (chat.postMessage / chat.getPermalink)
        │
        ▼
   outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json
```

ローカル / 手動実行経路は `bash scripts/with-env.sh tsx scripts/notify/slack-incident-runbook.ts --mode dryrun ...` を併存させる（Phase 5 ランブックで詳細化）。

## 配信モード切替の決定ロジック

```
mode = argv("--mode")        # "dryrun" | "production"
if (mode !== "dryrun" && mode !== "production")
  exit 2  // fail-fast: 不正値は production への漏出を防ぐため reject

channelId = mode === "dryrun"
  ? env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID
  : env.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID

assert(channelId.startsWith("C"))   // channel id は "C..." 形式 (Slack 仕様)
assert(channelId !== undefined && channelId.length >= 9)
```

production 直行経路を作らないため `if (mode === "production") return env.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` という単純条件は使わず、明示的な `mode` の switch を最上位に置く。テストで両 channel id が独立変数経由であることを assert する（誤配信ガード）。

## Block Kit メッセージ構造

`scripts/notify/slack-incident-runbook.template.json` に以下を保存する（template 変数は `{{...}}` 形式、render 時に置換）。

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "UBM Hyogo: Production release {{releaseVersion}} deployed", "emoji": true }
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "*Mode*: `{{mode}}`" },
        { "type": "mrkdwn", "text": "*Deployed at*: `{{deployedAt}}`" },
        { "type": "mrkdwn", "text": "*Oncall*: {{oncallHandle}}" }
      ]
    },
    { "type": "divider" },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":rotating_light: *Incident response runbook* :rotating_light:\nIf you observe degraded health checks, p95 spike, or D1 errors, follow the runbook below."
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Open runbook (commit-pinned)" },
          "url": "{{runbookPermalink}}",
          "style": "primary"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Open release in GitHub" },
          "url": "{{releaseUrl}}"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "Source: `{{runbookPath}}` @ `{{commitSha}}` · Owner: `docs/30-workflows/02-application-implementation/09b-...`" }
      ]
    }
  ]
}
```

dryrun モードでは `header.text` と `context` 1 要素目に `[DRYRUN]` プレフィックスを付与してオペレーターが視覚で識別できるようにする。

## 関数シグネチャ

`scripts/notify/slack-incident-runbook.ts`:

```ts
import type { KnownBlock } from "@slack/web-api";

export type DeliveryMode = "dryrun" | "production";

export interface PostIncidentRunbookOptions {
  mode: DeliveryMode;
  releaseVersion: string;     // semver, e.g. "v1.4.2"
  deployedAt: string;         // ISO8601 UTC
  runbookPath: string;        // repo-relative path
  oncallHandle: string;       // "@ubm-hyogo-oncall" or user/group mention
  commitSha?: string;         // optional override; defaults to git rev-parse HEAD
  repoSlug?: string;          // "daishiman/UBM-Hyogo" (defaults from env)
}

export interface SlackPostResult {
  ok: true;
  mode: DeliveryMode;
  channel: string;            // channel id (C...)
  ts: string;                 // message timestamp "1714960000.000100"
  permalink: string;          // chat.getPermalink result
  postedAt: string;           // ISO8601 UTC client-side
  releaseVersion: string;
  commitSha: string;
  runbookPermalink: string;
}

export async function postIncidentRunbook(
  opts: PostIncidentRunbookOptions
): Promise<SlackPostResult>;

export function renderTemplate(opts: {
  mode: DeliveryMode;
  releaseVersion: string;
  deployedAt: string;
  runbookPath: string;
  runbookPermalink: string;
  releaseUrl: string;
  oncallHandle: string;
  commitSha: string;
}): KnownBlock[];

export function buildRunbookPermalink(opts: {
  repoSlug: string;
  commitSha: string;
  runbookPath: string;
}): string;   // returns https://github.com/{repoSlug}/blob/{commitSha}/{runbookPath}
```

`scripts/notify/save-slack-evidence.ts`:

```ts
export function saveEvidence(
  result: SlackPostResult,
  outputDir: string         // 既定: docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence
): { evidencePath: string; bytes: number };
```

evidence ファイル名規則: `slack-delivery-${mode}.json`。同一モードで複数回 post する場合は既存ファイルを overwrite し、過去分は git history で参照する（NFR-03: 10 KB 以下を維持）。

## evidence JSON schema

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "ok": true,
  "mode": "dryrun",
  "channel": "C0123456789",
  "ts": "1714960000.000100",
  "message": {
    "permalink": "https://ubm-hyogo.slack.com/archives/C.../p1714960000000100"
  },
  "postedAt": "2026-05-06T01:23:45.000Z",
  "releaseVersion": "v1.4.2",
  "commitSha": "0123456789abcdef0123456789abcdef01234567",
  "runbookPermalink": "https://github.com/daishiman/UBM-Hyogo/blob/0123.../docs/30-workflows/02-application-implementation/09b-.../incident-runbook.md"
}
```

required: `ok`, `mode`, `channel`, `ts`, `message.permalink`, `postedAt`, `releaseVersion`, `commitSha`, `runbookPermalink`。Phase 4 で同 schema を unit test の expected として使う。

## runbook permalink 生成

```ts
const commitSha = opts.commitSha ?? execSync("git rev-parse HEAD").toString().trim();
const repoSlug  = opts.repoSlug  ?? process.env.GITHUB_REPOSITORY ?? "daishiman/UBM-Hyogo";
const runbookPermalink = `https://github.com/${repoSlug}/blob/${commitSha}/${opts.runbookPath}`;
```

main 移動で URL が腐らないよう必ず commit SHA で pin する。GitHub Actions 上では `${{ github.sha }}` を `--commit-sha` 引数で渡す。

## 環境変数 / secret 解決

| 名前 | 種別 | 必須 | 解決経路 |
| --- | --- | --- | --- |
| `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | secret (xox[b]-...) | YES | GitHub Secrets / 1Password (`op://UBM-Hyogo/Slack Bot - Incident Runbook/credential`) |
| `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | variable (C...) | YES（mode=production 時） | GitHub Variables |
| `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | variable (C...) | YES（mode=dryrun 時） | GitHub Variables |
| `GITHUB_REPOSITORY` | metadata | NO（default あり） | GitHub Actions / `gh repo view --json nameWithOwner` |
| `GITHUB_SHA` | metadata | NO（fallback: `git rev-parse HEAD`） | GitHub Actions |

ローカル実行時は `scripts/with-env.sh` が `op run --env-file=.env` で 1Password から token を揮発的に注入。`.env` には `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK="op://UBM-Hyogo/Slack Bot - Incident Runbook/credential"` の **参照のみ** を記載する。

## 変更対象ファイル一覧

| # | パス | 変更種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `.github/workflows/incident-runbook-slack-delivery.yml` | 新規 | dryrun / production ジョブ。`workflow_run` + `workflow_dispatch` |
| 2 | `scripts/notify/slack-incident-runbook.ts` | 新規 | エントリーポイント。`postIncidentRunbook` を呼ぶ CLI |
| 3 | `scripts/notify/render-template.ts` | 新規 | `renderTemplate` / `buildRunbookPermalink` を export |
| 4 | `scripts/notify/save-slack-evidence.ts` | 新規 | evidence JSON 永続化 |
| 5 | `scripts/notify/slack-incident-runbook.template.json` | 新規 | Block Kit template |
| 6 | `scripts/notify/slack-incident-runbook.sh` | 新規 | `with-env.sh` 経由のローカル実行ラッパー |
| 7 | `scripts/notify/__tests__/slack-incident-runbook.test.ts` | 新規 | unit test（Phase 4 で詳細化） |
| 8 | `package.json`（root or `scripts/` workspace） | 編集 | `@slack/web-api` 依存追加、`tsx` devDep 確認 |
| 9 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | Slack secret 名追記（Phase 12 で実施） |
| 10 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md` | 編集 | share-evidence placeholder を本タスク evidence への参照に置換（Phase 12 で実施） |

## 入出力データ構造（CLI）

```
Usage:
  tsx scripts/notify/slack-incident-runbook.ts \
    --mode <dryrun|production> \
    --release-version <semver> \
    --deployed-at <ISO8601> \
    --runbook-path <repo-relative path> \
    --oncall-handle <@handle> \
    [--commit-sha <sha>] [--repo-slug <owner/repo>] \
    [--evidence-dir <path>]

Exit codes:
  0  success (evidence written)
  1  Slack API error (4xx/5xx)
  2  invalid arguments / missing env
  3  filesystem error (evidence write failed)
```

stdout には evidence JSON を **redacted** (token は含めない / token はそもそも response に含まれない) で出力。stderr にはエラーのみ。

## エラーハンドリング

| 事象 | 検知 | 対応 |
| --- | --- | --- |
| token 不在 (`SLACK_BOT_TOKEN_*` 未設定) | startup check | exit 2、stderr に `missing env: SLACK_BOT_TOKEN_INCIDENT_RUNBOOK`。値は出さない |
| channel id 不在 / 形式不正 | startup check (`/^C[A-Z0-9]{8,}$/`) | exit 2、対応する env 変数名のみ出力 |
| Slack API `channel_not_found` | `WebAPICallError.code` | exit 1。channel id を redacted で出力 (`C***`)。token は決して出さない |
| Slack API `not_in_channel` | 同上 | exit 1。bot 招待手順を Phase 5 ランブックに参照させる stderr メッセージ |
| Slack API rate limited (429) | `error: ratelimited` | exit 1。`Retry-After` を尊重するが本スクリプトは 1-shot で再試行しない（Actions 側の rerun に委譲） |
| network error / fetch timeout | `WebClient` の `retryConfig` で 3 回まで指数 backoff | 3 回失敗で exit 1 |
| `chat.getPermalink` 失敗 | response.ok=false | warning stderr、evidence に `permalink: null` で書き出し、exit 0（投稿自体は成功しているため runtime evidence は残す）|
| evidence 書き込み失敗 | `fs.writeFileSync` throw | exit 3 |
| 不正 mode 引数 | argv parser | exit 2 |

`@slack/web-api` の `WebAPICallError` を catch して `error.data` をそのまま log すると **token を含む可能性がある fetch metadata** が漏れるため、`{ code, data: { error, response_metadata } }` のみを redact 後 log する。

## ログマスキング

`scripts/notify/slack-incident-runbook.ts` の冒頭で以下を実装:

```ts
const TOKEN_PATTERN = /xox[baprs]-[A-Za-z0-9-]+/g;
const origConsole = { log: console.log, error: console.error };
function masked(s: string): string { return s.replace(TOKEN_PATTERN, "xox*-***"); }
console.log  = (...a) => origConsole.log(...a.map(x => typeof x === "string" ? masked(x) : x));
console.error = (...a) => origConsole.error(...a.map(x => typeof x === "string" ? masked(x) : x));
```

evidence file 書き込み時も同 pattern で post-process し、誤注入を二重防止する。

## セキュリティ

- token は `WebClient(token)` constructor 引数として渡し、log / evidence に含めない
- evidence JSON には bot user id / token を含めない（`response.message.bot_id` は許容、`bot_access_token` は出力対象外）
- GitHub Actions 上では `secrets.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` を `env:` 経由で渡し、`echo` 等で印字しない（`::add-mask::` を最初の step で付与）
- production channel への post は GitHub Actions environment `production-slack-delivery` の reviewer approval 必須（CODEOWNERS との関係は Phase 3 で確認）
- bot の OAuth scopes は `chat:write`, `chat:write.public`（join せず post 可能とする場合）, `links:read`（permalink 取得用）に限定。`channels:read` 等の不要 scope は付与しない

## Rollback / 失敗時の手当て

| 事象 | 対応 |
| --- | --- |
| 誤って production channel に post された | Slack 側で `chat.delete` を手動実行（bot は自分の post に対して可能）。再発防止として channel id env 変数の値を一度クリアし、Phase 5 で再登録 |
| token が漏洩した可能性 | 1Password で rotate → Slack admin で旧 token revoke → GitHub Secrets 更新 → 該当 PR / コミットを `git filter-repo` で除去するかどうかは leak 範囲評価後に決定 |
| workflow が production に直接出ようとした | `needs: dryrun` と `environment: production-slack-delivery` の二重 gate で構造的に阻止。assert 失敗時は exit 2 で fail |

## 参照資料

- `phase-01.md`（FR/NFR/AC/制約）
- `index.md`（channel naming / scope）
- `artifacts.json`（secret 名・channel 名の正本）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md`（フォーマット参照元）
- Slack API: `chat.postMessage` / `chat.getPermalink` / Block Kit reference
- `scripts/with-env.sh`（既存 op ラッパー）

## 多角的チェック観点

- 配信経路が単一（GitHub Actions のみ）で複線化していない
- secret は env 注入のみで、コード/ログ/evidence に値が出ない
- dryrun / production の channel id 解決が独立変数経由で誤配信ガードされている
- runbook permalink が commit SHA pin され、main 移動で腐らない
- evidence schema が Phase 4 unit test の expected として再利用可能
- approval gate が GitHub Actions environment で構造的に強制されている

## サブタスク管理

- [ ] アーキテクチャ図確定
- [ ] 関数シグネチャ確定
- [ ] Block Kit template JSON 確定
- [ ] evidence schema 確定
- [ ] エラーハンドリング表確定
- [ ] `outputs/phase-02/main.md` 作成

## 成果物

- `outputs/phase-02/main.md`

## Definition of Done（Phase 2）

- [ ] 配信経路が GitHub Actions 単独として確定し、Cron 不採用の理由が記載されている
- [ ] dryrun / production 切替の関数ロジックがコードレベルで記述されている
- [ ] Block Kit template JSON が完全な形で本ファイルに記載されている
- [ ] `postIncidentRunbook` / `renderTemplate` / `saveEvidence` / `buildRunbookPermalink` の TypeScript シグネチャが確定している
- [ ] evidence JSON schema が Phase 4 unit test に再利用可能な形で記載されている
- [ ] 変更対象ファイル一覧が新規 / 編集を区別して列挙されている
- [ ] エラーハンドリング表が exit code レベルで網羅されている
- [ ] log / evidence への token 漏出を防ぐ二重マスク戦略が明記されている
- [ ] `outputs/phase-02/main.md` にサマリが保存されている

## 次 Phase への引き渡し

Phase 3 へ:
- 採用アーキテクチャ（GitHub Actions 単独）と不採用候補（Cron / SaaS）の根拠
- 設計上のリスク候補: secret 漏洩 / 誤配信 / permalink 腐敗 / approval bypass / mask 漏れ / scope 過剰付与
- セキュリティレビュー観点: token redaction、log マスキング、environment gate、scope minimization
