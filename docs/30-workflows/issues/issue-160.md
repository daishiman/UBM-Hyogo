# [#160] [UT-B1-SKILL-FEEDBACK] Phase 11 NON_VISUAL 証跡テンプレート改善

## メタ情報

```yaml
issue_number: 160
title: [UT-B1-SKILL-FEEDBACK] Phase 11 NON_VISUAL 証跡テンプレート改善
state: OPEN
priority: 低
scale: 小規模
category: 改善
status: 未実施
created_date: 2026-04-28
updated_date: 2026-04-28
url: https://github.com/daishiman/UBM-Hyogo/issues/160
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

docs-only / NON_VISUAL の設計タスクで、Phase 11 の「未実行 placeholder」と「実装後の実測ログ」が混同される問題への対処。`task-specification-creator` の Phase 11 テンプレートに `not_run` / `placeholder` / `executed` を区別する evidence state 項目を追加する。

仕様書: `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md`
親タスク: skill-ledger-b1-gitattributes
発見元: outputs/phase-12/skill-feedback-report.md（2026-04-28）

## 受入条件（要旨）

- Phase 11 reference / template に `evidenceState`（`not_run` / `placeholder` / `executed`）が定義されている
- Phase 12 compliance check で参照可能
- 既存 VISUAL workflow テンプレートを破壊しない
- canonical / mirror policy が記録されている
- skill `SKILL.md` / `LOGS.md` の変更履歴更新

## 依存・連携

なし（task-specification-creator skill 単独で実施可能）

詳細・苦戦箇所は仕様書参照。
