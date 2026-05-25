---
timestamp: 2026-05-24T00:00:00Z
branch: feat/issue-838-schema-alias-rollback-notification
author: claude-code
type: lessons-learned
task: docs/30-workflows/issue-838-schema-alias-rollback-notification/
skill: aiworkflow-requirements
related-files:
  - apps/api/src/workflows/schemaAliasRollbackNotification.ts
  - apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts
  - apps/api/src/routes/admin/schema.ts
  - apps/api/src/routes/admin/_shared.ts
  - apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
  - apps/api/wrangler.toml
  - apps/api/.dev.vars.example
---

# Issue #838: schema alias rollback 通知（best-effort 運用通知 + audit 記録）の苦戦点

`POST /admin/schema/aliases/:aliasId/rollback` の成功後に、運用者へ Slack 優先 / mail fallback の
best-effort 通知を飛ばし、その結果を `audit_log` の `schema_alias.rollback_notification` として記録する
仕組みを追加した。Issue #778（rollback 本体）への後段付加であり、Cloudflare Workers 上の
「重要 mutation 後に壊れない auxiliary sink を足す」典型ケースとして再利用できる知見を残す。

---

## L-I838-001: best-effort auxiliary sink は二重 try/catch で隔離する

### 状況

rollback 本体（D1 commit）は成功させたうえで、通知 dispatch と通知 audit 記録という 2 つの auxiliary
操作を後段に足した。これらの失敗が rollback の `200` を `5xx` に転じさせてはならない。

### Why

- 通知は補助機能であり、Slack / mail provider の一時障害で「rollback 自体が失敗した」と運用者に
  誤認させると、不要な再 rollback や調査コストが発生する。
- dispatch を 1 段の try/catch で包んでも、その後の `recordRollbackNotificationAudit()`（D1 insert）が
  throw すると rollback 応答へ伝播する。隔離境界を 1 段にまとめると audit 書き込み失敗が漏れる。

### How to apply

- dispatch 全体を 1 段目の try/catch で隔離し、`RollbackNotificationResult`（`sent` / `failed` /
  `skipped`）へ正規化して throw しない。
- audit 記録（`recordRollbackNotificationAudit`）はさらに別の try/catch で隔離する。
- route 側は「rollback 成功 → notification（best-effort）→ audit（best-effort）→ 既存 200 を返す」を
  保ち、auxiliary 失敗時も応答 shape を変えない。`schema.rollback.spec.ts` に skipped notification 後の
  200 + audit 記録の回帰テストを置く。

---

## L-I838-002: mail env は `MAIL_PROVIDER_KEY` が SSOT、`RESEND_API_KEY` を新規連携へ持ち込まない

### 状況

mail fallback 実装時、旧称 `RESEND_API_KEY` を流用しかけたが、正本は `MAIL_PROVIDER_KEY` /
`MAIL_FROM_ADDRESS`（05b-A 系で確立済み）。Slack も `SLACK_WEBHOOK_INCIDENT`（優先）/
`SLACK_WEBHOOK_URL`（fallback）の 2 系統。

### Why

- 旧名を staging secret に投入すると config gate が常に `skipped` 判定になり、runtime smoke が空振りする。
- `references/deployment-cloudflare.md` の healthcheck cron（UT-17）が依然 `RESEND_API_KEY` を使うのは
  別系統であり、新規 mail 連携がそこへ追従すると naming drift が拡散する。

### How to apply

- 新規 mail 連携は `createResendSender({ apiKey: env.MAIL_PROVIDER_KEY })` を正とする。
- Slack は `env.SLACK_WEBHOOK_INCIDENT ?? env.SLACK_WEBHOOK_URL` の優先順で解決する。
- system spec 反映時、`api-endpoints.md` / `database-implementation-core.md` / `.dev.vars.example` /
  `wrangler.toml` で env 名を一致させ、`RESEND_API_KEY` を issue-838 文脈に混入させない。

---

## L-I838-003: 3 層 redaction（payload 構築 / 送信本文 / audit 記録）を全部閉じる

### 状況

通知本文と audit `after_json` に actor email / stableKey / webhook URL / provider token が漏れる経路が
3 か所（payload 構築・送信本文・audit 記録）あった。

### Why

- 1 層でも漏らすと、外部 Slack / mail へ PII・secret を送信するか、監査ログへ恒久的に残す事故になる。
- mail fallback の HTML 本文は dynamic value（`aliasId` 等）を素で埋めると markup injection も起き得る。

### How to apply

- `redactRollbackActor()` で actor email を `admin:redacted` 化し、stableKey は payload に含めない。
- provider error は `errorClass` のみへ縮約し、raw body / token / webhook URL を残さない。
- mail HTML は同一 text payload を escape して `<pre>` 内に描画し、dynamic value の markup 注入を防ぐ。
- audit `after_json` は `{ status, channel, attempts, errorClass, dispatchedAt }` の最小集合に固定する。

---

## L-I838-004: Slack→mail fallback の `attempts` は実 dispatch 試行回数の合算で定義する

### 状況

Slack 試行 → 失敗 → mail 試行という経路で、`attempts` を両チャネル合算にするか単一チャネル分にするかが
曖昧になりやすい。

### Why

- 定義が曖昧だと、staging smoke の観測値と spec / test の期待値がずれ、`attempts` の解釈で運用者が混乱する。
- Cloudflare Workers は isolate を多重起動するため、in-memory 状態に依存した厳密 dedup は isolate 跨ぎで
  効かない（best-effort 設計上、重複/欠落は保証外）。

### How to apply

- `attempts` は「実際に行った dispatch 試行回数の合算」と定義する（Slack 1 + mail 1 = 2 等）。
- 未設定時は `skipped / none / attempts=0` に着地させ、test と system spec の双方へ同値で記載する。
- runtime smoke では観測値をそのまま evidence に残し、isolate 跨ぎ重複は保証外と明記する。

---

## L-I838-005: 「1 cycle / no deferral」spec を `implementation later` で閉じない

### 状況

当初 docs-only / spec_created で閉じる選択肢があったが、ローカルで実装可能な範囲を `後続で実装予定`
として先送りするのは、ワークフローの「1 cycle / no deferral」意図に反する。

### Why

- task-specification-creator の既存 Phase 12 ルールは、docs-only / spec_created 主張が実タスク意図と
  矛盾する場合は実装昇格を求める。新ルールを足す話ではなく、既存ルールの適用漏れだった。
- ローカル完了可能な実装を runtime user-gate と混同して先送りすると、後段 PR で「実装欠落」を後追い
  指摘され close が遅延する。

### How to apply

- ローカル達成可能な実装は本 cycle で `implemented_local_evidence_captured` まで進める。
- 真に user-gated な runtime（staging deploy / 実 provider dispatch / D1 mutation）のみを
  `runtime_pending` として境界に置き、Phase 11 evidence の present / pending を分離して記す。
- 「実装は後続」主張は撤回し、focused test + typecheck PASS を local evidence として確定させる。

---

## 補足: 反映 wave の運用注意（メタ知見）

- 並列監査 SubAgent は read-only 指示でも Bash で書き込み得る。本タスクでも監査中に未タスク 1 件が
  無断作成された。並列監査後は `git status --porcelain` で fs 変化を必ず再検証し、
  `unassigned-tasks-report.md` の「新規未タスクなし」判定と矛盾する生成物は削除して整合を維持する。
- `lessons-learned/` ディレクトリは `generate-index.js`（references/ のみ走査）の対象外のため、
  本ファイル追加は topic-map / keywords.json drift を生まない。
