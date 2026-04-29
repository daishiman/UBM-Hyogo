# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 8 で SSOT 化した「ヘルパー関数 5 件 / vitest exclude 5 分類 / CI 単一 job / ドキュメント責務 5 場所 / 閾値 SSOT / runbook template」を前提に、本タスク固有の品質保証チェックを行う。具体的には (1) 仕様書自体の **linting**（リンク切れ / コードブロック構文 / 表整合性 / line budget）、(2) `quality-gates.md` の Phase 完了ゲートチェックリスト適用、(3) `artifacts.json` と `phase-NN.md` の **整合性検証**、(4) **カバレッジ免除リスト（vitest exclude）のレビュー観点**、を観点固定で実施する。本ワークフローは spec_created に閉じるため、無料枠見積・secret hygiene・a11y は対象外（Cloudflare resource 非消費 / 新規 secret 0 / UI 非導入）と明記する。検証コマンド SSOT は本仕様書 §検証コマンドに集約。

## 実行タスク

1. `quality-gates.md` の Phase 完了ゲートチェックリストを本タスクに適用し、Phase 1〜13 各ゲート通過状況を整理する（完了条件: 13 Phase 全件にゲート判定）。
2. 仕様書自体の linting 手順を確定する（完了条件: リンク切れ / コードブロック構文 / 表整合性 / line budget の 4 観点で grep / wc / md linter コマンドが SSOT 化）。
3. `artifacts.json` と `phase-NN.md` の整合性検証手順を確定する（完了条件: status / outputs path / phase 数 / 完了率の 4 軸で機械検証コマンドが記述）。
4. カバレッジ免除リスト（vitest `coverage.exclude`）のレビュー観点を 5 件以上記述する（完了条件: 5 分類各々で「許容理由」「再評価タイミング」「過剰除外検出方法」が記述）。
5. 対象外 3 項目（無料枠 / secret hygiene / a11y）を明記する。
6. `validate-phase-output.js` 期待値を記述する（spec_created では NOT EXECUTED 許容）。
7. `outputs/phase-09/main.md` に QA チェックリスト結果を集約する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-08.md | DRY 化済み SSOT |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-08/main.md | SSOT 集約先 |
| 必須 | docs/30-workflows/coverage-80-enforcement/index.md | AC-1〜AC-14 / Phase 一覧 |
| 必須 | docs/30-workflows/coverage-80-enforcement/artifacts.json | path / status 整合の起点 |
| 必須 | .claude/skills/task-specification-creator/references/quality-gates.md | Phase 完了ゲート |
| 必須 | .claude/skills/task-specification-creator/references/quality-standards.md | line budget / 表記基準 |
| 必須 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビューゲート基準 |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-09.md | QA phase 構造参照 |

## QA 観点 1: `quality-gates.md` 適用（Phase 1〜13）

| Phase | 主ゲート | spec_created 視点判定 |
| --- | --- | --- |
| 1 要件定義 | 4 条件評価 PASS / AC 一覧化 | PASS |
| 2 設計 | 設計の 4 条件 / トポロジ / 苦戦想定 | PASS |
| 3 設計レビュー | 代替案比較 / NO-GO 条件 / 4 条件再評価 | PASS |
| 4 テスト戦略 | T 一覧（happy） / カバレッジ目標 | spec_created |
| 5 実装ランブック | コマンド SSOT / ファイル変更計画 | spec_created |
| 6 異常系 | T（fail） / 復旧手順 | spec_created |
| 7 AC マトリクス | 14 AC × Phase × T × 成果物 全件被覆 | spec_created |
| 8 DRY 化 | Before/After 5 区分 / 重複抽出 5+ / SSOT 集約 | spec_created |
| 9 品質保証 | 本 Phase 自身（13 項目チェック） | spec_created |
| 10 最終レビュー | AC PASS / blocker / GO/NO-GO | spec_created |
| 11 smoke | baseline / coverage-guard 実走 / 切替リハ | spec_created |
| 12 docs 更新 | 正本同期 / changelog / unassigned | spec_created |
| 13 PR | PR① / PR② / PR③ runbook + user_approval | spec_created |

