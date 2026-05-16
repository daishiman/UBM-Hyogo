# Phase 6: リファクタリング段階の品質ゲート

## メタ情報
- **ワークフロー**: serial-05-step-02-identity-conflicts-merge
- **Phase**: 6 / 13
- **実装区分**: 実装仕様書
- **直列順序**: 2/5
- **前提 Phase**: Phase 5（全 spec Green）
- **作成日**: 2026-05-16
- **CONST_007**: 先送り禁止（typecheck / lint / coverage / design token gate を **本 Phase 内で全て pass** させる）

## 目的
Phase 5 で Green 化した実装に対し、**機能変更ゼロでコード品質を上げる**。typecheck / lint / coverage / design token 不変条件 / dead code を一括確認するチェックポイント。リファクタ後に再度 spec を回し回帰がないことを保証する。

## 実行タスク
- タスク1: `pnpm typecheck` を pass
- タスク2: `pnpm lint`（必要なら `--fix`）を pass
- タスク3: coverage 確認（`bash scripts/coverage-guard.sh`）
- タスク4: design token 不変条件 verify（HEX / arbitrary color 禁止 grep）
- タスク5: dead code / unused import / 重複 helper を除去
- タスク6: 命名 / responsibility 整理（必要な場合のみ）
- タスク7: 全 spec 再実行で回帰なしを確認

## 参照資料
- `apps/web/tsconfig.json` / `apps/web/eslint.config.*`
- `scripts/coverage-guard.sh`（changed-mode）
- `apps/web/src/styles/tokens.css`
- 不変条件 #2 OKLch トークン正本化 / #3 prototype primitives 流用

## 実行手順

### ステップ1: typecheck
```bash
mise exec -- pnpm typecheck
```
- error 0 件まで反復
- `apps/web` 内 strict TS（`noUncheckedIndexedAccess` 等）に違反していないか確認
- `IdentityConflictRow` 型の field 名（`candidateTargetMemberId` 等）を実 API response と照合

### ステップ2: lint
```bash
mise exec -- pnpm lint
# 必要なら
mise exec -- pnpm lint --fix
```
- ESLint / Biome / Prettier いずれも 0 violation
- unused import / unused state / `console.log` 残骸を除去
- `"use client"` directive の位置（ファイル先頭 1 行目）を確認

### ステップ3: coverage gate
```bash
bash scripts/coverage-guard.sh
```
- changed-mode で本 step 変更分の line / branch coverage が thresholds を満たす
- Modal の error path（409 / 400）に対する分岐 coverage を確認
- 不足する場合は spec ファイル側でアサーション追加（実装は変えない）

### ステップ4: design token 不変条件 verify
```bash
# HEX 直書き
grep -rn "#[0-9a-fA-F]\{3,8\}" apps/web/src/components/admin/IdentityConflictRow.tsx apps/web/app/\(admin\)/admin/identity-conflicts
# Tailwind arbitrary color
grep -rEn "(bg|text|border|ring|fill|stroke)-\[#" apps/web/src/components/admin/IdentityConflictRow.tsx apps/web/app/\(admin\)/admin/identity-conflicts
# inline style color
grep -rEn "style=\{\{[^}]*color" apps/web/src/components/admin/IdentityConflictRow.tsx apps/web/app/\(admin\)/admin/identity-conflicts
```
- いずれも **0 件** を要件とする
- warning / danger / muted は `tokens.css` 由来の class 名を使う

### ステップ5: dead code / 重複 helper
```bash
# 重複 helper 検出
grep -rn "maskEmail\|formatEmail\|toMaskedEmail" apps/web/src apps/web/app
```
- email mask 関数が複数存在する場合は **既存実装を再利用**し新規追加しない
- 新規 util を作ってしまっていれば `apps/web/src/lib/` の妥当な配置に移動 or 既存 util へマージ

### ステップ6: 命名整理（必要時のみ）
- `selectedConflictId` / `isModalOpen` の責務が混線していないか
- props 名が spec.md 5節と完全一致しているか（rename しない）
- 対象ファイルが既存 `IdentityConflictRow.tsx` に集約され、新規 `_components` が不要であること

### ステップ7: 全 spec 再実行
```bash
mise exec -- pnpm test apps/web --run
```
- 全 pass を確認
- リファクタで意図せず壊した箇所がないか確認

## 統合テスト連携
- 本 Phase は unit / typecheck / lint 範囲。e2e は Phase 7 以降。

## 多角的チェック観点
- **回帰ゼロ**: リファクタ前後で spec 結果が同一
- **API 不変条件**: payload 形 / endpoint URL を **一切変更していない**
- **不変条件 #2/#3 連動**: design token と primitive 流用の二重 gate を通す
- **`apps/web` env 不変条件**: `process.env.*` 直接参照が追加されていない（getEnv 経由のみ。Modal / List とも本来 env 参照不要）
- **CSP / fetch 経路**: 既存の API client（`apps/web/src/lib/api/*`）を経由しており、`fetch()` 直書きをしていない

## サブタスク管理
- [ ] typecheck 0 error
- [ ] lint 0 violation
- [ ] coverage-guard pass
- [ ] HEX / arbitrary color grep 0 件
- [ ] 重複 helper 整理完了
- [ ] 命名 / props 整合確認
- [ ] 全 spec 再実行 pass

## 成果物
- リファクタ後の component 2 本（diff のみ、ファイルパスは Phase 5 と同一）
- `pnpm typecheck` / `pnpm lint` / `coverage-guard` の実行ログ（Phase 9 evidence 用に控える）

## 完了条件
- typecheck / lint / coverage / design token grep / spec 再実行 が **全て pass**
- 機能変更ゼロ（API payload / props シグネチャ / TC 結果に変化なし）
- dead code / 重複 helper / inline color 残存ゼロ

## タスク100%実行確認【必須】
- [ ] `mise exec -- pnpm typecheck` 終了コード 0
- [ ] `mise exec -- pnpm lint` 終了コード 0
- [ ] `bash scripts/coverage-guard.sh` 終了コード 0
- [ ] design token grep 4 種全て 0 件
- [ ] `mise exec -- pnpm test apps/web --run` 終了コード 0
- [ ] CONST_007: 「Phase 7 で直す」と書いた残課題が無い

## 次 Phase
Phase 7: レビュー / 中間検証（同 PR 内 self review、design token / a11y 確認、PR diff の最終チェック）。
