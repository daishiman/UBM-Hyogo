# Lessons Learned — task-27 MVP 3-layer mapping docs-only matrix workflow（2026-05-15）

> task: `task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping`
> 関連 workflow: `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/`
> 関連 final deliverable: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`
> 関連 skill 反映候補: `task-specification-creator/references/phase-12-documentation-guide.md`（state vocabulary 節）/ `task-specification-creator/schemas/artifact-definition.json`
> 関連 reference: `references/task-workflow-active.md`（task-27 行）/ `indexes/resource-map.md` / `indexes/quick-reference.md`

## 背景

`ui-prototype-alignment-mvp-recovery` の MVP recovery cycle 終盤として、22 task の 3 層（公開 6 / 会員 2 / 管理 8）への mapping を docs-only / NON_VISUAL で生成する task-27 を実施した。final deliverable は `MVP-3LAYER-TASK-MAPPING.md` 単一ファイルだが、Phase 12 close-out において「matrix が生成済みなのに root `status` が `spec_created` のまま残る」「workflow_state を root `status` enum に直接書こうとして schema 違反になる」「上流 task-26 が `completed-tasks/` 配下に移動済みで参照 path が drift」の 3 つの構造的論点を踏み抜いた。今後の docs-only matrix 系 task に再発させないため記録する。

## 苦戦した点

### L-T27-001: docs-only matrix workflow の status 遷移ルールが「生成後も spec_created」で固定化していた

- **症状**: 最終成果物（`MVP-3LAYER-TASK-MAPPING.md`）が物理生成され、Phase 5 implementation notes / Phase 7 coverage / Phase 11 manual-test-result も揃った段階で、root `artifacts.json.status` と `outputs/artifacts.json.status` が `spec_created` のまま close されようとした。Phase 13 が PR/commit/push の user-gated だからといって、本体 deliverable が generated 済みであるという事実が status に反映されない構造的バグ。
- **根本原因**: 「matrix は spec の一種だから docs-only タスクは最後まで spec_created」という慣性。`spec_created` は generated 前の文書状態であり、generated 完了後の中間状態を表す語彙が `task-workflow-active.md` 側にしか存在せず、artifacts.json 上では `spec_created → completed` の 2 値しか踏めない錯覚があった。
- **対応**: artifacts.json root `status` を schema enum (`spec_created|in_progress|runtime_pending|completed|on_hold|blocked`) に限定したうえで、「generated 済みだが PR 未承認」の中間表現を `metadata.workflow_state = implemented_local_evidence_captured` 側に逃がし、root `status` は `completed` を採用。Phase 13 の user-gated は `metadata.workflow_state` および phase-12 documentation で明示する。

### L-T27-002: root `status` enum と `metadata.workflow_state` の責任分離

- **症状**: skill feedback で抽出された 2 つの validator gap のうち、`artifacts.json.status` を `schemas/artifact-definition.json` の enum に対して検証するパスが存在しなかったため、`implemented_local_evidence_captured` のような語彙を root `status` にそのまま書いても通ってしまう状態だった。
- **根本原因**: aiworkflow-requirements 側の `task-workflow-active.md` が使う運用語彙（`implemented_local_evidence_captured` / `runtime_pending` / `pending_user_approval` 等）と、`artifact-definition.json` の `status` enum が 1:1 対応していなかった。両者を同列に書くと schema validator が enum violation を見逃すか、逆に運用語彙を捨てるかの二択になっていた。
- **対応**: 役割を明確に分離する。
  - root `status`: `artifact-definition.json` の enum (`spec_created|in_progress|runtime_pending|completed|on_hold|blocked`) のみ採用。
  - `metadata.workflow_state`: aiworkflow-requirements 運用語彙（`implemented_local_evidence_captured` 等）。phase-12 documentation と `task-workflow-active.md` で正本扱い。
  - Phase 12 verification は root `status` を enum 突合し、`metadata.workflow_state` は文字列の存在のみ確認する別レイヤ gate として扱う。

### L-T27-003: 上流 task の `completed-tasks/` 移動後に参照 path が canonical を追従していなかった

- **症状**: task-27 は task-26 (`ui-mvp-w8-par-error-tsx-token-utility-migration`) の common-surface context を入力として参照する設計だが、task-26 は別 wave で `docs/30-workflows/completed-tasks/task-26-…` に移動済みだった。task-27 spec 着手時点の参照 path が移動前の `docs/30-workflows/task-26-…` のままで artifacts inventory・phase 1 input list 等に残り、phase 12 で初めて drift を検出した。
- **根本原因**: completed-tasks 移動を per-task wave で実施したあと、移動先 path を「下流 task の入力 reference」側に反映する後追い同期 step が、`task-workflow-active.md` 更新と独立に進行していた。
- **対応**: completed-tasks 移動を含む wave では、`rg -n "docs/30-workflows/<moved-task>" docs/ .claude/` を必ず実行し、`completed-tasks/` 配下に書き換える。task-27 では task-26 への参照を `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` に統一済み。

## 学び

- `spec_created` は generated 前の文書状態を表す語彙であり、generated 完了後の状態（PR 未承認 / runtime 未取得 等）には別語彙を用意する。docs-only / matrix / report 単一生成 task でも root `status` は generated 完了で `completed` を踏める。
- root `status` は schema enum、`metadata.workflow_state` は運用語彙、という 2 層構造を docs-only / runtime いずれの task でも維持する。両者を混在させると validator が effective に効かなくなる。
- completed-tasks 移動は「移動」だけでなく「下流参照の path 更新」までを 1 wave のスコープに含める。`rg` による canonical path grep を移動 wave の Phase 12 entry checklist に固定する。

## 再発防止策

1. **task-specification-creator schemas/artifact-definition.json**: root `status` enum を変更する場合は aiworkflow-requirements 運用語彙との分離意図を SKILL-changelog に明示する。運用語彙を enum に混ぜない。
2. **Phase 12 verification**（skill feedback の昇格候補）:
   - root と output `artifacts.json` の `status` を `artifact-definition.json` enum と突合する validator gap を `validate-phase-output.js` 等に追加。
   - Phase 11 evidence path が `present` 宣言されているが physical に存在しない場合に FAIL とする validator gap を同時に追加。
3. **docs-only matrix close-out checklist**: final deliverable 物理生成済みかつ Phase 5/7/11 evidence が揃った時点で、root `status` を `completed`、`metadata.workflow_state` を `implemented_local_evidence_captured` に同 wave で揃える。Phase 13 が user-gated なら `metadata.workflow_state` 側で表現し、root `status` を `spec_created` のまま残さない。
4. **completed-tasks 移動 wave の固定手順**: 移動と同 wave で `rg -n "docs/30-workflows/<moved-task>(?!/completed-tasks)"` を実行し、hit 行を全件 `completed-tasks/` 配下 path に書き換える。`task-workflow-active.md` / `resource-map.md` / `quick-reference.md` / 下流 task の artifact inventory / phase 1 input list が対象範囲。

## 関連参照

- Artifact inventory: `references/workflow-task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping-artifact-inventory.md`
- Workflow root: `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/`
- Final deliverable: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`
- Phase 12 outputs: `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-12/{skill-feedback-report,system-spec-update-summary,phase12-task-spec-compliance-check,documentation-changelog,unassigned-task-detection,main,implementation-guide}.md`
- Changelog: `changelog/20260515-task27-mvp-3layer-mapping-sync.md`
- 先行 lessons: `lessons-learned-task-23-docs-only-final-deliverable-state-gate-2026-05.md`（matrix 単一生成型の Phase 12 strict 7 / final deliverable state gate）
- 関連 skill 参照: `task-specification-creator/references/phase-12-documentation-guide.md`（final deliverable state gate）/ `task-specification-creator/schemas/artifact-definition.json`（root status enum）
- 上流 completed task: `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/`
