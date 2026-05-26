---
workflow_id: issue-917-alert-relay-runtime-fire-evidence
title: issue #917 API_INTERNAL_BASE_URL 配線後の SA 資格情報失効 → alert relay 実発火 runtime evidence 取得
status: implemented_local_evidence_captured
created: 2026-05-25
owner: daishiman
github_issue: 917
github_issue_state: closed
---

# issue #917: alert relay runtime fire evidence — ワークフロー index

[実装区分: 実装 + ドキュメント]

## 概要

issue-857 で `apps/api/wrangler.toml` `[env.production.vars]` / `[env.staging.vars]` 双方に `API_INTERNAL_BASE_URL` を配線し、`postAlertRelay()` の self-subrequest 先 URL が解決可能な「local implementation 完了」状態を確立した。一方で issue-857 `outputs/phase-12/implementation-guide.md` の「Runtime Path x Evidence」表における **`actual alert receipt`（Workers tail after deploy and controlled SA key invalidation）は `pending_user_approval`** のまま残っている。本ワークフローは、staging Cloudflare Workers runtime で配線が実際に効き、SA 資格情報失効を模した条件下で `sheets-auth-healthcheck` cron が `POST /internal/alert-relay` を実発火することを **runtime evidence MD** として正本化し、issue-857 implementation-guide 側の pending 行を解消する。

## 実装区分の再判定（CONST_009）

本サイクルは初期には docs-only として作成したが、AC-4 の `responseStatus` evidence を実際に tail で取得できるようにするため **実装 + ドキュメント** へ再判定した。判定根拠:

1. wiring 系コードは issue-857 で投入済み（`apps/api/wrangler.toml` `[env.production.vars]` / `[env.staging.vars]` に `API_INTERNAL_BASE_URL` が 2 箇所存在）。
2. 受信側 `apps/api/src/middleware/verify-cf-webhook-auth.ts` は `CF_WEBHOOK_AUTH_SECRET` 単一照合、送信側 `postAlertRelay()` の token 解決は `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` fallback のまま維持する。
3. ただし `postAlertRelay()` 成功/401 応答はログ化されておらず、仕様が求める `event: "sheets.auth.alert_relay_post"` / `responseStatus` evidence を取得できなかったため、`apps/api/src/scheduled/sheets-auth-healthcheck.ts` と contract spec を最小変更する。
4. 残る runtime 作業は次の 4 種で、いずれも user-gated:
   - `bash scripts/cf.sh secret list` 経由の name presence 確認（user-gated）
   - `bash scripts/cf.sh deploy` 前後の Workers tail evidence 取得（user-gated）
   - 親 UT-25-DERIV-02 Phase 11 の controlled invalidation 手順による relay 実発火観測（user-gated）
   - `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` の作成と issue-857 implementation-guide 側の pending 行更新

→ CONST_009 に従い、ラベルより実態を優先して local observability 実装まで本サイクルで完了する。実 runtime 取得は user-gated で後続実施する。

## issue 状態

issue #917 は **CLOSED**（2026-05-25）。ユーザー指示によりクローズドのまま扱い、re-open はしない。本サイクルでは `Refs #917` の参照関係で扱い、`Closes #917` は使わない。runtime 取得は user-gated、commit / push / PR も user-gated。

## Phase 一覧

| Phase | ファイル | 目的 |
| --- | --- | --- |
| 1 | [phase-01-requirements.md](./phase-01-requirements.md) | Why / What / AC-1..6（runtime evidence 取得の機能 / 非機能要件） |
| 2 | [phase-02-architecture.md](./phase-02-architecture.md) | 送信側 cron → relay 経路 / 受信側 contract / wrangler vars named env 非継承の罠 |
| 3 | [phase-03-task-breakdown.md](./phase-03-task-breakdown.md) | 4 step（secret presence / deploy 前後 tail / SA dry-run / evidence MD + 逆参照） |
| 4 | [phase-04-contracts.md](./phase-04-contracts.md) | `scripts/cf.sh secret list / deploy / tail` 出力契約・relay status 契約 |
| 5 | [phase-05-implementation-guide.md](./phase-05-implementation-guide.md) | 実行手順（最小コード変更あり・evidence MD 雛形 / secret redact ルール） |
| 6 | [phase-06-test-strategy.md](./phase-06-test-strategy.md) | responseStatus logging contract test + runtime evidence grep gate |
| 7 | [phase-07-quality-gates.md](./phase-07-quality-gates.md) | runtime observability CI gate（gate-metadata / verify:phase12 / indexes:rebuild） |
| 8 | [phase-08-dod.md](./phase-08-dod.md) | 完了条件チェックリスト（元 spec セクション 5 完全踏襲） |
| 9 | [phase-09-risks.md](./phase-09-risks.md) | 元 spec セクション 6 の 4 苦戦箇所を risks/mitigation 形式へ展開 |
| 10 | [phase-10-local-verification.md](./phase-10-local-verification.md) | runtime observability ローカル検証コマンド列 |
| 11 | [phase-11-evidence-inventory.md](./phase-11-evidence-inventory.md) | NON_VISUAL evidence 表（focused contract test PASS、runtime MD path は pending） |
| 12 | [phase-12-compliance-check.md](./phase-12-compliance-check.md) | canonical 9 headings 自己点検 |
| 13 | [phase-13-commit-pr-draft.md](./phase-13-commit-pr-draft.md) | user-gated commit / PR 草案（base=dev） |

## 補助

- [SCOPE.md](./SCOPE.md): 含む / 含まない / 不変条件 / 正本順位
- [artifacts.json](./artifacts.json): gates / phases metadata
- [outputs/artifacts.json](./outputs/artifacts.json): output side parity copy

## 関連 issue / ファイル

- 元 issue: [#917](https://github.com/daishiman/UBM-Hyogo/issues/917)（CLOSED）
- 元 unassigned-task spec: `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md`（本サイクルでは consumed 化しない・実 runtime evidence 取得サイクルで consumed へ移す）
- 上流 workflow（配線完了）: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`
- 親 workflow: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
- 関連（受信側 smoke・重複回避）: `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md`
- 送信側: `apps/api/src/scheduled/sheets-auth-healthcheck.ts`（`postAlertRelay`）
- 受信側: `apps/api/src/routes/internal/alert-relay.ts` / `apps/api/src/middleware/verify-cf-webhook-auth.ts`
- 配線対象（既存）: `apps/api/wrangler.toml`（`[env.production.vars]` / `[env.staging.vars]`）
