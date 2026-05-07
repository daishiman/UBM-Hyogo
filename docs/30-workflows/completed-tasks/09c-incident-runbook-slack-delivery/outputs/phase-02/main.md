# Phase 2 サマリ — 設計

[実装区分: 実装仕様書]

## 確定事項

- **配信経路**: GitHub Actions `workflow_run`（09c production deploy 完了 trigger）+ `workflow_dispatch`。Cloudflare Workers Cron は不採用（deploy 完了 hook が Actions 側にしか存在しないため）
- **言語 / runtime**: TypeScript on Node 24、`tsx` で実行
- **Slack SDK**: `@slack/web-api`（pnpm 追加）
- **secret 注入**: ローカルは `scripts/with-env.sh`（op 経由）、CI は GitHub Secrets を `env:` で渡し `::add-mask::`
- **environment gate**: GitHub Actions environment `production-slack-delivery`（manual approval 必須）+ `production-slack-delivery-dryrun`
- **Block Kit template**: `scripts/notify/slack-incident-runbook.template.json`（header / context / divider / section / actions / context の 6 block）
- **runbook permalink**: `https://github.com/{repoSlug}/blob/{commitSha}/{runbookPath}`（commit SHA pin）

## 関数シグネチャ

- `postIncidentRunbook(opts: PostIncidentRunbookOptions): Promise<SlackPostResult>`
- `renderTemplate(opts): KnownBlock[]`
- `buildRunbookPermalink(opts): string`
- `saveEvidence(result, outputDir): { evidencePath, bytes }`

## evidence schema

`{ ok, mode, channel, ts, permalink, postedAt, releaseVersion, commitSha, runbookPermalink }` の 9 keys を required。

## 変更対象ファイル

新規 7（workflow yaml + 4 ts + 1 sh + 1 json）/ 編集 3（package.json、aiworkflow-requirements md、09c phase-11.md）。

## 引き渡し

Phase 3 へ: アーキテクチャ妥当性レビューと WebClient DI 化検討、scope 最小化確認、誤配信ガードの構造的担保。
