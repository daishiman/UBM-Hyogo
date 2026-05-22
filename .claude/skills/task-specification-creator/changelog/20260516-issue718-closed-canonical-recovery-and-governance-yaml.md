# 20260516 — Issue #718 closed canonical recovery & governance YAML

## Version

`v2026.05.16-issue718-closed-canonical-recovery-and-governance-yaml`

## Changes

- 新規 reference: `references/closed-issue-canonical-workflow-recovery.md`
  - 適用条件（CLOSED Issue + canonical workflow root 欠落 + unassigned-task のみ存在）
  - 後付け生成 5 段手順（inventory → root 生成 → `status: consumed` 追記 → issue body 保全 → Phase 12 / aiworkflow 同期）
  - artifacts.json `metadata.recovered_from_unassigned` / `issue_state_at_recovery` / `issue_reference_mode` 契約
- `references/unassigned-task-required-sections.md` §6 追加: 不可逆 mutation タスク YAML フロントマター 4 フィールド必須化
  - `governance_mutation_user_gate` / `mutation_commands` / `read_only_evidence_allowed_pre_gate` / `user_approval_marker`
  - audit script fail 種別: `MISSING_GOVERNANCE_CONTRACT` / `CONTRACT_INCONSISTENT` / `MISSING_USER_APPROVAL_MARKER`
- SKILL.md References 表と最新 version 行を同 wave で更新
- SKILL-changelog.md に summary 行を追加

## Trigger

Issue #718 legacy Cloudflare API token revocation: CLOSED Issue が unassigned-task ファイルのみを指し、
canonical workflow root（Phase 1-13）が未生成のまま閉じられていた。再 open せず `Refs #718` 限定で
後付け root を生成する必要が生じ、運用パターンとして正本化。

## Applied Example

- `docs/30-workflows/issue-718-legacy-cf-token-revocation/`
- `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` を `status: consumed` で保全

## 関連 reference

- [closed-issue-canonical-workflow-recovery.md](../references/closed-issue-canonical-workflow-recovery.md)
- [unassigned-task-required-sections.md](../references/unassigned-task-required-sections.md) §6
- [non-visual-irreversible-task-rules.md](../references/non-visual-irreversible-task-rules.md) §0