## QA 観点 2: 仕様書自体の linting

### 2.1 リンク切れ

```bash
# 相対参照の検出
grep -rnE '\]\(\.\./|\]\(\./|\]\(outputs/|\]\(\.claude/' \
  docs/30-workflows/coverage-80-enforcement/

# 各リンク先の存在確認（手動 or md-link-checker）
# 期待: リンク切れ 0
```

### 2.2 コードブロック構文

```bash
# 開閉対の数チェック（``` の出現回数が偶数）
for f in docs/30-workflows/coverage-80-enforcement/phase-*.md \
         docs/30-workflows/coverage-80-enforcement/outputs/phase-*/main.md; do
  count=$(grep -c '^```' "$f")
  [ $((count % 2)) -eq 0 ] || echo "ODD: $f ($count)"
done
# 期待: ODD 出力なし
```

### 2.3 表整合性

```bash
# 表ヘッダ行と区切り行の列数一致チェック（簡易）
# AC マトリクス（Phase 7）の AC-1〜14 行数確認
grep -cE '^\| AC-(1[0-4]|[1-9]) ' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-07/main.md
# 期待: 14 以上
```

### 2.4 line budget

| 対象 | 期待範囲 |
| --- | --- |
| `phase-NN.md` | 100〜500 行 |
| `index.md` | 250 行以内 |
| `outputs/phase-NN/main.md` | 50〜400 行 |

```bash
wc -l docs/30-workflows/coverage-80-enforcement/phase-*.md \
      docs/30-workflows/coverage-80-enforcement/outputs/phase-*/main.md \
      docs/30-workflows/coverage-80-enforcement/index.md
```

## QA 観点 3: `artifacts.json` ↔ `phase-NN.md` 整合性

| 軸 | 検証内容 | コマンド |
| --- | --- | --- |
| Phase 数 | `phases[]` 件数 = 13 | `jq '.phases | length' artifacts.json` → 13 |
| status | Phase 1〜3 = completed / 4〜13 = pending（実行前）または spec_created（仕様確定後） | `jq '.phases[] | {n,status}'` |
| outputs path | 各 Phase の `outputs[]` × 実 path 存在 | `jq -r '.phases[].outputs[]?'` × `test -f` |
| 完了率 | spec_created 段階では Phase 1〜3 = 100% / 4〜13 = 0% 実走 | 集計 |
| `validate-phase-output.js` | exit 0 | node 実行 |

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/coverage-80-enforcement
```

## QA 観点 4: カバレッジ免除リスト（vitest exclude）レビュー

| 分類 | glob 例 | 許容理由 | 再評価タイミング | 過剰除外検出方法 |
| --- | --- | --- | --- | --- |
| [1] Edge runtime / OpenNext 不可領域 | `apps/web/app/**/route.ts` / `middleware.ts` | v8 provider が Edge runtime で計測不可（R-1） | Phase 11 baseline / E2E 導入時 | `apps/web` 全 LoC のうち除外比率を Phase 11 で算出、30% 超なら見直し |
| [2] 型定義のみ | `**/*.d.ts` | 実行可能コードを含まない | 型生成ツール変更時 | `**/types.ts` 等の名前付き型ファイルが exclude されていないか grep |
| [3] 自動生成 | `**/.next/**` / `**/dist/**` / `**/.open-next/**` | ビルド成果物、ソースは別所管理 | OpenNext / Next バージョン更新時 | `git ls-files` と突合し、追跡対象が含まれないことを確認 |
| [4] テスト自身 | `**/*.test.{ts,tsx}` 等 | テストコードはカバレッジ対象外（一般的慣行） | テストファイル拡張子規則変更時 | `*.spec.*` / `__tests__/**` 等の漏れを定期 grep |
| [5] 設定ファイル | `**/*.config.*` / `vitest.config.*` | 設定値の集合、ロジックを含まない | config に動的ロジックが入ったとき | config 内の `if` / `function` の有無を grep |

