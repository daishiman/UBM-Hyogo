# Phase 8: リファクタリング — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 8（リファクタリング） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 上位依存 | Phase 7（カバレッジ確認） |
| 後続 | Phase 9（品質保証） |

## 1. 目的

本 Phase は docs-only タスクの「リファクタリング」フェーズである。コード変更は行わず、Phase 1〜7 で確定した設計・テスト設計・ランブックに対し、**仕様の重複排除・責務の明確化・before/after の可視化**を行う。実装変更は後続実装タスクで適用される前提で、ここでは「何をどこへ・どのような状態に変更するか」の差分図を固定する。

## 2. リファクタリング対象（4 軸）

| ID | 領域 | 改善後の責務 |
| --- | --- | --- |
| R-1 | skill symlink | symlink ゼロ・実ファイルコミット or グローバル参照に統一 |
| R-2 | `scripts/new-worktree.sh` | lock 取得 → worktree 作成 → 環境構築の単線フロー |
| R-3 | tmux 設定 | `update-environment` に worktree 依存変数を含めず、session-scope `-e` のみで注入 |
| R-4 | shell 初期化 | `cd` 直後に `mise trust` / `mise install` / `hash -r`、不要な `OP_*` を `unset` |

## 3. 成果物

- 本ファイル `outputs/phase-8/main.md`（サマリ）
- [`outputs/phase-8/before-after.md`](./before-after.md) — 4 軸の before/after 差分・影響範囲・後方互換性メモ

## 4. リファクタリング判断基準

1. **責務の単一化**: lock 取得・worktree 作成・環境構築・tmux 起動を `scripts/new-worktree.sh` 内で混在させず、関数として分離する（実装は別タスク、本 docs では関数境界のみ定義）。
2. **冗長な状態の削除**: `.claude/skills/` 配下の symlink は worktree state を漏らす冗長経路として撤去する。
3. **可逆性の維持**: すべての変更に rollback 経路（インベントリ復元・`flock -u` / `rmdir` / 旧 tmux 設定退避）を添付する。
4. **後方互換**: 既存呼び出し `bash scripts/new-worktree.sh feat/foo` の出力体裁・終了コード（成功 0）を維持する。

## 5. 完了条件

- [x] リファクタリング 4 軸の before/after が `before-after.md` に記載されている。
- [x] artifacts.json の outputs（`main.md` / `before-after.md`）と完全一致している。
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [x] CLAUDE.md の不変条件（D1 直アクセス禁止 / `wrangler` 直叩き禁止 / `.env` 実値非露出 / GAS prototype 非昇格）と衝突しない。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 6. 後続 Phase への申し送り

- Phase 9（品質保証）では本 Phase の before/after を品質ゲート（リンク整合 / spec 網羅 / artifacts 一致）で検証する。
- 実装は後続実装タスク（`task-git-hooks-lefthook-and-post-merge` 等）で適用するため、本タスクの PR では before/after 差分が docs として確定していれば足りる。
