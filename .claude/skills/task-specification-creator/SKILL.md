---
name: task-specification-creator
description: |
  タスクを単一責務原則で分解しPhase 1-13の実行可能な仕様書を生成。Phase 12は中学生レベル概念説明を含む。
  Anchors:
  • Clean Code / 適用: SRP / 目的: タスク分解基準
  • Continuous Delivery / 適用: フェーズゲート / 目的: 品質パイプライン
  • DDD / 適用: ユビキタス言語 / 目的: 用語統一
  Trigger:
  タスク仕様書作成, タスク分解, ワークフロー設計, Phase実行, インテグレーション設計, ワークフローパッケージ, Cloudflare Workers, Web API設計, 外部連携パッケージ
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# Task Specification Creator

開発タスクを Phase 1〜13 の実行可能な仕様書へ落とし込む。`SKILL.md` は入口だけを持ち、詳細は `references/` と `LOGS.md` に分離する。

## 変更履歴

| Version | Date | Changes |
| --- | --- | --- |
| v2026.04.28-claude-code-permissions-comparison-review | 2026-04-28 | `task-claude-code-permissions-project-local-first-comparison-001` の Phase 12 review で、docs-only 比較設計タスクでも root / outputs `artifacts.json` parity、必須見出し、LOGS / 正本仕様同期、後続タスク方針更新を同一 wave で閉じる必要を確認。比較設計テンプレート改善は LOGS と skill-feedback-report に記録。 |

## 設計原則

| 原則                      | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| Script First              | 決定論的処理は `scripts/` で固定する                        |
| LLM for Judgment          | 判断、設計、レビューだけを LLM が担う                       |
| Progressive Disclosure    | 必要な reference だけを段階的に読む                         |
| 1 File = 1 Responsibility | 大きくなった guide は family file へ分離する                |
| `.claude` Canonical       | 正本は `.claude/skills/...`、`.agents/skills/...` は mirror |

## 要件レビュー思考法（要約）

要件・設計レビューでは、システム系 / 戦略・価値系 / 問題解決系の 3 系統を必ず通し、真の論点 / 因果と境界 / 価値とコスト / 改善優先順位 / 4 条件評価を明示してから Phase 1 へ進む。詳細手順は [references/requirements-review.md](references/requirements-review.md) を参照。

## タスクタイプ判定（要約）

タスク作成前に **taskType**（implementation / docs-only）と **visualEvidence**（VISUAL / NON_VISUAL）を確定し、Phase 1 〜 artifacts.json 生成まで一貫して使う。判定フローと各分岐の運用ルールは [references/task-type-decision.md](references/task-type-decision.md) を参照。

---

## クイックスタート

| モード              | 用途                               | 最初に読むもの                                                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `create`            | 新規 workflow を作る               | [references/create-workflow.md](references/create-workflow.md)                           |
| `execute`           | Phase 1〜13 を順番に実行する       | [references/execute-workflow.md](references/execute-workflow.md)                         |
| `update`            | 既存仕様書を修正する               | [references/phase-templates.md](references/phase-templates.md)                           |
| `detect-unassigned` | Phase 12 の残課題を formalize する | [references/phase-12-documentation-guide.md](references/phase-12-documentation-guide.md) |

```bash
node scripts/detect-mode.js --request "{{USER_REQUEST}}"
```

## 実行フロー（要約）

`create` フローは `agents/decompose-task.md` → `agents/identify-scope.md` → `agents/design-phases.md` → `agents/generate-task-specs.md` → `agents/output-phase-files.md` → `agents/update-dependencies.md` → `agents/verify-specs.md` の順で gate を通す。`execute` フローは Phase 1（要件定義）〜 Phase 13（PR 作成）の 13 段階を順次実行する。各 Phase の目的と Feedback 注釈、Task 仕様ナビ表は [references/phase-templates.md](references/phase-templates.md) を参照。

## Phase 12 重要仕様（要約）

Phase 12 は次の 5 タスクすべてが必須:

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**）

詳細仕様（Part 1/2 セルフチェック・Step 1-A〜1-D ルール・`spec_created` close-out・docs-only → code 再判定）は [references/phase-12-spec.md](references/phase-12-spec.md)。よくある漏れ（UBM-009〜013 含む）と苦戦防止 Tips は [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md)。

## 重要ルール（要約）

- **Phase 完了時の必須アクション**: タスク完全実行 / 成果物確認 / `complete-phase.js` で artifacts.json 更新 / 完了条件チェック明記
- **PR 作成は自動実行しない**: 必ずユーザーの明示的な許可を得てから実行する
- **Phase 12 と Phase 13 の境界**: Task 12-1〜12-5 の完了条件と Phase 13（commit/PR）の承認ゲート

詳細と検証コマンド一覧は [references/quality-gates.md](references/quality-gates.md) を参照。

## agent 導線

- [agents/decompose-task.md](agents/decompose-task.md)
- [agents/identify-scope.md](agents/identify-scope.md)
- [agents/design-phases.md](agents/design-phases.md)
- [agents/generate-task-specs.md](agents/generate-task-specs.md)
- [agents/output-phase-files.md](agents/output-phase-files.md)
- [agents/update-dependencies.md](agents/update-dependencies.md)
- [agents/verify-specs.md](agents/verify-specs.md)
- [agents/update-system-specs.md](agents/update-system-specs.md)
- [agents/generate-unassigned-task.md](agents/generate-unassigned-task.md)

## References

| topic | path |
| --- | --- |
| 要件レビュー思考法 | [references/requirements-review.md](references/requirements-review.md) |
| タスクタイプ判定フロー | [references/task-type-decision.md](references/task-type-decision.md) |
| Phase テンプレ詳細（Phase 1〜13 / Task ナビ） | [references/phase-templates.md](references/phase-templates.md) |
| Phase 12 重要仕様（5 タスク詳細） | [references/phase-12-spec.md](references/phase-12-spec.md) |
| Phase 12 よくある漏れ / 苦戦防止 Tips | [references/phase-12-pitfalls.md](references/phase-12-pitfalls.md) |
| 品質ゲート / Phase 境界 / 検証コマンド導線（commands.md とハブ関係） | [references/quality-gates.md](references/quality-gates.md) |
| オーケストレーション / リソース導線 / ベストプラクティス | [references/orchestration.md](references/orchestration.md) |
| NON_VISUAL governance パターン（Phase 8 単一正本 YAML / check-runs 並走 / Phase 13 二重承認） | [lessons-learned/non-visual-governance-pattern.md](lessons-learned/non-visual-governance-pattern.md) |

## 最小 workflow

```
decompose-task → identify-scope → design-phases → generate-task-specs
   → output-phase-files → update-dependencies → verify-specs
   → (Phase 1〜13 を execute) → update-system-specs (Phase 12)
   → generate-unassigned-task (条件分岐)
```

詳細な履歴と usage log は [LOGS.md](LOGS.md)、[SKILL-changelog.md](SKILL-changelog.md)、[references/logs-archive-index.md](references/logs-archive-index.md) を参照。
