# Phase 8: リファクタリング (DRY 化)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング (DRY 化) |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 5 実装ランブック（vitest config / coverage-guard.sh / package script / CI / lefthook）と Phase 11 手動 smoke、Phase 13 PR① / PR② / PR③ runbook の間で重複しがちな「閾値定数」「集計 jq クエリ」「exclude リスト」「runbook 4 ステップ（dry-run / soft / 添加 / hard）」「ドキュメント正本参照」を、単一情報源（SSOT）に集約するリファクタ手順を仕様書として確定し、Phase 9 品質保証へ「同概念のロジックが複数箇所に並ぶ」状態を持ち越さない。本ワークフローは仕様書整備に閉じる（実コード未実装）ため、本 Phase は Phase 5 着手後に参照される refactor 指針として記述する。

## 実行タスク

1. `coverage-guard.sh` のヘルパー関数化候補を Before/After で提示する（完了条件: `aggregate_coverage` / `compute_top10_uncovered` / `emit_test_template_paths` / `compare_threshold` / `format_stderr_report` の 5 関数以上が分離され、`main()` がそれらを合成する設計が記述）。
2. `vitest.config.ts` の `coverage.exclude` リストを DRY 整理する（完了条件: 「Edge runtime 不可領域」「型定義のみ」「自動生成」「テスト自身」「設定ファイル」の 5 分類コメントで分類され、各分類内の glob が重複なし）。
3. CI workflow の matrix 化検討（package 別 job vs 単一 job）を比較表として記述する（完了条件: 単一 job / matrix の 2 案 Before/After + 採用案決定根拠）。
4. ドキュメント参照の重複排除（aiworkflow-requirements / task-specification-creator / index.md / phase-NN.md の責務分離）を SSOT 表として固定する（完了条件: 4 場所の責務が 1 表で分離され、Phase 12 正本同期手順がそれに準拠）。
5. 閾値定数 `80` の SSOT 化（vitest.config.ts / coverage-guard.sh / CI / lefthook / docs の 5 箇所で重複しないよう環境変数化または config 単一参照を確定）。
6. runbook 4 ステップ（dry-run / soft gate 検証 / hard gate 切替 / rollback）を `coverage-runbook.template.md` として SSOT 化（Phase 11 / 13 から参照のみ）。
7. `outputs/phase-08/main.md` に Before/After / 重複コード抽出 / SSOT 集約箇所を集約する（spec_created プレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-02.md | base case（coverage-guard.sh I/O / vitest config / CI / lefthook） |
| 必須 | docs/30-workflows/coverage-80-enforcement/outputs/phase-02/main.md | adapter / 設計詳細 |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-05.md | 実装ランブック — spec_created |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-07.md | AC マトリクス |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-08.md | DRY 化 phase の構造参照 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md`。本仕様書には観点と代表例のみ記載。

### `coverage-guard.sh` のヘルパー関数化

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| coverage 集計 | inline jq で `pnpm -r test:coverage` 出力を直接処理 | `aggregate_coverage(packages_dir)` 関数に分離 | SRP / unit test 容易化 |
| 不足ファイル top10 抽出 | jq + sort + head 1 行 | `compute_top10_uncovered(summary_json)` 関数 | AC-3 stderr 出力の SSOT |
| テスト雛形パス生成 | echo で散在 | `emit_test_template_paths(uncovered_files)` 関数 | `{src}/{file}.test.ts` 規則を 1 箇所化 |
| 閾値比較 | inline awk / bc | `compare_threshold(actual, threshold=80)` 関数 | 80% を引数化 |
| stderr フォーマット | printf 散在 | `format_stderr_report(top10, templates)` 関数 | 出力フォーマットの SSOT |
| エントリポイント | 200 行のスクリプト本体 | `main()` が 5 関数を合成、20 行以内 | 可読性 / テスト容易化 |

### vitest `coverage.exclude` の分類整理

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| exclude glob | フラットリストで混在 | 5 分類コメントで構造化 | 棚卸し容易化 |
| 重複 glob | `**/*.d.ts` と `**/types.d.ts` が併存 | 1 つに統一 | DRY |
| Edge runtime 不可領域 | 個別ファイル名で列挙 | `apps/web/app/**/route.ts` 等 glob で集約 | R-1 対応（Phase 3） |

#### 5 分類コメント例（spec のみ）

```ts
coverage: {
  exclude: [
    // [1] Edge runtime / OpenNext 不可領域（Phase 3 R-1）
    "apps/web/app/**/route.ts",
    "apps/web/middleware.ts",
    // [2] 型定義のみ
    "**/*.d.ts",
    // [3] 自動生成
    "**/.next/**",
    "**/dist/**",
    // [4] テスト自身
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    // [5] 設定ファイル
    "**/*.config.{ts,js,mjs}",
  ],
}
```

### CI workflow の matrix 化検討

| 観点 | 単一 job（採用候補 A） | matrix per package（採用候補 B） |
| --- | --- | --- |
| 実行時間 | 直列で長くなる | 並列で短い |
| coverage 集計 | `pnpm -r test:coverage` で 1 回集約しやすい | job 間で artifact 共有が必要 |
| 失敗ローカライズ | どの package が落ちたか log で判別 | job 名で即判別 |
| 実装コスト | 既存 CI に 1 job 追加で済む | matrix 設定 + artifact upload/download |
| 運用負荷 | 低 | 中（matrix 変更時に CI 修正） |
| 採用 | **A（単一 job）を PR① / PR③ で採用** | 将来 Turborepo / Nx 導入時に再評価（Phase 12 unassigned 候補） |

### ドキュメント参照の責務分離

| 場所 | 責務 | 参照される側 / する側 |
| --- | --- | --- |
| `aiworkflow-requirements/quality-requirements-advanced.md` | 全 package 一律 80% の **正本（canonical）** | 他全 4 場所が参照 |
| `task-specification-creator/coverage-standards.md` | Phase 6 / 7 検証テンプレ + `coverage-guard.sh` 参照 | 上記正本を引用 |
| `docs/30-workflows/coverage-80-enforcement/index.md` | 本タスクの AC / Phase 一覧 | 正本を §不変条件 で引用 |
| `docs/30-workflows/coverage-80-enforcement/phase-NN.md` | Phase 単位の実行手順 | index.md / 正本を必要に応じ引用 |
| `coverage-runbook.template.md`（新設） | Phase 11 / 13 共通の 4 ステップ手順 | Phase 11 / 13 が参照のみ |

### 用語・命名

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 閾値表記 | 「80%」「threshold 80」「coverage 80%」混在 | 「全 package 一律 80%（4 metric）」で統一 | 表記ドリフト 0 |
| gate 表記 | 「soft」「warning」「continue-on-error」混在 | 「PR① soft gate」「PR③ hard gate」で統一 | 3 段階 PR 段取りと整合 |
| script 表記 | 「test」「test:coverage」混在 | 「`test`（vitest）」「`test:coverage`（vitest --coverage）」で統一 | AC-4 と整合 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他 Phase 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 閾値定数 `80` | env 変数 `COVERAGE_THRESHOLD` または `coverage.thresholds` SSOT | 可 | vitest / guard.sh / CI / lefthook / docs |
| 2 | jq 集計クエリ（`coverage-summary.json` → metric 抽出） | `aggregate_coverage()` 関数 | 可 | guard.sh / CI artifact 検証 |
| 3 | テスト雛形パス規則（`{src}/{file}.test.ts`） | `emit_test_template_paths()` 関数 | 可 | guard.sh stderr / Phase 12 docs |
| 4 | exclude glob（型定義 / 自動生成 / テスト自身） | vitest.config.ts の 5 分類セクション | 可 | 全 package 共通 |
| 5 | `pnpm -F <pkg> test:coverage` 呼び出し | `pnpm -r test:coverage` に集約 | 可 | CI / pre-push / local |
| 6 | runbook 4 ステップ（dry-run / soft / 添加 / hard） | `coverage-runbook.template.md` | 可 | Phase 11 / 13 共通 |
| 7 | ドキュメント参照リンク | 正本 → 派生 1 方向のみ | 可 | aiworkflow / task-spec-creator / index / phase |

## navigation drift 確認

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × phase-NN.md の成果物 path | 目視 + grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` × 実 phase-NN.md ファイル名 | `ls phase-*.md` と突合 | 13 件一致 |
| Phase 13 出力 path（pr{1,2,3}-runbook.md） | artifacts.json と本仕様書の整合 | 3 ファイル一致 |
| 閾値定数表記 | `grep -rE '\b80\s*%' docs/30-workflows/coverage-80-enforcement/` | 「80%」表記が「全 package 一律 80%」文脈に閉じている |
| `coverage-runbook.template.md` 参照網 | Phase 11 / 13 の grep | リンク切れ 0 |

