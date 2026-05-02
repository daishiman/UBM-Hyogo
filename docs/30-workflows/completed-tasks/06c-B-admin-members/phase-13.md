# Phase 13: PR 作成 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |

## 目的

実装差分を含む PR を作成するための最終ゲートを定義する。commit / push / PR はユーザーの明示承認まで実行しない。

## approval gate

- 本タスクは実装差分を含む。**user の明示承認が無ければ commit / push / PR を作成しない。**
- staging visual evidence は 08b admin E2E / 09a staging smoke の承認ゲートで取得する。

## change-summary（PR 用 placeholder）

- 追加/変更: `docs/30-workflows/completed-tasks/06c-B-admin-members/`、`apps/api`、`apps/web`、`packages/shared`
- 内容: 06c admin members の検索/フィルタ/ページング実装、tag code AND 検索、正本仕様同期
- 影響: implementation（staging deploy / visual smoke は未実行）

## local-check-result（実行時に置換）

| 項目 | 結果 |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/shared typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/routes/admin/members.test.ts` | PASS |
| markdown lint（あれば） | placeholder |
| skill index drift | placeholder |

## PR template（提案）

```
title: feat(06c-B): admin members search follow-up

## Summary
- /admin/members 一覧検索を q / zone / tag code AND / sort / density / page に対応
- 11-admin-management.md / 07-edit-delete.md / 12-search-tags.md と正本同期
- 不変条件 #4 / #5 / #11 / #13 を全 phase で参照

## Test plan
- [ ] api/web/shared typecheck
- [ ] admin members focused vitest
- [ ] 08b admin members E2E / 09a admin smoke の前提が揃ったことを確認
```

## 実行タスク

1. user 承認を得るまで commit / push / PR を作成しない。完了条件: 承認エビデンスがある。
2. 承認後、change-summary を確定し PR description を組み立てる。完了条件: PR template が埋まる。
3. PR 作成後、08b / 09a への引き渡しを記録する。完了条件: 後続タスクが開始可能。

## 参照資料

- 本仕様書 Phase 1〜12
- CLAUDE.md ブランチ戦略

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- deploy、commit、push、PR 作成は user 明示承認まで行わない。
- 実測時は Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新
- 下流: 08b admin members E2E, 09a admin staging smoke

## 多角的チェック観点

- #4 / #5 / #11 / #13 を PR description でも侵さない
- secret 値を PR 本文に書かない
- 承認なしに自走しない

## サブタスク管理

- [ ] user 承認の確認
- [x] change-summary 草案作成
- [x] PR template 草案反映
- [x] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md

## 完了条件

- [ ] user 承認後にのみ PR が作成される
- [x] change-summary が implementation であることを明示する
- [x] 後続タスクの開始条件が記録される

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 承認なしに commit / push / PR を実行していない

## 次タスクへの引き渡し

08b admin members E2E と 09a admin staging smoke へ、本仕様書の AC / evidence path / blocker を渡す。
