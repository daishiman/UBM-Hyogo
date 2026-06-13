# Phase 7: Coverage Check（カバレッジ確認 / C2 実測設計）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-04 / phase-05 / phase-06（全 shard GREEN 後。baseline は phase-05 Step 0 で bump 前に採取済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 主目的 | C2（coverage v8 の AST ベース remapping 一本化）による数値変動を shard 別に実測し、閾値ゲートとの整合を証跡付きで回復する |

## カバレッジ対象範囲の明示（Feedback BEFORE-QUIT-002 / Feedback 5 準拠）

本タスクで変更したのは**依存バージョンと config / scripts / テスト期待値のみ**であり、プロダクトコード（`apps/*/src`, `packages/*/src`）の挙動は一切変更しない（Phase 2 責務境界）。したがって coverage の観点は「未カバー行を新規に潰す」ことではなく、**「v3→v4 で coverage 数値が動いた箇所」に対象を限定**し、その動きが説明可能（C2 由来）であることを確認することにある。**広域指定でなく、変更影響の局所実測値を証跡に残す。**

| 観点 | 本タスクでの扱い |
| --- | --- |
| 全ファイル一律の coverage 引き上げ | **対象外**。プロダクトコード不変のため新規テストは追加しない（index.md スコープ外） |
| v3→v4 で数値が動いた箇所 | **本 Phase の対象**。baseline（v3.2.6）と after（v4.1.8）の差分を shard 別に抽出し、C2（AST remapping）由来か否かを判定 |
| 数値が動かなかった shard / metric | 差分 0 と記録するのみ（プロダクトコードもテストも不変なら原則同一だが、**v4 は「v3 から更新すると数値が変わることが想定される」と公式明記**しているため、変動自体は異常ではない） |

> **C2 の前提（公式 migration guide）**: v4 で coverage v8 は `v8-to-istanbul` を廃止し AST 解析ベースの remapping に一本化された。`coverage.all` / `ignoreEmptyLines` / `extensions` / `experimentalAstAwareRemapping` は削除。include 定義時は covered+uncovered の両方が対象、`exclude` は include マッチ後に適用、exclude は文字列のみ。現行 config（`vitest.config.ts`）は include/exclude 明示済みで削除オプション未使用のため **config 修正は不要見込み**であり、**閾値の実測再確認が本 Phase の作業実体**。
>
> coverage 低下が **C2 で説明できない規模・態様**で観測された場合（特定ファイルだけ大幅低下など）、「破壊的変更で fail したテストが skip / 削除されたまま放置された」兆候として扱い、Phase 4/6 へ差し戻す（テスト未修正のサイン）。

## coverage 実行コマンド（shard 毎）

