# Implementation Guide

## Part 1: 中学生レベルの説明

### 日常生活での例え

たとえば、学校祭の会場を体育館から校庭へ引っ越す場面に似ています。お客さんには同じ入口から来てもらいたいので、案内板を新しい会場へ向け直し、問題が起きたらすぐ体育館へ戻れるように、しばらく古い会場も片付けずに残します。

このタスクでは、Web サイトを置く場所を Cloudflare Pages から Cloudflare Workers へ移します。見た目やページの中身を変えるのではなく、置き場所と自動で届ける手順を変えます。

### 専門用語セルフチェック

| 用語 | 中学生レベルの説明 |
| --- | --- |
| OpenNext | Next.js のサイトを Workers で動く形に変える道具 |
| Workers | 世界中の近い場所で小さなプログラムを動かす仕組み |
| Pages | これまで Web サイトを置いていた場所 |
| wrangler | Workers を操作するためのコマンド道具 |
| edge | 利用者の近くで処理する場所 |

## Part 2: 技術者レベル

### current contract

| 対象 | current fact |
| --- | --- |
| `apps/web/wrangler.toml` | `main = ".open-next/worker.js"` と `[assets].directory = ".open-next/assets"` を維持 |
| `apps/web/package.json` | `build:cloudflare` が OpenNext build と patch script を実行 |
| `.github/workflows/web-cd.yml` | 現状は Pages deploy が残存。implementation follow-up で `wrangler deploy --env <stage>` へ切替 |
| `apps/web` runtime | D1 直 binding は持たず、API 連携は service binding 経由 |

### target delta

```yaml
build:
  before: pnpm --filter @ubm-hyogo/web build
  after: pnpm --filter @ubm-hyogo/web build:cloudflare
deploy:
  before: wrangler pages deploy .next --project-name=...
  after: wrangler deploy --env staging|production
```

### エラーと edge case

| ケース | 判定 | 対応 |
| --- | --- | --- |
| OpenNext build failure | NO-GO | production cutover へ進まない |
| `API_SERVICE` binding 解決失敗 | NO-GO | staging cutover を中止し wrangler.toml / API Worker deploy 状態を確認 |
| custom domain が Pages 側に残る | NO-GO | runbook S4 の domain unbind / Workers attach を再実行 |
| rollback VERSION_ID 不明 | NO-GO | deploy log から version id を再取得し、append-only evidence に記録 |

### Phase 11 evidence 境界

本 workflow の Phase 11 は NON_VISUAL evidence template の定義までを扱う。実測 CD log、wrangler deploy output、staging smoke 10/10、route mapping、rollback readiness は implementation follow-up で取得し、spec_created の本PRでは runtime PASS と記録しない。

| Phase 11 file | 現在の扱い |
| --- | --- |
| `web-cd-deploy-log.md` | evidence contract / pending implementation follow-up |
| `wrangler-deploy-output.md` | evidence contract / pending implementation follow-up |
| `staging-smoke-results.md` | evidence contract / pending implementation follow-up |
| `route-mapping-snapshot.md` | evidence contract / pending implementation follow-up |
| `rollback-readiness.md` | evidence contract / pending implementation follow-up |

画面・コンポーネント・route表示の変更はこのspec workflowに含まれないため、スクリーンショットは不要。視覚検証ではなく、上記5ファイルのNON_VISUAL証跡契約をPhase 11成果物として保存する。

### Phase 13 approval gate

Phase 13 の `local-check-result.md` / `change-summary.md` / `pr-info.md` / `pr-creation-result.md` / `approval-gate-status.md` は、いずれも `BLOCKED_PENDING_USER_APPROVAL` または `NOT_CREATED_PENDING_USER_APPROVAL` の placeholder として保存する。commit / push / PR / Cloudflare deploy は実行していない。
