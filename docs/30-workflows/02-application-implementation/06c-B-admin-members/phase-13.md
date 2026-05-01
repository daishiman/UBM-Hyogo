# Phase 13: PR 作成 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval_required | true |

## 目的

仕様書のみを対象とした PR を作成するための最終ゲートを定義する。実装の PR ではない。

## approval gate

- 本タスクは spec のみ。**user の明示承認が無ければ commit / push / PR を作成しない。**
- 実装 PR は本タスクの scope 外。実装担当者が別ブランチで進める。

## change-summary（spec PR 用 placeholder）

- 追加: `docs/30-workflows/02-application-implementation/06c-B-admin-members/` 配下 15 ファイル
- 内容: 06c admin members の follow-up 仕様書（一覧/詳細/検索/論理削除/復元/ロール/audit）
- 影響: docs only（コード変更なし）

## local-check-result（実行時に置換）

| 項目 | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | docs only のため対象外 |
| `mise exec -- pnpm lint` | docs only のため対象外 |
| markdown lint（あれば） | placeholder |
| skill index drift | placeholder |

## PR template（提案）

```
title: docs(06c-B): admin members follow-up spec

## Summary
- /admin/members 一覧・詳細の follow-up 仕様書 15 ファイルを追加
- 11-admin-management.md / 07-edit-delete.md / 12-search-tags.md と整合
- 不変条件 #4 / #5 / #11 / #13 を全 phase で参照

## Test plan
- [ ] 仕様書のみのため code test は対象外
- [ ] 実装は本 PR の scope 外（後続 PR）
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

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 12 ドキュメント更新
- 下流: 08b admin members E2E, 09a admin staging smoke

## 多角的チェック観点

- #4 / #5 / #11 / #13 を PR description でも侵さない
- secret 値を PR 本文に書かない
- 承認なしに自走しない

## サブタスク管理

- [ ] user 承認の確認
- [ ] change-summary 確定
- [ ] PR template 反映
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md

## 完了条件

- user 承認後にのみ PR が作成される
- change-summary が docs only であることを明示する
- 後続タスクの開始条件が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 承認なしに commit / push / PR を実行していない

## 次タスクへの引き渡し

08b admin members E2E と 09a admin staging smoke へ、本仕様書の AC / evidence path / blocker を渡す。
