# Phase 6: 実装 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本 Phase は新規 GitHub Actions workflow YAML、TypeScript / shell スクリプト、Block Kit JSON テンプレ、evidence 書き出しユーティリティ、aiworkflow-requirements skill 正本ドキュメントへの追記を伴う。後続実装者がそのままコピー & 微調整できる粒度のコード骨格・関数シグネチャ・処理ロジック疑似コードを提示するため、CONST_004 に従い docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 6 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 5 ランブックで確定した実装ステップを、後続実装者（Claude Code or 人間）がそのままコード反映できるレベルの (a) 関数シグネチャ (b) 疑似コード or 実コード骨格 (c) commit 単位の依存順序 で確定する。実装本体の実行は Phase 8（テスト実行）/ Phase 11（runtime evidence 取得）で行うため、本 Phase ではコード骨格と編集対象 diff の確定のみを行い、実コード commit は実装サイクルで行う。

## 実装対象ファイル一覧（依存順）

| 順 | path | 種別 | 依存 | commit 単位 |
| --- | --- | --- | --- | --- |
| 1 | `scripts/notify/slack-incident-runbook.template.json` | 新規 | なし | C1: template 単独 |
| 2 | `scripts/notify/save-slack-evidence.ts` | 新規 | なし | C2: evidence ユーティリティ |
| 3 | `scripts/notify/slack-incident-runbook.ts` | 新規 | C1, C2 | C3: 配信スクリプト本体 |
| 4 | `scripts/notify/slack-incident-runbook.sh` | 新規 | C3 | C4: ラッパー |
| 5 | `.github/workflows/incident-runbook-slack-delivery.yml` | 新規 | C3, C4 | C5: workflow |
| 6 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | C5 | C6: secret 正本追記 |
| 7 | `.claude/skills/aiworkflow-requirements/indexes/` | 自動再生成 | C6 | C6 と同 commit（`pnpm indexes:rebuild` 結果） |

> 単体テストは Phase 7（`scripts/notify/__tests__/`）で別 commit 化する。

## C1: `scripts/notify/slack-incident-runbook.template.json`

Block Kit による message template。プレースホルダは `{{var}}` 形式。`renderTemplate` で置換する。

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "[{{mode}}] UBM兵庫 incident runbook — {{releaseVersion}}",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Release version*\n`{{releaseVersion}}`" },
        { "type": "mrkdwn", "text": "*Deployed at (UTC)*\n`{{deployedAt}}`" },
        { "type": "mrkdwn", "text": "*Oncall*\n{{oncallHandle}}" },
        { "type": "mrkdwn", "text": "*Mode*\n`{{mode}}`" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Runbook permalink (commit-pinned)*\n<{{runbookPermalink}}|incident-runbook.md @ {{commitSha}}>"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "owner: `{{runbookOwnerPath}}` / delivered by GitHub Actions `incident-runbook-slack-delivery.yml` / approval thread guidance: 返信は本 thread に。"
        }
      ]
    },
    { "type": "divider" }
  ]
}
```

プレースホルダ一覧: `mode` / `releaseVersion` / `deployedAt` / `oncallHandle` / `runbookPermalink` / `commitSha` / `runbookOwnerPath`。

## C2: `scripts/notify/save-slack-evidence.ts`

evidence JSON 書き出しユーティリティ。token 値は受け取らない設計（受け取るのは Slack API response のみ）。

```typescript
// scripts/notify/save-slack-evidence.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type SlackDeliveryEvidence = {
  ok: true;
  ts: string;            // Slack message ts
  channel: string;       // channel id
  permalink: string;     // chat.getPermalink result
  mode: "dryrun" | "production";
  releaseVersion: string;
  deployedAt: string;    // ISO8601
  commitSha: string;
  runbookPermalink: string;
  deliveredAt: string;   // ISO8601 (Date.now())
};

const FORBIDDEN = ["xox[b]-", "xox[p]-", "xapp-REDACTED-", "Bearer "];

export function assertNoToken(value: unknown): void {
  const s = JSON.stringify(value);
  for (const pat of FORBIDDEN) {
    if (s.includes(pat)) {
      throw new Error(`evidence contains forbidden token marker: ${pat}`);
    }
  }
}

export function saveEvidence(path: string, ev: SlackDeliveryEvidence): void {
  assertNoToken(ev);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(ev, null, 2) + "\n", { encoding: "utf-8" });
}
```

## C3: `scripts/notify/slack-incident-runbook.ts`

配信スクリプト本体。`@slack/web-api` の `WebClient` を使用。

### 主要関数シグネチャ

```typescript
import { WebClient, ErrorCode } from "@slack/web-api";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export type Mode = "dryrun" | "production";

