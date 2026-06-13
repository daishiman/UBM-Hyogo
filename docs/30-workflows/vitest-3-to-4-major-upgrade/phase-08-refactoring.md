# Phase 8: Refactoring（リファクタリング）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-07-coverage-check.md（全 shard GREEN + coverage 実測記録済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 方針 | 依存アップグレードのため大規模リファクタは不要。**v4.1 deprecation 警告の機械的解消** + version 表記統一 + 重複修正パターンの最小共通化に限定 |

## リファクタリング全体方針

本タスクの本質は依存バージョンの bump であり、プロダクトコード（`apps/*/src` / `packages/*/src`）は不変（Phase 2 責務境界）。よってリファクタは以下 3 点に限定する。**過剰な抽象化は行わない**（YAGNI）。

1. **v4.1 deprecation 警告の機械的解消**（本 Phase の主作業）— fail はしないが警告が出る記述を、警告実測で件数が確定した後に機械的に置換する。
2. **version 表記の統一確認** — Lane 0（Phase 5）で実施済みの bump が全ファイルで `^4.1.8` に揃っていることの最終確認。
3. **破壊的変更修正（C2-C4）で発生した重複の最小共通化** — 同一 shard 内で 4 箇所以上の機械的重複に限る。

## v4.1 deprecation 警告の機械的解消（変更内容記録: 対象 / Before / After / 理由）（Feedback RT-03 準拠）

v4.1 で追加された deprecation（fail はしない。phase-02「v4.1 追加の deprecation」参照）は以下 3 系統。**実施は Phase 5/7 の実行ログで警告の実件数が確定してから**とし、件数 0 の系統は「該当なし」と記録して置換しない。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `vitest/*` エントリポイント統合（警告が実測された import のみ） | 分割エントリポイント（例: `vitest/suite` / `vitest/environments` 等）からの import | `vitest` 本体エントリポイントからの import へ統合 | v4.1 で複数 `vitest/*` エントリポイントが deprecated。警告実測で対象ファイルを特定し機械的に置換する |
| spy アサーション（警告が実測された spec のみ） | `expect(spy.mock.calls.length).toBe(n)` 等の `toBe*` 系 spy 検証 | `toHaveBeenCalledTimes(n)` / `toHaveBeenCalledWith(...)` 等の `toHaveBeen*` 系 | v4.1 で `toBe*` 系 spy アサーションに deprecation 警告。意味論等価の専用 matcher へ置換（期待値は不変） |
| `vi.mock` / `vi.hoisted` のトップレベル外宣言（警告が実測された spec のみ） | 関数内・条件分岐内などモジュールトップレベル外での `vi.mock(...)` 宣言 | モジュールトップレベルへの移動（hoisting 前提の正規位置） | v4.1 でトップレベル外宣言に警告。モック対象・実装は変えず宣言位置のみ移動 |
| root `package.json` ほか version 表記（Lane 0 で実施済みの確認） | `vitest` / `@vitest/coverage-v8` `^3.2.6`、`@vitejs/plugin-react` `^4.0.0` | `^4.1.8` ×2 + `^5.2.0`（apps/api・apps/og の `vitest` も `^4.1.8`） | メジャー跨ぎ反映 + 全 3 ファイル単一バージョン化（NFR-1 / exact pin） |

> 後続実装者は、置換した各ファイルを上表の形式（対象 / Before / After / 理由）で `outputs/` の記録に追記する。**警告 grep で 0 件の系統は「実測 0 件・置換なし」と記録**し、推測で先回り置換しない。

## navigation / duplicate drift の確認

破壊的変更（C2-C4）の修正は複数の spec に同種パターンを生む可能性がある。重複が drift（同じ修正が散在し将来の保守コストを上げる状態）になっていないかを確認する。