### 4.1 過剰除外の警告条件

- 単一 package で `exclude` が `include` を 30% 超で上回る → 過剰除外、Phase 12 unassigned-task で再評価。
- `**/*.ts` のような全部 wildcard が混入 → 即時 blocker。
- `apps/api`（Workers + Hono）の business logic ファイルが exclude に入る → ロジック層は強制対象、即時除外。

## QA 観点 5: 対象外項目

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 無料枠見積（Workers / D1 / Sheets） | 対象外 | 本タスクは Cloudflare resource を消費しない。GitHub Actions と Vitest のみ |
| secret hygiene | 対象外 | 既存 `CODECOV_TOKEN`（任意）流用、新規 secret 0 |
| a11y (WCAG 2.1) | 対象外 | UI なし。`apps/web` を直接触らない（vitest config / package.json のみ変更） |
| free-tier-estimation.md | 不要 | 上記 3 項目が対象外のため別ファイル化しない |

## 検証コマンド（SSOT）

```bash
# 1. Phase ゲート充足（quality-gates.md 参照）
ls docs/30-workflows/coverage-80-enforcement/phase-*.md | wc -l    # => 13

# 2. リンク切れ
grep -rnE '\]\(\.\./|\]\(\./|\]\(outputs/' \
  docs/30-workflows/coverage-80-enforcement/

# 3. コードブロック開閉対
for f in docs/30-workflows/coverage-80-enforcement/phase-*.md; do
  c=$(grep -c '^```' "$f"); [ $((c%2)) -eq 0 ] || echo "ODD: $f"
done

# 4. line budget
wc -l docs/30-workflows/coverage-80-enforcement/phase-*.md \
      docs/30-workflows/coverage-80-enforcement/outputs/phase-*/main.md

# 5. AC マトリクス完全性
grep -cE '^\| AC-(1[0-4]|[1-9]) ' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-07/main.md

# 6. artifacts.json 整合
jq '.phases | length' \
  docs/30-workflows/coverage-80-enforcement/artifacts.json    # => 13
jq '[.phases[] | select(.status=="completed")] | length' \
  docs/30-workflows/coverage-80-enforcement/artifacts.json    # 1〜3 段階で 3

# 7. validate-phase-output.js
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/coverage-80-enforcement

# 8. exclude 5 分類コメント存在
grep -nE '\[1\] Edge runtime|\[2\] 型定義|\[3\] 自動生成|\[4\] テスト自身|\[5\] 設定ファイル' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-08/main.md
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | Phase ゲート充足（13 Phase） | quality-gates.md 全項目記述 | spec_created |
| 2 | リンク切れ | 0 件 | 実走可 |
| 3 | コードブロック開閉対 | ODD 0 | 実走可 |
| 4 | 表整合性（AC 14 行） | 14 以上 | 実走可（Phase 7 完了後） |
| 5 | line budget | 範囲内 | 実走可 |
| 6 | artifacts.json Phase 数 | 13 | 実走可 |
| 7 | artifacts.json status 分布 | 1〜3 completed / 4〜13 pending | 実走可 |
| 8 | validate-phase-output.js | exit 0 | 実走可 |
| 9 | exclude 5 分類整理 | コメント全件存在 | 実走可（Phase 8 完了後） |
| 10 | 過剰除外警告 | 30% 超なし | Phase 11 baseline 後 |
| 11 | 無料枠 | 対象外 | resource 消費なし |
| 12 | secret hygiene | 対象外 | 新規 secret 0 |
| 13 | a11y | 対象外 | UI なし |

## 実行手順

1. quality-gates.md を 13 Phase に適用、ゲート判定一覧化。
2. linting 4 観点（リンク / 構文 / 表 / line budget）を SSOT 化。
3. artifacts.json 整合性検証コマンドを記述。
4. exclude 5 分類のレビュー観点（許容理由 / 再評価 / 過剰検出）を表化。
5. 対象外 3 項目を明記。
6. `validate-phase-output.js` 期待値を記述。
7. `outputs/phase-09/main.md` 集約。

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 10 | QA 13 項目を GO/NO-GO 根拠 |
| Phase 11 | exclude 過剰検出を baseline で実走 |
| Phase 12 | implementation-guide.md に検証コマンドを転記 |
| Phase 13 | PR description に QA サマリー転記 |

