# Phase 5: Implementation（実装）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-01 / phase-02 / phase-03 / phase-04 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | vite 直接 devDep 追加（5.4.21→7.x）→ lockfile 再生成 → 単一解決確認 → RED 分類 → V2/V3 最小修正 → deprecation 警告ゼロ・apps/web sanity build まで GREEN 維持 |

## 実装方針サマリ

本タスクの中核は **root `package.json` の `devDependencies` に `"vite": "^7.0.0"` を新規追加**して、推移依存で 5.4.21 に固定されていた vite を 7.x へ引き上げること（SSOT §3 核心3 / §5 V1）。`@vitejs/plugin-react@4.7.0` と `vitest@3.2.6` は両方すでに Vite 7 を peer/dep サポート済みのため**据え置く**（SSOT §3 核心2）。修正は **テスト期待値・config・依存定義** に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は一切変更しない**。

> Vite はテストツールチェーン専用であり、apps/web 本番ビルドは `next build --webpack`（OpenNext Workers）で **Vite 非依存**（SSOT §3 核心1）。apps/web ビルドは Step 6 で sanity 確認に留め、blocker ではない（V8）。

## 変更対象ファイル一覧（SSOT §4 逐語）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `package.json`（root） | 編集 | `devDependencies` に `"vite": "^7.0.0"` を**新規追加**（推移依存の最低版固定を解除し 7.x へ引き上げ） |
| `pnpm-lock.yaml` | 再生成 | `mise exec -- pnpm install` による lockfile 再生成（vite を 7.x へ解決・単一バージョン維持） |
| `vitest.config.ts` | 条件付き編集 | Vite 7 で deprecation/removed API が検出された場合のみ最小修正。`resolve.alias`(react subpath) / `optimizeDeps` / `plugins:[react()]` / `dedupe` は等価維持（破壊しない） |
| `vitest.d1.config.ts` | 条件付き編集 | 同上。`pool: forks` / `singleFork: true`（issue-617 port exhaustion 回避）を破壊しない |
| 破壊的変更で fail した `*.spec.{ts,tsx}` | 条件付き編集 | RED 分類（V2/V3 該当）に限り期待値・モック設定のみ修正。プロダクトコードは無変更 |

> `apps/api/package.json` / `apps/og/package.json` / `apps/web/package.json` / `packages/*` は vite を直接依存しないため bump 対象外。vite は root の単一ノードで解決される（SSOT §4）。

## Step バイ Step 実装手順

### Step 1: root `package.json` への vite 直接 devDependency 新規追加（V1 / 直列起点）

root `package.json` の `devDependencies` に `"vite": "^7.0.0"` を**新規追加**する。現状 vite の直接 specifier は存在しない（SSOT §2 / §3 核心3）ため、これは「specifier 更新」ではなく「新規追加」である。

```jsonc
// package.json（root）devDependencies に新規エントリを追加
  "devDependencies": {
    // ... 既存エントリ ...
+   "vite": "^7.0.0",
    // ... 既存エントリ ...
  }
```

> **採用理由**（SSOT §3 核心3）: 直接依存にすることで (1) dependabot が以後追跡可能・(2) 解決バージョンが可視化され drift しにくい・(3) Issue の「specifier をメジャー更新」の意図に最も忠実。
> **非採用の代替**: `pnpm.overrides.vite` は「強制上書き」で peer 検証を弱めるため非採用（V7 重複が解消できない場合のフォールバックとしてのみ言及）。
> `@vitejs/plugin-react`（4.7.0）/ `vitest`（3.2.6）/ `@vitest/coverage-v8` は変更しない（SSOT §3 核心2 / 含まないもの）。`pnpm.overrides.esbuild = "0.27.3"` も維持（不変条件4）。

### Step 2: lockfile 再生成 + 単一 7.x 解決確認（V1 / V7）

