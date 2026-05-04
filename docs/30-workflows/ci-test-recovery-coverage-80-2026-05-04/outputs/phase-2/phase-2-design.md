# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| 依存 Phase | Phase 1（要件定義） |

## 目的

- AC-1〜AC-10 を満たすための concern 別 target topology / validation matrix を確定する。
- jsx-dev-runtime 解決の 3 案比較と推奨案を明示する。
- Task A-E の dependency matrix と owner / co-owner を固定する。

## concern 別 target topology

| Concern | Lane | 担当 Task | 主対象 |
| --- | --- | --- | --- |
| C1: vitest 環境（react jsx-dev-runtime 解決） | Lane-1 (env) | Task A | `vitest.config.ts` / root `package.json` / 必要なら `apps/web/vitest.config.ts` |
| C2: apps/api test failure 修復 | Lane-2 (api test) | Task B | `apps/api/src/**/*.test.ts` (実失敗ログにより確定) |
| C3: apps/web coverage 補強 | Lane-3 (web src + test) | Task C | `apps/web/src/components/**`, `apps/web/src/lib/**` + 対応 `__tests__` |
| C4: apps/api coverage 補強 | Lane-2 (api test 続) | Task D | `apps/api/src/**` + 対応 test |
| C5: CI hard gate 化 | Lane-4 (infra) | Task E | `.github/workflows/ci.yml` |

Lane 数 = 4（推奨上限 3 を 1 超過するが、Lane-2 は Task B → Task D の直列なので並列同時実行は最大 3 lane）。

## jsx-dev-runtime 解決の 3 案比較

### 前提

- `react` は `apps/web/package.json#dependencies` のみに宣言（`react@19.2.5`）。
- root `package.json#devDependencies` には `@vitejs/plugin-react` のみ存在し `react` 本体は不在。
- root `vitest.config.ts` は `--root=../..` で起動され、include パターンが workspace 全体を走査。
- pnpm hoisting でローカルでは `node_modules/react/jsx-dev-runtime.js` が見えるが、CI の `pnpm install --frozen-lockfile` 環境では vitest deps optimizer の解決順序が変わり失敗する。

### 案比較

| 案 | 内容 | Pros | Cons | 推奨度 |
| --- | --- | --- | --- | --- |
| **案 1: root に react devDep 追加** | root `package.json#devDependencies` に `react` `react-dom` `@types/react` を追加し、vitest が常に root から resolve できる状態にする | 実装最小（lockfile 更新のみ）/ 既存 vitest config 変更不要 / CI/ローカル両方で確実に hoist | バージョン同期が必要（apps/web と root で同じ react 版） / monorepo 内で react を二重宣言 | ◎ |
| **案 2: vitest deps.optimizer.include 追加** | `vitest.config.ts` の `test.deps.optimizer.web.include` に `react/jsx-dev-runtime` `react/jsx-runtime` を追加 | 依存追加なし / vitest 設定のみで完結 | optimizer が pre-bundle するため初回起動コスト増 / vitest 2 と 3 で API 差分があり将来改修時に脆弱 / `Failed to resolve` が optimizer pre-bundle 前にも起こりうる | ○ |
| **案 3: apps/web 専用 vitest config 分離** | `apps/web/vitest.config.ts` を新設し `--root=.` で起動するよう `apps/web/package.json#scripts.test` を変更。同時に root vitest の include から apps/web を除外 | apps/web の依存が apps/web 内で完結 / 各 app が独立した test runner を持てる | scope 拡大（test script 全面改修・coverage パス・CI scripts/coverage-guard.sh の挙動見直し）/ wave-1 1 PR では収まらない | △ |

### 推奨案: **案 1（root に react devDep 追加）**

#### 採用理由

1. **最小スコープ**: root `package.json` への 3 行追加 + `pnpm install` で完結。CI/ローカル両方で同じ resolution path を共有できる。
2. **既存 vitest 設定との互換性最大**: `vitest.config.ts` は `@vitejs/plugin-react` プラグイン構成のままで動く。
3. **将来性**: react 19 系の jsx-runtime に依存する別 package を root から増やしても回帰しない。
4. **リスク管理**: バージョン drift 防止のため `package.json` に `"react": "19.2.5"` のように **apps/web と完全一致** で固定し、Renovate / dependabot で同期する。

#### Fallback (案 1 で解決しない場合)

- 案 2 を補強として併用: `test.server.deps.inline: ['react', 'react-dom']` を追加。
- それでも CI で再現する場合のみ案 3 へエスカレーション（Task A の Phase 8 で判断）。

## Task 別 validation matrix

### Task A (jsx-dev-runtime 解決)