## 多角的チェック観点

- 価値性: 仕様書 linting + artifacts 整合 + exclude レビューで Phase 10 GO 前に drift / 過剰除外 / リンク切れを検知可能。
- 実現性: grep / wc / jq / Node + validate-phase-output.js のみ、新規依存なし。
- 整合性: 不変条件 #5 違反なし / Phase 8 SSOT を維持 / aiworkflow-requirements 正本との 1 方向引用維持。
- 運用性: 検証コマンド SSOT で再現可能。
- 認可境界: 新規 secret 0、対象外明記。
- 無料枠: resource 消費なし、対象外明記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | quality-gates.md 13 Phase 適用 | 9 | spec_created |
| 2 | 仕様書 linting 4 観点 | 9 | spec_created |
| 3 | artifacts.json 整合性検証 | 9 | spec_created |
| 4 | exclude 5 分類レビュー観点 | 9 | spec_created |
| 5 | 対象外 3 項目明記 | 9 | spec_created |
| 6 | validate-phase-output.js 期待値 | 9 | spec_created |
| 7 | outputs/phase-09/main.md 集約 | 9 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェックリスト 13 項目の結果集約 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] quality-gates.md ゲート判定が 13 Phase 全件で記述
- [ ] linting 4 観点（リンク / 構文 / 表 / line budget）の検証コマンドが記述
- [ ] artifacts.json 整合性検証が 4 軸（Phase 数 / status / outputs path / validate-phase-output.js）で記述
- [ ] exclude 5 分類すべてに「許容理由 / 再評価タイミング / 過剰除外検出方法」が記述
- [ ] 対象外 3 項目（無料枠 / secret / a11y）が理由付きで明記
- [ ] validate-phase-output.js の期待値（exit 0）が記述
- [ ] 過剰除外警告条件（30% 超 / `**/*.ts` 混入 / `apps/api` business logic）が 3 件以上明記
- [ ] outputs/phase-09/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 対象外 3 項目明記
- 検証コマンド SSOT が 1 箇所集約
- artifacts.json の `phases[8].status` が `pending`

## 苦戦防止メモ

- 仕様書 linting は github-flavored markdown 拡張表記（パイプ表 / fenced code）を許容する linter を選ぶ（markdownlint-cli2 / remark）。Phase 5 で実装する場合も 1 ツールに固定。
- exclude 過剰検出は「全 LoC のうち除外比率」で判定するため、`v8` provider の `untestedCoverageReport` 等を Phase 11 で活用する。
- artifacts.json の `status` は `completed` / `pending` の 2 値のみ index.md と一致させる。`spec_created` は phase-NN.md 本文表記であり、artifacts.json では `pending` 扱いに統一する旨を Phase 12 で reaffirm。
- spec_created 段階では実走系（リンク切れ / line budget / artifacts 整合）は実走可、Phase 11 baseline 系（exclude 過剰検出）は SKIP 表記で許容。
- Phase 12 unassigned-task に「過剰除外の定期再評価（四半期 or リリース前）」を formalize する。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 13 項目の判定結果（spec_created プレースホルダ）
  - quality-gates.md 13 Phase ゲート適用結果
  - linting 4 観点の検証コマンド SSOT
  - exclude 5 分類レビュー観点
  - 対象外 3 項目（無料枠 / secret / a11y）
- ブロック条件:
  - quality-gates.md ゲート判定が 13 Phase 未満
  - linting 4 観点のいずれか欠落
  - artifacts.json 整合性検証 4 軸のいずれか欠落
  - exclude 5 分類のいずれかでレビュー観点欠落
  - 対象外 3 項目のいずれか未明記
