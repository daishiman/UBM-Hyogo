# Closed Issue / Canonical Workflow Root Recovery

Anchors:
- Clean Code / SRP: closed Issue body と canonical workflow root の責務分離
- Continuous Delivery / Gate: closed 状態でも Phase 1-13 物理生成を gate にする
- DDD / ユビキタス言語: `unassigned-task` / `canonical workflow root` / `consumed` の語彙統一

Trigger:
closed issue canonical workflow absence, 後付け workflow root 生成, unassigned-task consumed 化, governance YAML frontmatter, governance_mutation_user_gate, mutation_commands, read_only_evidence_allowed_pre_gate, user_approval_marker

---

## 1. 適用条件

次のいずれかが該当する場合に本パターンを適用する:

- 対象 GitHub Issue が **CLOSED** 状態
- Issue 本文が `docs/30-workflows/unassigned-task/*.md` のファイルパスしか指していない
- 対応する **canonical workflow root** (`docs/30-workflows/<issue-N>-<slug>/`) が未作成のまま issue が閉じられた
- それでも実 mutation（branch protection PUT / wrangler deploy / d1 migrations apply 等）や code/docs work が残っている

> **実例**: Issue #718 legacy Cloudflare API token revocation。Issue は closed されていたが、
> unassigned-task ファイルのみが残り、Phase 1-13 を持つ canonical workflow root は未生成だった。

---

## 2. 後付け生成手順（Closed Issue Canonical Workflow Root Recovery）

CLOSED Issue を再 open せず、`Refs #<n>` 限定で canonical workflow root を後付けする。

### Step 1: unassigned-task ファイルを inventory

```bash
# unassigned-task ファイルの scope / AC / risk を抽出
Read docs/30-workflows/unassigned-task/<task-slug>.md
```

抽出項目:
- メタ情報（taskType / visualEvidence / governance_mutation_user_gate 等）
- 苦戦箇所 / リスクと対策 / 検証方法 / スコープ（[unassigned-task-required-sections.md](unassigned-task-required-sections.md) の 4 セクション）
- 関連 mutation commands と read-only evidence allow-list

### Step 2: canonical workflow root を生成

```
docs/30-workflows/issue-<N>-<slug>/
  ├── index.md
  ├── artifacts.json
  ├── phase-1-requirements.md
  ├── phase-2-design.md
  ├── ...
  ├── phase-13-pr.md
  └── outputs/phase-12/
```

- `artifacts.json.metadata` に **canonical workflow root 後付け生成** であることを明示:
  - `metadata.recovered_from_unassigned: <path>`
  - `metadata.issue_state_at_recovery: "closed"`
  - `metadata.issue_reference_mode: "refs_only"` （`Closes #<n>` 禁止）
- governance mutation を含む場合は §3 の YAML frontmatter 契約を **artifacts.json `metadata`** にも同値で展開する。

### Step 3: unassigned-task ファイルへ consumed pointer を追記

unassigned-task は **削除禁止**（issue body の既存リンクを壊さない）。
ファイル末尾またはメタ情報直下に次を追記する:

```markdown
---
status: consumed
consumed_at: 2026-05-16
canonical_workflow: docs/30-workflows/issue-718-legacy-cf-token-revocation/
recovery_note: |
  Issue #718 was closed before a canonical workflow root existed.
  This unassigned-task file is preserved for backward link integrity.
  All Phase 1-13 work has been migrated to the canonical workflow root above.
---
```

YAML フロントマターに `status: consumed` を持つ場合、`audit-unassigned-tasks.js` は
当該ファイルを backlog 対象から除外する（実装は §5 参照）。

### Step 4: Issue 本文の既存リンクを壊さない

- unassigned-task ファイルパスは **そのまま残す**（rename / 削除禁止）
- issue body 編集は不要。canonical workflow root への pointer は `consumed pointer` 経由で間接参照
- 後続 PR は `Refs #<n>` のみで紐付ける（CLOSED Issue 再 open / `Closes #<n>` は禁止）

### Step 5: Phase 12 / aiworkflow-requirements への同期

- canonical workflow root の `outputs/phase-12/`:
  - `unassigned-task-detection.md` に「recovery 起点となった unassigned-task の consumed 化」を current 列に記録
  - `documentation-changelog.md` に Step 1-4 の物理パスを列挙
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-<N>-*-artifact-inventory.md` を同 wave で生成

---

## 3. Governance YAML フロントマター契約（unassigned-task テンプレ正式化）

不可逆 mutation を含む unassigned-task は、ファイル冒頭 YAML フロントマターに次を **必須化** する。
（[non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) §0 の AI 実行可否分類と整合）

```yaml
---
governance_mutation_user_gate: true
mutation_commands:
  - "gh api -X PUT repos/<owner>/<repo>/branches/<branch>/protection"
  - "wrangler deploy --config apps/api/wrangler.toml --env production"
  - "bash scripts/cf.sh d1 migrations apply <db> --env production"
