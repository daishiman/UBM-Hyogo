# Phase 9 成果物: 品質保証 13 項目チェックリスト結果

## 状態

`spec_created` — 本ファイルは Phase 9 仕様書（`../../phase-09.md`）に基づく QA 13 項目の本体。実走系は Phase 11 / 13 で再走。

## 1. quality-gates.md 13 Phase ゲート適用結果

| Phase | ゲート | 判定 | 根拠 |
| --- | --- | --- | --- |
| 1 要件定義 | 4 条件評価 / AC 一覧化 | PASS | outputs/phase-01/main.md |
| 2 設計 | トポロジ / I/O / 苦戦想定 | PASS | outputs/phase-02/main.md |
| 3 設計レビュー | 代替案 A〜F / NO-GO / 4 条件再評価 | PASS | outputs/phase-03/main.md |
| 4 テスト戦略 | T 一覧 / カバレッジ目標 | spec_created | phase-04.md |
| 5 実装ランブック | コマンド SSOT / ファイル変更計画 | spec_created | phase-05.md |
| 6 異常系 | T (fail) / 復旧手順 | spec_created | phase-06.md |
| 7 AC マトリクス | AC × Phase × T × 成果物 全件被覆 | spec_created | phase-07.md / outputs/phase-07/main.md |
| 8 DRY 化 | Before/After 5 区分 / 重複 7 件 / SSOT | spec_created | phase-08.md / outputs/phase-08/main.md |
| 9 品質保証 | 本 Phase | spec_created | 本ファイル |
| 10 最終レビュー | AC PASS / blocker / GO/NO-GO | spec_created | phase-10.md |
| 11 smoke | baseline / guard 実走 / 切替リハ | spec_created | phase-11.md |
| 12 docs 更新 | 正本同期 / changelog / unassigned | spec_created | phase-12.md |
| 13 PR | PR① / PR② / PR③ + user_approval | spec_created | phase-13.md |

> 13 Phase 全件にゲート判定。Phase 1〜3 は PASS、Phase 4〜13 は spec_created（仕様確定済み、実走前）。

## 2. 仕様書 linting 4 観点

### 2.1 リンク切れ

```bash
grep -rnE '\]\(\.\./|\]\(\./|\]\(outputs/' \
  docs/30-workflows/coverage-80-enforcement/
```

期待: 検出された相対参照すべてに対し `test -f` が success。

### 2.2 コードブロック開閉対

```bash
for f in docs/30-workflows/coverage-80-enforcement/phase-*.md \
         docs/30-workflows/coverage-80-enforcement/outputs/phase-*/main.md; do
  c=$(grep -c '^```' "$f"); [ $((c%2)) -eq 0 ] || echo "ODD: $f ($c)"
done
```

期待: ODD 出力 0 行。

### 2.3 表整合性（AC マトリクス）

```bash
grep -cE '^\| AC-(1[0-4]|[1-9]) ' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-07/main.md
```

期待: 14 以上（AC-1〜AC-14）。

### 2.4 line budget

```bash
wc -l docs/30-workflows/coverage-80-enforcement/phase-*.md \
      docs/30-workflows/coverage-80-enforcement/outputs/phase-*/main.md \
      docs/30-workflows/coverage-80-enforcement/index.md
```

| 対象 | 期待範囲 |
| --- | --- |
| phase-NN.md | 100〜500 行 |
| index.md | 250 行以内（既存 167 行 → PASS 余裕） |
| outputs/phase-NN/main.md | 50〜400 行 |

## 3. artifacts.json 整合性検証

| 軸 | コマンド | 期待 |
| --- | --- | --- |
| Phase 数 | `jq '.phases | length' artifacts.json` | 13 |
| status 分布（spec_created 段階） | `jq '[.phases[] | select(.status=="completed")] | length'` | 3（Phase 1〜3） |
| outputs path 存在 | `jq -r '.phases[].outputs[]?'` × `test -f` | 全件存在 |
| validate-phase-output.js | `node ... --workflow .../coverage-80-enforcement` | exit 0 |

## 4. exclude 5 分類レビュー結果

| 分類 | 許容理由 | 再評価タイミング | 過剰除外検出方法 | 現状判定 |
| --- | --- | --- | --- | --- |
| [1] Edge runtime / OpenNext | v8 provider 計測不可（R-1） | Phase 11 baseline / E2E 導入時 | `apps/web` 全 LoC のうち除外比率 30% 超で警告 | spec_created（baseline 待ち） |
| [2] 型定義のみ | 実行コード非含 | 型生成ツール変更時 | `**/types.ts` 等の名前付き型ファイル混入確認 | OK |
| [3] 自動生成 | ビルド成果物 | OpenNext / Next 更新時 | `git ls-files` と突合 | OK |
| [4] テスト自身 | テストコードはカバレッジ対象外 | 拡張子規則変更時 | `*.spec.*` / `__tests__/**` 漏れ grep | OK |
| [5] 設定ファイル | 設定値の集合 | config に動的ロジック導入時 | config 内 `if` / `function` の有無 | OK |

### 過剰除外警告条件（再掲）

1. 単一 package で `exclude` が `include` を 30% 超で上回る → unassigned-task で再評価。
2. `**/*.ts` 等の全部 wildcard 混入 → 即時 blocker。
3. `apps/api` business logic ファイルが exclude に入る → 即時除外。

## 5. 対象外項目

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積 | 対象外 | Cloudflare resource 非消費。GitHub Actions + Vitest のみ |
| secret hygiene | 対象外 | 既存 `CODECOV_TOKEN` 流用、新規 secret 0 |
| a11y | 対象外 | UI なし。vitest config / package.json のみ変更 |

## 6. QA 13 項目チェックリスト結果

| # | 観点 | 判定 | 結果 |
| --- | --- | --- | --- |
| 1 | Phase ゲート充足（13 件） | PASS | quality-gates.md 全項目記述 |
| 2 | リンク切れ | 実走可 | spec_created 段階で grep 実行可能 |
| 3 | コードブロック開閉対 | 実走可 | 同上 |
| 4 | 表整合性（AC 14 行） | 実走可 | Phase 7 完了済み |
| 5 | line budget | 実走可 | wc 実行で確認 |
| 6 | artifacts.json Phase 数 | 実走可 | jq で 13 確認 |
| 7 | artifacts.json status 分布 | 実走可 | Phase 1〜3 = completed |
| 8 | validate-phase-output.js | 実走可 | exit 0 期待 |
| 9 | exclude 5 分類整理 | 実走可 | Phase 8 outputs にコメント記述 |
| 10 | 過剰除外警告 | spec_created | Phase 11 baseline 後に判定 |
| 11 | 無料枠 | 対象外 | resource 消費なし |
| 12 | secret hygiene | 対象外 | 新規 secret 0 |
| 13 | a11y | 対象外 | UI なし |

## 7. 結論

- 13 Phase 全件にゲート判定。
- linting 4 観点の検証コマンドを SSOT 化。
- artifacts.json 整合性検証を 4 軸で機械化可能。
- exclude 5 分類のレビュー観点 + 過剰除外警告条件 3 件確定。
- 対象外 3 項目を理由付きで明記。
- QA 13 項目のうち 9 項目が実走可、3 項目が対象外、1 項目が Phase 11 baseline 待ち。

## 次 Phase

Phase 10 (最終レビュー) で本 QA 結果を AC PASS / 4 条件 / blocker と統合し GO/NO-GO 判定。
