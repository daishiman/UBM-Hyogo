# システム正本更新サマリ — issue-230-lefthook-edit-guard

> 本 workflow は **implemented_local_runtime_pending**。システム正本更新は本サイクルで実施済み。
> CI run / commit / push / PR / Issue mutation のみ user-gated。

## Step 1-A: CLAUDE.md「Git hook の方針」節への追記（完了）

`CLAUDE.md` の「Git hook の方針」節（`lefthook.yml` が hook の正本 / `.git/hooks/*` の手書き禁止を
明記している箇所）に、新設した 2 つの enforcement の存在を追記済み。

- 追記内容:
  - pre-commit `lefthook-edit-guard`（`scripts/hooks/lefthook-edit-guard.sh`）が、手書き
    `.git/hooks/*` と `lefthook.yml` の無 ack 直編集を検知して block すること。
  - `lefthook.yml` を意図的に編集する場合の正式経路は `LEFTHOOK_EDIT_ACK=1 git commit ...` で
    あること（AC-2 ack ゲート）。
  - CI gate `verify-hook-integrity`（`.github/workflows/verify-hook-integrity.yml` /
    `scripts/verify-hook-integrity.sh`）が、`lefthook.yml` の参照スクリプト実在 + tracked stray
    hook 不在 + `min_version` 健全性を検証すること。
- AC-3 の「拒否メッセージから方針へ辿れる」アンカーとして、guard メッセージがこの節を指す。
- **本サイクルで完了**。

## Step 1-B: lefthook-operations.md への新 guard 運用節追記（完了）

`docs/00-getting-started-manual/lefthook-operations.md` に新 guard の運用節を追記済み。

- 追記内容:
  - `lefthook-edit-guard` の発火条件（staged `lefthook.yml` / 手書き `.git/hooks`）と除外条件
    （`.sample` / lefthook 署名 managed hook / merge・rebase・cherry-pick skip）。
  - `LEFTHOOK_EDIT_ACK=1` による意図編集の通し方と、その際の責務（設計図変更の周知）。
  - `verify-hook-integrity` の local / CI 共用での使い方（`bash scripts/verify-hook-integrity.sh`）。
- このファイルは AC-3 のリンク先（guard メッセージが指す詳細ドキュメント）。
- **本サイクルで完了**。

## Step 1-C: aiworkflow-requirements / task-specification-creator 同一 wave 同期（完了）

workflow discoverability と skill-feedback の正本反映は同一 wave で実施済み。
本 automation-30 改善で以下を更新済み:

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-230-lefthook-edit-guard-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- `.claude/skills/task-specification-creator/references/patterns-validation-and-audit.md`
- `.claude/skills/task-specification-creator/SKILL-changelog.md`

## Step 1-D: 関連タスク・正本順位

- hook 正本: `lefthook.yml` / `docs/00-getting-started-manual/lefthook-operations.md`
- 発見元（親）: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/`（U-6）
- 既存 guard 実装パターン: `scripts/hooks/block-test-suffix.sh`
- 既存 CI gate テンプレート: `.github/workflows/verify-test-suffix.yml`

## Step 2: API / DB / UI ランタイム正本更新の要否

`N/A`（API endpoint / D1 schema / UI component / deployment runtime / package interface のいずれも
変更しない）。本 workflow は git-hook governance / CI gate のタスクであり、`apps/` `packages/` の
ランタイム正本には影響しない。本サイクルで必要なシステム同期は、新規 workflow の
discoverability、state/evidence 境界、hook governance の実装済み状態であり、aiworkflow-requirements
skill とプロジェクト正本へ反映済み。
