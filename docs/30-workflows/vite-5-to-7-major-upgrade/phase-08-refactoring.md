# Phase 8: Refactoring（リファクタリング）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-07（全 shard GREEN + coverage 確認済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 方針 | 依存アップグレード（Vite 5.4.21 → 7.x）のため大規模リファクタは不要。config に不要な記述が増えていないか・alias / optimizeDeps が等価維持されているかの確認に限定 |

## リファクタリング全体方針

本タスクの本質は **Vite 5.4.21 → 7.x** の依存引き上げ（root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加 + `pnpm-lock.yaml` 再生成）であり、プロダクトコードは不変（Phase 2 責務境界）。さらに Vite はテストツールチェーン専用（apps/web 本番ビルドは `next build --webpack` で Vite 非依存・SSOT 核心1）であるため、リファクタの余地は構造的に小さい。

よってリファクタは「**bump で config に不要な記述が増えていないかの確認**」と「**alias / optimizeDeps の等価維持の確認**」に限定する。**過剰な抽象化は行わない**（YAGNI）。

> **重要**: 親タスク（vitest 2→3）と異なり、本タスクでは bump 対象の `package.json` が root 1 ファイルのみ（vite を直接依存するノードは root の単一ノード・SSOT §4）。version 表記の「複数ファイル統一」という重複削減対象は存在しない。

## 変更内容記録（対象 / Before / After / 理由）（Feedback RT-03 準拠）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| root `package.json` `devDependencies` | `"vite"` 直接 devDependency なし（推移依存で 5.4.21 に解決） | `"vite": "^7.0.0"` を**新規追加** | 推移依存の最低版固定（5.4.21）を解除し 7.x へ引き上げ。直接依存化で dependabot 追跡可・解決バージョン可視化（SSOT 核心3） |
| `pnpm-lock.yaml` | vite 5.4.21 系解決 | vite 7.x 系解決（単一バージョン） | `mise exec -- pnpm install` による再生成（SSOT §4） |
| `vitest.config.ts` `resolve.alias`（react subpath） | 既存 alias（`react/jsx-dev-runtime` 等） | **等価維持**（Vite 7 で解決失敗が出た場合のみ新 API へ等価変換） | 不変条件2。V2 が安定 API のため変更不要が原則 |
| `vitest.config.ts` `optimizeDeps` / `dedupe` / `plugins:[react()]` | 既存記述 | **等価維持** | 不変条件2。V2/V3 は v7 で安定。@vitejs/plugin-react@4.7.0 が peer で v7 宣言済み |
| `vitest.d1.config.ts` `pool: forks` / `singleFork: true` | 既存記述 | **等価維持** | 不変条件3（issue-617 port exhaustion 回避設計）。破壊しない |
| config 非推奨 API（存在する場合のみ） | `splitVendorChunkPlugin` / `legacy` / CJS Node API / `resolve.conditions` 既定変更等（V4） | 非推奨記述があれば該当行のみ最小置換 | 現行 config は未使用（Phase 2 grep で確認）→ **警告 0 期待。修正は発生しない見込み** |

> **新規リファクタ対象**: 上記の通り、config に不要な記述の追加はなく、alias / optimizeDeps / pool は等価維持が原則のため、**新規のリファクタ対象は該当なし（依存定義 + lockfile のみの変更のため）**。V4 deprecation が実測で検出された場合に限り、該当行の最小置換のみを行う。

## navigation / duplicate drift の確認

Vite 5→7 の破壊的変更（V2〜V4）は、現行 config が安定 API のみを使用しているため、複数箇所に同種パターンを生む可能性は低い。重複が drift（同じ修正が散在し将来の保守コストを上げる状態）になっていないかを確認する。

