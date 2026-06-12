# Phase 5: Implementation（実装）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-01 / phase-02 / phase-03 / phase-04 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | version bump → lockfile 再生成 → RED 分類 → C1/C2/C3 修正 → deprecation 警告ゼロ・閾値整合まで GREEN 化 |

## 実装方針サマリ

Phase 2 の Lane 設計（Lane 0 直列 bump → Lane A/B/C 並列 shard 修正 → Lane D 直列締め）に従う。修正は **テスト期待値・モック設定・config・閾値** に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は変更しない**（Phase 2「修正判断の境界」を継承）。

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `package.json`（root） | 編集 | `vitest` `^2.0.0` → `^3.2.6`（行 94）、`@vitest/coverage-v8` `^2.1.9` → `^3.2.6`（行 86） |
| `apps/api/package.json` | 編集 | `vitest` `^2.1.9` → `^3.2.6`（行 31） |
| `apps/og/package.json` | 編集 | `vitest` `^2.1.9` → `^3.2.6`（行 22） |
| `pnpm-lock.yaml` | 再生成 | `pnpm install` による lockfile 再生成（vitest/coverage-v8 を 3.2.6 系へ解決） |
| `vitest.config.ts` | 条件付き編集 | C4/C5 非推奨 API が検出された場合のみ最小修正。**現 config は未使用のため通常は無変更** |
| `vitest.d1.config.ts` | 条件付き編集 | 同上。`pool: forks`/`singleFork: true` は破壊しない |
| 破壊的変更で fail した `*.spec.ts` / `*.spec.tsx` | 条件付き編集 | RED 分類（C1/C2/C3）に該当した spec の期待値・モック設定のみ修正 |
| coverage 閾値設定 | 条件付き編集 | C6（`ignoreEmptyLines`）由来の実測ずれが閾値ゲートを赤化させた場合のみ最小調整 |

> `apps/web/package.json` / `packages/*` は vitest を直接依存していない（root 共通 devDependency を利用）ため、bump 対象外。

## Step バイ Step 実装手順

### Step 1: package.json 3 ファイルの version bump（Lane 0 / 直列起点）

3 ファイルの vitest 系依存を `^3.2.6` に統一する。**vitest と `@vitest/coverage-v8` は必ず同一バージョン**（peer 一致要求）。

```jsonc
// package.json（root）devDependencies
- "@vitest/coverage-v8": "^2.1.9",   // 行 86
+ "@vitest/coverage-v8": "^3.2.6",
- "vitest": "^2.0.0",                 // 行 94
+ "vitest": "^3.2.6",

// apps/api/package.json devDependencies
- "vitest": "^2.1.9",                 // 行 31
+ "vitest": "^3.2.6",

// apps/og/package.json devDependencies
- "vitest": "^2.1.9",                 // 行 22
+ "vitest": "^3.2.6",
```

> `jsdom`（`^25.0.0`）/ `@vitejs/plugin-react`（`^4.0.0`）は変更しない（Phase 2 ライブラリ選定表より vitest 3.2.6 と互換）。

### Step 2: lockfile 再生成 + バージョン整合確認（Lane 0）

```bash
mise exec -- pnpm install                 # pnpm-lock.yaml を再生成
mise exec -- pnpm why vitest              # 解決された実バージョンが 3.2.6 系で一致するか
mise exec -- pnpm why @vitest/coverage-v8 # vitest と完全同一バージョンか（C7 解消）
```

確認観点:
- `pnpm why vitest` の解決バージョンが `3.2.6`（系）で全 workspace 一致。
- `@vitest/coverage-v8` が `vitest` と**同一バージョン**（peer `vitest: 3.2.6` 完全一致）。
- 解決された `vite` が `5 / 6 / 7` のいずれか（範囲外なら peer 警告 → 要対応）。

### Step 3: typecheck / lint（Lane 0 → A/B/C の前提）

```bash
mise exec -- pnpm typecheck   # 型定義の v3 化（vitest の型 export 変更）に追従できているか
mise exec -- pnpm lint
```

> vitest 3 で型 export が変わったことによる型エラー（`import type { ... } from 'vitest'`）が出た場合は、import 元/型名のみを最小修正する（テストロジックは変えない）。

### Step 4: shard 別 RED 実行 → C1/C2/C3 分類 → 修正（Lane A/B/C / 並列）

Phase 2 の Lane 設計に従い、最大 3 並列で shard を修正する:

| Lane | 担当 shard | 中心カテゴリ |
| --- | --- | --- |
| Lane A | api（unit + d1） | C1 / C2 / C3（D1 は forks pool の C3 制約に注意） |
| Lane B | web（348 spec） | C1 / C2 + react alias 健全性 |
| Lane C | og / packages / scripts / infra | C1 中心 |

Phase 4 の「fail 分類テーブル」で付与した `RED-C{n}-{seq}` タグごとに、以下の before/after パターンで修正する。

#### C1 修正パターン（エラー比較厳格化 → 期待エラー型を実体へ）

```ts
// before（v2 では Error 指定で TypeError も通っていた）
expect(() => parsePort('abc')).toThrow(Error);

// after（v3: prototype まで比較されるため実体の型を明示）
expect(() => parsePort('abc')).toThrow(TypeError);
// または message マッチに切り替え（型に依存しないなら）
expect(() => parsePort('abc')).toThrow(/invalid port/);
```

