# Phase 8: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| 前 Phase | 7 (テスト計画) |
| 次 Phase | 9 (local 受入確認) |
| 状態 | spec_created |

## 目的

T-07 (runbook ADR ステータス追記) / T-08 (unassigned-task fold-state sync) のドキュメント差分を明文化する。

## 変更対象ドキュメント

### D-1: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

- 変更箇所: `## Issue #720 read-only monitor environment separation` セクション末尾
- 追記内容: Issue #772 cleanup no-op decision + runtime restoration pending サブセクション（Phase 06 T-07 参照）
- 目的: environment-separation ADR の現状ステータスを正本化
- monitor read-only token 限定原則の再確認サブセクション（CONDITIONAL 解消）も同箇所に併記:

```markdown
### Issue #772 monitor read-only token boundary reaffirmation (2026-05-17)

repo-level に複製する secret は monitor read-only token (`CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `EMAIL_WEBHOOK_URL`) に限定する。deploy 系 mutation-capable secret (`CLOUDFLARE_API_TOKEN`) は production environment scope に維持する。本境界線が崩れた場合は本 ADR を更新する。
```

### D-2: `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md`

- 変更箇所: 冒頭メタ情報セクション
- 追記内容: `status: consumed_via_issue_772_runtime_restoration_spec` / `consumed_at: 2026-05-17` / `consuming_workflow: ...` の 3 行
- 目的: CLOSED issue の reopen 回避と fold-state sync

### D-3: `docs/30-workflows/LOGS.md`（任意・solo dev 運用上は不要だが慣例があれば追記）

- 確認: 既存 LOGS.md に本タスクのエントリ追加が必要かを Phase 12 で再確認

## skills 系参照ドキュメント

| 種別 | パス | 更新内容 |
| --- | --- | --- |
| skill changelog | `.claude/skills/aiworkflow-requirements/changelog/20260517-issue772-cf-audit-monitor-runtime-restoration.md` | 新規ファイル（Phase 12 で生成）。本タスクで再確認した「monitor read-only token boundary」と「cleanup no-op fold-state sync」の運用知見を記録 |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-772-cf-audit-monitor-runtime-restoration-2026-05.md` | 新規ファイル（Phase 12 で生成）。`L-ISSUE772-001..N` で知見コード化 |

## 不変条件

1. runbook ADR の追記は **既存セクション末尾への追加のみ**。既存 ADR を書き換えない
2. fold-state sync は status 行のみで本文を変更しない
3. skill changelog / lessons は local spec close-out の same-wave sync として生成済み。runtime evidence 取得後は必要な追記だけを行う

## 完了条件

- [x] D-1 / D-2 / D-3 の変更点明文化
- [x] skill 系 changelog / lessons-learned の生成計画
- [x] CONDITIONAL 解消条件（monitor read-only token 限定原則の再確認）を D-1 内に組み込み

## 次 Phase

- 次: 9 (local 受入確認)
