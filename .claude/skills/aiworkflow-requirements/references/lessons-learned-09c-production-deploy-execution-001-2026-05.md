# lessons-learned: 09c Production Deploy Execution Spec 苦戦箇所（2026-05-02）

> 対象タスク: `docs/30-workflows/09c-production-deploy-execution-001/`
> 状態: `spec_created` / implementation / `VISUAL` / production runtime evidence pending_user_approval
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection}.md`

09c production deploy execution は Wave 9 終端の本番反映 spec である。次回 production deploy / approval-gated execution 系タスクで同じ判断を短時間で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-09C-EXEC-001: 親 docs-only と child execution-only は別ワークフローに分離する

**苦戦箇所**: 親 09c は runbook / evidence template 仕様であり、production mutation を含まない。だが production execution を同 root に押し込もうとすると、Phase 11 の reserved runtime path が PASS evidence と誤認され、`spec_created` と `runtime_completed` の lifecycle が混線する。

**5分解決カード**: production runtime mutation を伴う実行は親と別 workflow を作る。`docs/30-workflows/<NN>-<topic>-execution-001/` を立て、親へは `Source runbook` 参照のみを残す。Phase 12 `system-spec-update-summary.md` で `PASS_WITH_OPEN_SYNC` を判定し、runtime facts は実行後の close-out wave で同期する。

**promoted-to**: `task-specification-creator/references/phase-12-spec.md` (lifecycle separation pattern), `aiworkflow-requirements/references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md`

## L-09C-EXEC-002: reserved runtime path を PASS evidence にしない

**苦戦箇所**: `outputs/phase-09/screenshots/*.png` や `outputs/phase-11/screenshots/analytics-*.png` のような placeholder path を file existence check で PASS と判定すると、production mutation 未実行のまま runtime PASS を主張してしまう。

**5分解決カード**: Phase 12 compliance check の `Phase Output Inventory` 表で `Output state` (file 存在) と `Runtime interpretation` (実行有無) を 2 列分離する。reserved runtime path は file 存在 = `exists` / runtime = `not_executed` / `not_captured` と必ず併記する。skill 側 `phase12-task-spec-compliance-check.md` テンプレに 2 列分離を強制する。

**promoted-to**: `task-specification-creator/references/quality-gates.md` (Phase 11/12 reserved path 状態分離), `task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## L-09C-EXEC-003: production mutation gate は G1/G2/G3 を分けて記録する

**苦戦箇所**: 「user approval 1 回」で deploy 全体を進めると、Preflight 失敗時の rollback 判断、smoke 失敗時の GO/NO-GO 判断、24h anomaly 時の incident 起票がすべて同 gate に乗ってしまう。

**5分解決カード**: Phase 1 (G1: kickoff) / Phase 5 (G2: mutation entry) / Phase 10 (G3: GO/NO-GO) を独立 gate として approval matrix に明記する。Phase 13 PR 作成承認は **production approval には数えない** ことも併記し、PR 承認 = production 承認の混同を避ける。

**promoted-to**: `task-specification-creator/references/phase-13-spec.md`, `aiworkflow-requirements/references/deployment-cloudflare.md` (production approval gate matrix)

## L-09C-EXEC-004: Phase 12 strict 7 filenames は drift 検出を Phase 11 終了時に前倒す

**苦戦箇所**: Phase 12 で初めて strict 7 filenames を確認すると、`phase12-task-spec-compliance-check.md` 自体の命名漏れが Phase 12 内で連鎖発覚し、close-out wave で複数 rename が発生する。

**5分解決カード**: Phase 11 終了時 (Phase 12 着手前) に `task-specification-creator` の Phase 12 strict 7 filenames を grep で照合し、drift があれば Phase 12 着手前に rename / 新規作成する。`outputs/artifacts.json` の有無も同タイミングで判断し、root-only parity の例外宣言が必要なら Phase 12 compliance check に明示する。

**promoted-to**: `task-specification-creator/references/phase12-pitfalls.md`, `task-specification-creator/references/phase-12-spec.md` strict 7 filenames pre-check section

## L-09C-EXEC-005: Issue close 状態は `Refs #N` を使い `Closes` を再付与しない

**苦戦箇所**: Issue が既に CLOSED な状態で execution-only workflow を作ると、PR 本文に `Closes #N` を書いてしまい、reopened or duplicated close 状態になる。

**5分解決カード**: source issue が CLOSED なら PR 本文は `Refs #N` のみとし、`Closes` は使わない。Phase 12 `system-spec-update-summary.md` の Step 1-A に `Issue: #N remains CLOSED and is referenced with Refs #N` を必ず記録する。Phase 13 PR body テンプレからも `Closes` を除外する。

**promoted-to**: `task-specification-creator/references/phase-13-spec.md` (PR body issue reference rule), `github-issue-manager` skill PR body section

## L-09C-EXEC-006: follow-up の existing detection を新規化と分離する

**苦戦箇所**: `unassigned-task-detection.md` に検出した follow-up candidate をすべて新規 task として記録すると、`docs/30-workflows/unassigned-task/` の既存 task と重複する。

**5分解決カード**: detection 表は `Candidate` / `Reason` / `Handling` 3 列構成にし、`Handling` 列に `Existing formal task file` / `Newly formalized` / `No formalize reason` を区別して記録する。重複候補は existing path を引用し、新規 task は別表に分離する。

**promoted-to**: `task-specification-creator/references/phase12-skill-feedback-promotion.md`, `aiworkflow-requirements/references/task-workflow-active.md` (follow-up dedup rule)
