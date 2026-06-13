# Phase 5: Implementation（実装）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-04-test-creation.md（RED 設計・事前 grep 完了） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| Phase の主旨 | Lane 0（bump + 確定設定修正 C1/C5/C7）→ RED 採取 → Lane A/B/C（shard 別 C3/C4 修正）→ Lane D（締め）で全 shard GREEN 化 |

## 実装方針サマリ

Phase 2 の Lane 設計に従う: **Lane 0（直列・起点）→ RED 採取 → Lane A/B/C（並列・shard 修正）→ Lane D（直列・締め）**。v4 は bump 単体で起動不能になる確定破壊（C1/C5/C7）を含むため、これらを Lane 0 で bump と同一 wave に消化してから RED を観測する。修正は **テスト期待値・モック設定・snapshot・config・package.json scripts** に閉じ、**プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は変更しない**（Phase 2「修正判断の境界」を継承）。

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 変更内容 |
| --- | --- | --- |
| `package.json`（root） | 編集（新規なし） | `vitest` `^3.2.6`→`^4.1.8`（L94）、`@vitest/coverage-v8` `^3.2.6`→`^4.1.8`（L86）、`@vitejs/plugin-react` `^4.0.0`→`^5.2.0`（L85）の 3 行 bump |
| `apps/api/package.json` | 編集（新規なし） | `vitest` `^3.2.6`→`^4.1.8`（L31）+ `test:coverage:unit` script から `--minWorkers=1` 削除（L15） |
| `apps/og/package.json` | 編集（新規なし） | `vitest` `^3.2.6`→`^4.1.8`（L22） |
| `vitest.d1.config.ts` | 編集（新規なし） | `poolOptions.forks.singleFork: true` を削除し、top-level `maxWorkers: 1` へ書換。`isolate: false` は D1 mock のファイル間状態汚染を起こすため採用しない |
| `pnpm-lock.yaml` | 再生成 | `mise exec -- pnpm install` による lockfile 再生成（vitest/coverage-v8 を 4.1.x、vite を ^6/^7/^8、plugin-react を 5.2.x へ解決） |
| `vitest.config.ts` | 条件付き編集 | C8 残党・deprecation 警告が検出された場合のみ最小修正。**事前調査では未使用のため通常は無変更**（`resolve.alias` / `optimizeDeps` / coverage include・exclude は触らない） |
| 破壊的変更で fail した `*.spec.ts` / `*.spec.tsx` | 条件付き編集 | RED 分類（C3/C4）に該当した spec の期待値・モック設定のみ修正。**範囲は RED 採取結果に従属** |
| `__snapshots__/*.snap` / inline snapshot | 条件付き更新・清掃 | C4 機械的差分の `--update` 更新 + obsolete 残骸の削除。**範囲は RED 採取結果に従属** |
| coverage 閾値設定 | 条件付き編集 | C2（AST remapping）由来の実測ずれが閾値ゲートを赤化させた場合のみ最小調整（Phase 7 の実測が前提） |

> `apps/web/package.json` / `packages/*` は vitest を直接依存していない（root 共通 devDependency を利用）ため、bump 対象外。新規ファイルは作成しない（Phase 6 の回帰 guard spec を追加する場合のみ例外。任意）。

## 入出力・副作用の定義

| 項目 | 内容 |
| --- | --- |
| 入力 | Phase 4 の RED 採取結果（fail の C1〜C8 タグ付けリスト）、事前 grep 結果、phase-02 の C1-C8 v4 版分類表 |
| 出力 | bump 済み package.json ×3、v4 化 config、GREEN 化した全 shard、deprecation 警告の分類記録 |
| 副作用 1 | `pnpm-lock.yaml` の再生成（vitest 系依存ツリーの 4.1.x 化・vite transitive 解決の更新） |
| 副作用 2 | `node_modules` の更新（worktree ローカル。`verify:vitest-runtime` で健全性確認） |
| 副作用 3 | snapshot ファイルの更新・obsolete 削除（C4。diff 目視確認を経たもののみ） |

## Step バイ Step 実装手順

### Step 0: coverage baseline 採取（Lane 0 の前。Phase 7 の前提）

