# Phase 13 main — PR 作成（user-gated・pending）

> 正本: `_shared-context.md` §3 変更ファイル / §4 DoD。
> **commit / push / PR は user の明示承認後にのみ実施する**（本サイクルでは pending）。

## 状態

- 本タスクは implemented_local_evidence_captured（ローカル実装・証跡取得済み）。Phase 13 は **pending**。
- PR は、実装（F1〜F7 + T1〜T6）・検証（SSOT §4）・ローカル実スクリーンショット取得が完了し、
  **user が明示的に承認した後**に `gh pr create --base dev` で作成する。

## 手順（user 承認後）

1. 作業ブランチ（例: `feat/home-dashboard-japanese-localization`）で実装をコミット。
2. SSOT §4 の検証コマンド（focused vitest / typecheck / lint / verify-design-tokens / 回帰 grep / diff 空）を実行し緑を確認。
3. 実スクリーンショット（home-localized-full/stats/about.png）を `outputs/phase-11/` に配置。
4. `outputs/phase-13/pr-template.md` を本文として `gh pr create --base dev` を実行。

## user-gated 境界

- `git add` / `git commit` / `git push` / `gh pr create` は **すべて user の明示承認後のみ**。
- 本サイクル（implemented_local_evidence_captured）では一切実行しない。
- base は `dev`（開発統合ブランチ）。production リリースの `dev → main` は本タスクの対象外。

## 成果物

- `pr-template.md` — PR 本文テンプレート（base=dev / タイトル案 / 変更概要 / 変更ファイル一覧 / テスト / スクリーンショット欄 / 不変条件チェック）。
