# 09b-A Sentry / Slack 実Provider smoke evidence取得 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09b-a-runtime-provider-smoke-execution-001 |
| タスク名 | 09b-A Sentry / Slack 実Provider smoke evidence取得 |
| 分類 | observability runtime verification |
| 対象機能 | `POST /admin/smoke/observability` による staging / production readiness evidence |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | unassigned |
| issue_number | #495 |
| 発見元 | 09b-A Phase 12 close-out review |
| 発見日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL（provider console / log artifact） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

09b-A では、Sentry / Slack の secret 名、1Password 参照、Cloudflare 配置、redaction gate、API Worker の smoke route を整備した。`apps/api/src/routes/admin/smoke-observability.ts` は `SENTRY_DSN_API` と `SLACK_WEBHOOK_INCIDENT` を使い、staging / development でのみ admin token 認証後に Sentry envelope と Slack webhook を送信できる。

ただし、実Providerへの送信は本物の secret と人間の承認が必要なため、今回の実行サイクルでは実測 evidence を取得していない。

### 1.2 問題点・課題

- staging の `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` が Cloudflare に登録済みか未確認
- `POST /admin/smoke/observability?target=both` の実Provider到達 evidence が未取得
- Sentry event id、Slack message timestamp / permalink、redaction grep 0 hit の Phase 11 evidence が未作成
- 09c production deploy readiness は、この実測 PASS がない限り observability gate を閉じられない

### 1.3 放置した場合の影響

- Sentry / Slack 設定が仕様上は存在していても、実運用時に通知が届かない可能性を残す
- production deployment の承認前提が曖昧になり、09c の blocker が解除できない
- secret 値や provider URL を evidence に漏らさない運用が実地検証されない

---

## 2. 何を達成するか（What）

### 2.1 目的

staging で実 secret を登録し、`/admin/smoke/observability` を実行して、Sentry と Slack の両方に test event / message が届くことを redaction-safe な evidence として記録する。

### 2.2 最終ゴール

- staging の Cloudflare secret list で `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` の name-only 存在を確認
- `POST /admin/smoke/observability?target=both` が `200` を返す
- Sentry event id と Slack message timestamp / permalink を Phase 11 evidence に記録
- provider secret、DSN host / project id、webhook URL、token、hash が repo / outputs に残っていないことを grep で確認
- 09c の observability blocker を実測結果に基づき更新できる状態にする

### 2.3 スコープ

#### 含むもの

- Cloudflare staging secret の name-only 確認
- staging API への smoke route 実行
- Sentry / Slack provider console または API 上での到達確認
- Phase 11 evidence artifact の作成または追記
- 09c Phase 03 / index の blocker 更新判断

#### 含まないもの

- secret 実値のファイル記録
- production secret 登録または production smoke 実行（別途ユーザー承認が必要）
- route 実装の再設計（今回サイクルで実装済み）
- Sentry SDK の本格導入（smoke route は最小 envelope 送信で実装済み）

### 2.4 成果物

- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-11/manual-smoke-log.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-11/link-checklist.md`
- redaction grep 実行結果
- 09c blocker 更新差分（実測 PASS の場合）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 1Password に staging 用 `SENTRY_DSN_API` と `SLACK_WEBHOOK_INCIDENT` の正本が存在する
- Cloudflare staging へ secret 登録できる権限がある
- `SMOKE_ADMIN_TOKEN` が staging に登録済み、または今回登録できる
- API Worker の staging URL が確認できる
- production 実行はユーザー承認なしに行わない

### 3.2 実行手順

1. `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging` で name-only evidence を取得する。
2. 不足 secret があれば 1Password から `op read` し、`bash scripts/cf.sh secret put ... --env staging` で登録する。
3. staging API に対して次を実行する。
   ```bash
   curl -i -X POST "$STAGING_API_URL/admin/smoke/observability?target=both" \
     -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN"
   ```
4. レスポンスから secret 値・URL・hash が出ていないことを確認する。
5. Sentry と Slack で到達確認し、event id / timestamp / permalink だけを evidence に記録する。
6. repo / outputs に対して redaction grep を実行し、0 hit を記録する。
7. 09c blocker を、実測 PASS なら解除、失敗なら具体的な失敗理由付きで維持する。

### 3.3 受入条件 (AC)

- AC-1: staging secret name-only evidence が取得されている
- AC-2: `/admin/smoke/observability?target=both` が `200` を返す
- AC-3: Sentry test event と Slack test message の到達が確認できる
- AC-4: evidence に secret 実値、DSN host / project id、webhook URL、token、hash が含まれない
- AC-5: 09c の observability blocker が実測結果と整合している

---

## 4. 苦戦箇所 / 学んだこと

### 4.1 docs-only 判定では目的を満たせなかった

当初は 09b-A を runbook / secret contract の formalization として閉じかけたが、ユーザー確認により「実際にやりたいこと」は Sentry / Slack の実行可能な smoke 経路を持つことだと判明した。仕様ラベルより実態を優先し、API route とテストを同一サイクルで追加した。

### 4.2 redaction grep はテスト用URL文字列にも反応する

実 secret は書いていなくても、テスト fixture に Sentry / Slack 風 URL を直書きすると redaction grep が検出する。テストでは文字列を分割し、実値パターンが repo に残らないようにした。

### 4.3 09b parent runbook 欠落が依存関係を壊していた

09b-A と 09c は `09b-parallel-cron-triggers-monitoring-and-release-runbook` を前提にしていたが、worktree 上に canonical root が存在しなかった。今回サイクルで最小 runbook root を復元したため、実測 evidence はその runbook とも整合させる必要がある。

### 4.4 Sentry envelope は送信時だけ実DSNが必要

evidence から DSN を排除する方針は正しいが、Sentry envelope header まで `redacted` にすると実Provider ingestion が失敗する可能性がある。今回の実装ではレスポンス・ログ・evidenceにはDSNを返さず、Sentryへ送る request body 内だけ `SENTRY_DSN_API` 由来の envelope DSN を使う。実測時はこの境界が守られているかを確認する。

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| secret 実値が evidence に混入する | name-only / event id / timestamp だけ記録し、grep gate を必須化する |
| production に誤送信する | staging URL と `--env staging` を手順内で明示し、production は別承認にする |
| Slack に不要な通知を送る | smoke message prefix を `[STAGING SMOKE]` に固定する |
| Sentry DSN の host / project id が漏れる | curl出力やprovider URLをそのまま貼らず、event idのみ残す |
| 09c blocker 解除が先行する | 実測 PASS 取得後にのみ09cを更新する |

---

## 6. 検証方法

### 6.1 実行コマンド

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/smoke-observability.test.ts
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
curl -i -X POST "$STAGING_API_URL/admin/smoke/observability?target=both" \
  -H "Authorization: Bearer $SMOKE_ADMIN_TOKEN"
```

### 6.2 期待結果

| 検査項目 | 期待値 |
| --- | --- |
| typecheck | exit 0 |
| focused vitest | 7 tests PASS |
| secret list | secret name のみ確認可能 |
| smoke route | HTTP 200 / redaction-safe JSON |
| Sentry / Slack | test event / message 到達 |
| redaction grep | 0 hit |

---

## 7. 依存関係

| 種別 | 対象 | 関係性 |
| --- | --- | --- |
| blocks | 09c production deploy readiness | 09c の observability blocker は本タスクの実測 PASS 後に解除可能 |
| depends-on | 09b-A route implementation | `apps/api/src/routes/admin/smoke-observability.ts` が前提 |
| depends-on | 09b parent runbook | incident response / release runbook への evidence linkage が必要 |
