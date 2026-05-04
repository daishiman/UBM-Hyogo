# Phase 13: PR 作成 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 13 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

user approval を得て PR を作る手順、local check 結果、change summary、PR template を確定する。

## 実行タスク

1. user approval gate を確認する。完了条件: 承認なしには push / PR を行わない宣言が記録される。
2. local-check-result（typecheck / lint / test の実行ログ要約）を貼る。完了条件: 失敗時の rollback ステップがある。
3. change-summary（変更ファイル一覧 / 追加 endpoint / 追加 D1 table / 追加 UI route）を書く。完了条件: artifacts.json と一致する。
4. PR template を書く（タイトル / Summary / Test plan / 関連 Issue / Co-Authored-By）。完了条件: `gh pr create --base dev` を踏む順序が決まる。

## 参照資料

- CLAUDE.md（ブランチ戦略 / Git Safety Protocol）
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-11/main.md

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-E-admin-meetings/
- 本仕様書作成では PR を作らない。実装後の PR 作成は user approval 後に `gh pr create` を踏む。
- `--no-verify` を使わない。hook 失敗時は新規 commit で修正する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- secret / cookie 値が PR 本文・diff・スクリーンショットに混入しないか。

## サブタスク管理

- [ ] user approval gate を明記する
- [ ] local-check-result を書く
- [ ] change-summary を書く
- [ ] PR template を書く
- [ ] outputs/phase-13/main.md を作成する

## 成果物

- outputs/phase-13/main.md
- outputs/phase-13/pr-template.md（PR 本文の雛形）

## 完了条件

- user approval gate が明文化される
- local check が green であることが前提条件として書かれる
- PR template が `gh pr create --body` にそのまま流せる粒度になる
- secret 混入リスクの最終チェック項目がある

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 仕様書作成段階で PR を作成していない

## 次 Phase への引き渡し

なし（最終 phase）。user approval が降りた段階で実装担当が PR を作成する。
