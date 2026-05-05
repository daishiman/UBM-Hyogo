# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-01 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| scope | GitHub GET evidence 由来の aiworkflow-requirements 反映仕様作成。GitHub PUT / commit / PR は含まない |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

Issue #303 の要求を、UT-GOV-001 second-stage reapply の applied GET evidence を入力正本にした aiworkflow-requirements 反映タスクとして定義する。Issue は closed のまま扱い、再オープンや close 操作をしない。

## 実行タスク

1. Issue #303 と `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001.md` の要求を照合する。
2. 上流 applied evidence の実体を確認し、placeholder を final state として扱わないゲートを定義する。
3. aiworkflow-requirements の反映候補を列挙する。
4. AC-1〜AC-8 を検証可能な形に固定する。
5. Phase 1-3 完了前に Phase 4 へ進まない gate を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/303 | 元要求 |
| 未タスク | docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001.md | 初期仕様 |
| 上流 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-{dev,main}.json | 入力正本候補 |
| 正本 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | branch protection 反映先候補 |
| 索引 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | 早見表同期候補 |

## 実行手順

### ステップ 1: P50チェック

```bash
git log --oneline -20 -- docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001.md
jq '.status, .required_status_checks.contexts' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-dev.json
jq '.status, .required_status_checks.contexts' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-main.json
```

### ステップ 2: 入力正本ゲート

`branch-protection-applied-{dev,main}.json` が `blocked_until_user_approval` または `required_status_checks.contexts == null` の場合、Phase 5 の実反映を BLOCKED とする。expected / payload JSON から final state を推測してはならない。

### ステップ 3: Ownership 宣言

| 対象 | owner | 本タスクの扱い |
| --- | --- | --- |
| GitHub applied GET evidence | UT-GOV-001 second-stage reapply Phase 13 | 読み取り専用入力 |
| aiworkflow-requirements `.claude` 正本 | 本タスク | fresh GET evidence がある場合のみ更新 |
| `.agents` mirror | 本タスク | `.claude` 更新後に差分確認 |
| Issue #303 状態 | GitHub issue manager / 既存状態 | closed のまま参照 |

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 2 | evidence → 反映先 mapping を設計 |
| Phase 4 | jq / rg / generate-index の検証マトリクスを作成 |
| Phase 9 | final state と references/indexes の一致を検証 |
| Phase 12 | system-spec-update-summary に GitHub GET 由来を記録 |

## 多角的チェック観点

- 矛盾なし: placeholder evidence を final state と書かない。
- 漏れなし: references / indexes / workflow台帳 / mirror を対象に含める。
- 整合性: Issue #303 は closed のまま `Refs #303`。
- 依存関係整合: UT-GOV-001 Phase 13 fresh GET が無い場合は BLOCKED。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | Issue / 未タスク照合 | pending |
| 2 | applied evidence gate 定義 | pending |
| 3 | 反映候補列挙 | pending |
| 4 | AC固定 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件、AC、入力正本ゲート |

## 完了条件

- [ ] AC-1〜AC-8 が index と Phase 1 に一致している
- [ ] placeholder applied JSON を BLOCKED とする条件が明記されている
- [ ] Phase 1-3 完了前に Phase 4 へ進まない gate が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-01/main.md` を作成
- [ ] `artifacts.json` の Phase 1 状態を更新

## 次Phase

Phase 2: 設計