| Validation | Command | 期待結果 |
| --- | --- | --- |
| ローカル apps/web test 起動 | `pnpm --filter @ubm-hyogo/web test 2>&1 \| grep "jsx-dev-runtime"` | 0 件 hit |
| 全 test pass | `pnpm --filter @ubm-hyogo/web test` | exit 0 |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| CI dry-run | act または GitHub Actions push | jsx-dev-runtime 解決失敗 0 件 |
| react バージョン整合 | `node -e "console.log(require('./apps/web/package.json').dependencies.react === require('./package.json').devDependencies.react)"` | `true` |

### Task B (apps/api 13 test repair)

| Validation | Command | 期待結果 |
| --- | --- | --- |
| 実失敗ログ取得 | `pnpm --filter @ubm-hyogo/api test 2>&1 \| tee /tmp/api-test-baseline.log` | 13 失敗確認 |
| 全 test pass | `pnpm --filter @ubm-hyogo/api test` | exit 0 |
| coverage 計測成立 | `pnpm --filter @ubm-hyogo/api test:coverage && cat apps/api/coverage/coverage-summary.json` | JSON parse 成功 |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |

### Task C (apps/web coverage 80%)

| Validation | Command | 期待結果 |
| --- | --- | --- |
| baseline 取得 | `pnpm --filter @ubm-hyogo/web test:coverage` (Task A 完了後) | 各 metric 39〜68% |
| 補強後 | 同上 | 全 metric ≥80% |
| 個別ファイル除外承認 | `vitest.config.ts` の `coverage.exclude` 追記 | unassigned-task-detection.md に理由記載 |

### Task D (apps/api coverage 80%)

| Validation | Command | 期待結果 |
| --- | --- | --- |
| baseline | `pnpm --filter @ubm-hyogo/api test:coverage` (Task B 完了後) | 計測成立 |
| 補強後 | 同上 | 全 metric ≥80% |

### Task E (hard gate 化)

| Validation | Command | 期待結果 |
| --- | --- | --- |
| yml 編集確認 | `grep -c "continue-on-error" .github/workflows/ci.yml` | coverage-gate 該当 0 件（他 job の正当な使用は残してよい） |
| coverage-guard 通過 | `bash scripts/coverage-guard.sh` | exit 0 |
| CI 実走 | `gh run watch` | coverage-gate job が hard fail 可能な状態で success |

## dependency matrix（共有モジュール owner/co-owner）

| 共有モジュール | 用途 | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- | --- |
| `vitest.config.ts` (root) | 全 package の test 設定 | Task A | Task C, Task D | Task A wave-1 完了時 |
| `package.json` (root) | dependencies 管理 | Task A | Task B, Task C, Task D | Task A wave-1 完了時 |
| `pnpm-lock.yaml` | lock | Task A | 全 task | wave 末尾 sync |
| `.github/workflows/ci.yml` | CI 設定 | Task E | Task A, Task B (regression 監視) | Task E wave-3 |
| `scripts/coverage-guard.sh` | 検証 script | (変更なし予定) | 全 task | — |

並列実行時の競合リスク:

| 競合点 | 対処 |
| --- | --- |
| Task A の root `package.json` 変更と Task B の `apps/api/package.json` 変更が同時に lockfile 触る | wave-1 内で Task A → Task B の順に rebase。Task B は単独 PR にせず Task A merge 後に push |
| Task C / Task D の lockfile 変更 | 新規 test dep は最小化。必要なら wave-2 内で merge 順序を A→C→D にする |

## DI 境界・型配置

該当なし（本 wave は test/CI 環境修復および test code 追加のみ）。

## 多角的チェック観点

- **CI/ローカル差分**: ローカル macOS で hoist する `node_modules/react` が CI Linux で解決されない要因は `pnpm install --frozen-lockfile` の hoist policy 差異。案 1 採用で CI/ローカル両方の root install path を統一する。
- **vitest 2 → 3 移行リスク**: `^2.0.0` 指定だが将来 3 系 upgrade 時に deps.optimizer API が変わる。案 1 なら影響を受けない。
- **react peer dep 整合性**: `@testing-library/react` `@vitejs/plugin-react` が react peer に依存するため、root に react を置けば peer 警告も解消される副次効果あり。

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Phase テンプレ | `.claude/skills/task-specification-creator/references/phase-template-core.md` §「Phase 2 のポイント」 |
| coverage 標準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| Phase 1 成果物 | `outputs/phase-1/phase-1-requirements.md` |
| 既存 wave | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| react package | `apps/web/package.json` / root `package.json` |
| vitest config | `vitest.config.ts` |

## 完了条件

- [x] concern × Lane × Task の対応表記載
- [x] jsx-dev-runtime 3 案比較と推奨案（案 1）明示
- [x] Task A-E の validation matrix 記載
- [x] dependency matrix の owner/co-owner 列記載
- [x] 並列競合点と対処記載

## 次 Phase

Phase 3（アーキテクチャ・タスク分解）— Task A-E それぞれの後続仕様書配置先と対象ファイル群、依存グラフ、wave 分割を確定する。
