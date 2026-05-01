# Phase 13: PR準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR準備 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 |
| 次 Phase | なし |
| 状態 | pending_user_approval |

## 目的

ローカル確認、変更サマリー、PR情報、PR作成結果を準備する。ただし commit / push / PR はユーザーの明示承認まで実行しない。

## 実行タスク

1. `outputs/phase-13/local-check-result.md` を作成する。
2. `outputs/phase-13/change-summary.md` を作成する。
3. `outputs/phase-13/pr-info.md` を blocked として作成する。
4. `outputs/phase-13/pr-creation-result.md` を blocked として作成する。
5. PR本文では `Refs #303` を使い、`Closes #303` を使わない。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 12 | phase-12.md | 完了根拠 |
| skill template | .claude/skills/task-specification-creator/references/phase-template-phase13.md | 承認ゲート |

## 実行手順

### ステップ 1: local check

```bash
git status --short
find docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001 -maxdepth 3 -type f | sort
rg -n "Closes #303" docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001 || true
```

### ステップ 2: approval gate

ユーザーが明示的に commit / push / PR 作成を指示するまで、以下は実行しない。

- `git commit`
- `git push`
- `gh pr create`

## 統合テスト連携

Phase 13はPR作成準備のみ。GitHub branch protection PUTは本タスクの範囲外。

## 多角的チェック観点

- closed Issueに対して `Closes #303` を使っていないか。
- PR作成結果を成功扱いにしていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | local check | pending |
| 2 | change summary | pending |
| 3 | PR blocked記録 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-13/local-check-result.md | ローカル確認 |
| ドキュメント | outputs/phase-13/change-summary.md | 変更サマリー |
| ドキュメント | outputs/phase-13/pr-info.md | PR情報 |
| ドキュメント | outputs/phase-13/pr-creation-result.md | PR作成結果 |

## 完了条件

- [ ] Phase 13必須4成果物が存在する
- [ ] commit / push / PR が blocked と記録されている
- [ ] `Refs #303` 方針が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-13/*` を作成
- [ ] `artifacts.json` の Phase 13 状態を pending_user_approval として更新

## 次Phase

なし
