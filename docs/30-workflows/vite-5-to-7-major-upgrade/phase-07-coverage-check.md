# Phase 7: Coverage Check（カバレッジ確認）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-04 / phase-05 / phase-06（全 shard GREEN 後） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | アップグレード前後で coverage 数値が低下していないことの確認（変更は依存定義 + config のみ → プロダクトコード coverage は不変が期待） |

## カバレッジ対象範囲の明示（プロダクトコード不変）

本タスクで**変更したのは依存定義（root `package.json` の `vite` 直接 devDep 追加 + `pnpm-lock.yaml` 再生成）と、必要時のみ config（`vitest.config.ts` / `vitest.d1.config.ts`）/ テスト期待値**のみであり、プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は一切変更しない（SSOT §4 / Phase 5 責務境界）。したがって coverage の観点は「未カバー行を新規に潰す」ことではなく、**「プロダクトコード coverage は不変が期待」** であり、その不変を baseline 比較で確認することにある。

| 観点 | 本タスクでの扱い |
| --- | --- |
| 全ファイル一律の coverage 引き上げ | **対象外**。プロダクトコード不変のため新規テストは追加しない（不変条件1・スコープ外） |
| Vite 5→7 で数値が動いた箇所 | **本 Phase の対象**。baseline（vite 5.4.21）と after（vite 7.x）の差分を抽出し、変化が無い（不変）ことを確認 |
| 数値が動かなかったファイル | 期待どおり。プロダクトコードもテストも不変なら数値は同一（これが既定の期待値） |

> coverage 低下が観測された場合、それは「破壊的変更（V2/V3/V7）で fail したテストが skip / 削除されたまま放置された」兆候として扱い、Phase 4/6 へ差し戻す（テスト未修正のサイン）。Vite はテスト変換層（JSX transform / module resolution）のみに関与するため、変換が壊れて一部 spec が走らないと当該プロダクトコードの coverage が落ちる形で現れる。

## coverage 閾値を下げない不変条件（不変条件8）

- coverage 閾値は既存水準を**下げない**（不変条件8）。本タスクは依存更新のみでプロダクトコードを触らないため、**閾値調整は原則不要**。
- 万一 Vite 7 の module 解決変化で coverage 計測の分母が変動した場合でも、恣意的な閾値引き下げは禁止。低下が観測されたら原因（fail テストの skip 等）を特定して解消する方向で対応する。
- include / exclude を縮小して見かけの coverage を上げることも禁止。

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

> D1 shard は `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` を維持して実行する（V7 / 不変条件3）。アップグレードで pool 設定が無効化されていないことを、completion（hang/EADDRINUSE なし）で同時確認する。

### CI 相当の並列実行

CI では `scripts/coverage-guard.sh` が shard を並列実行する。ローカルでも同スクリプトで CI と同条件の coverage を再現できる。

```bash
mise exec -- bash scripts/coverage-guard.sh
```

## baseline 比較手順（shard 別 coverage 実測の採取方針）

変更が依存定義 + config のみのため、coverage は **baseline（vite 5.4.21）と after（vite 7.x）で一致する**ことが期待値。以下の手順で shard 別に実測採取して不変を確認する。

| 手順 | 内容 |
| --- | --- |
| S1: baseline 採取 | アップグレード**前**（vite 5.4.21）の状態で全 shard の `coverage-summary.json` を控える。devDep 追加前の作業ツリー（または `git stash` / 別 worktree / dev tip）で `test:coverage` を実行し、`lines` / `branches` / `functions` / `statements` の `pct` を記録 |
| S2: after 採取 | アップグレード**後**（vite 7.x）で同一 shard の `coverage-summary.json` を採取 |
| S3: 差分判定 | shard 毎に baseline vs after の `pct` を比較。**差分ゼロ（不変）が期待値** |
| S4: 許容判定 | 不変であれば合格。**低下**が観測されたら、Vite 7 の変換層変化で一部 spec が走っていない兆候として Phase 4/6 へ差し戻す（テスト未修正のサイン） |

> プロダクトコードもテストも不変なら coverage `pct` は同一になるのが本タスクの正常系。Vite はテスト時の JSX 変換 / module 解決のみに関与し、計測ロジック（`@vitest/coverage-v8`）自体は据え置き（SSOT §3 核心2）であるため、coverage 数値は理論上動かない。**有意な低下**が出た場合は必ず原因（fail テストの skip 等）を特定する。

### 差分記録テーブル（採取結果の記入枠）

| shard | metric | baseline pct（vite 5.4.21） | after pct（vite 7.x） | 差分 | 判定（不変 / 要調査） |
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
| 閾値の調整有無 | **原則なし**。本タスクはプロダクトコード不変のため閾値は据え置き。引き下げは禁止（不変条件8） |

## 完了条件

- [ ] coverage 対象範囲を「変更は依存定義 + config のみ → プロダクトコード coverage は不変が期待」として明示している
- [ ] coverage 閾値を下げない不変条件（不変条件8）が明記されている
- [ ] shard 毎の `test:coverage` コマンドと `reportsDirectory` が一覧化されている
- [ ] apps/api の unit + d1 merge（`coverage-merge.mjs`）手順が記載されている
- [ ] baseline（vite 5.4.21）vs after（vite 7.x）の shard 別実測採取方針（S1〜S4）と差分記録テーブルが用意されている
- [ ] coverage 低下がゼロ（あれば Phase 4/6 へ差し戻し）
- [ ] `coverage-threshold-lint.spec.ts` が green
- [ ] D1 shard が `singleFork` 維持で hang/EADDRINUSE なく完走している（V7 / 不変条件3）
