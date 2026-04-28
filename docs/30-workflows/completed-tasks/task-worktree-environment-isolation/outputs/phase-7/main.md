# Phase 7: カバレッジ確認 — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 7（カバレッジ確認） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

本タスクは docs-only / spec_created であり、コード実装を含まない。したがって従来のコードカバレッジ（行/分岐）は適用できない。代わりに **「仕様網羅率（Specification Coverage）」** を評価軸とする。

評価対象:
- Phase 1 受け入れ条件 AC-1〜AC-4
- Phase 2 設計決定 D-1〜D-4 と検証証跡 EV-1〜EV-7
- Phase 6 失敗ケース F-1〜F-6

## サマリ

- **仕様網羅率: 100%**（AC-1〜AC-4 すべてに対し、正常系テスト ≥ 1 / 失敗ケース ≥ 1 / EV ≥ 1 がマップ済み）。
- 未カバー領域は「想定外として明示除外」しているもの（NFS、別 OS、Claude Code 起動前の OP_SERVICE_ACCOUNT_TOKEN リーク）に限定され、いずれも runbook / 別タスク申し送りで処理される。
- 本タスクの spec_created ゴールに対し、**追加テスト不要**と判定する。

## 成果物

- [`coverage.md`](./coverage.md) — 仕様網羅率マトリクスと未カバー領域の評価

## 完了条件

- [x] カバレッジ確認 の成果物が artifacts.json と一致する。
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [x] AC-1〜AC-4 すべてに対しテストケース・失敗ケース・証跡が紐付いている。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 後続 Phase への申し送り

- Phase 8 リファクタリングでは、本マトリクスの「未カバー = 許容」と判定した領域に変更が入る場合、再評価する。
- Phase 11 手動テストでは EV-1〜EV-7 を全件実行し、`outputs/phase-11/manual-smoke-log.md` に貼る。
