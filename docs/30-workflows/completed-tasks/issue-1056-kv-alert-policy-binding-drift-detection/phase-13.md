# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフト検知（issue-1056 / issue-57-followup-003） |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-06-02 |
| 前 Phase | 12 (ドキュメント更新) |
| 次 Phase | なし |
| 状態 | pending_user_approval |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / NON_VISUAL / tooling |
| 承認 | **ユーザー明示承認があるまで commit / push / PR 作成 / Issue mutation は実行禁止** |

## 目的

Phase 1〜12 の仕様書整備成果と、今回サイクルで生成した実コード変更（検知モジュール / CLI / 回帰 spec / CI gate / 棚卸し表追記）を 1 PR として提出できる状態にまとめる。ただし、**ユーザーの明示承認なしに commit / push / PR 作成 / Issue mutation は実行しない**。本ワークフローは **implemented_local_evidence_captured** であり、PR base は CLAUDE.md の PR 完全自律フローに従い `dev`。

## 変更ファイル（今回生成・PR 対象）

| # | パス | 種別 | 変更内容 |
| --- | --- | --- | --- |
| 1 | infra/cloudflare-alerts/lib/binding-policy-drift.ts | 新規 | 型 + `BINDING_POLICY_MAP` + `parseActiveBindings` + `buildBindingPolicyDrift` + `loadActiveBindings` |
| 2 | infra/cloudflare-alerts/lib/cli.ts | 編集 | `cmdBindingDrift` / `printBindingDrifts` 追加、switch + usage 追記 |
| 3 | infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts | 新規 | 回帰 spec（AC-6 の (a)〜(f)） |
| 4 | scripts/cf.sh | 編集 | alerts allowlist + usage に `binding-drift` |
| 5 | package.json | 編集 | `cf:alerts:binding-drift` script 追加 |
| 6 | .github/workflows/cloudflare-alerts-drift.yml | 編集 | paths に `apps/api/wrangler.toml`、`validate` job に `binding-drift --ci` step |
| 7 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 編集 | binding↔policy 対応表 + UT-17-followup-006 責務境界追記 |

## 実行タスク

1. 差分範囲を確認する（`git status --short` / `git diff dev...HEAD --name-only`）。完了条件: PR に含めるファイル一覧が取得できている。
2. PR 本文案を作成する（AC-1〜AC-9 / 調査結論 / 変更ファイル 7 件 / issue #1056 OPEN 維持注記 / 検証計画 / user-gated 境界）。完了条件: outputs/phase-13/main.md に PR 本文骨子。
3. commit / push / PR 作成 / Issue mutation はユーザー承認を得てから実行する（base=dev）。完了条件: 承認後にのみ `gh pr create --base dev`。

## PR 本文骨子

- **概要**: KV/R2 binding 活性状態 ↔ Cloudflare alert policy `enabled` 状態のドリフトを read-only で検知する CLI サブコマンド `cf.sh alerts binding-drift` と回帰 spec / PR CI gate を新設（issue #1056 / issue-57-followup-003）。
- **調査結論**: 既存 `alerts diff`（宣言 vs デプロイ）・#1054（wrangler 三者ドリフト）いずれも binding 活性 ↔ policy enabled 軸を持たず #1056 未解決。issue アンカー陳腐化なし。現状 drift 0 件（green baseline）。
- **drift 2 種**: `MONITORING_GAP`（binding active かつ policy `enabled:false`）/ `STALE_MONITORING`（binding inactive かつ policy `enabled:true`）。
- **変更ファイル 7 件**: 上記表。
- **AC-1〜AC-9**: 対応表 / drift 2 種 read-only / コメント尊重 line parser / baseline green / CLI exit 0·2·64 / 回帰 spec (a)〜(f) / PR CI gate / 棚卸し表追記 / 4 条件 PASS。
- **検証計画**: `pnpm test:alerts`（回帰 spec 全緑）/ `bash scripts/cf.sh alerts binding-drift`（exit 0）/ `--json`（空配列）/ typecheck / lint。
- **issue 注記**: issue #1056 は実測 **OPEN**（`closedAt: null`）。本 PR では Issue state を変更しない（close / reopen はユーザー承認まで行わない）。
- **責務境界**: policy 実有効化判断は UT-17-followup-006 / 運用設定は #85 / #75 / #77 へ委譲。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/commands/ai/diff-to-pr.md | PR 本文仕様 / PR 完全自律フロー |
| 必須 | （本ワークフロー）phase-12.md | close-out / 成果物一覧 |
| 必須 | （本ワークフロー）outputs/phase-12/implementation-guide.md | PR 本文へ反映する実装ガイド |
| 必須 | （本ワークフロー）phase-02.md | 変更ファイル 7 件の根拠 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | CLI 回帰 smoke（baseline exit 0）を PR 検証計画の根拠として参照 |
| Phase 12 | Phase 12 成果物一式を PR 本文へ反映 |

## 多角的チェック観点（AIが判断）

- Phase 13 が自動実行されていないか（承認前に commit / push / PR / Issue mutation を実行しない）。
- issue #1056 を OPEN のまま扱う方針と矛盾していないか（close / reopen しない）。
- 実装完了済み範囲と user-gated 操作を混同していないか。
- PR base が `dev` であることを確認しているか（production リリース時のみ `main`）。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 差分確認 | pending | commit 前 |
| 2 | PR 本文案 | pending | 承認前 |
| 3 | commit / push / PR / Issue mutation | pending_user_approval | 自動実行禁止 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| PR 準備 | outputs/phase-13/main.md | PR 本文案・差分サマリー・承認待ち状態 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] PR 本文案（AC-1〜AC-9 / 変更ファイル 7 件 / issue OPEN 注記 / 検証計画）が作成されている
- [ ] ユーザー承認前に commit / push / PR 作成 / Issue mutation を実行していない
- [ ] Phase 13 の承認待ち状態（pending_user_approval）が明記されている
- [ ] PR base が `dev` であることが明記されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク（3 件）が completed または pending_user_approval
- [ ] 成果物が `outputs/phase-13/main.md` に配置済み

## 次 Phase への引き渡し

- なし（最終 Phase）
- 残務: ユーザー承認後の commit / push / PR 作成（base=dev）+ Issue #1056 の扱い判断
