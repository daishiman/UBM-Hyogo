# Phase 8 成果物: DRY 化 Before/After / 重複コード抽出 / SSOT 集約

## 状態

`spec_created` — 本ファイルは Phase 8 仕様書（`../../phase-08.md`）に基づく Before/After 詳細展開。実コード変更は伴わず、Phase 5 実装着手時に参照される refactor 指針として固定する。

## 1. `coverage-guard.sh` ヘルパー関数化（5 関数 + main 合成）

### 関数責務（SRP）

| 関数 | 入力 | 出力 | 責務 |
| --- | --- | --- | --- |
| `aggregate_coverage` | packages 配列 | `coverage-summary.json` の package 別集計 (stdout) | `pnpm -r test:coverage` 実行後の全 summary を集計 |
| `compute_top10_uncovered` | summary JSON | 不足ファイル top10（lines 未達順）(stdout) | jq + sort で top10 抽出 |
| `emit_test_template_paths` | uncovered files | `{src}/{file}.test.ts` パス一覧 (stdout) | テスト雛形パス規則を一元化 |
| `compare_threshold` | actual, threshold (default 80) | exit 0 / 1 | 閾値比較ロジックの SSOT |
| `format_stderr_report` | top10, templates | stderr 整形済みレポート | AC-3 出力フォーマット |
| `main` | argv | exit code | 上記 5 関数を合成 |

### main 合成（疑似コード）

```bash
main() {
  set -euo pipefail
  local threshold="${COVERAGE_THRESHOLD:-80}"
  pnpm -r test:coverage  # 各 package の coverage-summary.json を生成
  local summaries
  summaries=$(aggregate_coverage)
  if compare_threshold "$(echo "$summaries" | jq -r '.lines')" "$threshold"; then
    return 0
  fi
  local top10 templates
  top10=$(compute_top10_uncovered "$summaries")
  templates=$(emit_test_template_paths "$top10")
  format_stderr_report "$top10" "$templates" >&2
  return 1
}
```

### Before / After

| 観点 | Before | After |
| --- | --- | --- |
| 行数 | ~200 行のフラット script | `main()` 20 行以内 + 5 関数（各 30 行以内） |
| テスト | smoke のみ | bats / shellspec で関数単位ユニットテスト可 |
| 閾値変更 | 80 を直書き | `COVERAGE_THRESHOLD` env で上書き、既定 80 |
| stderr 出力 | printf 散在 | `format_stderr_report` 1 関数 |

## 2. `vitest.config.ts` `coverage.exclude` の 5 分類整理

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary", "html"],
  thresholds: {
    lines: 80, branches: 80, functions: 80, statements: 80,
  },
  exclude: [
    // [1] Edge runtime / OpenNext 不可領域（Phase 3 R-1）
    "apps/web/app/**/route.ts",
    "apps/web/middleware.ts",
    "apps/web/instrumentation.ts",
    // [2] 型定義のみ
    "**/*.d.ts",
    // [3] 自動生成
    "**/.next/**",
    "**/dist/**",
    "**/.open-next/**",
    "**/coverage/**",
    // [4] テスト自身
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/test/**",
    "**/tests/**",
    "**/__tests__/**",
    // [5] 設定ファイル
    "**/*.config.{ts,js,mjs,cjs}",
    "**/vitest.config.*",
    "**/wrangler.toml",
  ],
}
```

### Before / After

| Before | After |
| --- | --- |
| フラット 20+ glob、重複・漏れ多発 | 5 分類コメント、各分類内 DRY |
| `**/*.d.ts` と `**/types.d.ts` が併存 | `**/*.d.ts` 1 行に統一 |
| Edge runtime ファイルが個別列挙 | `apps/web/app/**/route.ts` 1 glob で集約 |

## 3. CI workflow の matrix 化検討表

| 観点 | 案 A: 単一 job（採用） | 案 B: matrix per package（将来） |
| --- | --- | --- |
| 実行時間 | 中（直列） | 短（並列） |
| coverage 集計 | `pnpm -r test:coverage` で一発 | matrix job 間で artifact 共有が必要 |
| 失敗ローカライズ | log で判別 | job 名で即判別 |
| 実装コスト | 既存 CI に 1 job 追加 | matrix + artifact upload/download |
| 運用負荷 | 低 | 中 |
| Turborepo / Nx 整合 | 低（フル実行） | 高（差分テスト連携） |
| 採用判定 | **PR① / PR③ で採用** | Phase 12 unassigned-task として将来再評価 |

### 採用根拠

- 現 monorepo は Turborepo 未導入（Phase 3 代替案 E）。matrix の運用コストを正当化できる規模ではない。
- `coverage-guard.sh` は単一 job 内で全 package を集計する設計（Phase 2）。
- 将来 Turborepo 導入時に matrix + cache + 差分テストへ移行する unassigned-task を Phase 12 で formalize。

## 4. ドキュメント参照の責務分離（5 場所）

| # | 場所 | 責務 | 引用方向 |
| --- | --- | --- | --- |
| 1 | `aiworkflow-requirements/references/quality-requirements-advanced.md` | 全 package 一律 80% **正本** | 他全 4 場所が引用 |
| 2 | `task-specification-creator/references/coverage-standards.md` | Phase 6 / 7 検証テンプレ + `coverage-guard.sh` 参照 | (1) を引用 |
| 3 | `docs/30-workflows/coverage-80-enforcement/index.md` | 本タスクの AC / Phase 一覧 | (1) を §不変条件 で引用 |
| 4 | `docs/30-workflows/coverage-80-enforcement/phase-NN.md` | Phase 単位の実行手順 | (1)(3) を必要に応じ引用 |
| 5 | `coverage-runbook.template.md`（新設） | Phase 11 / 13 共通の 4 ステップ | Phase 11 / 13 が参照 |

> **ルール**: 正本（1）の値（80%）を他 4 場所で **再記述しない**。引用形式（リンク + ID）のみ。Phase 12 で正本同期手順を確定。

## 5. 閾値 SSOT（80）

| 利用箇所 | アクセス方法 |
| --- | --- |
| `vitest.config.ts` | `coverage.thresholds.{lines,branches,functions,statements} = 80`（**第一正本**） |
| `coverage-guard.sh` | env `COVERAGE_THRESHOLD`（既定 80）または引数で上書き可、テスト時のみ |
| `.github/workflows/ci.yml` | `env: COVERAGE_THRESHOLD: 80`（明示）、guard.sh に渡す |
| `lefthook.yml` | guard.sh を呼び出すのみ。閾値直書きしない |
| ドキュメント | 「全 package 一律 80%（4 metric）」表記のみ、数値直書きは aiworkflow-requirements 正本に一本化 |

## 6. `coverage-runbook.template.md` 設計（4 ステップ）

```markdown
# coverage-runbook.template.md（spec only / 実本番版は Phase 13 で派生）

