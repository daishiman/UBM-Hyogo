# Issue #588 — Fallback alert Slack and mail extension

[実装区分: 実装仕様書]

## 調査結果（事前検証）

- 親 Issue #549 の成果物 `scripts/cf-audit-log/observation/fallback-rate-alert.ts` は **GitHub Issue 起票のみ**を実装しており、Slack / mail 通知は未実装である（2026-05-10 検証）。
- Slack webhook の正本は既に Issue #520 の `SLACK_WEBHOOK_INCIDENT`（`op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`）として provision 済みである。Issue #588 の GitHub Actions 側もこの正本名へ寄せ、`SLACK_WEBHOOK_URL` は CLI の local fallback 名としてのみ扱う。
- 該当機能が他タスクで重複実装されていないことを `grep -rn "fallback.*Slack" docs/30-workflows/completed-tasks/` および `scripts/cf-audit-log/observation/fallback-rate-alert.ts` 全文確認で確認した。
- したがって Issue #588（CLOSED 状態）の内容は依然として未実装であり、本仕様書を **CLOSED issue 由来の retroactive 実装仕様書** として作成する。

## 親 / 関連

- 親: Issue #549 (`docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/`)
- 関連: Issue #520 Slack incidents channel webhook provisioning（webhook 正本）
- 元仕様: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md`（本仕様書で superseded）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #588 (CLOSED) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| 親 | Issue #549 |
| 影響範囲 | `scripts/cf-audit-log/observation/fallback-rate-alert.ts` 単一 module + 同 `__tests__/` + `.github/workflows/cf-audit-log-monitor.yml` env 追加 |

## スコープ（CONST_007: 1 サイクル完結）

含む:
1. `fallback-rate-alert.ts` への Slack 通知 dispatcher 追加（canonical `SLACK_WEBHOOK_INCIDENT` env 経由。legacy `SLACK_WEBHOOK_URL` は local fallback のみ）
2. mail 通知 dispatcher 追加（Cloudflare Workers から呼び出される CLI コンテキストでは GitHub Actions 上で動作するため、SMTP に依存せず **GitHub Actions の `actions-mail` 系 step ではなく**、本 CLI からは `EMAIL_WEBHOOK_URL`（Mailgun / Resend 等の HTTP API webhook）を使う薄い抽象 `sendMail` を `fallback-rate-alert.ts` 内に実装）
3. dispatcher は **fallback rate 連続 3h 超過時のみ**発火し、GitHub Issue 起票と同一 alert cycle 内で並列に動作する
4. secret redaction: snapshot JSON に含まれる可能性のある `userId` / `tenantId` / `user_id` / `tenant_id` 等の PII / secret 文字列は通知 body から除外（既存 `buildIssueBody` の出力をベースに、追加の redaction 関数を経由）
5. 単体テスト追加: Slack dispatcher / mail dispatcher / redaction の 3 ケース
6. dry-run モード: `--dry-run` で Slack / mail 通知を**送らず stdout に payload を出力**
7. workflow YAML への secret 名追加（`SLACK_WEBHOOK_INCIDENT` / `EMAIL_WEBHOOK_URL` を job env として渡す）

含まない:
- 新規 Slack channel の provisioning（Issue #520 で完了済み）
- mail provider の選定・契約（既存 `EMAIL_WEBHOOK_URL` 想定。未契約の場合は env 未設定 → mail dispatcher は no-op で skip）
- alert 閾値・window の変更（5% / 3h は親 #549 の運用合意のため変更しない）
- GitHub Issue 起票ロジックの変更
- 外部 SIEM bulk export

未タスク分離: なし（CONST_007 例外条件に該当しない）

## 不変条件

1. Slack / mail 通知の payload に webhook URL / token / fingerprint hash 全文 / PII を含めない
2. 通知失敗時も GitHub Issue 起票は実行する（依存関係が逆: notification は best-effort、Issue 起票は必須）
3. dry-run は Slack / mail を一切送らない
4. 既存 `evaluateConsecutive` / `buildIssueBody` の signature を変更しない（後方互換）

## 受け入れ条件 (AC)

- AC-1: fallback rate > 5% × 3h 連続を満たす hourly snapshot fixture で `evaluateAndAlert` を実行すると、Slack POST / mail POST / GitHub Issue POST の 3 つが発火する（mock 検証）
- AC-2: `--dry-run` 時は HTTP POST が 0 回（fetch mock 0 call）
- AC-3: `SLACK_WEBHOOK_INCIDENT` と fallback `SLACK_WEBHOOK_URL` が未設定時は Slack dispatcher が no-op で skip し、mail / Issue 起票は継続
- AC-4: `EMAIL_WEBHOOK_URL` 未設定時は mail dispatcher が no-op で skip し、Slack / Issue 起票は継続
- AC-5: redaction 関数は `userId` / `tenantId` / 任意 32+ hex 文字列を `[REDACTED]` に置換する
- AC-6: 既存 unit test (`fallback-rate-alert.test.ts`) は破壊変更なしで PASS
- AC-7: `pnpm typecheck` / `pnpm lint` が PASS
- AC-8: `outputs/phase-11/evidence/secret-grep.txt` に webhook URL / op:// 参照が含まれない（grep 0 件）

## Phase 構成

| Phase | 目的 |
| --- | --- |
| 1 | 要件定義・Gate 整理 |
| 2 | 設計（dispatcher 抽象、redaction 仕様、env 命名、failure isolation） |
| 3 | 設計レビュー（不変条件 / 整合性 / 依存関係） |
| 4 | テスト戦略（vitest mock 設計、fixture、negative case） |
| 5 | 実装契約（関数シグネチャ・型・既存 `evaluateAndAlert` への差分） |
| 6 | 異常系（HTTP エラー / timeout / secret redaction breach） |
| 7 | DevOps（workflow YAML diff、secret 投入手順） |
| 8 | ドキュメント差分（runbook / SSOT） |
| 9 | テスト実装と実行手順 |
| 10 | レビュー観点 |
| 11 | 証跡（NON_VISUAL evidence canonical path） |
| 12 | Phase 12 close-out（state vocab / SSOT 同期 / unassigned 検出） |
| 13 | PR 作成 |

## 実装結果（2026-05-10）

- `scripts/cf-audit-log/observation/fallback-rate-alert.ts` に redacted notification payload、Slack dispatcher、mail HTTP webhook dispatcher、dry-run payload output、best-effort failure isolation を実装した。
- `.github/workflows/cf-audit-log-monitor.yml` に fallback-rate alert 評価 step を追加し、`outputs/observation/*.json` snapshot が存在する場合のみ実行する。Issue #518 HOLD 中の `dry_run=true` 制約は維持する。
- `EMAIL_WEBHOOK_URL` / `EMAIL_FROM` / `EMAIL_TO` が未設定の場合、mail dispatcher は no-op として skip する。これは mail provider 契約が未済でも GitHub Issue 起票と Slack 通知を阻害しないための運用境界であり、production completion ではなく `IMPLEMENTED_LOCAL_RUNTIME_PENDING` に留める。

## artifacts.json metadata

```json
{
  "issue": 588,
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "implemented-local-runtime-pending",
  "parent": 549,
  "supersedes": "docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md"
}
```