## 共通化パターン

- `coverage-guard.sh` エントリ: `main()` が `aggregate_coverage` / `compute_top10_uncovered` / `emit_test_template_paths` / `compare_threshold` / `format_stderr_report` を合成する 1 関数集約。
- 閾値 SSOT: `vitest.config.ts` の `coverage.thresholds` を **第一正本**、guard.sh は env でオーバーライドのみ可（CI で `COVERAGE_THRESHOLD=80` を渡す or 既定値 80）。
- exclude SSOT: `vitest.config.ts` の `coverage.exclude` を 5 分類コメントで構造化し、各 package vitest config から spread。
- runbook 4 ステップ固定順序: 「dry-run（baseline）→ PR① soft → PR② テスト追加 → PR③ hard」。
- 用語: 「全 package 一律 80%」「PR① soft gate」「PR③ hard gate」「coverage-guard.sh」を全 Phase で固定。

## 削除対象一覧

- `coverage-guard.sh` 内に 80 を直書きする箇所（env または引数化に置換）。
- vitest.config.ts の重複 glob（`**/*.d.ts` の 2 重出現等）。
- Phase 11 / 13 runbook で重複していた 4 ステップ個別記述（template 参照に置換）。
- aiworkflow-requirements 以外で「85%/65%」記述が残存している場合（Phase 12 で正本同期）。