bump **前**（vitest 3.2.6 のまま）の状態で全 shard の `coverage-summary.json` を採取して控える（Phase 7 S1 の baseline）。bump 後には v3 の数値を再現できないため、**必ず Lane 0 より先に実行する**。

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm --filter @ubm-hyogo/og test:coverage
mise exec -- pnpm --filter './packages/*' test:coverage
# 各 reportsDirectory の coverage-summary.json の pct を記録（Phase 7 の差分記録テーブルへ）
```

### Step 1: package.json 3 ファイルの version bump（Lane 0 / 直列起点）

vitest 系を `^4.1.8` に統一し、`@vitejs/plugin-react` を `^5.2.0` へ更新する。**vitest と `@vitest/coverage-v8` は必ず同一バージョン**（v4 の peer は **exact pin**）。

```jsonc
// package.json（root）devDependencies
- "@vitejs/plugin-react": "^4.0.0",   // L85（vite 8 非対応のため C5 確定修正）
+ "@vitejs/plugin-react": "^5.2.0",
- "@vitest/coverage-v8": "^3.2.6",    // L86
+ "@vitest/coverage-v8": "^4.1.8",
- "vitest": "^3.2.6",                 // L94
+ "vitest": "^4.1.8",

// apps/api/package.json devDependencies
- "vitest": "^3.2.6",                 // L31
+ "vitest": "^4.1.8",