export type CliArgs = {
  mode: Mode;
  releaseVersion: string;       // semver
  deployedAt: string;           // ISO8601
  runbookPath: string;          // 例: docs/30-workflows/.../incident-runbook.md
  oncallHandle: string;         // 例: @manju
  evidenceOut: string;          // 既定: docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-{mode}.json
  commitSha?: string;           // GitHub Actions では GITHUB_SHA
  repoSlug?: string;            // owner/repo
};

export type RuntimeEnv = {
  SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: string;     // 必須
  SLACK_INCIDENT_RUNBOOK_CHANNEL_ID?: string;   // production
  SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID?: string; // dryrun
  PRODUCTION_APPROVAL_TOKEN?: string;           // production gate marker
};

export function parseArgs(argv: string[]): CliArgs;            // --mode= 等を parse
export function loadEnv(env: NodeJS.ProcessEnv): RuntimeEnv;   // 必須キー欠落で throw
export function resolveChannelId(mode: Mode, env: RuntimeEnv): string;
export function loadRunbookPermalink(runbookPath: string): { url: string; commitSha: string };
export function renderTemplate(tplPath: string, vars: Record<string, string>): { blocks: unknown[] };
export async function postIncidentRunbook(client: WebClient, args: CliArgs, env: RuntimeEnv): Promise<void>;
```

### 処理ロジック疑似コード（main entry）

```typescript
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv(process.env);

  // production gate: production-slack-delivery environment 配下でのみ approval token が注入される
  if (args.mode === "production" && !env.PRODUCTION_APPROVAL_TOKEN) {
    throw new Error("production mode requires PRODUCTION_APPROVAL_TOKEN (GitHub Actions environment gate)");
  }

  const channel = resolveChannelId(args.mode, env);
  const { url: runbookPermalink, commitSha } = loadRunbookPermalink(args.runbookPath);

  const tpl = renderTemplate("scripts/notify/slack-incident-runbook.template.json", {
    mode: args.mode,
    releaseVersion: args.releaseVersion,
    deployedAt: args.deployedAt,
    oncallHandle: args.oncallHandle,
    runbookPermalink,
    commitSha,
    runbookOwnerPath: args.runbookPath,
  });

  const client = new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK, { retryConfig: { retries: 1 } });

  const post = await client.chat.postMessage({
    channel,
    blocks: tpl.blocks as never,
    text: `[${args.mode}] UBM兵庫 incident runbook — ${args.releaseVersion}`, // fallback
    unfurl_links: false,
  });
  if (!post.ok || !post.ts || !post.channel) {
    throw new Error(`chat.postMessage failed: ${post.error ?? "unknown"}`);
  }

  const perm = await client.chat.getPermalink({ channel: post.channel, message_ts: post.ts });
  if (!perm.ok || !perm.permalink) {
    throw new Error(`chat.getPermalink failed: ${perm.error ?? "unknown"}`);
  }

  saveEvidence(args.evidenceOut, {
    ok: true,
    ts: post.ts,
    channel: post.channel,
    message: { permalink: perm.permalink },
    mode: args.mode,
    releaseVersion: args.releaseVersion,
    deployedAt: args.deployedAt,
    commitSha,
    runbookPermalink,
    deliveredAt: new Date().toISOString(),
  });
}

