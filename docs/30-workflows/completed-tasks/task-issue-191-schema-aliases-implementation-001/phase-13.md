# Phase 13: PR作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | commit/PR approval gate |

## 目的

ユーザー承認後にのみ commit、push、PR 作成を行う。

## 実行タスク

- Phase 1-12 の成果物と code diff を確認する。
- ユーザーから明示承認を得る。
- 承認後に commit を作成する。
- 承認後に branch push と draft PR 作成を行う。
- Issue #298 は closed のまま参照し、`Closes #298` は使わない。本文は `Refs #298` とする。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 12 | `phase-12.md` | close-out |
| GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/298` | closed issue |

## 実行手順

1. `git status --short` を確認する。
2. ユーザー承認がない場合はここで停止する。
3. 承認後、commit message は `feat(api): implement schema aliases write path` を候補にする。
4. PR body に `Refs #298` と evidence summary を記載する。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| pre-PR tests | Phase 9/11 evidence PASS |
| issue policy | closed 維持、Refs のみ |

## 多角的チェック観点（AIが判断）

- ユーザー承認前に push/PR を実行していないか。
- `Closes #298` で closed issue を再操作しようとしていないか。

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
- [ ] `Refs #298` を使っている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] commit/push/PR を承認なしで実行していない

## 次Phase

なし