## 実行手順

### ステップ 1: ヘルパー関数 5 件の Before/After 提示
- `coverage-guard.sh` の 5 関数 + `main()` 合成設計を `outputs/phase-08/main.md` に固定。

### ステップ 2: vitest exclude 5 分類整理
- 5 分類コメントテンプレを確定し、Phase 5 実装で適用させる。

### ステップ 3: CI matrix 化検討表
- 単一 job（採用）/ matrix（将来）の 2 案 + 採用根拠を記述。

### ステップ 4: ドキュメント参照責務分離
- 4 場所 + template の 5 場所責務表を SSOT 化、Phase 12 正本同期手順がそれに準拠。

### ステップ 5: 閾値 SSOT 化
- vitest config 第一正本 + env オーバーライドの設計を確定。

### ステップ 6: `coverage-runbook.template.md` 設計
- 4 ステップを 1 テンプレに統合、Phase 11 / 13 が参照する形にする。

### ステップ 7: outputs/phase-08/main.md 集約
- spec_created プレースホルダ含めて作成。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | line budget / link 整合 / SSOT 集約完了を QA 入力に渡す |
| Phase 10 | navigation drift 0 / SSOT 集約を GO/NO-GO 根拠 |
| Phase 11 | `coverage-runbook.template.md` を smoke リハーサルで実走 |
| Phase 12 | `system-spec-update-summary.md` にドキュメント責務分離表を反映 |
| Phase 13 | PR① / PR② / PR③ runbook が template 参照のみで成立することを user_approval ゲートで確認 |

## 多角的チェック観点

