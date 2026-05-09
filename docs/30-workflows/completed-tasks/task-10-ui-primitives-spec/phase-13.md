# Phase 13: PR作成

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 13 |
| 名称 | PR作成 |
| 依存Phase | Phase 12 |
| user approval | required |

## 目的

ユーザーの明示承認がある場合に限り、commit / push / PR 作成を実施する。承認がない状態では Phase 13 を blocked_pending_user_approval として閉じる。

## 実行タスク

- Task 13-1: `git status` と `git diff --stat` で task-10 scope を確認する。
- Task 13-2: user approval を取得する。
- Task 13-3: 承認後に commit / push / PR 作成を実施する。
- Task 13-4: PR URL を `outputs/phase-13/pr-url.txt` に記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | requirements and AC |
| Phase 2 | `phase-02.md` | integration design |
| Phase 5 | `phase-05.md` | implementation scope |
| Phase 6 | `phase-06.md` | regression tests |
| Phase 7 | `phase-07.md` | coverage evidence |
| Phase 8 | `phase-08.md` | refactor evidence |
| Phase 9 | `phase-09.md` | quality gate |
| Phase 10 | `phase-10.md` | final review |
| Phase 11 | `phase-11.md` | runtime evidence boundary |
| Phase 12 | `phase-12.md` | close-out |
| scope | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | diff scope discipline |

## 実行手順

1. user approval がない場合は操作しない。
2. approval 後、base branch `dev` を確認する。
3. local quality gate の結果を PR body に記載する。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| 戦略的思考 | user gate と release flow を分離 |
| 依存関係整合 | Phase 12 完了後のみ PR に進む |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| approval gate | `outputs/phase-13/main.md` |
| PR URL | `outputs/phase-13/pr-url.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 13 main | `outputs/phase-13/main.md` |
| PR URL | `outputs/phase-13/pr-url.txt` |

## 完了条件

- [ ] user approval がない状態で commit / push / PR を実行していない。
- [ ] approval 後のみ PR URL を記録する。
- [ ] `git status` と `git diff --stat` を確認している。

## タスク100%実行確認【必須】

- [ ] Task 13-1 完了
- [ ] Task 13-2 完了
- [ ] Task 13-3 完了
- [ ] Task 13-4 完了

## 次Phase

なし。