read_only_evidence_allowed_pre_gate: true
user_approval_marker: outputs/phase-13/user-approval-<task-id>-<timestamp>.md
---
```

### 各フィールドの契約

| field | 必須 | 値 / 意味 |
| --- | --- | --- |
| `governance_mutation_user_gate` | ✅ | `true` 固定。AI が user 明示承認なしに mutation を実行することを禁止する trigger flag |
| `mutation_commands` | ✅ | 実行予定の不可逆 command を **literal 一覧** で列挙。partial wildcard / placeholder 禁止 |
| `read_only_evidence_allowed_pre_gate` | ✅ | `true` の場合、user 承認前でも GET / `list` / `whoami` 等の read-only 操作のみ AI 実行可 |
| `user_approval_marker` | ✅ | 物理ファイル絶対パス。user 承認文言（`Approve Gate C` 等）を逐語保存する場所 |

### 違反検出

- フロントマター欠落 → `audit-unassigned-tasks.js` が `MISSING_GOVERNANCE_CONTRACT` で fail
- `governance_mutation_user_gate: false` で `mutation_commands` に不可逆 command が並んでいる → `CONTRACT_INCONSISTENT` で fail
- `user_approval_marker` 物理不在で mutation 実行コミットが入っている → revert 対象（[non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) §0 末尾と整合）

---

## 4. 後付け recovery 時の root artifacts state 推奨値

| `metadata.workflow_state` | 適用条件 |
| --- | --- |
| `spec_created` | canonical root 後付け生成のみで、実 mutation / code diff 未着手 |
| `implemented_local_runtime_pending` | code diff が apps/ / packages/ / scripts/ に入り、local PASS evidence あり |
| `runtime_pending` | code diff + local PASS は揃ったが governance mutation は user gate 未通過 |
| `completed` | user 承認 → mutation 実行 → fresh evidence 取得 → PR merge 完了の全 wave 完遂後のみ |

CLOSED Issue 由来の recovery では、Phase 13 の `status` は `blocked` / `user_approval_required=true` を
維持し、`Closes #<n>` を出さないこと。

---

## 5. 検証スクリプト連携

`scripts/audit-unassigned-tasks.js`（実装予定）への期待挙動:

| 入力 | 期待挙動 |
| --- | --- |
| `status: consumed` + `canonical_workflow` pointer あり | backlog 対象から除外、`consumed inventory` に分類 |
| `governance_mutation_user_gate: true` + `user_approval_marker` 物理不在 | `MISSING_USER_APPROVAL_MARKER` で fail |
| `mutation_commands` 未列挙で issue body に `gh api -X PUT` 言及 | `CONTRACT_INCONSISTENT` warning |

---

## 6. 適用事例

| Issue | 後付け対象 | 主な mutation | 備考 |
| --- | --- | --- | --- |
| Issue #718 | `docs/30-workflows/issue-718-legacy-cf-token-revocation/` | 旧 Cloudflare API token revocation（dashboard 操作 + secrets rotation） | unassigned-task `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` を consumed 化、`Refs #718` のみ |
| Issue #775 | `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/` | runtime visual evidence completion（fixture-backed Playwright で 11 PNG capture、production app/API code は frozen） | unassigned-task `docs/30-workflows/completed-tasks/serial-05-step-03-followup-001-runtime-evidence-completion.md` を consumed 化、`Refs #775` のみ。screenshots は parent `completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/` に一本化し、recovery root は README pointer のみ。legacy placeholder は `.placeholder.txt` へ退避し PASS inventory から除外。`metadata.gates` 配下に `passed_at` / `approver` 必須。詳細教訓: [aiworkflow-requirements/references/lessons-learned-issue-775-serial-05-step-03-runtime-evidence-completion-2026-05.md](../../aiworkflow-requirements/references/lessons-learned-issue-775-serial-05-step-03-runtime-evidence-completion-2026-05.md) |

---

## 関連 reference

- [unassigned-task-required-sections.md](unassigned-task-required-sections.md) — 4 必須セクション
- [non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) §0 — Governance mutation user gate
- [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md) — CLOSED fold / external mutation state sync
- [completed-tasks-policy.md](completed-tasks-policy.md) — completed 配置先 / Refs 表記
