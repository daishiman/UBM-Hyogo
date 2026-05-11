# Lessons Learned: E2E Stage 3c — Branch protection runtime evidence vocabulary (2026-05)

> Workflow root: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`
> Phase 12 出典: `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/implementation-guide.md`
> 反映日: 2026-05-11

このファイルは Stage 3c（required status check context を `dev` / `main` の branch protection に追加するガバナンスタスク）で発生した苦戦箇所と、再現可能な対処を残す。

---

## L-E2EQU3C-001: canonical path normalization — 一時 drift と正規化

### What

Stage 3c の workflow root は当初 `docs/30-workflows/3c-branch-protection-contexts/` に一時的に作られたが、Stage 3 family の親 umbrella `e2e-quality-uplift-stage-3-impl/` 配下に正規化された。canonical root は `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`。

### Why

Stage 3 は 3a / 3b / 3c の 3 サブタスクで構成される。家族関係を表す path 構造を持たないと、`task-workflow-active.md` と `resource-map.md` の同期、親 umbrella の `completed-tasks/` 移動、artifact inventory の reverse index が破綻する。

### How to apply

- Stage 3 family のサブタスクは必ず `e2e-quality-uplift-stage-3-impl/<sub>/` 配下に置く。
- `docs/30-workflows/3c-branch-protection-contexts/` のような非 canonical path は intentionally absent として `quick-reference.md` に明示する。
- path drift を検知したら、同一 wave で root / outputs / artifacts.json / task-workflow-active / quick-reference / resource-map を normalization する。

### Evidence

- `quick-reference.md` §"E2E Stage 3 Branch Protection Contexts": `non-canonical path note: docs/30-workflows/3c-branch-protection-contexts/ is intentionally absent`

---

## L-E2EQU3C-002: branch-specific drift — `dev` と `main` で pre 値が異なる

### What

2026-05-10 時点の branch protection pre snapshot は次のとおり:

| branch | `required_pull_request_reviews` | `required_status_checks.strict` |
| --- | --- | --- |
| `dev` | `null` | `false` |
| `main` | object present | `true` |

PUT payload を 1 つに固定すると、main の reviews object と strict=true が dev 側の null / false で上書きされ、main の保護が破壊される。

### Why

GitHub branch protection は branch ごとに独立した state を持つ。`gh api -X PUT` は payload で受け取った値で **全置換** するため、固定 payload を両 branch に流すと branch-specific 設定が失われる。CLAUDE.md は solo 運用ポリシーで `required_pull_request_reviews=null` を期待するが、main の現実値は object present であり、現状値を保全しつつ contexts のみ append する戦略が正解。

### How to apply

- 必ず branch ごとに `branch-protection-{dev,main}-pre.json` を取得する（read-only `gh api` GET）。
- PUT payload は pre 値をベースに `required_status_checks.contexts` だけ append する。`required_pull_request_reviews` / `required_linear_history` / `enforce_admins` / `lock_branch` などは pre 値を保全する。
- `dev` を先に PUT して invariants を verify、次に `main` に PUT する。post snapshot を `branch-protection-{dev,main}-post.json` として保存する。
- 既存 invariants（`enforce_admins.enabled`, `required_linear_history.enabled`）が CLAUDE.md 期待値とずれている場合は、3c では pre/post 値を保全し、policy alignment は別タスク（`task-e2e-stage3c-enforce-admins-claudemd-alignment-001`）で扱う。

### Evidence

- Phase 12 implementation-guide §"Edge cases": `main pre snapshot differs from dev` で main reviews object present / strict true を扱う
- Phase 12 system-spec-update-summary: `main pre snapshot has required_pull_request_reviews object present and required_status_checks.strict=true; runtime PUT guidance must preserve branch-specific pre values and only append contexts`

---

## L-E2EQU3C-003: `artifacts.json` ledger 分割 — read-only と mutation を別フィールドで管理

### What

Stage 3c では read-only evidence（pre GET, check-runs GET）と mutation evidence（PUT post）を `artifacts.json` で分けて記録する。

```
actual_read_only_evidence_files
actual_mutation_evidence_files
```

### Why

read-only GET evidence は spec wave で取得できるが、PUT は user approval 後の runtime cycle まで実行できない。両者を 1 フィールドに混在させると、pre-only evidence が揃った時点で workflow が completed 誤判定される。ledger 分割により、PUT が走るまでは `actual_mutation_evidence_files` が空欄のまま `runtime_pending` を維持できる。

### How to apply

- governance / runtime mutation workflow では `artifacts.json` に read-only と mutation の 2 ledger を必ず分けて持つ。
- `runtime_state` 空欄 / `runtime_pending` を pre-only evidence で書き換えない。
- Phase 11 evidence path も `branch-protection-{dev,main}-pre.json` と `branch-protection-{dev,main}-post.json` で分離する。

### Evidence

- Phase 12 system-spec-update-summary: `artifacts.json now separates actual_read_only_evidence_files from actual_mutation_evidence_files, so pre-only evidence is tracked without marking the PUT as completed`

---

## L-E2EQU3C-004: 3-state vocabulary 統一 — `spec_created` / `runtime_pending` / `completed`

### What

従来、Phase 12 では `PASS` 単独表記で済ませる慣行があったが、runtime mutation を含む governance task では「spec が揃った」「runtime PUT 待ち」「PUT 完了」の 3 状態を区別する必要がある。Stage 3c では次に統一した:

| 状態 | 意味 |
| --- | --- |
| `spec_created` | Phase 1-12 完了、Phase 11 は read-only evidence のみ |
| `runtime_pending (blocked_until_user_approval)` | PUT 待ち、approval marker `outputs/phase-13/user-approval-3c-<timestamp>.md` 未配置 |
| `completed` | PUT 実行済み、post snapshot 保存済み、artifacts.json mutation ledger fill 済み |

### Why

`PASS` 単独表記は「ローカル PASS」「CI runtime PASS」「production mutation PASS」を区別できず、誤って 3c の PUT 前に completed 判定する事故を招く。`task-specification-creator` skill の `workflow-state-vocabulary.md` と整合させ、runtime mutation 系は明示的に 3-state を採用する。

### How to apply

- Phase 12 strict 7 outputs の `phase12-task-spec-compliance-check.md` で state を 3-state vocabulary で記述する。
- `task-workflow-active.md` 行も同じ 3-state で同期する。
- `artifacts.json.workflow_state` は `spec_created` で開始し、PUT 後に `completed` へ昇格させる。中間の `runtime_pending` は approval marker の有無で判定する。

### Evidence

- Phase 12 implementation-guide: `Until those files are fresh runtime evidence, the workflow remains spec_created / runtime_pending (blocked_until_user_approval)`
- `quick-reference.md` §"E2E Stage 3 Branch Protection Contexts": `state: spec_created / implementation / NON_VISUAL / runtime_pending / branch-protection user-gated`

---

## L-E2EQU3C-005: 承認前後の操作境界 — read-only vs mutation

### What

3c では user approval marker が配置されるまで、以下を厳密に分離する:

| 種別 | 操作 | 例 |
| --- | --- | --- |
| Allowed before approval | read-only `gh api` GET, payload draft 生成 | `gh api repos/.../branches/dev/protection` |
| Forbidden before approval | `gh api -X PUT`, commit, push, PR creation | branch protection mutation |

### Why

GitHub branch protection mutation は production governance に直接影響する。Claude Code を含む AI エージェントが先回りで PUT すると、reviews policy / strict checks / required contexts のロールバック手順が必要になる。明示的な approval marker を gate にすることで、ガバナンス事故を構造的に防ぐ。

### How to apply

- `artifacts.json.metadata.governance_mutation_user_gate=true` を必ず立てる。
- approval marker path: `outputs/phase-13/user-approval-3c-<timestamp>.md`。marker 不在時は state を `runtime_pending (blocked_until_user_approval)` に固定する。
- mutation 実行は別 unassigned-task `task-e2e-stage3c-runtime-gh-api-put-execution-001.md` を formalize して分離する。

### Evidence

- Phase 12 implementation-guide §"Allowed before approval": read-only `gh api` GET と payload draft 生成のみ許可
- Phase 12 implementation-guide §"Forbidden before approval": `gh api -X PUT`, commit, push, PR creation を禁止

---

## L-E2EQU3C-006: required contexts target — Stage 3a / 3b 完了が前提

### What

`required_status_checks.contexts` の target は `["ci", "Validate Build", "coverage-gate", "lighthouse-ci", "e2e-tests-coverage-gate"]`。このうち `lighthouse-ci` と `e2e-tests-coverage-gate` は Stage 3a / 3b の成果物で、PUT 実行前に **少なくとも 1 回成功した check run** が登録済みである必要がある。

### Why

登録されていない context を required に追加すると、PR が永遠に未充足になり、merge が完全にブロックされる。3c は順序依存タスクで、3a / 3b の runtime check-run 登録を待つ必要がある。

### How to apply

- PUT 前に `gh api repos/.../check-runs` で対象 context 名が registered になっていることを確認する（`outputs/phase-11/check-runs.txt` に保存）。
- 未登録の場合は PUT 前に停止し、3a / 3b で成功 run を産生する。
- post PUT で `outputs/phase-11/branch-protection-evidence.md` に context 追加の diff を記録する。

### Evidence

- Phase 12 implementation-guide §"Edge cases": `lighthouse-ci or e2e-tests-coverage-gate is not registered: stop before PUT; 3a/3b must produce a successful run first`

---

## 関連

- canonical workflow root: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`
- 親 umbrella: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`
- 関連 lessons: `lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md`, `lessons-learned-ut-gov-004-branch-protection-context-sync.md`, `lessons-learned-issue-554-branch-protection-required-check-2026-05.md`
- 関連 references: `branch-protection.md`, `task-workflow-active.md`
- 関連 unassigned tasks: `task-e2e-stage3c-runtime-gh-api-put-execution-001.md`, `task-e2e-stage3c-enforce-admins-claudemd-alignment-001.md`
