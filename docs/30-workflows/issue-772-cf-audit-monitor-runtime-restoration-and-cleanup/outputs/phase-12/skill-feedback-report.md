# Skill feedback report

## task-specification-creator

### 知見 SF-772-001: CLOSED issue を最新コードに最適化して再起動するパターン

**観測**: Issue #772 はラベル上「cleanup」だが、現コードベース実態（hourly 10 連続 failure + 削除対象 secret 不在）と乖離していた。原典ラベルを鵜呑みにすると no-op 確認の docs-only タスクに見えるが、実態は runtime restoration が必要だった。

**改善案**: Phase 1 要件定義テンプレートに「現状実態の確認（期待 vs 実態 vs 根拠）」表を追加し、CLOSED issue を再起動する際は必ず inventory check（`gh secret list` / `gh run list` / 関連 workflow yaml grep）を実施する step を組み込む。

### 知見 SF-772-002: 実装区分判定はラベル / 原典スコープより実態優先

**観測**: 原典 unassigned-task のラベル「整理 (Governance / Security cleanup)」とユーザー初期指定（docs-only 想定）は、実態調査で覆る場合がある。

**改善案**: CONST_004 を補強する Phase 1 判定基準に「ラベル / ユーザー指定 < コードベース実態」の優先順位を明文化する。本タスクではこの方針で実装仕様書化を判断した。

## aiworkflow-requirements

### 知見 SF-772-003: ADR ステータス語彙の拡張

**観測**: `15-infrastructure-runbook.md` の environment-separation ADR に「cleanup no-op decision」「runtime restoration pending」のステータス追記が必要だが、これらの語彙が正本仕様に登録されていない。

**改善案**: `.claude/skills/aiworkflow-requirements/references/` に「runbook ADR status vocabulary」を追加候補として残し、本タスクで実 ADR 追記後に確定。

### 知見 SF-772-004: fold-state sync 文言の正本化

**観測**: `consumed_via_issue_<N>_*` 命名規約は issue-720 Phase 12 で運用されているが、aiworkflow-requirements skill 側の正本化が未対応。

**改善案**: skill references に fold-state sync 文言一覧を整理する task を別途検討。

## 反映結果

| Item | Promotion target | Status |
| --- | --- | --- |
| SF-772-001 | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | promoted_same_wave |
| SF-772-002 | `.claude/skills/task-specification-creator/SKILL-changelog.md` / `SKILL.md` latest entry | promoted_same_wave |
| SF-772-003 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` + `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-772-cf-audit-monitor-runtime-restoration-2026-05.md` | promoted_same_wave |
| SF-772-004 | `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` + aiworkflow indexes | promoted_same_wave |