```bash
mise exec -- pnpm install     # pnpm-lock.yaml を再生成（vite を 7.x へ解決）
mise exec -- pnpm why vite    # 解決された実バージョンが単一 7.x か（5系と7系の併存=重複がないか）
```

確認観点:
- `pnpm why vite` の解決バージョンが **単一の 7.x**（5.4.21 が消え、5系と7系の重複が無い・V1/V7）。
- vite を引き込む経路（`@vitejs/plugin-react@4.7.0` / `vitest@3.2.6` の `@vitest/mocker` 経由 / `vite-node@3.2.4`）がすべて 7.x で peer を満たす（peer 警告ゼロ）。
- `pnpm.overrides.esbuild = "0.27.3"` と Vite 7 が期待する esbuild レンジが peer 破壊なく解決される（V5）。不整合時は `scripts/cf.sh` の `ESBUILD_BINARY_PATH` / `mise exec -- pnpm verify:vitest-runtime` で吸収し、解決不能なら Phase 3 でエスカレーション（不変条件4）。

> 単一 7.x に収束しない場合のみ、フォールバックとして `pnpm.overrides.vite = "^7.0.0"` を検討するが、peer 検証を弱めるためユーザーへエスカレーションしてから採用する。

### Step 3: typecheck / lint（V1 → V2/V3 修正の前提）

```bash
mise exec -- pnpm typecheck   # vite 7 の型 export 変更に追従できているか
mise exec -- pnpm lint
```

> vite 7 で型 export が変わったことによる型エラー（`import type { ... } from 'vite'`）が config 側で出た場合は、import 元/型名のみを最小修正する（テストロジック・プロダクトコードは変えない）。

### Step 4: shard 別 RED 実行 → V2/V3 分類 → 修正

Phase 4 の「fail 分類テーブル」で付与した `RED-V{n}-{seq}` タグごとに、以下の before/after パターンで修正する。**期待値は全 shard fail 0** であり、fail が出た場合のみ修正する。主観測対象は web shard（V2/V3）。

| 担当 shard | 中心カテゴリ |
| --- | --- |
| web（最大規模） | V2（react subpath alias / optimizeDeps）/ V3（plugin-react interop） |
| api（unit + d1） | V7（d1 は forks pool の単一解決に注意）/ V4 |
| og / packages / scripts / infra | V4 中心（deprecation 警告） |

#### V2 修正パターン（react subpath alias の等価変換）

```ts
// before（Vite 5 で動いていた resolve.alias の react subpath マッピング）
resolve: {
  alias: {
    'react/jsx-dev-runtime': '...既存マッピング...',
  },
},

// after（Vite 7 で subpath 解決が変わった場合のみ・マッピング先 import 名は不変で等価変換）
resolve: {
  alias: [
    { find: 'react/jsx-dev-runtime', replacement: '...同一マッピング先...' },
  ],
},
// ※ alias / optimizeDeps の API は v6/v7 で安定（SSOT §5 V2）。等価維持で green が期待値。
//    通常は無変更。解決失敗が出たときだけ上記の等価形へ。
```

#### V3 修正パターン（@vitejs/plugin-react interop）

```ts
// before（plugins:[react()] をそのまま使用）
plugins: [react()],

// after（runtime warning が出た場合のみオプションを等価に明示・plugin のメジャーアップはしない）
plugins: [react({ jsxRuntime: 'automatic' })],
// ※ @vitejs/plugin-react@4.7.0 は peer で vite ^7 を宣言済み（SSOT §2）。
//    通常は warning 0 で無変更。
```

#### V7 修正パターン（vite 重複解決の収束）

```bash
# before: pnpm why vite が 5系と7系を併存表示（重複）
# after: lockfile を再生成して単一 7.x へ収束
mise exec -- pnpm install
mise exec -- pnpm why vite   # 単一 7.x を確認
# 収束しない場合のみフォールバック（要エスカレーション）:
#   package.json の pnpm.overrides に "vite": "^7.0.0" を追加
```

