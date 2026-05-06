# Phase 12: ドキュメント更新

## 必須 6 タスク + Token rotation runbook

### Task 12-1: 実装ガイド作成（Part 1 + Part 2）

`outputs/phase-12/implementation-guide.md`
- Part 1（中学生レベル）: 「鍵を 1 本から 6 本に分けて、もし 1 本が落ちても被害を狭くする」という比喩で説明
- Part 2（技術者レベル）: scope 設計、job 分割、`needs:` 順序、rollback 独立性、failure mode 切り分け

### Task 12-2: システム仕様書更新

`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の secrets 表を 6 Token + deprecated 旧 Token に更新。

`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` の deploy job 構造図を 3 job split 図に差し替え。

`outputs/phase-12/system-spec-update-summary.md` に canonical absolute path 反映行を列挙:
- `/Users/dm/.../.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `/Users/dm/.../.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `/Users/dm/.../.claude/skills/aiworkflow-requirements/LOGS.md`

### Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` — 本タスクで触ったすべてのファイルとその要約。

### Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`:
- DERIV-03（rotation 自動化）— 6 Token 運用に伴い優先度上昇
- DERIV-04（Audit Logs 監視）— Token 単位での操作 audit が DERIV-04 で必要

### Task 12-5: skill feedback

`outputs/phase-12/skill-feedback-report.md`:
- テンプレ改善: 「Token 単位 rollback の独立性検証」を `phase-template-phase11.md` の NON_VISUAL evidence に明記する案
- ワークフロー改善: 6 Token のような multi-secret タスクで `secret hygiene grep` を必須 phase 9 step に格上げする案
- ドキュメント改善: `deployment-secrets-management.md` の deprecated 表記ルールの追加

### Task 12-6: コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` — 7 ファイル + runbook の実体存在確認。

### Task 12-extra: Token rotation runbook

`outputs/phase-12/runbook-token-rotation.md`:
- Token 単位の rotation 手順（90 日サイクル）
- Token 単位の rollback 手順（D1 / Workers / Pages 別）
- failure mode 切り分けマトリクス
- DERIV-03（自動化）への移行段取り

## 完了条件

- 7 ファイル + runbook が実体ファイルで存在
- compliance check が PASS
- canonical absolute path 反映行が `system-spec-update-summary.md` に列挙

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/runbook-token-rotation.md`