main().catch((e) => {
  // token 値を含めない: e.message を redact
  const msg = String(e?.message ?? e).replace(/xox[bpa]-[A-Za-z0-9-]+/g, "***REDACTED***");
  process.stderr.write(`[slack-incident-runbook] ${msg}\n`);
  process.exit(1);
});
```

### `loadRunbookPermalink` 詳細

```typescript
export function loadRunbookPermalink(runbookPath: string): { url: string; commitSha: string } {
  const sha = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  const repo = process.env.GITHUB_REPOSITORY ?? "daishiman/UBM-Hyogo";
  const url = `https://github.com/${repo}/blob/${sha}/${runbookPath}`;
  return { url, commitSha: sha };
}
```

### `resolveChannelId` 詳細

```typescript
export function resolveChannelId(mode: Mode, env: RuntimeEnv): string {
  const id = mode === "production"
    ? env.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID
    : env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID;
  if (!id || id.trim() === "") {
    throw new Error(`channel id missing for mode=${mode}`);
  }
  if (mode === "production" && id === env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID) {
    throw new Error("production channel id must differ from dryrun channel id");
  }
  return id;
}
```

### `renderTemplate` 詳細

```typescript
export function renderTemplate(tplPath: string, vars: Record<string, string>): { blocks: unknown[] } {
  let raw = readFileSync(tplPath, "utf-8");
  for (const [k, v] of Object.entries(vars)) {
    raw = raw.replaceAll(`{{${k}}}`, v);
  }
  if (/\{\{[a-zA-Z]+\}\}/.test(raw)) {
    throw new Error("template still contains unresolved placeholder");
  }
  return JSON.parse(raw) as { blocks: unknown[] };
}
```

## C4: `scripts/notify/slack-incident-runbook.sh`

ローカル / 手動経路用のラッパー。`scripts/with-env.sh` 経由で 1Password から `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` を揮発注入する。

```bash
#!/usr/bin/env bash
set -euo pipefail
# Usage:
#   bash scripts/notify/slack-incident-runbook.sh \
#     --mode=dryrun \
#     --release-version=v0.0.0-test \
#     --deployed-at="$(date -u +%FT%TZ)" \
#     --runbook-path=docs/30-workflows/.../incident-runbook.md \
#     --oncall-handle=@manju
exec mise exec -- ./scripts/with-env.sh -- tsx scripts/notify/slack-incident-runbook.ts "$@"
```

`with-env.sh` 側で `op run --env-file=.env -- "$@"` が走り、`.env` の `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK=op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` 等が解決される。

## C5: `.github/workflows/incident-runbook-slack-delivery.yml`

```yaml
name: incident-runbook-slack-delivery

on:
  workflow_dispatch:
    inputs:
      mode:
        description: dryrun or production
        type: choice
        required: true
        default: dryrun
        options: [dryrun, production]
      release_version:
        description: semver (例 v1.2.3)
        type: string
        required: true
      deployed_at:
        description: ISO8601 UTC (例 2026-05-06T10:00:00Z)
        type: string
        required: true
      runbook_path:
        description: 'docs/30-workflows/.../incident-runbook.md'
        type: string
        required: true
      oncall_handle:
        description: '@username'
        type: string
        required: true
  workflow_run:
    workflows: ["backend-ci", "web-cd"]
    types: [completed]

permissions:
  contents: read

concurrency:
  group: incident-runbook-slack-delivery-${{ github.event_name == 'workflow_dispatch' && github.event.inputs.mode || 'auto-dryrun' }}
  cancel-in-progress: false

