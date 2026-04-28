# Phase 11: 手動テスト — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 11（手動テスト） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## サマリ

本タスクは docs-only / NON_VISUAL のため、Phase 11 では実コードの実行ではなく、後続実装タスクで再現するための **手動 smoke ログ枠** と **リンク整合チェックリスト** を確定させる。

- `manual-smoke-log.md`: 設計 §6 EV-1〜EV-7 を再現するための手順・期待結果・記録欄を整備
- `link-checklist.md`: artifacts.json outputs と実ファイルの照合、phase-XX.md / CLAUDE.md / scripts/new-worktree.sh への参照整合を確認

NON_VISUAL の証跡は **terminal output / file diff** のみとし、screenshot 等の視覚証跡は採用しない。

## 成果物

- [`outputs/phase-11/main.md`](./main.md) — 本ファイル（Phase 11 サマリ）
- [`outputs/phase-11/manual-smoke-log.md`](./manual-smoke-log.md) — 手動 smoke ログ枠（EV-1〜EV-7）
- [`outputs/phase-11/link-checklist.md`](./link-checklist.md) — リンク整合チェックリスト

## 入力

- `outputs/phase-10/go-no-go.md` の Go 判定（条件付き）
- `outputs/phase-2/design.md` §6 の EV-1〜EV-7 定義
- `outputs/phase-1/main.md` の AC-1〜AC-4
- `CLAUDE.md`、`scripts/new-worktree.sh`、`docs/30-workflows/task-worktree-environment-isolation/artifacts.json`

## 証跡方針

- taskType: docs-only
- visualEvidence: NON_VISUAL
- screenshot: 不要（採用しない）
- 採用する証跡: terminal output（標準出力 / 標準エラー）、file diff、`cat` / `find` / `git worktree list` 等のコマンド出力

## 完了条件

- [x] `manual-smoke-log.md` に EV-1〜EV-7 の手順・期待結果・記録欄が揃っている。
- [x] `link-checklist.md` で artifacts.json outputs と実ファイルが完全一致しているチェック項目が並んでいる。
- [x] NON_VISUAL 証跡方針が明記され、screenshot を採用しないことが明文化されている。
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 次 Phase 申し送り

- Phase 12 では `manual-smoke-log.md` の手順を `CLAUDE.md` の「ワークツリー作成」セクションへ参照リンクとして追記する。
- 後続実装タスクが EV-1〜EV-7 を実行した際の実出力は、本タスクではなく実装タスク側の Phase 11 で記録する。
