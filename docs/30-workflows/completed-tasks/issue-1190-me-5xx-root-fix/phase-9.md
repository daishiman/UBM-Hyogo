# Phase 9: 品質保証

## メタ情報
正本: `outputs/phase-9/phase-9.md`

## 目的
typecheck / lint / focused vitest・apps/web 非接触・migrations 非接触・memberId 非露出 grep gate を一括判定する計画を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-9/phase-9.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT §6 実行コマンド）
- `outputs/phase-9/phase-9.md`

## 成果物
- `outputs/phase-9/phase-9.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 品質ゲートは Q1〜Q7（typecheck / lint / focused vitest / apps/web diff 空 / migrations 非接触 / #11 grep gate / NON_VISUAL 宣言）。実行は本サイクル（結果欄は現時点でlocal present/staging pending）。
- focused vitest は monorepo root 基準（`--root=. --config=vitest.config.ts <パス>`）必須。`--filter` 経由は "No test files found" になる既知の罠。
- Phase 10 は Q1〜Q7 の PASS 計画を前提に AC-1〜AC-10 の充足を spec 段階判定（実装・検証済み）で確定する。
