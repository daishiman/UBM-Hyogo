# Implementation Guide — vitest-3-to-4-major-upgrade

## Part 1: 中学生レベルの説明

テストの自動チェック係を「3 代目」から「4 代目」に入れ替えました。係の名前（vitest）と仕事（テストを走らせる）は同じですが、4 代目は (1) テストを並べて走らせる道具の置き場所のルールと、(2) テストがどれだけコードを通ったかの「点数の数え方」が少し変わっています。

そのため、係を入れ替えるだけでなく、設定ファイルの書き方を 4 代目のルールに直し、4 代目で書き方が変わった一部のテストの書き方も直しました。さらに、点数の数え方が変わったことで「枝分かれ（branch）の点数」だけが少し下がったので、**点数の合格ライン（80 点）は下げずに、足りない分のテストを追加して** 合格ラインまで戻しました。画面の見た目や使い方は一切変えていません。変わったのは開発者が使うテストの仕組みだけです。

## Part 2: 技術者向け（実装内容）

### 依存バージョン

| ファイル | 変更 |
| --- | --- |
| `package.json`（root） | `vitest` `^3.2.6`→`^4.1.8` / `@vitest/coverage-v8` `^3.2.6`→`^4.1.8`（v4 は exact peer pin、解決実バージョンも一致）/ `@vitejs/plugin-react` `^4.0.0`→`^5.2.0`（vite 6-8 互換） |
| `package.json` devDependencies | `vite` `^7.0.0` を**直接依存として追加** |
| `package.json` `pnpm.overrides` | `vite: "^7.0.0"` を追加 |
| `apps/api/package.json` | `vitest`→`^4.1.8` / `test:coverage:unit` から `--minWorkers=1` を削除（v4 で minWorkers 廃止） |
| `apps/og/package.json` | `vitest`→`^4.1.8` |
| `pnpm-lock.yaml` | 再生成（vitest 4.1.8 / vite 7.3.5 / plugin-react 5.2.0 / coverage-v8 4.1.8） |

> **vite を直接依存 + override で固定した理由**: vitest 4 は `vite` を required peer（`^6 || ^7 || ^8`）として要求するが、`pnpm install` が旧 lockfile の stale な vite 5.4.21 を peer に再利用し続け、override 単独では auto-installed peer edge を再解決しなかった。直接依存 edge を与えることで再解決を強制した。vite 8 は rolldown ベースの大改修のため、テスト挙動を安定させる目的で in-range の最も保守的な **vite 7**（esbuild/rollup ベース）を採用した。

### config の v4 化

`vitest.d1.config.ts`（D1 binding テスト専用・issue-617 の port exhaustion 回避用直列化）:

- v4 で tinypool 削除に伴い `poolOptions` / `singleFork` が廃止。旧 `poolOptions.forks.singleFork: true` を **`pool: "forks"` + top-level `maxWorkers: 1`** へ書き換えた。
- 公式 migration guide が等価表現として挙げる `isolate: false` は **採用しない**。RED 採取で `isolate: false` を併用すると D1 mock のモジュール状態がファイル間で汚染し `db.prepare is not a function` 等の順序依存 fail を 14 件起こすことを実証した。旧 `singleFork: true` はファイル単位の module isolation を保っていたため、`maxWorkers: 1`（直列化＝Miniflare D1 インスタンスを 1 つに保ち port exhaustion を回避）のみが正しい等価表現である。
- D1 専用 shard の `testTimeout` / `hookTimeout` を 30s→180s に拡大（テスト増加・D1 migration cold-start 時の CI タイムアウト誤検知を防ぐ安全余裕の ceiling。passing テストの所要時間には影響しない）。

### v4 破壊的変更によるテスト修正（プロダクトコード不変）