jobs:
  derive-context:
    runs-on: ubuntu-latest
    outputs:
      mode: ${{ steps.ctx.outputs.mode }}
      release_version: ${{ steps.ctx.outputs.release_version }}
      deployed_at: ${{ steps.ctx.outputs.deployed_at }}
      runbook_path: ${{ steps.ctx.outputs.runbook_path }}
      oncall_handle: ${{ steps.ctx.outputs.oncall_handle }}
    steps:
      - id: ctx
        run: |
          if [ "${{ github.event_name }}" = "workflow_run" ]; then
            echo "mode=dryrun" >> "$GITHUB_OUTPUT"
            echo "release_version=auto-${{ github.event.workflow_run.head_sha }}" >> "$GITHUB_OUTPUT"
            echo "deployed_at=${{ github.event.workflow_run.updated_at }}" >> "$GITHUB_OUTPUT"
            echo "runbook_path=docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/share-evidence.md" >> "$GITHUB_OUTPUT"
            echo "oncall_handle=@release-oncall" >> "$GITHUB_OUTPUT"
          else
            echo "mode=${{ github.event.inputs.mode }}" >> "$GITHUB_OUTPUT"
            echo "release_version=${{ github.event.inputs.release_version }}" >> "$GITHUB_OUTPUT"
            echo "deployed_at=${{ github.event.inputs.deployed_at }}" >> "$GITHUB_OUTPUT"
            echo "runbook_path=${{ github.event.inputs.runbook_path }}" >> "$GITHUB_OUTPUT"
            echo "oncall_handle=${{ github.event.inputs.oncall_handle }}" >> "$GITHUB_OUTPUT"
          fi

  deliver:
    needs: derive-context
    runs-on: ubuntu-latest
    # production mode は environment gate 経由で approval を要求
    environment: ${{ needs.derive-context.outputs.mode == 'production' && 'production-slack-delivery' || '' }}
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
        with:
          version: 2025.10.0
      - name: install deps
        run: pnpm install --frozen-lockfile
      - name: deliver
        env:
          SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: ${{ secrets.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK }}
          SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: ${{ vars.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID }}
          SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: ${{ vars.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID }}
          PRODUCTION_APPROVAL_TOKEN: ${{ needs.derive-context.outputs.mode == 'production' && github.run_id || '' }}
        run: |
          tsx scripts/notify/slack-incident-runbook.ts \
            --mode='${{ needs.derive-context.outputs.mode }}' \
            --release-version='${{ needs.derive-context.outputs.release_version }}' \
            --deployed-at='${{ needs.derive-context.outputs.deployed_at }}' \
            --runbook-path='${{ needs.derive-context.outputs.runbook_path }}' \
            --oncall-handle='${{ needs.derive-context.outputs.oncall_handle }}' \
            --commit-sha='${{ github.sha }}' \
            --repo-slug='${{ github.repository }}' \
            --evidence-dir='docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence'
      - name: upload evidence
        uses: actions/upload-artifact@v4
        with:
          name: slack-delivery-evidence-${{ needs.derive-context.outputs.mode }}
          path: docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/*
          if-no-files-found: error
```

設計要点:

- production 配信は `environment: production-slack-delivery` の reviewer 承認なしには job が走らない（FR-03 / AC-02）
- token は `secrets.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` のみ使用、log マスクは GitHub Actions が自動付与
- channel id は GitHub Variables（公開可）として `vars.*` から取得

## C6: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 追記

末尾に以下のセクションを追加する（diff レベル）。

```diff
+## Slack incident runbook delivery secrets
+
+| 名称 | 種別 | 配置先 | 1Password 正本 | 用途 |
+| --- | --- | --- | --- | --- |
+| SLACK_BOT_TOKEN_INCIDENT_RUNBOOK | secret | GitHub Secrets / `.env` (op 参照) | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` | `chat.postMessage` / `chat.getPermalink` 認証 |
+| SLACK_INCIDENT_RUNBOOK_CHANNEL_ID | non-secret | GitHub Variables | n/a | `#ubm-hyogo-incident-runbook` の channel id |
+| SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID | non-secret | GitHub Variables | n/a | `#ubm-hyogo-incident-runbook-dryrun` の channel id |
+
+- production 配信は GitHub Actions environment `production-slack-delivery` の approval を強制
+- token 値はログ・evidence・PR diff に書かない（CONST-RUN-01）
+- 詳細運用: `docs/30-workflows/09c-incident-runbook-slack-delivery/`
```

追記後、`mise exec -- pnpm indexes:rebuild` を実行し `.claude/skills/aiworkflow-requirements/indexes/` の差分を同 commit に含める（NFR-05）。

## commit 戦略

| commit | message 例 |
| --- | --- |
| C1 | `feat(notify): add Slack incident runbook Block Kit template` |
| C2 | `feat(notify): add slack evidence writer with token-leak guard` |
| C3 | `feat(notify): add slack-incident-runbook.ts with channel/permalink resolver` |
| C4 | `feat(notify): add op-aware shell wrapper for slack-incident-runbook` |
| C5 | `ci: add incident-runbook-slack-delivery workflow with prod env gate` |
| C6 | `docs(aiworkflow): canonicalize SLACK_BOT_TOKEN_INCIDENT_RUNBOOK + indexes` |

## 多角的チェック観点

- 関数シグネチャがすべて型注釈付きで提示されている
- production / dryrun の channel 分離が `resolveChannelId` のみで完結する
- token 文字列が evidence / log / Error message に出ない経路が全行程で保証されている
- workflow YAML の `environment` 指定が dryrun では空文字（gate なし）、production では `production-slack-delivery` 固定
- aiworkflow-requirements indexes の再生成が C6 と同 commit である

## Definition of Done（Phase 6）

- [ ] C1〜C6 のコード骨格・diff が本ファイルに記載されている
- [ ] 各関数のシグネチャと処理ロジック疑似コードが揃っている
- [ ] commit 単位と依存順序が明示されている
- [ ] `outputs/phase-06/main.md` に要点サマリが保存されている
- [ ] CONST_007 の「先送り」表現を含まない

## 参照

- phase-01.md / phase-05.md
- `scripts/with-env.sh`（既存ラッパー）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `@slack/web-api` 公式 README

## 次 Phase への引き渡し

Phase 7 へ:

- `postIncidentRunbook` / `renderTemplate` / `resolveChannelId` / `loadRunbookPermalink` / `saveEvidence` の各関数に対する unit test 設計
- `WebClient` モック方針（`vi.mock("@slack/web-api")`）
- token leak assertion の必須化