## ステップ 1: dry-run（baseline 計測）
- pnpm -r test:coverage を実行
- coverage-summary.json を artifact として upload
- 各 package の lines / branches / functions / statements を一覧化

## ステップ 2: PR① soft gate
- ci.yml の coverage-gate job を `continue-on-error: true` で追加
- coverage-guard.sh は exit 1 でも CI 全体は green

## ステップ 3: PR② テスト追加
- baseline で 80% 未達の package ごとにテスト追加 PR を発行
- 各 PR は単体で 80% 達成を確認

## ステップ 4: PR③ hard gate
- ci.yml の `continue-on-error: false` 化
- branch protection `required_status_checks.contexts` に coverage-gate job を登録
- UT-GOV-004 完了確認後に実行

### rollback 経路
- PR③ merge 後に CI 詰みが発生 → contexts から coverage-gate を一時削除（gh api PUT）
- soft gate へ戻す（continue-on-error: true 化 hotfix PR）
```

## 7. 重複コード抽出サマリー（再掲 + Before/After）

| # | 重複候補 | Before | After（抽出先） |
| --- | --- | --- | --- |
| 1 | 閾値 80 | 5 箇所直書き | vitest.config 第一正本 + env オーバーライド |
| 2 | jq 集計クエリ | guard.sh / CI で重複 | `aggregate_coverage()` 関数 |
| 3 | テスト雛形パス規則 | echo 散在 | `emit_test_template_paths()` 関数 |
| 4 | exclude glob | フラットリスト | 5 分類コメント |
| 5 | `pnpm -F <pkg> test:coverage` | 個別呼び出し | `pnpm -r test:coverage` 集約 |
| 6 | runbook 4 ステップ | Phase 11 / 13 で重複 | `coverage-runbook.template.md` |
| 7 | docs 参照リンク | 双方向引用 | 正本 → 派生 1 方向 |

## 8. navigation drift 確認結果

| チェック項目 | 期待 | 実績（spec_created） |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × phase-NN.md | 完全一致 | TBD（Phase 9 で機械検証） |
| index.md Phase 一覧 × `ls phase-*.md` | 13 件一致 | TBD |
| Phase 13 outputs（pr1/pr2/pr3-runbook.md） | 3 ファイル | TBD |
| 「80%」表記が「全 package 一律 80%」文脈に閉じる | TRUE | TBD |
| `coverage-runbook.template.md` 参照網 | リンク切れ 0 | TBD |

## 9. 用語統一表

| 用語 | 固定表記 |
| --- | --- |
| 閾値 | 「全 package 一律 80%（4 metric）」 |
| gate | 「PR① soft gate」「PR③ hard gate」 |
| script | 「`test`（vitest）」「`test:coverage`（vitest --coverage）」 |
| 4 metric | lines / branches / functions / statements |
| 不足ファイル | top10（lines 未達順） |

## 結論

- ヘルパー関数 5 件分解 + main 合成設計を確定。
- vitest exclude を 5 分類コメントで構造化。
- CI 単一 job 採用 / matrix 将来再評価を確定。
- ドキュメント責務 5 場所分離 + 1 方向引用ルール確定。
- 閾値 SSOT は `vitest.config.ts` 第一正本 + env オーバーライド。
- `coverage-runbook.template.md` を 4 ステップ + rollback で SSOT 化。
- 重複コード抽出 7 件すべてに抽出先割当。
- 用語ドリフト 0、navigation drift は Phase 9 で機械検証。

## 次 Phase

Phase 9 (品質保証) で本 SSOT を前提に payload 整合性 / link 整合 / line budget を検証。
