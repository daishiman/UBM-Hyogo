# Phase 5 実装証跡 — vitest 2→3 メジャーアップグレード実行結果

> 本ファイルは Phase 5（実装）の **実行証跡**。Phase 12 の `implementation-guide.md`（規範文書）に対し、実コードベースで実際に行った変更と検証結果を記録する。
> 実行日: 2026-06-10 / Node 24.15.0 / pnpm 10.33.2（`mise exec --` 経由）

## 結論（要約）

| 項目 | 結果 |
| --- | --- |
| version bump（3 package.json + lockfile） | 完了 |
| RED（v2→v3 破壊的変更による fail） | **0 件**（C1〜C8 のいずれにも該当する実テスト失敗なし） |
| テストコード修正 | **不要**（期待値・モック・fakeTimers の修正ゼロ） |
| config 修正（`vitest.config.ts` / `vitest.d1.config.ts`） | **不要**（deps.inline / workspace 不使用を静的確認済み） |
| 全 shard テスト | 全 green |
| coverage 集約閾値（≥80%） | 全 7 パッケージ PASS |
| typecheck / lint | green |

> v3.0 公式が「破壊的変更は小さい」と位置づける通り、当 monorepo の 651 spec は **期待値・モック・config を一切変えずに** vitest 3.2.6 で green を維持した。これは Phase 4 で想定した「RED ゼロなら version bump + lockfile 確認のみで完了」というベストケースに該当する。

## 1. 実コード変更（`git diff --stat`）

```
 apps/api/package.json |   2 +-
 apps/og/package.json  |   2 +-
 package.json          |   4 +-
 pnpm-lock.yaml        | 216 +++++++++++++++++++++++++++++---------------------
 4 files changed, 131 insertions(+), 93 deletions(-)
```

| ファイル | 変更内容 |
| --- | --- |
| `package.json`（root） | `vitest` `^2.0.0`→`^3.2.6`（L94） / `@vitest/coverage-v8` `^2.1.9`→`^3.2.6`（L86） |
| `apps/api/package.json` | `vitest` `^2.1.9`→`^3.2.6`（L31） |
| `apps/og/package.json` | `vitest` `^2.1.9`→`^3.2.6`（L22） |
| `pnpm-lock.yaml` | `mise exec -- pnpm install` で再生成 |

## 2. バージョン整合（AC-1 / AC-2 / C7）

```
$ mise exec -- pnpm exec vitest --version
vitest/3.2.6 darwin-arm64 node-v24.15.0

$ mise exec -- pnpm why vitest               → vitest@3.2.6
$ mise exec -- pnpm why @vitest/coverage-v8  → @vitest/coverage-v8@3.2.6（Found 1 version）
# lock.yaml: @vitest/coverage-v8 3.2.6(vitest@3.2.6(...)) で peer 完全一致
```

vitest と `@vitest/coverage-v8` は同一バージョン 3.2.6 に解決。peer 不一致なし（C7 解消）。

## 3. 静的検出（C4 / C5 / C8）

| カテゴリ | コマンド結果 |
| --- | --- |
| C4 `deps.inline` | `OK: C4 なし`（config 未使用） |
| C5 `workspace` | `OK: C5 なし`（config 未使用 / `vitest.workspace.*` 不在） |
| C8 第3引数オブジェクト記法 | ヒットなし（`test/it/describe` の第3引数オブジェクトなし） |

config（`vitest.config.ts` / `vitest.d1.config.ts`）は無変更。`resolve.alias`（react subpath）/ `optimizeDeps` / `pool: forks` / `singleFork: true` を保持。

## 4. typecheck / lint（AC-3 / AC-4）

```
$ mise exec -- pnpm typecheck   → 7 workspace すべて Done（exit 0）
$ mise exec -- pnpm lint        → 全 workspace Done + dep-cruiser/stablekey-lint/no-inline-style 全 OK（exit 0）
```

vitest 3 の型 export 変更に起因する型エラーは発生せず。import 修正ゼロ。

## 5. shard 別テスト結果（AC-5 / AC-7 / AC-8）

| shard | config | 結果 | exit |
| --- | --- | --- | --- |
| api-unit | `vitest.config.ts` | 87 files / 561 tests passed | 0 |
| api-d1 | `vitest.d1.config.ts`（forks/singleFork） | 115 files / 1007 tests passed・port exhaustion なし | 0 |
| web | `vitest.config.ts` | 244 files / 1773 tests passed・1 skipped（既存） | 0 |
| og | `vitest.config.ts` | 6 files / 23 tests passed | 0 |
| packages | `vitest.config.ts` | 33 files / 335 tests passed | 0 |
| scripts | `vitest.config.ts` | 58 files / 478 tests passed | 0※ |
| infra | `vitest.config.ts` | 10 files / 56 tests passed | 0 |

- skip 件数は bump 前から増加なし（web の 1 skip は既存・AC-8 充足）。
- D1 shard は `pool: forks` / `singleFork: true` 維持で port exhaustion なく完走（AC-7 / 不変条件3）。