| ファイル | 修正内容（C カテゴリ） |
| --- | --- |
| `RequestQueueDetail.spec.tsx` / `IdentityConflictRow.spec.tsx` | v4 で `vi.fn()` の戻り型が `Mock<Procedure \| Constructable>` となり `() => void` へ直接代入不可・直接呼出不可。`vi.fn<() => void>()` / `Mock<...>` ジェネリック明示で解消（C8 型変更） |
| `server-fetch.env.spec.ts` | v4 で `vi.spyOn` が既 spy 済みメソッドに対し同一 spy（呼び出し履歴保持）を返すため、`beforeEach` の再 spyOn でテスト間に `console.warn` 履歴が残り誤検知。`vi.restoreAllMocks()` を `beforeEach` 先頭に追加（C3 mock 挙動変更） |
| `IdentityConflictRow.spec.tsx` | jsdom 未定義の `window.matchMedia` を `vi.spyOn` で spy できない（v4 で対象が関数でないと throw）。`vi.stubGlobal` + `afterEach` の `vi.unstubAllGlobals()` へ変更（C3） |

> snapshot（C4）は本リポジトリに `__snapshots__` が存在せず該当なし。deprecation 警告・obsolete snapshot も観測されず。

### coverage（C2: v8 AST remapping）の回復

v4 で v8 coverage provider が AST ベース remapping に一本化され、**branch カバレッジのみが** 全 shard で 2-5pt 低下（lines/functions/statements は 80% 維持）。閾値（80%）は変更せず、**実ソースの到達可能分岐に対するテスト追加のみ**で回復した（詳細・実測差分は `outputs/phase-07/coverage-diff.md`）。

| package | 回復前 branch | 回復後 branch | 追加 spec 概要 |
| --- | --- | --- | --- |
| apps/web | 77.93% | **80.01%** | logger / security-headers / safe-fetch / safe-redirect / server-fetch.fixtures / me-photo-client |
| apps/api（merged） | 76.58% | **81.69%** | repository / routes contract / sync / workflows / audit-correlation / diagnostics |
| packages/shared | 75.51% | **90.13%** | admin/search / browser-storage / consent |

`coverage.include` / `exclude` の縮小、閾値引き下げ、プロダクトコード変更は **一切行っていない**（phase-07 Rule 4 遵守）。

## ローカル検証結果（全 green）

| 検証 | 結果 |
| --- | --- |
| `pnpm why`（vitest / coverage-v8 / vite / plugin-react） | vitest 4.1.8・coverage-v8 4.1.8（完全一致）・vite 7.3.5・plugin-react 5.2.0、peer 警告ゼロ |
| `pnpm verify:vitest-runtime` | node-arch / worktree-isolation / esbuild すべて OK（arm64） |
| `pnpm typecheck` | 全 workspace Done（エラー 0） |
| `pnpm lint` | 全 workspace Done・dependency/stablekey/inline-style 違反 0 |
| 全 shard テスト | og 23 / packages（contracts 21・shared 287+・integrations 63・google）/ api-unit 652 / **api-d1 1159（port exhaustion 非再発）** / web 1996（+1 既存 skip）/ scripts / infra（alerts 66・sentry 9）— 全 spec green |
| `coverage-guard.sh --no-run` | `PASS: all packages ≥ 80%`（全 package・全 4 メトリクス） |
| `lint:coverage-threshold` | OK（threshold=80） |
| `indexes:rebuild` | 冪等（drift 0、CI `verify-indexes-up-to-date` 通過見込み） |

## 不変条件の遵守

- 新規テストは全て `*.spec.ts` / `*.spec.tsx`（`*.test.*` 追加 0・CLAUDE.md 不変条件8）。
- D1 直列化設計（`pool: "forks"` + `maxWorkers: 1`）を維持（不変条件 3）。
- coverage 閾値 80% を維持（実測 diff 由来の引き下げなし・不変条件 8）。
- プロダクトコード（`apps/*/src` 非テスト・`packages/*/src` 非テスト）無変更。
- Node 24.15.0 / pnpm 10.33.2 を `mise exec --` で固定実行（不変条件 6）。

## NON_VISUAL 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショットは不要（`visualEvidence: NON_VISUAL`）。

## commit / PR について

CONST_002 / Phase 13 に従い、commit・push・PR 作成はユーザー明示承認後にのみ行う。本ガイド時点では実コード差分がローカルに存在し、全ローカルゲートが green。