| 重複候補パターン | 検出方法 | 抽出判断基準 |
| --- | --- | --- |
| V4: `splitVendorChunkPlugin` 等の削除済み API 参照 | `grep -rn "splitVendorChunkPlugin\|resolve.conditions\|\.legacy" vitest.config.ts vitest.d1.config.ts` | ヒット 0 件が期待。検出されたら該当行のみ最小置換（重複ではなく個別置換） |
| V2: react subpath alias の重複定義 | `grep -rn "jsx-dev-runtime\|jsx-runtime" vitest.config.ts` | 既存 alias は単一定義。重複追加しない（等価維持） |
| V3: `react()` plugin の多重適用 | `grep -rn "react()" vitest.config.ts vitest.d1.config.ts` | 各 config で単一適用を維持。共通化のための無理な抽出はしない |

> **過剰な抽象化の禁止**: 「同じに見える」だけで config を共通モジュール化すると、各 config（unit / d1）の独立性・可読性を損なう。共通化は本タスクでは行わない（vitest.config.ts / vitest.d1.config.ts は独立した責務を持つ）。

## リファクタを「行わない」判断の記録（YAGNI）

| 検討した変更 | 判断 | 理由 |
| --- | --- | --- |
| `vitest.config.ts` / `vitest.d1.config.ts` の構造刷新（projects 化等） | **行わない** | projects 移行は Vitest 4 系の範囲（SSOT §7「含まないもの」）。本タスクは Vite 依存引き上げのみ |
| react alias / optimizeDeps の整理 | **行わない** | 不変条件2。pnpm isolated node-linker 対応として機能中。等価維持（触らない） |
| D1 pool 設定（`forks` / `singleFork`）の poolOptions トップレベル化 | **行わない** | 不変条件3。issue-617 port exhaustion 回避設計を破壊しない |
| `pnpm.overrides.esbuild = "0.27.3"` の見直し | **行わない** | 不変条件4。vite 7 と整合しない場合のみ Phase 3 エスカレーション（リファクタ対象外） |
| `vite` を `pnpm.overrides.vite` で強制上書きする方式への変更 | **行わない** | SSOT 核心3。直接 devDependency 追加を採用方針とし、overrides は peer 検証を弱めるため非採用（フォールバックとしてのみ言及） |
| apps/api / apps/og / apps/web / packages への vite 個別追加 | **行わない** | これらは vite を直接依存しない。vite は root の単一ノードで解決される（SSOT §4 注記） |

> 本タスクで行う変更は **root `package.json` への `vite ^7.0.0` 直接追加 + lockfile 再生成**のみ。それ以外は「現行が機能しており、bump の目的と無関係」または「不変条件で保護対象」として明示的に据え置く。

## リファクタ後の再検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| 全 shard vitest | `mise exec -- pnpm exec vitest run`（api-unit / api-d1 / web / og / packages / scripts / infra） | 全 shard green（fail 0 / skip 増なし） |
| vite 単一解決 | `mise exec -- pnpm why vite` | 単一 7.x に解決（5系と7系の重複なし・V1/V7） |
| deprecation 警告 | vitest 実行ログ → `grep -iE 'deprecat\|warn'` | ヒット 0 件 |

## 完了条件

- [ ] 変更内容が「対象 / Before / After / 理由」テーブルで記録されている
- [ ] root `package.json` に `"vite": "^7.0.0"` が直接 devDependency として追加され、lockfile が 7.x 単一解決へ再生成されている
- [ ] config（vitest.config.ts / vitest.d1.config.ts）に不要な記述が増えていない（alias / optimizeDeps / pool が等価維持）ことが確認されている
- [ ] navigation / duplicate drift（V4 削除済み API 等）が確認され、新規リファクタ対象が「該当なし（依存定義 + lockfile のみの変更のため）」と判定・記録されている
- [ ] リファクタを「行わない」判断（YAGNI）が理由付きで記録されている
- [ ] 過剰抽象化を避ける方針が明記されている
- [ ] リファクタ後に typecheck / lint / 全 shard vitest が green、`pnpm why vite` が単一 7.x