| 重複候補パターン | 検出方法 | 抽出判断基準 |
| --- | --- | --- |
| C3: spy リセット定型（`mockReset` / `mockRestore` / `vi.restoreAllMocks` 限定化対応） | `grep -rn "restoreAllMocks\|mockReset\|mockRestore" apps packages scripts` | **同一 shard 内で 4 箇所以上**同一設定が重複する場合のみ、その shard の共通 setup（または既存 `beforeEach`）へ集約。3 箇所以下は据え置き（YAGNI） |
| C3: `invocationCallOrder` 1 始まり対応の期待値修正 | `grep -rn "invocationCallOrder" apps packages` | 期待値は**各 spec 固有の意図**であり共通化しない |
| C4: snapshot 更新（`[MockFunction spy]` → `[MockFunction]`） | `git diff` の `__snapshots__` / inline snapshot 差分 | snapshot は spec ごとの成果物であり共通化対象外。obsolete 残骸 0 件のみ確認 |
| `isolate: false` 不採用の確認 | `grep -n "isolate: false" vitest.d1.config.ts` | D1 mock のファイル間状態汚染を避けるため、該当なし（grep 0 件）であることを確認する |

> **過剰な抽象化の禁止**: 「同じに見える」だけで共通化すると、各テストの独立性・可読性を損なう。共通化は「同一 shard 内で 4 箇所以上の機械的重複」に限る。それ未満は重複のまま残すことを正とする。

## リファクタを「行わない」判断の記録（YAGNI）

| 検討した変更 | 判断 | 理由 |
| --- | --- | --- |
| `vitest.config.ts` / `vitest.d1.config.ts` の `projects` 化等の構造刷新 | **行わない** | 現行 config は `workspace` 未使用（C8 で未使用確認済み）。bump の目的と無関係な構造変更 |
| coverage reporter 構成の見直し | **行わない** | 現行 `["text","json-summary","json","lcov","html"]` は CI/baseline 比較で機能している。C2（AST remapping）は数値変動であり reporter 構成と無関係 |
| react alias / optimizeDeps の整理 | **行わない** | 不変条件4。pnpm isolated node-linker 対応として機能中。触らない |
| D1 直列化表現のさらなる変更（`maxWorkers: 1` 以降の調整） | **行わない** | Phase 5 で確定した v4 表現が正本（不変条件3）。Phase 7 で完走確認済みの構成を動かさない |
| 警告が出ていない spy 記述の全体統一リファクタ | **行わない** | deprecation 警告の実測 0 件箇所まで置換すると bump スコープ外の大規模変更になる。警告実測箇所のみに限定 |
| プロダクトコード（`apps/*/src` / `packages/*/src`）への一切の変更 | **行わない** | Phase 2 責務境界。deprecation 解消はテスト・config・package.json に閉じる |

## リファクタ後の再検証

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| 全 shard vitest | artifacts.json `mutation_commands` の shard 系コマンド一式（`shard_web` / `shard_api_unit` / `shard_api_d1` / `shard_og` / `shard_scripts` / `shard_alerts`）+ `mise exec -- pnpm coverage:guard` | 全 shard green（fail 0 / skip 増なし） |
| deprecation 警告再 grep | shard 実行ログ → `grep -iE 'deprecat'` | 置換対象の警告が 0 件（対応不要分類分を除く） |
| version 整合 | `mise exec -- pnpm why vitest` / `mise exec -- pnpm why @vitest/coverage-v8` | 両者同一 4.1.x で一致 |

## 完了条件

- [ ] deprecation 警告の解消が「対象 / Before / After / 理由」テーブルで記録されている（実測 0 件の系統は「置換なし」と記録）
- [ ] version 表記が root / apps/api / apps/og で `^4.1.8`（plugin-react は `^5.2.0`）に統一されていることが確認されている
- [ ] navigation/duplicate drift（C3/C4 重複・`vi.resetModules()` 散在）が確認され、共通化要否が「4 箇所以上」基準で判定されている
- [ ] リファクタを「行わない」判断（YAGNI）が理由付きで記録されている
- [ ] プロダクトコード非接触が維持されている
- [ ] リファクタ後に typecheck / lint / 全 shard vitest / deprecation 再 grep / version 整合が green

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-05-implementation.md`, `phase-07-coverage-check.md`, Vitest 4 deprecation output
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-08-refactoring.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
