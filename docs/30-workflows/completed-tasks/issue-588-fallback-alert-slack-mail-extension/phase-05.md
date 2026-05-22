# Phase 5: 実装契約

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | 編集 | dispatcher / redaction / evaluateAndAlert 拡張 |
| `scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` | 編集 | TC-01〜TC-12 追加 |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 | env に SLACK_WEBHOOK_INCIDENT / EMAIL_WEBHOOK_URL / EMAIL_FROM / EMAIL_TO 追加 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | fallback alert 通知系セクションに Slack/mail 経路と env 設定方法を追記 |

## 1. `fallback-rate-alert.ts` 差分方針

既存コード（193行）を**保持**したまま、以下を追加・拡張する。

### 1-1. `redactForNotification` 追加（新規 export）

```ts
export function redactForNotification(text: string): string {
  return text
    .replace(/[A-Fa-f0-9]{32,}/g, "[REDACTED:hash]")
    .replace(/userId=[^\s,]+/g, "userId=[REDACTED]")
    .replace(/tenantId=[^\s,]+/g, "tenantId=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]")
    .replace(/https?:\/\/hooks\.slack\.com\/[^\s]+/g, "[REDACTED:slack-webhook]");
}
```

### 1-2. `buildNotificationPayload` 追加

```ts
export interface NotificationPayload {
  title: string;
  text: string;
}

export function buildNotificationPayload(
  evaluation: AlertEvaluation,
  threshold: number,
  window: number,
): NotificationPayload {
  const title = `[cf-audit] fallback rate > ${threshold} for ${window}h`;
  const fullBody = buildIssueBody(evaluation);
  return { title, text: redactForNotification(`${title}\n\n${fullBody}`) };
}
```

### 1-3. `dispatchSlack` / `dispatchMail` 追加

```ts
export interface SlackDispatcher {
  (params: { url: string; payload: NotificationPayload }): Promise<void>;
}

export const defaultSlackDispatcher: SlackDispatcher = async ({ url, payload }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: payload.text }),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook ${response.status}`);
  }
};

export interface MailDispatcher {
  (params: {
    url: string;
    payload: NotificationPayload;
    from: string;
    to: string;
  }): Promise<void>;
}

