# Branch Protection / Governance Mutation タスクパターン

GitHub branch protection / required status checks / repository settings 等の **governance mutation** を含むタスクの仕様書テンプレート前提パターン。
e2e-quality-uplift stage-3-impl 3c（branch-protection-contexts）の Phase 12 skill-feedback で確立。

`gh api -X PUT` / `gh api -X POST` / `gh api -X DELETE` などの不可逆 governance mutation は、
[non-visual-irreversible-task-rules.md §0 Governance mutation user 明示承認 gate](non-visual-irreversible-task-rules.md) と
組み合わせて運用する。本 reference はそのうち **branch protection 系特有の branch-specific drift パターン** に焦点を当てる。

---

## 不変条件

### 1. branch-specific drift 前提

branch protection は `dev` / `main` / `release/*` など **ブランチごとに独立した API endpoint** を持ち、片方だけ drift する事故が起きやすい。仕様書 template には次を必須化する:

- `dev` / `main` を **同一 wave で個別に取得し、個別に PUT する**
- 単一 payload を両ブランチに使い回さない（required status checks 集合がブランチごとに異なるため）

### 2. ブランチ別 evidence 分離

| evidence 種別 | dev | main | 配置例 |
| --- | --- | --- | --- |
| before（read-only GET） | 必須 | 必須 | `outputs/phase-13/branch-protection-current-dev.json` / `-main.json` |
| payload draft | 必須 | 必須 | `outputs/phase-13/branch-protection-payload-dev.json` / `-main.json` |
| after（fresh GET） | 必須 | 必須 | `outputs/phase-13/branch-protection-after-dev.json` / `-main.json` |
| user approval marker | 必須（1 ファイルで両ブランチ承認を逐語記録）| 同左 | `outputs/phase-13/user-approval-<task-id>-<timestamp>.md` |

### 3. AI 実行可否（branch protection 専用）

| 操作 | AI 実行可否（user 承認前） | 備考 |
| --- | --- | --- |
| `gh api repos/<owner>/<repo>/branches/dev/protection`（GET） | 可 | read-only。before snapshot を取得 |
| `gh api repos/<owner>/<repo>/branches/main/protection`（GET） | 可 | 同上 |
| `outputs/phase-13/branch-protection-payload-*.json` の draft 生成 | 可 | template / lint のみ |
| `jq` / `diff` による payload と current の差分提示 | 可 | 比較 read-only |
| `gh api -X PUT .../branches/dev/protection` | **不可** | user 承認 evidence 必須 |
| `gh api -X PUT .../branches/main/protection` | **不可** | 同上 |

---

## 仕様書 template 必須セクション

### Phase 2 / 5（設計）

- 対象ブランチ一覧と、各ブランチ向け payload 構造の差異を表で明示
- `required_status_checks.contexts[]` の差分を branch ごとに列挙
- `enforce_admins` / `lock_branch` / `required_pull_request_reviews` のブランチ別期待値

### Phase 11（read-only pre-gate evidence）

- `gh api .../branches/dev/protection` GET 出力を `outputs/phase-11/evidence/protection-current-dev.json` に保存（AI 実行可）
- 同 main 版を `protection-current-main.json` に保存
- payload draft との `jq -S 'paths(scalars) as $p | { ($p|tostring): getpath($p) }'` 等での diff を補助 evidence に添付

### Phase 13（user gate + mutation）

PR description / approval gate template に次を逐語記載:

```markdown
### Governance Mutation Gate（branch protection PUT）

| ブランチ | before evidence | payload | after evidence | user 承認 |
| --- | --- | --- | --- | --- |
| dev | outputs/phase-13/branch-protection-current-dev.json | outputs/phase-13/branch-protection-payload-dev.json | outputs/phase-13/branch-protection-after-dev.json | ⏸ pending |
| main | (同上 -main) | (同上 -main) | (同上 -main) | ⏸ pending |

### 実行手順（user 承認後のみ AI 実行可）

1. `gh api -X PUT --input outputs/phase-13/branch-protection-payload-dev.json repos/<owner>/<repo>/branches/dev/protection`
2. 直後 fresh GET → `outputs/phase-13/branch-protection-after-dev.json`
3. main 側を 1-2 と同手順で実行
4. `phase12-task-spec-compliance-check.md` の `governance_mutation_executed_dev` / `_main` 行に `completed (runtime PASS / approved at <ISO8601>)` を記録
```

### artifacts.json metadata

```json
{
  "metadata": {
    "governance_mutation_user_gate": true,
    "mutation_commands": [
      "gh api -X PUT --input outputs/phase-13/branch-protection-payload-dev.json repos/<owner>/<repo>/branches/dev/protection",
      "gh api -X PUT --input outputs/phase-13/branch-protection-payload-main.json repos/<owner>/<repo>/branches/main/protection"
    ],
    "read_only_evidence_allowed_pre_gate": [
      "gh api repos/<owner>/<repo>/branches/dev/protection",
      "gh api repos/<owner>/<repo>/branches/main/protection"
    ],
    "user_approval_marker": "outputs/phase-13/user-approval-<task-id>-<timestamp>.md",
    "actual_read_only_evidence_files": [
      "outputs/phase-11/evidence/protection-current-dev.json",
      "outputs/phase-11/evidence/protection-current-main.json"
    ],
    "actual_mutation_evidence_files": [
      "outputs/phase-13/branch-protection-after-dev.json",
      "outputs/phase-13/branch-protection-after-main.json"
    ]
  }
}
```

---

## Phase 12 compliance check 必須行

| 行 | 期待値 | 失敗条件 |
| --- | --- | --- |
| `governance_mutation_user_gate` | `true` | false で mutation 実行済みなら FAIL |
| `dev_before_evidence_exists` | tracked file 存在 | 欠落 → FAIL |
| `main_before_evidence_exists` | tracked file 存在 | 欠落 → FAIL |
| `dev_payload_draft_exists` | tracked file 存在 | 欠落 → FAIL |
| `main_payload_draft_exists` | tracked file 存在 | 欠落 → FAIL |
| `user_approval_marker_exists` | tracked file + ISO8601 timestamp | 欠落 → FAIL |
| `dev_after_evidence_exists` | `runtime_pending` または `completed (runtime PASS)` | mutation 未実行なら `runtime_pending`（OK） |
| `main_after_evidence_exists` | 同上 | 同上 |

`PASS` 単独表記禁止。3-state vocabulary（`spec_created` / `runtime_pending` / `completed`）で suffix する。

---

## 適用例（3c branch-protection-contexts）

- Issue #554: `audit-correlation-verify / verify` を `dev` / `main` の required status check に追加
- 仕様書では dev / main を個別に取得・個別に PUT する手順を明記
- AI は read-only GET と payload draft 作成のみ実行
- `gh api -X PUT` は user の `Gate C: approve` 明示後に AI 実行
- after fresh GET で context 集合に `audit-correlation-verify / verify` が含まれることを `jq` で集合一致確認

---

## 関連 reference

- [non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) §0 — Governance mutation user 明示承認 gate
- [workflow-state-vocabulary.md](workflow-state-vocabulary.md) — runtime_pending / completed 3-state
- [phase12-compliance-check-template.md](phase12-compliance-check-template.md) — compliance check 観点
- [lessons-learned/non-visual-governance-pattern.md](../lessons-learned/non-visual-governance-pattern.md) — Phase 8 単一 YAML / 並走監視 / 二重承認
