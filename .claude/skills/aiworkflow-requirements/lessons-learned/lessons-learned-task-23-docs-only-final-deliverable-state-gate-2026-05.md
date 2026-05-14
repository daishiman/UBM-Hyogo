# Lessons Learned — task-23 docs-only Final Deliverable State Gate（2026-05-14）

> task: `task-23-ui-mvp-w8-par-verification-status-matrix`
> 関連 workflow: `docs/30-workflows/completed-tasks/task-23-ui-mvp-w8-par-verification-status-matrix/`
> 関連 final deliverable: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md`
> 関連 skill 反映: `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`（`v2026.05.14-task23-docs-only-final-deliverable-state-gate`）
> 関連 reference: `task-workflow-active.md`（task-23 行）/ aiworkflow-requirements `resource-map.md` / `quick-reference.md`

## 背景

`ui-prototype-alignment-mvp-recovery` の MVP recovery cycle で、22 task × 4 condition = 88 セルの matrix 検証を docs-only / NON_VISUAL で生成する task-23 を実施した。matrix は `VERIFICATION-STATUS.md` 単一 final deliverable に集約されるが、Phase 12 close-out で「planned final deliverable」「contract-only evidence」「runtime evidence」の 3 状態区別が曖昧になり、generated 済み deliverable と planned wording が並存する drift が起きやすかった。これを skill 側に gate として戻すまでの教訓を記録する。

## 教訓一覧

### L-T23-001: docs-only / matrix 単一生成型でも Phase 12 strict 7 ファイルは省略不可

- **背景**: `spec_created` / docs-only / NON_VISUAL の matrix task では「report 単一生成だから Phase 12 outputs は軽量でよい」と省略しがちで、`outputs/phase-12/` 配下に `main.md` / `implementation-guide.md` / `phase12-task-spec-compliance-check.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` の **strict 7 ファイル**を物理生成しないまま compliance を主張するケースが発生した。
- **教訓**: docs-only / matrix / report 単一生成型でも canonical 7 ファイルは **strict・別名なし**で物理存在必須。簡略化は各ファイルの「内容の thin / 短文化」で対応し、「ファイル自体を省略する」方向には**逃げない**。
- **将来アクション**: Phase 12 着手時にまず `ls outputs/phase-12/{main,implementation-guide,phase12-task-spec-compliance-check,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md` を実行し、7 ファイル存在を validator として `documentation-changelog.md` の Validator Execution Log に転記する。

### L-T23-002: final deliverable 物理生成済みなら root state を `implemented_local_evidence_captured` へ同 wave 統一

- **背景**: `final_deliverable` や Phase 5 成果物が物理生成済みなのに、`index.md` / `artifacts.json` / `outputs/artifacts.json` / `outputs/phase-11/*` / `outputs/phase-12/*` や aiworkflow indexes に `planned` / `future` / `not generated` / `no impl yet` が残ったまま PASS にしてしまう state drift がおきた。
- **教訓**: 生成済み deliverable を採用するなら root state を `implemented_local_evidence_captured`（または `completed`）に**同一 wave で統一**し、Phase 5/7/9 の deterministic evidence を実ファイルとして保存する。まだ未生成で閉じるなら `final_deliverable` 実体を差分に含めない。**両者の混在は Phase 12 FAIL**。
- **将来アクション**: Phase 12 close-out 前に `rg -n "planned|future|not generated|no impl yet" <workflow-root>` を実行し、hit 行を generated/completed 状態と矛盾しない表現へ補正する。skill feedback の gate 用語として `planned final deliverable` を定義／参照する文脈の hit は drift ではないが、その判定を `documentation-changelog.md` Validator Execution Log に明記する。

### L-T23-003: `required_at` wording で planned / generated を時間軸ごとに分離する

- **背景**: 成果物 inventory に `planned` と `generated` を同じ行に並置すると、「後で出すもの」と「いま出ているもの」の区別が消える。task-23 では matrix が「現時点必須の contract-only evidence」なのか「後で出す final deliverable」なのかが artifacts.json 単行表記では読めなかった。
- **教訓**: 成果物 inventory は `required_at` / `planned` / `generated` / `completed` を**明示**し、`planned final deliverable` と `generated evidence` を**同じ行で混ぜない**。`required_at: phase-5` 等の生成タイミング表記を必ず入れる。
- **将来アクション**: matrix / report 単一生成型 task の artifacts.json / outputs/artifacts.json には `required_at` field を明示する。task-specification-creator skill の Phase 12 guide `final deliverable state gate` 節（v2026.05.14）と整合させる。

### L-T23-004: docs-only NON_VISUAL でも apps/ / packages/ 隣接 diff を Phase 12 entry checklist で必ず観測

- **背景**: docs-only / NON_VISUAL の task でも、同一 worktree 内で `apps/` / `packages/` の dirty diff が並走している場合があり、task primary deliverable の PASS 根拠と隣接 diff を混ぜると compliance check の信頼性が壊れる。
- **教訓**: Phase 12 着手の最初の手で `git status --porcelain apps/ packages/` および `git diff --name-only main...HEAD -- 'apps/**' 'packages/**'` を実行し、**生出力ごと** `documentation-changelog.md` 冒頭の Entry Checklist セクションに転記する。1 件以上 hit した場合は「当該 task の実装差分として再分類」または「task 外の隣接 diff として `system-spec-update-summary.md` / `unassigned-task-detection.md` / compliance check に分離記録」のどちらかを明記する。0 件でも「0 件確認済」と明示記録する。
- **将来アクション**: aiworkflow-requirements の Phase 12 entry checklist として task-23 documentation-changelog の現行テンプレートを正本扱いとし、新規 docs-only task の Phase 12 着手時に複製・差し替えで利用する。

### L-T23-005: skill feedback は同 wave で promotion target / no-op reason / evidence path の 3 要素を明示

- **背景**: skill feedback を `outputs/phase-12/skill-feedback-report.md` に残しても、「どの skill のどのファイルに昇格したか」「昇格しなかったものは何故か」「evidence 行はどこか」の 3 要素が揃わないと、後の wave で再昇格忘れや重複 promotion が起きる。
- **教訓**: skill-feedback-report.md には各項目を `promotion target` / `no-op reason` / `evidence path` の 3 要素で記録する。task-23 では 3 件を `task-specification-creator/references/phase-12-documentation-guide.md` + `SKILL-changelog.md` へ same-wave 反映し、no-op となった項目（topic-map / keywords 再生成、LOGS.md 二重記帳）はその理由を明記した。
- **将来アクション**: `phase-12-documentation-guide.md` の Task 12-5（skill feedback）節に 3 要素フォーマットを明示し、validate-phase12-implementation-guide.js の対象に skill-feedback-report.md の 3 要素 grep を将来追加する候補とする。

## index 反映状況

task-23 は以下の 3 indexes に登録済み（2026-05-14 wave）:

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

skill promotion 状況:

- `task-specification-creator/references/phase-12-documentation-guide.md` に 3 件昇格（final deliverable state gate / `required_at` wording gate / planned wording grep 前 close-out gate）
- `task-specification-creator/SKILL-changelog.md` に `v2026.05.14-task23-docs-only-final-deliverable-state-gate` で履歴反映

## 関連 task

- task-27 (`ui-mvp-w9-solo-mvp-3-layer-task-mapping`): task-23 の matrix を入力 gate として参照する spec_created 後続 task。本 lessons の L-T23-001 / L-T23-002 / L-T23-003 は task-27 にも適用される。