export const defaultMailDispatcher: MailDispatcher = async ({ url, payload, from, to }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subject: payload.title,
      body: payload.text,
      from,
      to,
    }),
  });
  if (!response.ok) {
    throw new Error(`Mail webhook ${response.status}`);
  }
};
```

### 1-4. `evaluateAndAlert` 拡張

既存の `if (!evaluation.triggered || opts.dryRun) return { evaluation };` 早期 return より前にdry-run 時の payload 観測ログを追加し、Issue 起票後に Slack / mail dispatcher を try/catch で順次呼ぶ。

```ts
export async function evaluateAndAlert(opts: {
  snapshots: HourlySnapshot[];
  window: number;
  threshold: number;
  dryRun: boolean;
  repo?: string;
  token?: string;
  createIssue?: IssueCreator;
  slackWebhookUrl?: string;
  emailWebhookUrl?: string;
  emailFrom?: string;
  emailTo?: string;
  dispatchSlack?: SlackDispatcher;
  dispatchMail?: MailDispatcher;
}): Promise<{
  evaluation: AlertEvaluation;
  issueUrl?: string;
  slackDelivered?: boolean;
  slackError?: string;
  mailDelivered?: boolean;
  mailError?: string;
}> {
  const evaluation = evaluateConsecutive(opts.snapshots, opts.threshold, opts.window);
  if (!evaluation.triggered) return { evaluation };

  const payload = buildNotificationPayload(evaluation, opts.threshold, opts.window);
  if (opts.dryRun) {
    process.stdout.write(`[dry-run] notification payload: ${JSON.stringify(payload)}\n`);
    return { evaluation };
  }

  if (!opts.repo || !opts.token) {
    throw new Error("repo and token are required to create issue");
  }
  const issueCreator = opts.createIssue ?? defaultIssueCreator;
  const issueUrl = await issueCreator({
    repo: opts.repo,
    title: payload.title,
    body: buildIssueBody(evaluation), // 非 redacted（audit trail）
    labels: ["type:incident", "priority:high", "cf-audit"],
    token: opts.token,
  });

  let slackDelivered: boolean | undefined;
  let slackError: string | undefined;
  if (opts.slackWebhookUrl) {
    const slack = opts.dispatchSlack ?? defaultSlackDispatcher;
    try {
      await slack({ url: opts.slackWebhookUrl, payload });
      slackDelivered = true;
    } catch (e) {
      slackError = (e as Error).message;
      slackDelivered = false;
      process.stderr.write(`slack dispatch failed: ${slackError}\n`);
    }
  }

  let mailDelivered: boolean | undefined;
  let mailError: string | undefined;
  if (opts.emailWebhookUrl && opts.emailFrom && opts.emailTo) {
    const mail = opts.dispatchMail ?? defaultMailDispatcher;
    try {
      await mail({
        url: opts.emailWebhookUrl,
        payload,
        from: opts.emailFrom,
        to: opts.emailTo,
      });
      mailDelivered = true;
    } catch (e) {
      mailError = (e as Error).message;
      mailDelivered = false;
      process.stderr.write(`mail dispatch failed: ${mailError}\n`);
    }
  }

  return { evaluation, issueUrl, slackDelivered, slackError, mailDelivered, mailError };
}
```

### 1-5. `runCli` 拡張

```ts
export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const snapshots = readSnapshots(args.snapshotsDir);
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_INCIDENT ?? process.env.SLACK_WEBHOOK_URL;
  const emailWebhookUrl = process.env.EMAIL_WEBHOOK_URL;
  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.EMAIL_TO;
  const result = await evaluateAndAlert({
    snapshots,
    window: args.window,
    threshold: args.threshold,
    dryRun: args.dryRun || !token || !repo,
    repo,
    token,
    slackWebhookUrl,
    emailWebhookUrl,
    emailFrom,
    emailTo,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
```

## 2. workflow YAML 差分

`.github/workflows/cf-audit-log-monitor.yml` の fallback alert step（または該当 job）の `env:` ブロックに以下を追加:

```yaml
SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
EMAIL_WEBHOOK_URL: ${{ secrets.EMAIL_WEBHOOK_URL }}
EMAIL_FROM: ${{ vars.EMAIL_FROM }}
EMAIL_TO: ${{ vars.EMAIL_TO }}
```

> **注**: workflow YAML の現行構造は実装着手前に `cat .github/workflows/cf-audit-log-monitor.yml` で確認し、fallback-rate-alert step を特定したうえで env を追加すること。step が複数 job に分散している場合は、該当 step を実行する job の env のみに追加する。

## 3. ローカル実行コマンド

```bash
# typecheck
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# unit test (focused)
mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts

# dry-run smoke (snapshots fixture が必要)
SLACK_WEBHOOK_URL=https://hooks.slack.com/test \
  EMAIL_WEBHOOK_URL=https://example/mail \
  EMAIL_FROM=alerts@example \
  EMAIL_TO=to@example \
  mise exec -- tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts \
    --window=3 --threshold=0.05 \
    --input=docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/outputs/phase-11/fixture \
    --dry-run
```

## 4. DoD（完了条件）

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` で TC-01〜TC-12 が PASS
- [x] 既存 case が無修正で PASS
- [x] `outputs/phase-11/evidence/secret-grep.txt` にて以下 grep が 0 件
  - `grep -r "hooks.slack.com/T" outputs/` （webhook 実値が混入していない）
  - `grep -r "op://" outputs/phase-11/evidence/`（op 参照は仕様書側のみ）
- [x] dry-run 実行で stdout に `[dry-run] notification payload: ` 行が出力される
- [x] 通知 payload に 32+ hex / userId= / tenantId= / Bearer / hooks.slack.com URL が含まれない（unit test で証明）

## 5. 出力

- `outputs/phase-05/main.md`
