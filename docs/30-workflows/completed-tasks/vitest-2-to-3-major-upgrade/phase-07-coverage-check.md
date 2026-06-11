# Phase 7: Coverage Check（カバレッジ確認）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-04 / phase-05 / phase-06（全 shard GREEN 後） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | アップグレード前後で coverage 数値が（C6 由来の不可避ずれを除き）低下していないことの確認 |

## カバレッジ対象範囲の明示（Feedback BEFORE-QUIT-002 / Feedback 5 準拠）

本タスクで**変更したのは依存バージョンのみ**であり、プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は一切変更しない（Phase 2 責務境界）。したがって coverage の観点は「未カバー行を新規に潰す」ことではなく、**「v2→v3 で coverage 数値が動いた箇所」に対象を限定**し、その動きが説明可能（C6 由来）であることを確認することにある。

| 観点 | 本タスクでの扱い |
| --- | --- |
| 全ファイル一律の coverage 引き上げ | **対象外**。プロダクトコード不変のため新規テストは追加しない（index.md スコープ外） |
| v2→v3 で数値が動いた箇所 | **本 Phase の対象**。baseline（v2.1.9）と after（v3.2.6）の差分を抽出し、C6（`ignoreEmptyLines`）由来か否かを判定 |
| 数値が動かなかったファイル | 確認不要（プロダクトコードもテストも不変なら数値は同一） |

> coverage 低下が**ignoreEmptyLines 由来以外**で観測された場合、それは「破壊的変更で fail したテストが skip / 削除されたまま放置された」兆候として扱い、Phase 4/6 へ差し戻す（テスト未修正のサイン）。

## coverage 実行コマンド（shard 毎）

各 package の `test:coverage` 系スクリプトを shard 単位で実行し、個別の `reportsDirectory` に出力する。実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する。

| shard | コマンド | 出力先 reportsDirectory |
| --- | --- | --- |
| web | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`（root config 利用） | `./coverage`（root `vitest.config.ts` の `coverage.reportsDirectory`） |
| api-unit | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage`（unit / `vitest.config.ts`） | `apps/api/coverage`（unit 分） |
| api-d1 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1`（`vitest.d1.config.ts`） | `apps/api/coverage/d1`（`vitest.d1.config.ts` の `coverage.reportsDirectory`） |
| og | `mise exec -- pnpm --filter @ubm-hyogo/og test:coverage` | og package の `reportsDirectory` |
| packages | `mise exec -- pnpm --filter './packages/*' test:coverage` | 各 package 個別の `reportsDirectory` |
| root（統合） | `mise exec -- pnpm test:coverage` | `./coverage`（reporter: `text` / `json-summary` / `json` / `lcov` / `html`） |

> reporter は root `vitest.config.ts` で `["text", "json-summary", "json", "lcov", "html"]`。baseline 比較には機械可読な **`json-summary`（`coverage/coverage-summary.json`）** を正本とする。

### apps/api の unit + d1 マージ

apps/api は unit（`vitest.config.ts`）と D1（`vitest.d1.config.ts`）を**別々の reportsDirectory** に出力するため、両者を `scripts/coverage-merge.mjs` で統合してから閾値判定する。

```bash
# 1) unit 出力
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage          # → apps/api/coverage
# 2) d1 出力（singleFork 維持 / port exhaustion 回避）
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1        # → apps/api/coverage/d1
# 3) 2 つを統合
mise exec -- node scripts/coverage-merge.mjs               # unit + d1 → 統合 summary
```

> D1 shard は `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を維持して実行する（NFR-4 / 不変条件3）。アップグレードで pool 設定が無効化されていないことを、completion（hang/EADDRINUSE なし）で同時確認する。

### CI 相当の並列実行

CI では `scripts/coverage-guard.sh` が shard `[web, api-unit, api-d1, packages, og]` を並列実行する。ローカルでも同スクリプトで CI と同条件の coverage を再現できる。

```bash
mise exec -- bash scripts/coverage-guard.sh
```

## C6（ignoreEmptyLines）影響の確認手順

vitest v2.0 から coverage `ignoreEmptyLines` の既定が `true` になり、空行が計測対象から除外される。v3 移行を機に、空行除外由来の分母変動で閾値が微変動し得る（破壊的変更マップ C6）。以下の手順で baseline 比較する。

| 手順 | 内容 |
| --- | --- |
| S1: baseline 採取 | アップグレード**前**（vitest 2.1.9）の状態で全 shard の `coverage-summary.json` を控える。PR #1177 取込前の dev tip（`f0297ad71`）または bump 前の作業ツリーで `test:coverage` を実行し、`lines` / `branches` / `functions` / `statements` の `pct` を記録 |
| S2: after 採取 | アップグレード**後**（vitest 3.2.6）で同一 shard の `coverage-summary.json` を採取 |
| S3: 差分判定 | shard 毎に baseline vs after の `pct` を比較。差分が **空行除外（分母縮小）で説明可能な微増/微減** に収まるかを確認 |
| S4: 許容判定 | 空行除外由来の差分のみ許容。それ以外の **低下** はテスト未修正（skip/削除の放置）の兆候として Phase 4/6 へ差し戻す |

> C6 は「空行が分母から外れる」ため、多くの場合 `pct` は**微増または不変**になる（カバーされない空行が分母から消えるため）。**有意な低下**が出た場合は C6 では説明できないため、必ず原因（fail テストの skip 等）を特定する。

### 差分記録テーブル（採取結果の記入枠）

| shard | metric | baseline pct（v2.1.9） | after pct（v3.2.6） | 差分 | 判定（C6許容 / 要調査） |
| --- | --- | --- | --- | --- | --- |
| web | lines | _採取_ | _採取_ | _計算_ | _判定_ |
| api（merged） | lines | _採取_ | _採取_ | _計算_ | _判定_ |
| og | lines | _採取_ | _採取_ | _計算_ | _判定_ |
| packages | lines | _採取_ | _採取_ | _計算_ | _判定_ |

> branches / functions / statements も同様に記録する。`pct` の有意低下が 1 件でもあれば本 Phase は未完。

## coverage 閾値 lint の green 確認

coverage 閾値は `scripts/__tests__/coverage-threshold-lint.spec.ts` 等で lint されている。アップグレード後にこの lint spec が green であることを確認する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts/__tests__/coverage-threshold-lint.spec.ts
```

| 確認 | 期待結果 |
| --- | --- |
| `coverage-threshold-lint.spec.ts` | PASS（閾値定義と実測の整合 lint が green） |
| 閾値の調整有無 | C6 由来の不可避ずれで閾値ゲートが赤化した場合のみ、実測差分の範囲で最小調整（下げ過ぎない / 不変条件8・NFR-5）。それ以外の閾値引き下げは禁止 |

> 閾値を調整した場合は、調整値・調整理由（C6 の空行除外で分母が N 行縮小した等）を Phase 8 のリファクタ記録テーブルにも残す。

## 完了条件

- [ ] coverage 対象範囲を「v2→v3 で数値が動いた箇所」に限定して明示している
- [ ] shard 毎の `test:coverage` コマンドと `reportsDirectory` が一覧化されている
- [ ] apps/api の unit + d1 merge（`coverage-merge.mjs`）手順が記載されている
- [ ] C6（ignoreEmptyLines）の baseline 比較手順（S1〜S4）と差分記録テーブルが用意されている
- [ ] 空行除外由来以外の coverage 低下がゼロ（あれば Phase 4/6 へ差し戻し）
- [ ] `coverage-threshold-lint.spec.ts` が green
- [ ] D1 shard が `singleFork` 維持で hang/EADDRINUSE なく完走している
