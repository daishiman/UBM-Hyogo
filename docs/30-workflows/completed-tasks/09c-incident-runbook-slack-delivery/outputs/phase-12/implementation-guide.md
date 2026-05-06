# Implementation Guide — 09c-incident-runbook-slack-delivery

## Part 1: 中学生レベル

学校で大事なお知らせがあったとき、先生が黒板に書くだけだと、見ていない人に届かない。だから先生は「みんなのスマホに自動でメッセージを送る仕組み」を用意して、「いつ、誰に、どんな内容で送ったか」を記録に残しておく。

UBM 兵庫支部会のサイトでも、本番の更新が終わった直後に「もし何か壊れたときに読むべき手順書」のリンクを、Slack の決まった部屋に自動で投げ込む。そして「いつ投げたか・どの部屋に投げたか・どのリンクなのか」をファイルに残す。

## 何をするの？

1. 練習部屋に先に test 投稿する
2. 内容が大丈夫だと人が確認する
3. 本番部屋に投稿する
4. 投稿の結果をファイルに保存する

## 専門用語セルフチェック

| 専門用語 | 日常語への言い換え |
| --- | --- |
| Slack bot | 自動でメッセージを書き込んでくれるロボット |
| channel | Slack の中の部屋 |
| approval gate | 「やっていい？」を人が OK する関門 |
| token | Slack に話しかけるための合言葉 |
| dry-run | 本番に投稿する前の練習投稿 |
| permalink | あとから何度でも開ける固定リンク |
| evidence | 「ちゃんと届いた」という証拠ファイル |

## Part 2: 技術者レベル

| 項目 | 契約 |
| --- | --- |
| 配信方式 | GitHub Actions `workflow_dispatch` + `workflow_run` dry-run |
| production gate | `environment: production-slack-delivery` |
| Slack API | `chat.postMessage` + `chat.getPermalink` |
| token | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` |
| channel variables | `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID`, `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` |
| evidence path | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json` |

```ts
export interface SlackEvidence {
  ok: boolean;
  mode: "dryrun" | "production";
  ts: string;
  channel: string;
  message: { permalink: string };
  releaseVersion: string;
  deployedAt: string;
  commitSha: string;
  runbookPermalink: string;
  deliveredAt: string;
}
```

## Runtime Path x Evidence

| path | evidence | 境界 |
| --- | --- | --- |
| local dry-run | `dryrun-smoke.log`, `slack-delivery-dryrun.json` | token 値は保存しない |
| workflow_run | `slack-delivery-dryrun.json` | inputs は使わず `derive-context` で固定値を作る |
| workflow_dispatch production | `slack-delivery-production.json` | GitHub environment approval 必須 |
| Phase 12 | strict 7 files | runtime PASS ではなく `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
