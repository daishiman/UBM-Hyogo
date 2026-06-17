# Phase 12 — skill feedback report

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

task-specification-creator / aiworkflow-requirements skill への改善点を記録する（なくても出力）。

## 改善点

### F-1: implemented_local_evidence_captured VISUAL の §4 inventory で screenshot を pending にする運用の明文化

VISUAL かつ implemented_local_evidence_captured のタスクでは、UI 実装と機械検証は完了していても、authenticated staging / seed apply / runtime visual capture が user-gated の場合 screenshot は物理的に存在しない。`verify-phase12-compliance` の §4 evidence inventory は **Status=present の行のみ物理 file 存在を検査**するため、未撮影 screenshot は必ず `pending` にする必要がある。この「implemented_local_evidence_captured VISUAL では screenshot 行を pending にし、capture-metadata は `status: pending_implementation` にする」という運用を、skill の references（phase11/phase12 テンプレ）に明文化すると、毎回の判断ブレ（present で書いて gate fail）を防げる。

反映先: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（VISUAL + implemented_local_evidence_captured の screenshot pending rule）へ本サイクルで追記済み。

### F-2: implemented_local_evidence_captured の Step 1-B（global skill 反映）を「本サイクル」と明示する導線

implemented_local_evidence_captured サイクルでは global skill（aiworkflow-requirements の active/index/inventory/changelog）反映を同一サイクルで完了させるのが正しい。changelog テンプレに「implemented_local_evidence_captured の場合は active / index / inventory / changelog へ本サイクル反映」の分岐例があると、close-out 送りや N/A 扱いによる同期漏れを防げる。

反映先: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（same-wave sync gate）と `.claude/skills/task-specification-creator/{SKILL.md,SKILL-changelog.md}` へ本サイクルで追記済み。

### F-3: API 不変タスクの AC に `git diff` 範囲を明記する型

「API 非変更」を AC に含むタスクでは、`git diff -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared`（concern の testing/seed を除く）という具体的な diff 範囲を AC 本文に書く型があると、実装済みの検証が決定論的になる。本タスクは AC-8 で既にこの型を採用しており、横展開価値がある。

判定: 既存 `phase12-compliance-check-template.md` の verification commands と本 workflow の AC-8 でカバーできるため no-op。次に同種漏れが再発した場合に専用 reference へ昇格する。

## 良かった点（維持したい型）

- shared-context.md を文言・seed 仕様の単一正本にし、各 phase が引用する構成は、SubAgent 並列時の文言ドリフトを防いだ。
- glossary（`matchedFieldLabel`・未登録 fail-soft）/ Guide component を先行タスク（dashboardGlossary / tagManagementGlossary / TagManagementGuide）の命名規則に倣ったことで、命名探索コストがゼロ。
- seed を専用 dataset（identity-conflicts）に分離し既存 test-accounts を不変にした方針は、contract test の責務を明確化した。
