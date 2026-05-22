# UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER — Verify indexes trigger and recovery runbook

> **[実装区分: NON_VISUAL 実装 (runbook + hook config)]**
> **判定根拠 (CONST_004)**: AC-1〜AC-4 は `docs/00-getting-started-manual/lefthook-operations.md` への追記で閉じる。一方 AC-5 は `lefthook.yml` の `indexes-drift-guard.fail_text` から SOP へ読者が辿れることを要求するため、hook 実行ロジックは変えず、失敗文に runbook 導線を 1 行追加する。`.github/workflows/verify-indexes.yml` は現状実装が要件を満たすため変更しない。`scripts/hooks/indexes-drift-guard.sh` は実行ロジックを維持し、ユーザー向け復旧コマンド表記のみ `mise exec -- pnpm indexes:rebuild` に統一する。

## メタ情報

```yaml
issue_number: 289
issue_state: CLOSED  # 2026-05-17 closed
task_id: UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER
task_name: Verify indexes trigger and recovery runbook
category: 改善 / docs-impl
target_feature: aiworkflow requirements index gate
priority: 低
scale: 小規模
status: implemented_local_evidence_captured
source_phase: UT-CICD-DRIFT Phase 12
created_date: 2026-04-29
optimized_date: 2026-05-17
dependencies: [#58]
spec_root: docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/
```

## 現状コードに最適化した範囲（2026-05-17 時点）

原 issue は 2026-04-29 起票で、その後 pre-push hook 群 (`indexes-drift-guard.sh`) が導入され **CI 失敗を構造的に preempt** している。本仕様書は以下を踏まえて再設計する:

| 原 issue 想定 | 現状の retarget |
|---|---|
| `deployment-gha.md` に trigger 条件記述 | `docs/00-getting-started-manual/deployment-gha.md` は存在しない。`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` は CI/CD 正本として残しつつ、開発者復旧 SOP は hook 運用正本 `lefthook-operations.md` に統合 |
| CI 失敗 → ローカル `pnpm indexes:rebuild` → 再 push の SOP | pre-push hook が drift を先回りブロックするため SOP は「pre-push 拒否時の対処 + (例外的に) CI 失敗時の対処」の二段構成に再構成 |
| 失敗時 runbook | pre-push hook の `fail_text` と SOP 文書を相互参照させる |

## Phase 一覧

| Phase | 成果物 | パス |
|---|---|---|
| 1 | 課題定義・スコープ確認 | `outputs/phase-1/scope.md` |
| 2 | 現状調査・既存資産インベントリ | `outputs/phase-2/inventory.md` |
| 3 | 設計（追記対象 / 章構成 / 文書間リンク方針） | `outputs/phase-3/design.md` |
| 4 | タスク分解 (WBS) | `outputs/phase-4/wbs.md` |
| 5 | 編集対象ファイル一覧・差分方針 | `outputs/phase-5/edit-targets.md` |
| 6 | 文章ドラフト（追記する本文の素案） | `outputs/phase-6/draft.md` |
| 7 | リンク整合性チェック方針 | `outputs/phase-7/link-check.md` |
| 8 | Before/After 差分プレビュー | `outputs/phase-8/before-after.md` |
| 9 | レビュー観点 | `outputs/phase-9/review.md` |
| 10 | 受入条件 (AC) 検証手順 | `outputs/phase-10/ac-verification.md` |
| 11 | 手動検証ログ枠 | `outputs/phase-11/manual-smoke-log.md` |
| 12 | 実装ガイド（後続実行者向け SSOT） | `outputs/phase-12/implementation-guide.md` |
| 13 | PR 用 diff-to-pr 要点 | `outputs/phase-13/diff-to-pr.md` |

## 受入条件 (AC)

- [x] AC-1: `verify-indexes.yml` の trigger 条件（push: main / pull_request: main, dev）と status context 名 `verify-indexes-up-to-date` が `lefthook-operations.md` に記述される
- [x] AC-2: pre-push hook 拒否時 / CI 失敗時の SOP が `lefthook-operations.md` 内 1 セクションで完結する
- [x] AC-3: SOP に `mise exec -- pnpm indexes:rebuild` が正規経路として記載される
- [x] AC-4: 手編集禁止と generator (`pnpm indexes:rebuild`) 単独正本の方針が明記される
- [x] AC-5: 既存 `lefthook.yml` の `indexes-drift-guard` `fail_text` から SOP セクションへの導線が読者目線で辿れる（詳細リンク 1 行を追加）

## 関連

- 関連: `docs/30-workflows/unassigned-task/U-VIDX-01-verify-indexes-actions-smoke-and-branch-protection.md`
- 関連: `docs/30-workflows/unassigned-task/U-VIDX-02-other-skill-indexes-gate-adr.md`
- 親: `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md`（原仕様書、保持）
- 正本 workflow: `.github/workflows/verify-indexes.yml`
- 正本 hook: `scripts/hooks/indexes-drift-guard.sh` / `lefthook.yml`
- 正本 docs: `docs/00-getting-started-manual/lefthook-operations.md`