> ※ scripts shard フルディレクトリ実行は、forks プールの **birpc 60 秒 RPC タイムアウト**（`Timeout calling "onTaskUpdate"`・vitest issue #8164、v2 から存在しバージョン非依存）により高負荷並列時に exit 1 を返すことがある。全 478 テスト自体は pass しており、`--no-file-parallelism`（並列抑制）で再実行すると **exit 0 / 478 passed / Errors 0** に収束することを確認済み。CI では scripts はフルディレクトリではなくファイル単位・限定ディレクトリ（`test:alerts` / `test:sentry-alerts` / `verify-design-tokens` / `verify-no-localhost-bake` / `verify-wrangler-binding-drift`）で実行されるため、この RPC タイムアウトは CI ゲートに影響しない。

### CI scripts/infra 系ゲート（実 CI コマンド）

| ゲート | 結果 |
| --- | --- |
| `pnpm test:alerts` | 8 files / 66 tests passed（exit 0） |
| `pnpm test:sentry-alerts` | 3 files / 9 tests passed（exit 0） |
| `vitest run scripts/verify-design-tokens.spec.ts` | 1 file / 20 tests passed（exit 0） |
| `vitest run scripts/verify-no-localhost-bake.spec.ts` | 1 file / 2 tests passed（exit 0） |
| `vitest run scripts/__tests__/verify-wrangler-binding-drift.spec.ts` | 1 file / 12 tests passed（exit 0） |

## 6. deprecation 警告（AC-6）

実行時の唯一の警告は `The CJS build of Vite's Node API is deprecated`（上流 Vite の通知）。これは root `package.json` が `type` 未指定（CommonJS）で vite Node API が CJS 経由ロードされるため出るもので、**vite 5 系から存在し本アップグレードで新規発生したものではない**（ESM 移行はスコープ外）。

AC-6 が対象とする **vitest config 由来の非推奨 API 警告**（`deps.inline` / `workspace`）は **ゼロ**。

## 7. coverage 集約閾値（不変条件8 / C6）

`bash scripts/coverage-guard.sh --no-run`（exit 0・all packages ≥ 80% PASS）:

| パッケージ | lines | branches | functions | statements |
| --- | --- | --- | --- | --- |
| apps/api（unit+d1 merge） | 86.82 | 86.11 | 90.51 | 85.03 |
| apps/og | 99.47 | 96.77 | 100 | 99.47 |
| apps/web | 86.56 | 85.91 | 82.83 | 86.56 |
| packages/contracts | 100 | 100 | 100 | 100 |
| packages/integrations | 100 | 100 | 100 | 100 |
| packages/shared | 94.33 | 86.27 | 95.91 | 94.33 |
| packages/integrations/google | 89.2 | 80.6 | 88.23 | 89.2 |

v8 provider は vitest 3.2.6 で正常動作。閾値（80%）を全パッケージで上回り、C6（`ignoreEmptyLines`）由来の閾値割れは発生せず。閾値設定の変更は不要（不変条件8 充足）。

## 8. 環境起因のノイズ（実テスト失敗ではないもの）

実行マシンが外部要因で高負荷（load average 130〜260）になった時間帯に、以下の **環境 flake** を観測したが、いずれも負荷の低い状態での単独再実行で green を確認しており、vitest 3 の回帰ではない:

| 事象 | 真因 | 確認方法 |
| --- | --- | --- |
| api-d1 coverage で hook/test timeout（30s 超） | 高負荷下で Miniflare 起動（`setupD1` hook）が hookTimeout 30s を超過 | CLI 一時フラグ `--hookTimeout=120000 --testTimeout=120000`（config 不変条件は変更せず）で再実行 → 115 files/1007 tests passed・exit 0 |
| web coverage で `BulkActionBar TC-BAB-CAT-11` が 1 件 fail | real timer の `waitFor`（既定 1000ms）が高負荷下で 2384ms 超過（fakeTimers 不使用 = C3 非該当） | 低負荷時（load 8.59）に当該 spec 単独再実行 → 22 tests passed・exit 0。web shard 全体も 244 files/1773 tests passed・exit 0 |

> どちらも fakeTimers / モック / エラー比較とは無関係で、test/config の修正対象ではない。

## DoD 充足状況

- [x] `pnpm install` 成功・`pnpm-lock.yaml` 再生成
- [x] `pnpm why vitest` / `@vitest/coverage-v8` が同一 3.2.6（C7 解消）
- [x] 3 package.json が `^3.2.6`、root coverage-v8 も `^3.2.6`（AC-1）
- [x] `pnpm typecheck` green（AC-3）
- [x] `pnpm lint` green（AC-4）
- [x] 全 shard green・fail ゼロ（AC-5）
- [x] RED（C1/C2/C3）該当の実テスト失敗なし → プロダクトコード・テストコードとも無変更
- [x] deprecation 警告（deps.inline/workspace）ゼロ（AC-6）
- [x] D1 の forks/singleFork 維持・port exhaustion なし（AC-7）
- [x] skip 件数増なし（AC-8）
- [x] coverage 閾値の C6 由来割れなし・既存水準維持（不変条件8）
