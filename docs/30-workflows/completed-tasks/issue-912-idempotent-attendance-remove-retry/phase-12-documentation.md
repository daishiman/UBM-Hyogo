# Phase 12: ドキュメント同期

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 12
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 12 (ドキュメント同期) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-12-documentation.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。
## 1. 同期対象

| 対象 | 更新内容 | 必須性 |
|---|---|---|
| `outputs/phase-12/main.md` | strict 7 サマリ | 必須 |
| `outputs/phase-12/implementation-guide.md` | 実装ガイド（中学生レベル概念説明含む） | 必須 |
| `outputs/phase-12/system-spec-update-summary.md` | 仕様変更サマリ（既存 spec へは影響なし） | 必須 |
| `outputs/phase-12/documentation-changelog.md` | 本サイクルの doc 変更履歴 | 必須 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件想定） | 必須 |
| `outputs/phase-12/skill-feedback-report.md` | skill への lessons 反映候補 | 必須 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings | 必須 |

## 2. system spec への影響

| spec | 更新有無 |
|---|---|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | なし（既存 endpoint 利用） |
| `docs/00-getting-started-manual/specs/02-auth.md` | なし |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | なし（既存挙動の保持） |

本タスクは **caller 経路の差し替え** であり system spec への新規記述は不要。

## 3. skill への lessons 候補

`outputs/phase-12/skill-feedback-report.md` にて以下を提案:

- L-I912-001: 「冪等 endpoint は既に server side に存在するが UI caller が POST + mutationFn 経路を選ぶ事象」のパターン化（hook の `mutationFn` 経路は timeout/retry/abort/idempotency-key を非適用）
- L-I912-002: `useAdminMutation(endpoint, "DELETE", { retry, idempotencyKey })` opt-in の最小 caller サンプル
- L-I912-003: `trigger(payload, endpointOverride)` を path 動的化に使う pattern（path placeholder + override）
- L-I912-004: DELETE で payload=null の hook fetch body 注意点

## 4. indexes 再生成

`mise exec -- pnpm indexes:rebuild` を実行し drift があれば `git add` してコミットする（user-gated）。