```ts
// before（cause 付き error を toEqual で比較し v3 で cause 差異 fail）
expect(caught).toEqual(new Error('failed'));

// after（message に分解、または cause を含めて構築）
expect(caught).toBeInstanceOf(Error);
expect((caught as Error).message).toBe('failed');
```

#### C2 修正パターン（mockReset / mockRestore 見直し）

```ts
// before（v2: mockReset 後は undefined 返し前提だった）
beforeEach(() => {
  vi.mockReset(); // v3 では spy が元実装へ復帰し副作用が走る
});

// after（元実装復帰を断つ場合は空実装を再設定、または restore を使い分け）
beforeEach(() => {
  vi.restoreAllMocks();             // spy を完全に元へ戻して付け直す方針
});
// 既存モックを undefined 返しに保ちたいケース
spy.mockReset().mockImplementation(() => undefined);
```

#### C3 修正パターン（fakeTimers の toFake 明示）

```ts
// before（v2: useFakeTimers() で nextTick/queueMicrotask も fake 化されていた）
vi.useFakeTimers();

// after（v3: 既定では nextTick/queueMicrotask は fake 化されない → 明示）
vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'queueMicrotask', 'nextTick'] });

// 注意: D1 shard（vitest.d1.config.ts / pool: forks）では nextTick をモックできない。
// その場合は当該テストを nextTick 非依存へ書き換える（プロダクトコードは触らない）。
```

> 各 Lane の修正後、担当 shard を再実行して GREEN を確認する（`mise exec -- pnpm exec vitest run --root=. --config=... <path>`）。

### Step 5: config deprecation 警告ゼロ確認（Lane D / 直列締め）

```bash
# C4/C5 非推奨 API が config に無いことの再確認
grep -rn "deps.inline\|inline:" vitest.config.ts vitest.d1.config.ts || echo "OK: C4 なし"
grep -rn "workspace" vitest.config.ts vitest.d1.config.ts || echo "OK: C5 なし"

# 実行時の deprecation/warn ログがゼロであることの確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```

- 現 config は `deps.inline`/`workspace` を**使っていない**（Phase 2 / Phase 4 で確定）ため、通常は無変更で警告ゼロ。
- 万一警告が出た場合のみ、該当行を vitest 3 の推奨 API（`deps.inline` → `deps.optimizer` 系 / `workspace` → `projects`）へ最小置換する。**`resolve.alias`（react subpath）・`optimizeDeps`・`pool` 設計は触らない**。

### Step 6: coverage 閾値の ignoreEmptyLines 由来ずれ確認・最小調整（Lane D）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api run test:coverage   # unit + d1 マージ
mise exec -- pnpm --filter @ubm-hyogo/web run test:coverage
mise exec -- pnpm --filter @ubm-hyogo/og run test:coverage
```

- C6: `ignoreEmptyLines` 既定 true により空行除外で line/statement 比率が微変動しうる。
- 閾値ゲートが赤化した場合のみ、**実測差分の範囲でのみ**閾値を調整する（恣意的に大きく下げない / include・exclude を縮小しない = 不変条件 8）。
- 調整した場合は「v2 実測 → v3 実測」の差分を Phase 7（カバレッジ確認）へ申し送る。

## DoD（Definition of Done）

- [ ] `mise exec -- pnpm install` が成功し `pnpm-lock.yaml` が再生成された
- [ ] `pnpm why vitest` / `pnpm why @vitest/coverage-v8` が **同一の 3.2.6 系**で一致（AC-2 / C7 解消）
- [ ] root / apps/api / apps/og の `package.json` が `^3.2.6`、root の coverage-v8 も `^3.2.6`（AC-1）
- [ ] `mise exec -- pnpm typecheck` が green（AC-3）
- [ ] `mise exec -- pnpm lint` が green（AC-4）
- [ ] 各 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の vitest が green、fail ゼロ（AC-5）
- [ ] RED 分類（C1/C2/C3）に該当した spec が期待値・モック設定の修正のみで回復し、プロダクトコードは無変更
- [ ] deprecation 警告（`deps.inline`/`workspace` 等）がゼロ（AC-6）
- [ ] `vitest.d1.config.ts` の `pool: forks`/`singleFork: true` が維持され D1 が port exhaustion なく完走（AC-7）
- [ ] skip 件数が bump 前から増えていない（AC-8）
- [ ] coverage 閾値が C6 実測差分の範囲を超えて下がっていない（不変条件 8）

## ローカル検証コマンド一覧

```bash
# 依存・整合
mise exec -- pnpm install
mise exec -- pnpm why vitest
mise exec -- pnpm why @vitest/coverage-v8

# 静的品質
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# shard 別 GREEN 確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts packages
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts infra

# coverage（閾値ずれ確認）
mise exec -- pnpm --filter @ubm-hyogo/api run test:coverage
mise exec -- pnpm --filter @ubm-hyogo/web run test:coverage
mise exec -- pnpm --filter @ubm-hyogo/og run test:coverage

# deprecation 警告ゼロ確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"
```
