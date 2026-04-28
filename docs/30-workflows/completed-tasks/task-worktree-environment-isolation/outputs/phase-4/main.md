# Phase 4: テスト設計サマリ — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 4（テスト設計） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 入力 | `outputs/phase-1/main.md`、`outputs/phase-2/design.md`、`outputs/phase-3/review.md` |
| 出力 | `outputs/phase-4/main.md`（本書）、`outputs/phase-4/test-matrix.md` |

## 1. テスト設計方針

本タスクは docs-only / NON_VISUAL であり、コード実装・自動テストは後続実装タスクで実行する。Phase 4 の責務は以下に限定される。

1. AC-1〜AC-4 を **観点 → ケース → 期待出力** の形で固定する。
2. Phase 3 の申し送り（C-1 macOS の `flock(1)` 不在 / C-5 `BRANCH_SLUG` 境界値 / C-3 既存 tmux 汚染）を漏れなくケース化する。
3. NON_VISUAL タスクで取れる検証手段（手動 smoke コマンド出力、リンク整合、設計レビュー）に揃え、UI スナップショットや E2E は対象外とする。
4. 失敗時の判定基準を「コマンド終了コード」「`grep`/`wc -l` 結果」「ファイル存在」など決定論的な指標に揃える。

## 2. 主要観点

- AC-1: skill symlink 撤去後の状態（`find -type l` がゼロ件）
- AC-2: tmux global env と session env の差分（`UBM_WT_*` の局在）
- AC-3: gwt-auto lock の取得・競合・解放・stale 判定（mkdir lockdir 正本、flock は optional）
- AC-4: NON_VISUAL evidence EV-1〜EV-7 の再現可能性
- 横断: 日本語パス（`個人開発`）耐性、`BRANCH_SLUG` 境界値、`scripts/new-worktree.sh` の後方互換

## 3. 詳細マトリクス

詳細は [`test-matrix.md`](./test-matrix.md) を参照。

## 4. 完了条件

- [x] artifacts.json の `outputs/phase-4/*` と一致する 2 ファイルが揃っている。
- [x] AC-1〜AC-4 すべてに対応するテストケースが test-matrix.md に列挙されている。
- [x] Phase 3 の申し送り C-1 / C-3 / C-5 がケース化されている。
- [x] 失敗時の判定基準が決定論的に定義されている。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 5. 後続 Phase への申し送り

- Phase 5 ランブックは本テストケース ID（T-xxx）を実装ステップ末尾の検証コマンドとして転記する。
- Phase 6 失敗ケース拡充では、本書の「失敗時判定」列をベースに negative scenario を追加する。
- Phase 11 手動テストでは test-matrix.md のコマンド列をそのまま実行し、出力を `manual-smoke-log.md` に貼り付ける。