- 価値性: ヘルパー関数化で AC-2 / AC-3 のテスト容易性が向上、runbook テンプレ化で Phase 11 / 13 のドリフト排除。
- 実現性: bash 関数 / vitest config / GitHub Actions の既存技術範囲。新規依存なし。
- 整合性: 不変条件 #5（D1 触らない）違反なし / CLAUDE.md ブランチ戦略 SSOT と整合 / aiworkflow-requirements 正本との整合維持。
- 運用性: 閾値変更時の修正点が `vitest.config.ts` 1 箇所に集約。
- 責務境界: guard.sh は集計と stderr 出力に閉じ、CI は exit code を gate に使うのみ。
- 表記ドリフト: 閾値 / gate / script の 3 用語が固定。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `coverage-guard.sh` ヘルパー関数 5 件分解 | 8 | spec_created | main 合成 |
| 2 | vitest exclude 5 分類整理 | 8 | spec_created | コメント構造化 |
| 3 | CI matrix 化検討表 | 8 | spec_created | A 採用 / B 将来 |
| 4 | ドキュメント責務分離表 | 8 | spec_created | 5 場所 |
| 5 | 閾値 SSOT 化 | 8 | spec_created | vitest config 第一正本 |
| 6 | `coverage-runbook.template.md` 設計 | 8 | spec_created | 4 ステップ |
| 7 | outputs/phase-08/main.md 集約 | 8 | spec_created | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After / 重複コード抽出 / SSOT 集約方針 |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# ヘルパー関数 5 件の言及確認
grep -nE 'aggregate_coverage|compute_top10_uncovered|emit_test_template_paths|compare_threshold|format_stderr_report' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-08/main.md

# vitest exclude 5 分類コメント確認
grep -nE '\[1\] Edge runtime|\[2\] 型定義|\[3\] 自動生成|\[4\] テスト自身|\[5\] 設定ファイル' \
  docs/30-workflows/coverage-80-enforcement/outputs/phase-08/main.md

# 閾値 SSOT の表記確認（80% が「全 package 一律」文脈に閉じている）
grep -nE '全 package 一律 80%' \
  docs/30-workflows/coverage-80-enforcement/

# coverage-runbook.template.md 参照網
grep -rnE 'coverage-runbook\.template\.md' \
  docs/30-workflows/coverage-80-enforcement/ 2>/dev/null
```

## 完了条件

- [ ] Before/After テーブルが 5 区分（ヘルパー関数 / vitest exclude / CI matrix / ドキュメント責務 / 用語）すべて埋まっている
- [ ] 重複コード抽出が 5 件以上列挙（本仕様では 7 件）
- [ ] navigation drift（artifacts.json / index.md / phase-NN.md / outputs path）が 0
- [ ] `coverage-guard.sh` のヘルパー関数が 5 件以上分解
- [ ] vitest `coverage.exclude` が 5 分類コメントで整理
- [ ] CI matrix 化検討（A 採用 / B 将来）の比較表が記述
- [ ] ドキュメント参照責務分離が 5 場所で固定
- [ ] `coverage-runbook.template.md` が SSOT として確定し Phase 11 / 13 が参照する設計
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-08/main.md` 配置予定
- 用語ドリフト 0 / navigation drift 0
- ヘルパー関数 5 件以上 / exclude 5 分類 / 重複抽出 7 件
- artifacts.json の `phases[7].status` が `pending`

## 苦戦防止メモ

- bash 関数分解は subshell の exit code 伝播に注意。`set -euo pipefail` + `local` 変数 + 関数末尾 return を Phase 5 ランブックで明記する。
- `vitest.config.ts` の `coverage.exclude` が緩すぎると実質カバレッジが下がる（R-1）。Phase 11 baseline で再評価し、Edge runtime 不可領域以外を exclude しない方針を Phase 12 で reaffirm。
- CI matrix 化を「将来再評価」と明記しないと Turborepo 導入と混線する（Phase 3 案 E）。Phase 12 unassigned-task 候補に登録。
- 閾値 SSOT は `vitest.config.ts` を **第一正本** にする。env オーバーライドは CI 切替（80→0 等）に閉じ、ローカル開発で個別変更しない運用を Phase 12 docs に明記。
- runbook template は Phase 13 で本番版を派生させる（spec レベル template と本番 runbook を混同しない）。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 化済みヘルパー関数 5 件の分解図
  - exclude 5 分類コメント構造
  - CI 単一 job 採用 / matrix 将来再評価
  - ドキュメント責務分離 5 場所
  - 閾値 SSOT（vitest config 第一正本）
  - `coverage-runbook.template.md` 参照網
  - 用語統一（閾値 / gate / script）
- ブロック条件:
  - Before/After に空セルが残る
  - navigation drift が 0 にならない
  - ヘルパー関数分解が 5 件未満
  - exclude が 5 分類で整理されない
  - runbook template が SSOT 化されない
