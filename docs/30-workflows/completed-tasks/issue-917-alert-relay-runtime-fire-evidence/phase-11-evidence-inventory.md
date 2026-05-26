---
phase: 11
title: Evidence Inventory
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 11: Evidence Inventory — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 本サイクルは runtime observability hardening cycle。UI/UX 変更なし・最小コード変更あり。focused contract test と docs gate を local evidence とし、Cloudflare runtime は後続 user-gated サイクルで取得する。

## NON_VISUAL 宣言

- **タスク種別**: implementation（runtime evidence observability hardening）/ NON_VISUAL
- **非視覚的理由**: 変更は API scheduled job の構造化ログと Markdown / JSON のみ。UI レンダリングへの影響なし。
- **代替証跡**: focused contract test + docs gate 出力（gate-metadata / verify:phase12 / indexes:rebuild）+ 後続サイクル取得の staging Workers tail / secret list / relay POST 到達ステータス
- **スクリーンショットは作成しない**（`screenshots/` ディレクトリを置かない）。

## evidence 表

| evidence | 取得方法 | 主ソース | 保存先 | 状態 |
| --- | --- | --- | --- | --- |
| 型チェック | broader gate（未実行） | — | — | not run |
| lint | broader gate（未実行） | — | — | not run |
| focused vitest | `pnpm exec vitest run apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts --root=. --config=vitest.config.ts` | stdout（8 tests PASS） | `outputs/phase-11/main.md` 内転記 | present |
| gate-metadata 検証 | `mise exec -- pnpm gate-metadata:validate` | stdout（OK / ERROR 件数） | `outputs/phase-11/main.md` 内転記 | present |
| Phase 12 compliance 検証 | `mise exec -- pnpm verify:phase12-compliance` | stdout（PASS / FAIL） | 同上 | present |
| indexes 冪等性 | `mise exec -- pnpm indexes:rebuild` + `git diff --stat` | stdout / git diff | 同上 | present |
| secret name presence | `bash scripts/cf.sh secret list --env staging`（user-gated・後続サイクル） | stdout（name 列のみ） | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` §1 | pending（runtime user-gated） |
| deploy 前後 tail | `bash scripts/cf.sh deploy` + `tail`（user-gated・後続サイクル） | Workers tail（`event: "sheets.auth.healthcheck"` / `alert_relay_skipped` 有無） | 同 MD §2 | pending |
| SA dry-run 観測 | 親 UT-25-DERIV-02 Phase 11 controlled invalidation 手順（user-gated・後続サイクル） | Workers tail（401/403 status） | 同 MD §3 | pending |
| relay POST 到達 | tail（user-gated・後続サイクル） | `event: "sheets.auth.alert_relay_post"` / `responseStatus: 200` | 同 MD §4 | pending |
| 通知到達（任意） | Slack / mail（user-gated・後続サイクル） | 着信テキスト要約 | 同 MD §5 | pending（任意） |
| issue-857 implementation-guide 更新 | docs 編集（後続サイクル） | git diff | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` | pending |
| 親 UT-25-DERIV-02 逆参照 | docs 編集（後続サイクル） | git diff | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | pending |

## 証跡件数サマリ（本サイクル時点）

| カテゴリ | PASS | FAIL | SKIP | 備考 |
| --- | --- | --- | --- | --- |
| local contract test | 1 | 0 | 0 | focused vitest 8 tests PASS |
| docs gate（gate-metadata / verify:phase12 / indexes:rebuild） | 3 | 0 | 0 | 本サイクルで取得済み |
| runtime evidence（後続サイクル） | 0 | 0 | 0 | user-gated。本サイクルでは pending |

> 取得後の最新値は `outputs/phase-11/main.md` に反映する。

## 環境ブロッカー（runtime evidence パート）

- runtime 証跡（secret list / staging deploy / tail / SA dry-run）は Cloudflare 環境と user 承認が前提。本サイクル（local observability）の PASS とは別カテゴリ。
- production 実施範囲は deploy ポリシー次第。staging のみ先行となった場合は evidence MD §1 に明記して段階分離する。
