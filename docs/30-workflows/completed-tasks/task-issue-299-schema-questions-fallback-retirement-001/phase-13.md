# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | commit/PR approval gate |

## 目的

ユーザー承認後にのみ commit、push、PR 作成を行う。Issue #299 の state は変更しない。

## 実行タスク

- Phase 1-12 の成果物と code diff を確認する。
- ユーザーから明示承認を得る。
- 承認後に commit を作成する。
- 承認後に branch push と PR 作成を行う（base: `dev`）。
- Issue #299 は **state=open のまま** 参照し、PR body は `Refs #299` とする（`Closes #299` 禁止）。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 12 | `phase-12.md` | close-out |
| GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/299` | open issue（変更しない） |
| PR ワークフロー | `CLAUDE.md` 「PR作成の完全自律フロー」 | base=dev、`gh pr create --base dev` |

## 実行手順

1. `git status --short` と `git diff dev...HEAD --name-only` を確認する。
2. ユーザー承認がない場合はここで停止する。
3. 承認後、commit message は以下を候補にする:
   - GO 時: `refactor(api): retire schema_questions stable_key fallback after alias coverage`
   - DEFERRED 時: `docs(workflows): record schema_questions stable_key fallback retirement deferral evidence`
4. PR body に `Refs #299` と evidence summary（coverage 0 件 + test PASS + diff）を記載する。
5. PR base は `dev`。`gh pr create --base dev` で作成する。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| pre-PR tests | Phase 9 / Phase 11 evidence PASS |
| issue policy | open 維持、`Refs #299` のみ |
| base branch | `dev`（`main` 直接ではない） |

## 多角的チェック観点（AIが判断）

- ユーザー承認前に push/PR を実行していないか。
- `Closes #299` で open issue を再操作しようとしていないか。
- DEFERRED の PR を「fallback 削除完了」として誤った body で出していないか。

## サブタスク管理

| サブタスク | 承認 |
| --- | --- |
| commit | 必須 |
| push | 必須 |
| PR | 必須 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| PR draft | GitHub | ユーザー承認後のみ |

## 完了条件

- [ ] ユーザー承認を得ている
- [ ] `Refs #299` を使っている（`Closes` 禁止）
- [ ] base=`dev` で作成している
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] commit/push/PR を承認なしで実行していない

## 次Phase

なし
