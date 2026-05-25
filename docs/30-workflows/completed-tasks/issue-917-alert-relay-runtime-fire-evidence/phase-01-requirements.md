---
phase: 1
title: Requirements
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 1: Requirements — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

再判定根拠: 初期仕様は docs-only として開始したが、runtime evidence の AC-4 が `event: "sheets.auth.alert_relay_post"` / `responseStatus` を要求している一方、現コードは relay POST 成功/401 応答をログ化していなかった。CONST_009 に従い、ラベルより目的達成を優先して `apps/api/src/scheduled/sheets-auth-healthcheck.ts` と同 contract spec を最小変更する。

## 1. 目的（Why）

issue-857 で `apps/api/wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` 双方へ `API_INTERNAL_BASE_URL` を配線し、`postAlertRelay()` の self-subrequest 先 URL を解決できる「local implementation 完了」状態を確立した。送信側 token は受信 `verify-cf-webhook-auth.ts`（`CF_WEBHOOK_AUTH_SECRET` 単一照合）に合わせ `CF_WEBHOOK_AUTH_SECRET` fallback を正本化し、config guard / contract fallback の回帰テストで local 証跡を固定した（`workflow_state = implemented_local_evidence_captured`）。

ただし issue-857 `outputs/phase-12/implementation-guide.md` の「Runtime Path x Evidence」表で **`actual alert receipt`（Workers tail after deploy and controlled SA key invalidation）は `pending_user_approval`** のまま残っている。つまり「base URL 配線によって healthcheck の no-op が実際に解消し、SA 資格情報失効時に alert relay が本物に発火するか」は実機未確認である。本タスクは staging runtime evidence を MD として正本化し、この pending を解消する。

## 2. 現状の事実確認（現コード調査結果）

