# Phase 8: Refactoring（リファクタリング）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-07（全 shard GREEN + coverage 確認済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 方針 | 依存アップグレードのため大規模リファクタは不要。version 表記統一 + 重複修正パターンの最小共通化に限定 |

## リファクタリング全体方針

本タスクの本質は依存バージョンの bump であり、プロダクトコードは不変（Phase 2 責務境界）。よってリファクタは「**bump で露呈した表記の不統一の解消**」と「**破壊的変更修正で発生した重複の最小共通化**」に限定する。**過剰な抽象化は行わない**（YAGNI）。

## 変更内容記録（対象 / Before / After / 理由）（Feedback RT-03 準拠）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| root `package.json` `vitest` | `^2.0.0` | `^3.2.6` | メジャー跨ぎ反映 + 表記統一（root だけ `^2.0.0` で apps と不統一だった） |
| root `package.json` `@vitest/coverage-v8` | `^2.1.9` | `^3.2.6` | peer 完全一致要求（vitest と同一バージョン）。NFR-1 |
| `apps/api/package.json` `vitest` | `^2.1.9` | `^3.2.6` | 全 3 ファイルで単一バージョン化（drift 解消） |
| `apps/og/package.json` `vitest` | `^2.1.9` | `^3.2.6` | 同上 |
| `pnpm-lock.yaml` | vitest 2.1.9 系解決 | vitest 3.2.6 系解決 | `pnpm install` による再生成（FR-5） |
| 重複 mock setup（C2/C3 修正で発生した場合のみ） | 各 spec に同一の `vi.useFakeTimers({ toFake })` / spy リセット設定が散在 | 必要なら同一 shard 内の共通 setup へ抽出（**過剰抽象化はしない**） | 同一パターンの重複は drift 源。ただし 2〜3 箇所程度なら抽出せず据え置く |
| config 非推奨 API（存在する場合のみ） | `vitest.config.ts` / `vitest.d1.config.ts` に非推奨記述 | 非推奨記述があれば該当行のみ最小修正 | 現行 config に `deps.inline` / `workspace` 記述は**なし**（Phase 2 調査済み）。実体は「警告ゼロ確認」であり修正は発生しない見込み |

> version 統一は「不統一の解消」という明確な価値があるため必須。それ以外の構造変更は次節の navigation/duplicate drift 判定に従う。

## navigation / duplicate drift の確認

破壊的変更（C1〜C3）の修正は複数の spec に同種パターンを生む可能性がある。重複が drift（同じ修正が散在し将来の保守コストを上げる状態）になっていないかを確認する。

| 重複候補パターン | 検出方法 | 抽出判断基準 |
| --- | --- | --- |
| C3: `vi.useFakeTimers({ toFake: [...] })` の同一設定 | `grep -rn "useFakeTimers" apps packages scripts` | **同一 shard 内で 4 箇所以上** 同一設定が重複する場合のみ、その shard の共通 setup（または既存 `beforeEach`）へ集約。3 箇所以下は据え置き（YAGNI） |
| C2: `mockReset` / `mockRestore` の定型 spy 復帰 | `grep -rn "mockReset\|mockRestore" apps packages` | 同上。テストの独立性を損なう共通化はしない |
| C1: エラー型期待値（`toThrow(TypeError)` 等）の修正 | `grep -rn "toThrow" apps packages` | 期待値は **各 spec 固有の意図** であり共通化しない（drift ではなく正当な個別記述） |

> **過剰な抽象化の禁止**: 「同じに見える」だけで共通化すると、各テストの独立性・可読性を損なう。共通化は「同一 shard 内で 4 箇所以上の機械的重複」に限る。それ未満は重複のまま残すことを正とする。

## リファクタを「行わない」判断の記録（YAGNI）

| 検討した変更 | 判断 | 理由 |
| --- | --- | --- |
| `vitest.config.ts` / `vitest.d1.config.ts` の構造刷新（projects 化等） | **行わない** | v3.2 で `workspace`→`projects` が推奨化されたが、現行 config は `workspace` 未使用。projects 移行は将来 v4 タスクの範囲（index.md スコープ外） |
| coverage reporter 構成の見直し | **行わない** | 現行 `["text","json-summary","json","lcov","html"]` は CI/baseline 比較で機能している。bump と無関係な変更 |
| react alias / optimizeDeps の整理 | **行わない** | 不変条件4。pnpm isolated node-linker 対応として機能中。触らない |
| D1 pool 設定（`forks`/`singleFork`）の poolOptions トップレベル化 | **行わない** | poolOptions トップレベル化は v4 仕様。v3.2.6 では現行記述が有効。不変条件3 |
| test 全体の `vi.spyOn` 戦略統一リファクタ | **行わない** | bump スコープ外の大規模変更。プロダクトコード巻き込みリスク。今回は fail した箇所の局所修正のみ |

> 本タスクで構造変更を行うのは **version 表記統一のみ**。それ以外は「現行が機能しており、bump の目的と無関係」として明示的に据え置く。

## リファクタ後の再検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| 全 shard vitest | `mise exec -- bash scripts/coverage-guard.sh` | 全 shard green（fail 0 / skip 増なし） |
| version 整合 | `mise exec -- pnpm why vitest` / `pnpm why @vitest/coverage-v8` | 両者 3.2.6 で一致 |

## 完了条件

- [ ] 変更内容が「対象 / Before / After / 理由」テーブルで記録されている
- [ ] version 表記が全 3 ファイルで `^3.2.6` に統一されている
- [ ] navigation/duplicate drift（C2/C3 重複）が確認され、共通化要否が「4 箇所以上」基準で判定されている
- [ ] リファクタを「行わない」判断（YAGNI）が理由付きで記録されている
- [ ] 過剰抽象化を避ける方針が明記されている
- [ ] リファクタ後に typecheck / lint / 全 shard vitest が green
