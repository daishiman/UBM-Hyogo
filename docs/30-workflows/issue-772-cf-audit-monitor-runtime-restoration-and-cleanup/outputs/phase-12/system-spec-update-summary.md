# System spec update summary

本タスクで同一 wave 更新した正本仕様の差分要約。

## `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

### 追記場所

`## Issue #720 read-only monitor environment separation` セクション末尾（既存 ADR の保存・書き換えなし、追記のみ）。

### 追記内容（実反映済み）

- **Issue #772 current-state addendum (2026-05-17)**: production env 側 monitor 専用 secret は fresh name-only inventory で引き続き不在なら cleanup no-op とする。runtime restoration は user-approved repo-level monitor secrets / variables、dry_run success、six hourly successes が揃うまで未完了。
- **monitor read-only token boundary reaffirmation**: repo-level mirror は monitor read-only token (`CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `EMAIL_WEBHOOK_URL`) に限定。deploy 系 (`CLOUDFLARE_API_TOKEN`) は production environment scope に維持。境界線が崩れた場合は本 ADR を更新。

### 影響範囲

- `docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/` の environment-separation ADR ドラフトと整合
- 将来の monitor 系 workflow 追加時の運用判断材料

## その他正本仕様

| 仕様 | 更新有無 |
| --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | 更新なし |
| `docs/00-getting-started-manual/specs/01-api-schema.md` 等 | 更新なし |
| `.claude/skills/aiworkflow-requirements/` | changelog / quick-reference / resource-map / task-workflow-active / artifact inventory / lessons-learned / LOGS を同一 wave で更新 |
| `.claude/skills/task-specification-creator/` | CLOSED Issue current-codebase optimization / cleanup no-op reclassification の skill feedback を同一 wave で昇格 |