// apps/og/package.json devDependencies
- "vitest": "^3.2.6",                 // L22
+ "vitest": "^4.1.8",
```

> `jsdom`（`^25.0.0`）/ `@testing-library/*` は変更しない（Phase 2 ライブラリ選定表: jsdom は vitest 4 の optional peer `'*'` で適合）。

### Step 2: `vitest.d1.config.ts` の pool API 書換（Lane 0 / C1 確定修正）

v4 では tinypool 削除により `poolOptions` が削除される。公式 migration guide は旧 `singleFork` の移行候補として `maxWorkers: 1` + `isolate: false` を示すが、本リポジトリの D1 mock は `isolate: false` でファイル間モジュール状態が汚染し、`db.prepare is not a function` 等の順序依存 fail を起こす。したがって `pool: "forks"` を維持し、直列化は top-level `maxWorkers: 1` のみで表現する。

**Before（現行 `vitest.d1.config.ts` L72-90）:**

```ts
  test: {
    environment: "jsdom",
    globals: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    include: D1_INCLUDE,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
```

**After:**

```ts
  test: {
    environment: "jsdom",
    globals: false,
    testTimeout: 180000,
    hookTimeout: 180000,
    include: D1_INCLUDE,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
    // v4: tinypool 削除により poolOptions / singleFork は廃止。
    // issue-617 の D1 直列化（port exhaustion 回避）は top-level maxWorkers: 1 で表現する。
    // NOTE: 旧 singleFork: true は「単一 fork で全ファイルを直列実行」だが
    // モジュール状態はファイル単位で隔離されていた（isolate 既定 true）。
    // migration guide の等価表現とされる isolate: false を併用すると、
    // D1 mock のモジュール状態がファイル間で汚染するため採用しない。
    pool: "forks",
    maxWorkers: 1,
    // Vitest 4 + x64 Node では初回 migration が 60s を超えることがあるため、
    // D1 専用 shard だけ timeout を 180s に広げる。
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
```

> ファイル冒頭コメント（L1-12）の `singleFork` 言及は v4 表現に合わせて更新してよい（任意・コメントのみ）。`plugins` / `resolve.alias` / `optimizeDeps` / `D1_INCLUDE` / `coverage` は**変更しない**（不変条件 3・4）。

### Step 3: `apps/api/package.json` `test:coverage:unit` の `--minWorkers=1` 削除（Lane 0 / C1 確定修正）

v4 で `minWorkers` オプション（CLI `--minWorkers` 含む）が削除。`--maxWorkers=1` は v4 でも有効なため維持する。**最小 diff（` --minWorkers=1` の削除のみ）**:

**Before（現行 L15）:**

```jsonc
"test:coverage:unit": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage/unit --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --maxWorkers=1 --minWorkers=1 apps/api",
```

**After:**

```jsonc
"test:coverage:unit": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage/unit --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --maxWorkers=1 apps/api",
```

### Step 4: lockfile 再生成 + バージョン整合確認（Lane 0 / C5・C7 消化確認）

```bash
mise exec -- pnpm install                  # pnpm-lock.yaml を再生成
mise exec -- pnpm why vitest               # 解決バージョンが 4.1.x 系で全 workspace 一致か
mise exec -- pnpm why @vitest/coverage-v8  # vitest と完全同一バージョンか（exact pin / C7 解消）
mise exec -- pnpm why vite                 # ^6/^7/^8 のいずれかで解決されているか
mise exec -- pnpm why @vitejs/plugin-react # 5.2.x で peer 警告ゼロか（C5 解消）
```

確認観点（phase-02 複合確認チェック）:
- vitest と `@vitest/coverage-v8` の解決実バージョンが**完全一致**（peer は exact pin）。
- vite の解決メジャーが 6/7/8 のいずれか。8.x に解決された場合も plugin-react ^5.2 が peer を満たすこと（install 出力に peer 警告がない）。

### Step 5: typecheck / lint（Lane 0 → A/B/C の前提）

```bash
mise exec -- pnpm typecheck   # 型の v4 化（UserConfig→ViteUserConfig 等の型 export 変更）に追従できているか
mise exec -- pnpm lint
```

> 型エラーが出た場合は import 元/型名のみを最小修正する（テストロジックは変えない）。現行 config は vitest の型 import を持たない（cast のみ）ため通常は無変更。

### Step 6: RED 採取（Phase 4 の手順を実行）

Phase 4 の shard 別 RED 採取手順を実行し、fail を `RED-C{n}-{seq}` でタグ付けして修正対象一覧に転記する。**修正範囲（対象 spec / snapshot の件数）は RED 採取結果に従属する。**

### Step 7: shard 別 fail 修正（Lane A/B/C / 並列）

| Lane | 担当 shard | 中心カテゴリ |
| --- | --- | --- |
| Lane A | api（unit + d1） | C2/C3 中心。D1 直列化の完走確認（port exhaustion 非再発）を含む |
| Lane B | web（385 spec） | C3/C4 中心 + react alias / plugin-react 5.2 健全性 |
| Lane C | og / packages / scripts / infra | C3/C4 中心（小規模） |

#### C3 修正パターン（mock/spy 挙動変更）

```ts
// RED-C3-01: restoreAllMocks の限定化（v4 は手動 vi.spyOn の restore のみ。状態 reset 廃止）
// before（v3: restoreAllMocks で vi.fn の状態もリセットされる前提）
afterEach(() => {
  vi.restoreAllMocks();
});
// after（v4: 状態 reset が必要なら resetAllMocks を明示併用）
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

// RED-C3-02: invocationCallOrder 0 始まり → 1 始まり
- expect(spy.mock.invocationCallOrder[0]).toBe(0);
+ expect(spy.mock.invocationCallOrder[0]).toBe(1);

// RED-C3-03: getMockName 既定値の変更
- expect(fn.getMockName()).toBe("spy");
+ expect(fn.getMockName()).toBe("vi.fn()");

// RED-C3-04: mockImplementation のアロー関数はコンストラクタ呼出で "not a constructor"
- vi.spyOn(mod, "Client").mockImplementation(() => fakeClient);
+ vi.spyOn(mod, "Client").mockImplementation(function () { return fakeClient; });
```

#### C1 補修パターン（D1 直列化で状態共有が顕在化した場合のみ）

```ts
// RED-C1-01: D1 shard でテスト間モジュール状態共有による順序依存 fail
// → setupFile または該当 spec の beforeAll で公式対処
beforeAll(() => {
  vi.resetModules();
});
```

#### C4 修正: snapshot 更新（2 ステップ分離 — FB-IPC-SNAP-002）

snapshot の更新は「初回 `--update` 生成」と「既存との diff 目視確認」を**必ず別ステップ**として実施し、それぞれを記録する:

```bash
# Step 7-a: 初回 --update 生成（機械的差分の一括更新。fail した shard のみ対象）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --update <fail した spec のパス>

# Step 7-b: 既存 snapshot との diff 目視確認（生成とは別ステップ）
git diff -- '**/__snapshots__/**' '**/*.spec.ts' '**/*.spec.tsx'
# 確認観点:
#   - [MockFunction spy] → [MockFunction] / shadow root 出力などの機械的差分のみか
#   - 実挙動の変化を示す差分（DOM 構造・値の変化）が混ざっていないか
#     → 混ざっていれば受け入れず、Phase 3 エスカレーション条件 2 を発火
# obsolete snapshot の清掃（v4 は CI 上で obsolete があると fail）
# vitest 実行出力の "obsolete" 報告を確認し、残骸 .snap / エントリを削除する
```

> 各 Lane の修正後、担当 shard を再実行して GREEN を確認する。修正は spec / snapshot に閉じ、プロダクトコードに触れる必要が生じたら停止してエスカレーション（Phase 3 条件 2）。

### Step 8: Lane D（直列・締め）

```bash
# C8 残党の最終 grep（Phase 4 (a) の再実行。全て「なし」であること）
# deprecation 警告ゼロ確認（v4.1 deprecation は件数記録 → Phase 8 で対応判断）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/og 2>&1 | grep -i "deprecat\|warn" || echo "OK: 警告なし"

# obsolete snapshot 0 件確認（CI 相当）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web 2>&1 | grep -i "obsolete" || echo "OK: obsolete なし"

# 全 shard 統合 GREEN + coverage ゲート（C2 実測は Phase 7 が正本）
mise exec -- pnpm coverage:guard
```

## ローカル検証コマンド一覧

```bash
# 依存・整合
mise exec -- pnpm install
mise exec -- pnpm why vitest
mise exec -- pnpm why @vitest/coverage-v8
mise exec -- pnpm why vite
mise exec -- pnpm why @vitejs/plugin-react

# runtime 健全性（worktree / esbuild — FB-MSO-002）
mise exec -- pnpm verify:vitest-runtime

# 静的品質
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# shard 別 GREEN 確認（artifacts.json mutation_commands と一致）
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm --filter @ubm-hyogo/og test:coverage
mise exec -- pnpm --filter './packages/*' test:coverage
mise exec -- pnpm test:scripts
mise exec -- pnpm test:alerts && mise exec -- pnpm test:sentry-alerts

# coverage 集約ゲート + PR pre-flight
mise exec -- pnpm coverage:guard
bash scripts/verify-pr-ready.sh
```

## DoD（Definition of Done）

- [ ] Step 0 の coverage baseline（v3.2.6 実測）が bump 前に採取され記録されている（Phase 7 S1 の前提）
- [ ] root / apps/api / apps/og の `vitest` が `^4.1.8`、root の `@vitest/coverage-v8` が `^4.1.8`、`@vitejs/plugin-react` が `^5.2.0`（AC-1）
- [ ] `mise exec -- pnpm install` が成功し `pnpm-lock.yaml` が再生成された
- [ ] `pnpm why` 4 点整合: vitest と coverage-v8 が**同一の 4.1.x** で完全一致、vite が ^6/^7/^8 範囲、plugin-react の peer 警告ゼロ（AC-2 / C5・C7 解消）
- [ ] `vitest.d1.config.ts` が `pool: "forks"` + `maxWorkers: 1`（`poolOptions` 削除、`isolate: false` 不採用）で D1 テストが port exhaustion なく完走（AC-7 / 不変条件 3）
- [ ] `apps/api/package.json` の `test:coverage:unit` から `--minWorkers=1` が削除され（`--maxWorkers=1` は維持）、shard が起動・完走する
- [ ] `mise exec -- pnpm typecheck` が green（AC-3）
- [ ] `mise exec -- pnpm lint` が green（AC-4）
- [ ] 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）が green、fail ゼロ（AC-5）
- [ ] RED 分類（C1/C3/C4）に該当した spec が期待値・モック設定・snapshot 修正のみで回復し、プロダクトコードは無変更
- [ ] snapshot 更新が「`--update` 生成」と「diff 目視確認」の 2 ステップで実施・記録され、obsolete snapshot が 0 件（AC-8 / FB-IPC-SNAP-002）
- [ ] deprecation 警告が残っていない、または対応不要と分類記録されている（AC-6）
- [ ] skip 件数が bump 前から増えていない（AC-8 / 不変条件 7）

## 完了条件

- [ ] 変更対象ファイル一覧（パス / 変更種別 / 変更内容）が記載されている（CONST_005）
- [ ] `vitest.d1.config.ts` の Before/After コードブロックが現行実体と一致した転記で記載されている
- [ ] `test:coverage:unit` の Before/After（`--minWorkers=1` 削除のみの最小 diff）が記載されている
- [ ] Step バイ Step 手順が Lane 0 → RED → Lane A/B/C → Lane D の順で phase-02 と整合している
- [ ] 入出力・副作用（lockfile 再生成 / node_modules 更新 / snapshot 更新）が定義されている
- [ ] snapshot 更新の「初回 `--update` 生成」と「diff 目視確認」が別ステップとして記載されている（FB-IPC-SNAP-002）
- [ ] ローカル検証コマンド一式と DoD チェックリストが記載されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-02-design.md`, `phase-04-test-creation.md`, `artifacts.json` mutation commands
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-05-implementation.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