各 shard を独立実行し、個別の `reportsDirectory` に出力する。実行は全て `mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2 を固定する（コマンドは artifacts.json の `mutation_commands` と一致）。

| shard | コマンド | 出力先 reportsDirectory |
| --- | --- | --- |
| api-unit | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit` | `apps/api/coverage/unit` |
| api-d1 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` | `apps/api/coverage/d1`（`vitest.d1.config.ts` の coverage 上書き） |
| web | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | web 側 script 指定の reportsDirectory |
| og | `mise exec -- pnpm --filter @ubm-hyogo/og test:coverage` | `apps/og/coverage` |
| packages | `mise exec -- pnpm --filter './packages/*' test:coverage` | 各 package 個別の reportsDirectory |
| 集約ゲート | `mise exec -- pnpm coverage:guard`（`scripts/coverage-guard.sh`） | CI と同条件の shard 並列実行 + 閾値判定 |

> reporter は root `vitest.config.ts` で `["text", "json-summary", "json", "lcov", "html"]`。baseline 比較には機械可読な **`json-summary`（各 reportsDirectory の `coverage-summary.json`）** を正本とする。

### apps/api の unit + d1 マージ

apps/api は unit（`vitest.config.ts`）と D1（`vitest.d1.config.ts`）を**別々の reportsDirectory** に出力するため、`scripts/coverage-merge.mjs` で統合してから閾値判定する（`apps/api/package.json` の `test:coverage` script がこの 3 段を一括実行する）:

```bash
# unit → d1 → merge を一括実行
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
# 内部: test:coverage:unit → test:coverage:d1 →
#   node scripts/coverage-merge.mjs --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" --output="apps/api/coverage"
```

> D1 shard は v4 表現（`pool: "forks"` + `maxWorkers: 1`、`isolate: false` 不採用）で直列実行する（NFR-4 / 不変条件 3）。pool 設定が無効化されていないことを、completion（hang/EADDRINUSE なし）で同時確認する。

## C2（AST remapping）実測手順

| 手順 | 内容 |
| --- | --- |
| S1: baseline 採取 | アップグレード**前**（vitest 3.2.6）の状態で全 shard の `coverage-summary.json` を採取（**phase-05 Step 0 で Lane 0 より先に実施済みであること**。bump 後は v3 数値を再現できない）。`lines` / `branches` / `functions` / `statements` の `pct` を記録 |
| S2: after 採取 | アップグレード**後**（vitest 4.1.8 / 全 shard GREEN）で同一 shard の `coverage-summary.json` を採取 |
| S3: 差分判定 | shard × metric 毎に baseline vs after の `pct` を比較し、下表へ記入。差分が AST remapping による計測方式変更で説明可能な範囲かを確認 |
| S4: 許容判定 | C2 由来と説明できる差分のみ許容。閾値割れが生じた場合は「実測 diff の範囲でのみ」最小調整（次節）。**C2 で説明できない低下**は Phase 4/6 へ差し戻す |
| S5: 局所実測の証跡化 | 差分が出た shard は summary（広域値）だけでなく、`coverage-final.json` / html レポートから**差分の出たファイル単位の局所実測値**を抽出して記録する（Feedback BEFORE-QUIT-002 / Feedback 5: 広域指定でなく変更影響の局所実測値を証跡に残す） |

### 差分記録テーブル（採取結果の記入枠）

`lines` の例。`branches` / `functions` / `statements` も同形式で全 shard 記録する。記録先: `outputs/phase-07/coverage-diff.md`（実装サイクルで作成）。

| shard | metric | baseline pct（v3.2.6） | after pct（v4.1.8） | 差分（pt） | 判定（C2許容 / 要調査） | 局所実測の証跡（差分が出たファイルと pct） |
| --- | --- | --- | --- | --- | --- | --- |
| web | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |
| api-unit | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |
| api-d1 | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |
| api（merged） | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |
| og | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |
| packages | lines | _採取_ | _採取_ | _計算_ | _判定_ | _該当時のみ_ |

> 実際の変動方向・幅は **RED/実測採取結果に従属**する（v4 公式は変動の発生のみ明記し、方向は規定していない）。「要調査」が 1 件でもあれば本 Phase は未完。

## 閾値ゲートの判定手順

| ゲート | 実行 | 判定 |
| --- | --- | --- |
| coverage-guard | `mise exec -- pnpm coverage:guard`（`scripts/coverage-guard.sh`） | CI 同条件の shard 並列実行 + 閾値判定が green |
| coverage-threshold-lint | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts scripts/__tests__/coverage-threshold-lint.spec.ts`（または `mise exec -- pnpm lint:coverage-threshold`） | 閾値定義と実測の整合 lint が green |

### 閾値調整のルール（不変条件 8 / NFR-5）

1. **下げ幅は実測 diff のみ**: 閾値ゲートが赤化した場合のみ、S3 で記録した baseline→after の実測差分の範囲内で最小調整する。先回り・余裕代込みの引き下げは禁止。
2. **証跡必須**: 調整した場合は「調整した閾値・調整前後の値・根拠となる shard 別実測 diff（S5 の局所実測値を含む）」を `outputs/phase-07/coverage-diff.md` に残し、Phase 8 のリファクタ記録にも転記する。
3. **2pt 級超はエスカレーション**: shard あたり **2pt 級**を超える引き下げが必要になった場合は、品質低下を伴う計測仕様変化として実装を止め、diff 根拠を添えてユーザーへ報告する（Phase 3 エスカレーション条件 3 と整合）。
4. **include / exclude の縮小禁止**: カバレッジ対象の `coverage.include` / `exclude` を恣意的に狭めて数値を回復することは禁止（Phase 2 責務境界）。なお v4 では exclude は文字列のみ・include マッチ後適用へ仕様変更されているが、現行 config は適合済みのため変更しない。

## 完了条件

- [ ] coverage 対象範囲を「v3→v4 で数値が動いた箇所」に限定して明示している（広域指定でなく局所実測 / BEFORE-QUIT-002・Feedback 5）
- [ ] shard 毎の coverage コマンドと reportsDirectory が一覧化され、artifacts.json の mutation_commands と整合している
- [ ] apps/api の unit + d1 merge（`coverage-merge.mjs`）手順が記載されている
- [ ] C2 実測手順（S1〜S5）と shard 別 before/after 差分記録テーブル雛形が用意されている
- [ ] baseline 採取が bump 前（phase-05 Step 0）であることが明示されている
- [ ] 閾値ゲート（`coverage-guard.sh` / `coverage-threshold-lint`）の判定手順が記載されている
- [ ] 閾値調整ルール（下げ幅は実測 diff のみ・証跡必須・2pt 級超はエスカレーション・include/exclude 縮小禁止）が phase-03 エスカレーション条件と整合して記載されている
- [ ] C2 で説明できない coverage 低下がゼロ（あれば Phase 4/6 へ差し戻し）
- [ ] D1 shard が v4 表現（forks + maxWorkers 1、isolate false 不採用）維持で hang/EADDRINUSE なく完走している

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-04-test-creation.md`, `phase-05-implementation.md`, coverage guard scripts
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-07-coverage-check.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