| # | 事実 | ソース |
| --- | --- | --- |
| F-1 | `API_INTERNAL_BASE_URL` は `[env.production.vars]` / `[env.staging.vars]` 両方に配線済み（issue-857 結果） | `apps/api/wrangler.toml`（L60 / L147 相当） |
| F-2 | `postAlertRelay()` は `env.API_INTERNAL_BASE_URL` falsy 時に `event: "sheets.auth.alert_relay_skipped"` / `reason: "missing API_INTERNAL_BASE_URL or token"` で no-op | `apps/api/src/scheduled/sheets-auth-healthcheck.ts:90-101` |
| F-3 | 送信 token は `env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET` | 同上 L91 |
| F-4 | 受信側 middleware は `cf-webhook-auth` を `CF_WEBHOOK_AUTH_SECRET` のみと照合（不一致 401・未設定 500） | `apps/api/src/middleware/verify-cf-webhook-auth.ts:15-25` |
| F-5 | issue-857 implementation-guide「actual alert receipt」行は `pending_user_approval` のまま | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` |
| F-6 | 親 UT-25-DERIV-02 Phase 11 は staging secret invalidation dry-run 手順を保有 | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| F-7 | 受信側 endpoint 汎用 smoke は別タスク（`ut-17-followup-001`）で扱い、本タスク（送信トリガー経路）と重複しない | `docs/30-workflows/unassigned-task/ut-17-followup-001-alert-relay-runtime-smoke-evidence.md` |
| F-8 | relay POST 到達ステータスの runtime evidence 取得には、成功/401 応答を tail で拾える構造化ログが必要 | `apps/api/src/scheduled/sheets-auth-healthcheck.ts` |

## 3. 機能要件（AC-1..6）

| ID | 要件 |
| --- | --- |
| AC-1 | `bash scripts/cf.sh secret list --env staging` で `CF_WEBHOOK_AUTH_SECRET` の name presence が確認され、evidence MD に redact 済みで記録される（production は deploy ポリシーで実施範囲を判断） |
| AC-2 | staging deploy 前後の Workers tail が `bash scripts/cf.sh` 経由で取得され、`event: "sheets.auth.alert_relay_skipped"` / `reason: "missing API_INTERNAL_BASE_URL or token"` の有無 before/after が evidence MD に並記される |
| AC-3 | 親 UT-25-DERIV-02 Phase 11 の controlled invalidation 手順により Sheets API が 401/403 を返す状態を模した SA 資格情報失効 dry-run が実施される |
| AC-4 | dry-run 状態下で `postAlertRelay()` → `${API_INTERNAL_BASE_URL}/internal/alert-relay` への POST 到達ステータス（200 / 401）が tail に記録され、no-op でないことが確認できる |
| AC-5 | runtime evidence MD `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` が作成され、(a) secret name presence (b) deploy 前後 tail (c) SA dry-run 観測 (d) 通知到達状況 が含まれる |
| AC-6 | issue-857 `outputs/phase-12/implementation-guide.md` の「actual alert receipt」行が `pending_user_approval` から `verified` または取得済み evidence MD への相対リンクへ更新され、親 UT-25-DERIV-02 close-out チェックから逆参照が張られる |

## 4. 非機能要件（NFR-*）

| ID | 要件 |
| --- | --- |
| NFR-1 | 実 secret 値・OAuth トークン値を tail 出力 / evidence MD / 仕様書に転記しない（CLAUDE.md シークレット管理ルール）。`cf-webhook-auth` header 値は redact 必須 |
| NFR-2 | `wrangler` 直接実行を行わない。すべて `bash scripts/cf.sh` 経由（CLAUDE.md Cloudflare CLI ルール） |
| NFR-3 | runtime evidence の取得は user-gated。Claude Code は仕様書作成と evidence MD 雛形までで停止し、実 deploy / tail / secret list / SA invalidation はユーザー承認後のみ |
| NFR-4 | 通知先（Slack / mail）が未設定なら relay POST の到達ステータスまでを evidence 範囲とし、着信確認は別 wave に切り出す（本タスクで de-scope しない） |
| NFR-5 | production 実施範囲は deploy ポリシー次第。staging のみ先行となった場合は evidence MD に明記して段階分離する |

## 5. 不変条件（UNBREAKABLE）

1. `apps/api/src/scheduled/sheets-auth-healthcheck.ts` の変更は relay POST 応答ステータスの構造化ログ追加に限定し、送信 payload / token 解決 / cron 挙動は変更しない。
2. `apps/api/wrangler.toml` の `API_INTERNAL_BASE_URL` 配線は触らない（issue-857 結果を不変条件として保つ）。
3. 別値 `INTERNAL_ALERT_TOKEN` Secret の新規投入を行わない（issue-857 で de-scope 済み・relay 401 の罠）。
4. `verify-cf-webhook-auth.ts` の token 検証ロジックを変更しない（`CF_WEBHOOK_AUTH_SECRET` 単一照合を維持）。
5. 元 unassigned-task spec `UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` を本サイクルで削除・移動しない。
6. issue #917 は CLOSED のまま運用（`Refs #917`）。
7. PR base は `dev`。`main` への直接 PR をしない。

## 6. 命名規則（現コード分析）

| 対象 | 規則 | 例 |
| --- | --- | --- |
| evidence MD | `<domain>-<action>-<env>.md`（kebab-case） | `alert-relay-fire-staging.md` |
| 構造化ログ event | `<domain>.<area>.<action>`（dot 区切り） | `sheets.auth.healthcheck` / `sheets.auth.alert_relay_skipped` |
| header 名 | `cf-<area>-<purpose>`（小文字・ハイフン区切り） | `cf-webhook-auth` |
| wrangler.toml var 名 | `SCREAMING_SNAKE_CASE` | `API_INTERNAL_BASE_URL` |

本サイクルで作成する evidence MD のファイル名は `alert-relay-fire-staging.md`（production 拡張時は `alert-relay-fire-production.md`）。

## 7. タスク分類

- **タスク種別**: implementation（runtime evidence observability hardening）/ NON_VISUAL
- **implementation_mode**: `runtime_observation`
- **implementationCategory**: `runtime-evidence`
- **Phase 11**: スクリーンショット不要（UI/UX 変更なし）。代替証跡は staging tail ログ + secret name presence ログ + relay POST 到達ステータス。

## 8. 受け入れ条件サマリ

詳細は Phase 8 (DoD)。要点: secret name presence 確認 → deploy 前後 tail で no-op reason 消失 → SA dry-run で relay POST 到達ステータス記録 → evidence MD 作成 → issue-857 implementation-guide「actual alert receipt」更新。
