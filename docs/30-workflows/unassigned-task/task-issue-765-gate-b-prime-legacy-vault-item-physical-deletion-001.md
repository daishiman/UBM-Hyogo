# Issue #765 Gate B' — 1Password legacy vault item 物理削除 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| タスクID     | task-issue-765-gate-b-prime-legacy-vault-item-physical-deletion-001                   |
| GitHub Issue | 未採番（`Refs #765`、本仕様書 Issue 化後に追番）                                       |
| 親 Issue     | #765 (1Password vault restructure + OIDC cutover)                                     |
| タスク名     | legacy 1Password item の archive→物理削除（Gate B'）                                  |
| 分類         | 運用 / 破壊的クリーンアップ (operation / destructive cleanup)                         |
| 対象機能     | 1Password UBM-Hyogo vault の legacy Cloudflare token item 群                          |
| 優先度       | 中 (medium) — Gate B (canonical path cutover) 完了 + dormant 観察期間経過後にのみ着手 |
| 見積もり規模 | 小規模（operator 手動操作）+ 観察期間あり                                              |
| ステータス   | 未実施 (open / pending Gate B completion)                                             |
| 親タスク     | `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/`                |
| 発見元       | issue-765 workflow Phase 12 unassigned-task-detection / Gate B' subgate                |
| 発見日       | 2026-05-18                                                                            |
| 承認         | 削除実行前にユーザー（operator）の明示承認が必須（destructive operation）              |

---

## 背景 / Why

Issue #765 で Cloudflare deploy token の op:// 参照 path を canonical（`op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production`）へ統一した。
canonical cutover（Gate B）と、legacy item（`op://Cloudflare/API Token/credential` 系 4 パターン）の物理削除（Gate B'）は同一 wave で実行してはならない。

理由:
- canonical cutover 直後に CI / runtime smoke の安定が確認されるまでは、legacy item を残しておくことが緊急 rollback の戻り先になる。
- 1Password 側に operator-only mutation API がないため、削除操作のロールバックは「item 再作成 + 値再投入」となり、コストが高い。
- legacy item を dormant 状態（参照ゼロ）で観察期間維持してから削除する分離運用が必須。

## スコープ

### 含む

- Gate B（canonical path cutover）完了の確認（CI / staging / production すべての runtime smoke 通過、grep gate after log green）。
- legacy item 参照ゼロの確認（`scripts/verify-onepassword-op-uri-canonical.sh` deny regex hit ゼロ、`.env.example` / `.dev.vars.example` / `scripts/cf.sh` / docs / skill references すべて canonical 化済）。
- dormant 観察期間（最低 14 日）の運用記録（開始日 / 終了日 / 観察期間中のインシデント有無）。
- 1Password operator による legacy item の archive（先に archive → 物理削除は別ステップ）。
- archive 状態で再度観察期間（最低 7 日）。
- ユーザー（operator）明示承認後の物理削除実行。
- redacted evidence 保存（item title / vault path のみ、token 値・参照 URI 値・OAuth 値を含めない）。
- `aiworkflow-requirements` 正本仕様の legacy item 言及箇所の削除済みステータス更新。

### 含まない

- canonical path への migration 実装（Issue #765 本体で扱う）。
- OIDC cutover（Issue #717 / #765 OIDC 部で扱う）。
- WAF 用 token (`op://UBM-Hyogo/Cloudflare-WAF/api_token_waf`) の整理（別 path / 別 lifecycle）。
- Cloudflare API token 自体の revoke（Issue #718 で扱う）。

## 受け入れ基準（AC）

| AC   | 要件                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| AC-1 | Issue #765 Phase 11 evidence（grep-gate-after.log / cf-whoami-after.log）が green                          |
| AC-2 | `bash scripts/verify-onepassword-op-uri-canonical.sh` が deny regex hit ゼロで pass                        |
| AC-3 | dormant 観察期間（最低 14 日）の記録が存在し、期間中に legacy item 参照が発生していない                     |
| AC-4 | legacy item が archive 状態へ遷移し、archive 後の観察期間（最低 7 日）が記録されている                     |
| AC-5 | 物理削除操作にユーザー（operator）の明示承認が記録されている（Issue comment / PR description）             |
| AC-6 | evidence に 1Password token 値 / Cloudflare API token / OAuth value / 参照 URI 値が含まれていない          |
| AC-7 | `aiworkflow-requirements` 正本仕様（`deployment-secrets-management.md` 等）の legacy item 言及が削除済みへ更新 |

## 苦戦箇所【記入必須】

本未タスクは Issue #765 workflow（Phase 1-13）の作成過程で formalize された。親仕様の苦戦点を申し送る。

- 対象: `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/outputs/phase-11/`
- 症状: 1Password vault の mutation には operator API の audit trail が無く、削除操作の evidence は (a) operator-approval-record.md と (b) item-status-before/after.md の 2 種に依存する。CI で自動検証できないため、Phase 11 evidence ledger の人手レビューが「PASS」判定の最終根拠になる。Phase 11 完了 = 物理削除完了と短絡しないよう、Gate B' を別 wave として独立化させる必要があった。
- 申し送り: Gate B' 実行時も同様に `phase-11/onepassword-item-status-before.md` / `after.md` を redacted で残し、削除 evidence の人手レビュー記録を明文化する。

- 対象: `scripts/verify-onepassword-op-uri-canonical.sh`
- 症状: deny regex は 4 種の legacy path（`op://Cloudflare/API Token/credential` 等）をカバーするが、operator が GUI で item を改名すると追従漏れが起き得る。grep gate は「ファイル中の参照 URI」しか見ない。
- 申し送り: Gate B' 直前に `op item list --vault UBM-Hyogo` 系の operator 確認手順を runbook に明記し、deny regex に無い variant が GUI 改名で生まれていないか目視確認する。

- 対象: rollback readiness（Gate B' 実行後の戻り先）
- 症状: 1Password の archive→delete は item 復元コストが高い。canonical path 群が runtime / CI / docs / skill に伝播済みであることを前提に Gate B' を踏むため、Gate B' 後の rollback は「item 再作成 + 値再投入 + canonical path 変更」の三段になる。
- 申し送り: dormant 観察期間（14 日）+ archive 後観察期間（7 日）を必ず確保する。短縮判断は operator 明示承認の上のみ可。

## 依存

- 前提: Issue #765 Gate B（canonical path cutover）完了。
- 前提: CI gate `verify-onepassword-op-uri-canonical` が常時 green。
- 前提: OIDC cutover（Issue #717 followups）完了。
- ブロック: なし（独立タスク、後続なし）。

## 参照

- 親仕様: `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/`
- 関連 unassigned-task: `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md`（consumed_pending_issue_765_gate_b）
- 検証スクリプト: `scripts/verify-onepassword-op-uri-canonical.sh`
- 正本仕様: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