> 各 shard の修正後、担当 shard を再実行して GREEN を確認する（`mise exec -- pnpm exec vitest run --root=. --config=... <path>`）。`vitest.d1.config.ts` の `pool: forks`/`singleFork: true` は破壊しない（不変条件3）。

### Step 5: deprecation 警告ゼロ確認（V4）

```bash
# V4: Vite 6/7 で削除された API が config に無いことの再確認（現 config は未使用）
grep -rn "splitVendorChunkPlugin\|legacy:\|resolve.conditions\|conditions:" vitest.config.ts vitest.d1.config.ts || echo "OK: V4 削除 API なし"
grep -rn "require(['\"]vite['\"])" vitest.config.ts vitest.d1.config.ts 2>/dev/null || echo "OK: CJS vite Node API なし"

# 実行時の deprecation/warn ログがゼロであることの確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

- 現 config は `splitVendorChunkPlugin` / `legacy` / `resolve.conditions` を**使っていない**（SSOT §5 V4・grep で確認）ため、通常は無変更で警告ゼロ。
- 万一警告が出た場合のみ、該当行を Vite 7 の推奨 API へ最小置換する。**`resolve.alias`（react subpath）・`optimizeDeps`・`pool` 設計は触らない**（不変条件2/3）。

### Step 6: apps/web sanity build（V8 / Vite 非依存の確認・blocker ではない）

```bash
mise exec -- pnpm build   # apps/web は next build --webpack（OpenNext Workers）= Vite 非依存
```

確認観点（SSOT §3 核心1 / §5 V8）:
- apps/web 本番ビルドが `next build --webpack` 正本で完走する（Turbopack を deploy bundle に混入させない・不変条件9）。
- OpenNext Workers bundle に `[project]/...` 仮想 module specifier が混入しないこと。
- これは **Vite 7 化が apps/web ビルドに影響しない**ことの確認であり、**blocker ではない**（Vite は deploy bundle に関与しない）。

## DoD（Definition of Done）

- [ ] root `package.json` の `devDependencies` に `"vite": "^7.0.0"` が新規追加された（V1）
- [ ] `mise exec -- pnpm install` が成功し `pnpm-lock.yaml` が再生成された
- [ ] `pnpm why vite` が **単一の 7.x** で解決（5系と7系の重複なし・V1/V7）
- [ ] `@vitejs/plugin-react`（4.7.0）/ `vitest`（3.2.6）が据え置かれ、peer 警告ゼロ
- [ ] `pnpm.overrides.esbuild = "0.27.3"` が維持され peer 破壊なく解決（V5・不変条件4）
- [ ] `mise exec -- pnpm typecheck` が green
- [ ] `mise exec -- pnpm lint` が green
- [ ] 各 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の vitest が green、fail ゼロ
- [ ] RED 分類（V2/V3/V7）に該当した修正は config / 依存定義 / テスト期待値のみで、プロダクトコードは無変更
- [ ] deprecation 警告（`splitVendorChunkPlugin`/`legacy`/`resolve.conditions` 等）がゼロ（V4）
- [ ] `vitest.d1.config.ts` の `pool: forks`/`singleFork: true` が維持され D1 が port exhaustion なく完走（V7・不変条件3）
- [ ] skip 件数が devDep 追加前から増えていない（不変条件7）
- [ ] apps/web sanity build（`next build --webpack`）が完走し OpenNext bundle 健全（V8・不変条件9）
- [ ] coverage 閾値が既存水準を下回っていない（不変条件8）

## ローカル検証コマンド一覧（SSOT §9）

```bash
mise exec -- pnpm install            # lockfile 再生成
mise exec -- pnpm why vite           # 単一 7.x 解決の確認（V1/V7）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# shard 別 green
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra
# deprecation 警告ゼロ確認（V4）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
# apps/web sanity build（V8・Vite 非依存の確認）
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```
