# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 12 |
| 下流 | - |
| 状態 | blocked（ユーザー承認待ち） |
| user_approval_required | true |

## 目的

Phase 1〜12 の全成果物を含むタスク仕様書を `feat/issue-141-permissions-deny-bypass-verification-task-spec`
ブランチから main に向けて PR を作成する。**ユーザーの明示承認まで blocked** とし、
本仕様書の自動 push / 自動 PR 作成は禁止。

## 前提条件

- Phase 1〜12 が completed
- Phase 12 サマリと 6 canonical 詳細成果物が揃っている
- `git status` がクリーンでコミット済み
- ユーザーの明示承認（「PR 作成して」等）

## PR テンプレート（pr-template.md に記載）

### Title

```
docs(spec): task-claude-code-permissions-deny-bypass-verification-001 タスク仕様書追加
```

### Body 構成

```
## Summary

- Issue #141 に対応するタスク仕様書を `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/` 配下に Phase 1-13 構成で作成
- 上流 `task-claude-code-permissions-decisive-mode` Phase 3 R-2 BLOCKER 解除のための検証仕様
- spec_created で完了。検証実施は別途承認後に行う

## 変更内容

- `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md`
- 検証プロトコル（isolated repo + dummy bare） / alias フォールバック / 観測ログテンプレート

## 不変条件

- 実 settings / `.zshrc` / 実 remote には触れない
- 検証は `/tmp/cc-deny-verify-*` 限定
- API token / `.env` 値の混入なし

## Test plan

- [ ] index.md と artifacts.json の Phase 表が一致
- [ ] 全 Phase ファイルが artifacts.json `outputs[]` と一致
- [ ] 機密情報 grep が no leak
- [ ] 上流タスク Phase 3 R-2 への反映方針が Phase 12 で確定
- [ ] apply-001 への前提条件転記方針が Phase 12 で確定

## 関連 Issue

Closes #141 (CLOSED 状態のままタスク仕様書のみ追加)
```

## チェックリスト

- [ ] 自動 push しない（ユーザー承認後のみ）
- [ ] 自動 PR 作成しない（ユーザー承認後のみ）
- [ ] CI green を確認
- [ ] レビュアーは solo 開発のため required: 0
- [ ] branch protection の `required_status_checks` を満たす
- [ ] 線形履歴 / force-push 禁止を遵守

## 解除条件

- ユーザーから「PR 作成して」/ 「push して」等の明示指示が出ること
- かつ Phase 12 完了

## 主成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/pr-template.md`

## スコープ外

- main / dev への直接コミット（pre-commit hook で禁止済み）
- 検証実施そのもの

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- ユーザー承認まで blocked

## 参照資料

- Phase 1〜12 全成果物
- Phase 2: `outputs/phase-2/main.md`
- Phase 5: `outputs/phase-5/runbook.md`
- Phase 6: `outputs/phase-6/main.md`
- Phase 7: `outputs/phase-7/main.md`
- Phase 8: `outputs/phase-8/main.md`
- Phase 9: `outputs/phase-9/main.md`
- Phase 10: `outputs/phase-10/final-review-result.md`
- Phase 11: `outputs/phase-11/main.md`
- Phase 12: `outputs/phase-12/main.md`
- `CLAUDE.md`（ブランチ戦略 / solo 運用ポリシー）
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] ユーザー承認を得た
- [ ] PR が作成され URL が記録された
- [ ] CI が green
