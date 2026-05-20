# Phase 1 — Scope / 課題定義

## 目的

`verify-indexes-up-to-date` CI gate の trigger 条件と失敗時 SOP を `docs/00-getting-started-manual/lefthook-operations.md` に統合し、開発者が pre-push 拒否時または CI 失敗時に迷わず復旧できる状態を作る。

## 含む

- `verify-indexes.yml` の trigger 条件・status context 名の文書化
- pre-push hook 拒否時の対処手順（一次防衛）
- CI 失敗時の対処手順（二次防衛・例外時）
- 手編集禁止と generator 単独正本ポリシーの明文化
- 既存 `lefthook.yml` の `fail_text` から SOP への導線整合

## 含まない

- workflow ファイル (`.github/workflows/verify-indexes.yml`) のロジック変更
- `pnpm indexes:rebuild` generator 仕様変更
- branch protection 設定の直接変更（U-VIDX-01 の責務）
- 他 skill の indexes gate 拡張（U-VIDX-02 の責務）
- 新規ドキュメントファイルの作成（`deployment-gha.md` 等）

## 前提

- Issue #289 は CLOSED 済み。原因の構造的部分は pre-push hook で解決済み。
- 残るのは documentation gap のみ。
- AC-5 の導線確保のため `lefthook.yml` fail_text も同一 wave で更新し、NON_VISUAL 実装として扱う。
