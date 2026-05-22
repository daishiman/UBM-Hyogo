# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. モジュール構造

`scripts/cf-audit-log/observation/fallback-rate-alert.ts` 単一ファイル内に以下を追加する（新規ファイルは作らない）。

```
fallback-rate-alert.ts
├─ evaluateConsecutive          (既存・不変)
├─ buildIssueBody               (既存・不変)
├─ defaultIssueCreator          (既存・不変)
├─ evaluateAndAlert             (既存を拡張)
├─ dispatchSlack         (新規)
├─ dispatchMail          (新規)
├─ redactForNotification (新規)
├─ buildNotificationPayload (新規)
└─ runCli                       (既存を拡張)
```

## 2. 関数シグネチャ

```ts
export function redactForNotification(text: string): string;

export interface NotificationPayload {
  title: string;
  text: string; // redacted
}

export function buildNotificationPayload(
  evaluation: AlertEvaluation,
  threshold: number,
  window: number,
): NotificationPayload;

export interface SlackDispatcher {
  (params: { url: string; payload: NotificationPayload }): Promise<void>;
}

export interface MailDispatcher {
  (params: { url: string; payload: NotificationPayload }): Promise<void>;
}

export const defaultSlackDispatcher: SlackDispatcher;
export const defaultMailDispatcher: MailDispatcher;

// evaluateAndAlert の拡張版オプション
export interface EvaluateAndAlertOptions {
  snapshots: HourlySnapshot[];
  window: number;
  threshold: number;
  dryRun: boolean;
  repo?: string;
  token?: string;
  createIssue?: IssueCreator;
  slackWebhookUrl?: string;
  emailWebhookUrl?: string;
  dispatchSlack?: SlackDispatcher;
  dispatchMail?: MailDispatcher;
}

export interface EvaluateAndAlertResult {
  evaluation: AlertEvaluation;
  issueUrl?: string;
  slackDelivered?: boolean;
  slackError?: string;
  mailDelivered?: boolean;
  mailError?: string;
}
```

## 3. redaction ルール

`redactForNotification` は次の置換を**この順序で**適用する:

| パターン | 置換 |
| --- | --- |
| `/[A-Fa-f0-9]{32,}/g` | `[REDACTED:hash]` |
| `/userId=[^\s,]+/g` | `userId=[REDACTED]` |
| `/tenantId=[^\s,]+/g` | `tenantId=[REDACTED]` |
| `/Bearer\s+[A-Za-z0-9._-]+/g` | `Bearer [REDACTED]` |
| `/https?:\/\/hooks\.slack\.com\/[^\s]+/g` | `[REDACTED:slack-webhook]` |

`buildIssueBody` は不変（audit trail としてフル情報を残す）。`buildNotificationPayload` は `buildIssueBody` の結果を `redactForNotification` に通したものを `text` に格納する。

## 4. payload 設計

### Slack
```json
{
  "text": "<title>\n\n<redacted body>"
}
```
シンプルな `text` フィールドのみ（既存 `30day-summary.sh` と同流儀）。Block Kit は使わない（payload 複雑化と secret 漏洩リスク回避）。

### Mail (HTTP webhook)
```json
{
  "subject": "<title>",
  "body": "<redacted body>",
  "from": "alerts@ubm-hyogo.example",
  "to": "incidents@ubm-hyogo.example"
}
```
`from` / `to` は env `EMAIL_FROM` / `EMAIL_TO` から読む（未設定時は dispatcher を no-op）。

## 5. failure isolation

`evaluateAndAlert` の擬似コード:

```ts
1. evaluate = evaluateConsecutive(...)
2. if (!evaluate.triggered || dryRun) return { evaluation }
3. issueUrl = await createIssue(...)         // throw 伝播（必須）
4. slackDelivered = false
5. if (slackWebhookUrl) {
     try { await dispatchSlack(...); slackDelivered = true }
     catch (e) { slackError = e.message }    // 握る
   }
6. mailDelivered = false
7. if (emailWebhookUrl) {
     try { await dispatchMail(...); mailDelivered = true }
     catch (e) { mailError = e.message }     // 握る
   }
8. return { evaluation, issueUrl, slackDelivered, slackError, mailDelivered, mailError }
```

dry-run 時は payload を `console.log("[dry-run]", JSON.stringify(payload))` で出力し、HTTP は呼ばない。

## 6. env と secret 命名

| env 変数 | 1Password 参照 | 用途 |
| --- | --- | --- |
| `SLACK_WEBHOOK_INCIDENT` | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` | Slack incoming webhook canonical secret |
| `EMAIL_WEBHOOK_URL` | `op://Cloudflare/UBM-Hyogo Shared/email-webhook-incident`（provision pending） | Mail HTTP webhook |
| `EMAIL_FROM` | non-secret（GitHub Variables） | from address |
| `EMAIL_TO` | non-secret（GitHub Variables） | to address |

GitHub Actions 上では `secrets.SLACK_WEBHOOK_INCIDENT` / `secrets.EMAIL_WEBHOOK_URL` と `vars.EMAIL_FROM` / `vars.EMAIL_TO` を job env として渡す。CLI は local fallback として `SLACK_WEBHOOK_URL` も読む。

## 7. workflow YAML diff（設計）

`.github/workflows/cf-audit-log-monitor.yml` の fallback-rate-alert step に以下を追加:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
  EMAIL_WEBHOOK_URL: ${{ secrets.EMAIL_WEBHOOK_URL }}
  EMAIL_FROM: ${{ vars.EMAIL_FROM }}
  EMAIL_TO: ${{ vars.EMAIL_TO }}
```

## 8. 完了条件

- [x] 上記 8 セクションが `outputs/phase-02/main.md` に転記される
- [x] redaction ルール 5 件が確定
- [x] failure isolation の擬似コードが確定
- [x] env 命名と 1Password 参照が確定

## 出力

- `outputs/phase-02/main.md`
