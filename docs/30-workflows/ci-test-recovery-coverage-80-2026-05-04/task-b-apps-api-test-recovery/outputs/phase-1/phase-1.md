# Phase 1: 要件定義（baseline log 取得・13 件分類・先行タスク差分確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 要件定義 |
| status | spec_created |
| 入力 | 親 wave Phase 1 inventory / `apps/api/package.json` / 先行タスク `ut-api-cov-precondition-01-test-failure-recovery` |
| 出力 | `outputs/phase-1/main.md` / `outputs/phase-1/api-test-baseline.log` |

## 目的

`apps/api` の vitest run で発生している 13 件 failure を **個別に特定** し、各 failure を「実装 bug / test stale / setup drift / mock contract drift」のいずれかに分類する。先行タスクの修復内容と現状との差分を確定し、Phase 2 の修復方針設計に必要な情報を揃える。

## P50 チェック（前提確認）

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（regression 再発のため未修復） | 通常の実装 Phase（Phase 5 で RED → GREEN） |
| upstream（main）にマージ済み | No（main で 25297513424 失敗中） | 未マージとして扱う |
| 前提タスク（依存タスク）が完了済み | N/A（依存なし） | wave-1 並列実行 |
| 先行タスク `ut-api-cov-precondition-01-test-failure-recovery` の修復が main に反映されているか | **未確認 → Phase 1 で確定必須** | Step 0-2 で `git log` 比較 |

## 実行タスク

### Step 0-1: baseline log 取得（最優先・他 step ブロッカー）

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/<このワークツリー>
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-apps-api-test-recovery/outputs/phase-1/api-test-baseline.log
```

- exit code、Test Files / Tests のサマリー行、各 failure の test path・assertion・stack trace を `api-test-baseline.log` に確実に保存する
- 13 件と一致するかを検証。13 件 ≠ 実測の場合は実測値を採用し `main.md` に乖離理由を記録する

### Step 0-2: 先行タスク差分確認

`docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/outputs/phase-06/main.md`（root cause 整理）と `outputs/phase-11/coverage-result.md` を読み、先行タスクが修復対象とした 13 件と現状の 13 件を突き合わせる。

| 確認軸 | 期待 |
| --- | --- |
| 先行タスクの 13 件 test path | 一覧化 |
| 現状の 13 件 test path | 一覧化 |
| 重複 / 完全一致 / 部分一致 / 全く別系統 | 4 区分で分類 |
| 重複が多い場合 | 「先行修復が main 未反映」仮説を採用し、`git log --oneline main -- apps/api` で関連 commit が main に存在するか確認 |
| 重複が少ない場合 | 「別経路の regression」仮説を採用し新規 root cause 調査 |

### Step 1: 13 件個別分類

各 failure に対し以下の表を `outputs/phase-1/main.md` に作成する。

| # | test file | test name | 失敗種別 | root cause 仮説 | 想定修復対象 | 修復難度 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | （baseline log から） | | impl bug / test stale / setup drift / mock drift | | impl ファイルパス or test ファイルパス | 低/中/高 |

「失敗種別」の定義:

- **impl bug**: 実装の defect。test 期待値が正しい。実装側を直す。
- **test stale**: 実装変更に test が追従していない。test 側を最小修正。
- **setup drift**: D1 binding mock / Miniflare setup / env injection の不整合。`test/setup.ts` 等を直す。
- **mock contract drift**: mock 戻り値が実 schema と乖離。mock factory を直す。

### Step 2: 影響範囲確定

| 確認項目 | コマンド |
| --- | --- |
| apps/api test file 件数 | `find apps/api/src -name "*.test.ts" \| wc -l` |
| 既存 PASS test 件数 | baseline log の `Tests` 行から抽出 |
| 修復対象 test file 数 | Step 1 表から集計（重複排除） |
| 修復対象 impl file 数 | Step 1 表から集計（重複排除） |

### Step 3: 既存命名規則・パターン分析

| 確認項目 | 内容 |
| --- | --- |
| test file 命名 | `*.test.ts` / `__tests__/*.test.ts` の混在ルール |
| D1 binding mock パターン | `apps/api/test/setup.ts` / vitest config の miniflare 設定 |
| auth/session test 慣例 | `apps/api/src/routes/me/index.test.ts` 等の Authorization header 注入パターン |
| hookTimeout 設定 | 30000ms 等の test 個別設定 |

### Step 4: タスク分類記録

- タスク種別: **NON_VISUAL（test 修復）**
- targeted run 必須リスト: 13 件 failure test file（メモリ・時間制約のため全件 `pnpm test` ではなく targeted run を Phase 5 で使う）
- 全件 `pnpm test` SIGKILL リスク: 中（test file 104 件、Miniflare instantiation コスト）
- carry-over: 先行タスク `ut-api-cov-precondition-01-test-failure-recovery` の修復差分の評価結果を `main.md` に転記

## 完了条件

- [ ] `outputs/phase-1/api-test-baseline.log` が存在し 13 件（または実測値）の failure 詳細が記録されている
- [ ] `outputs/phase-1/main.md` に Step 1 の 13 件分類表（種別ラベル付き）が完成している
- [ ] 先行タスク差分の 4 区分結論（重複多 / 少 / 一致 / 無）が記録されている
- [ ] 影響範囲（修復対象 test file 数 / impl file 数 / 既存 PASS 件数）が確定している
- [ ] タスク分類 = NON_VISUAL が確定し、targeted run リストが Phase 5 用に列挙されている

## 多角的レビュー観点

- システム系: Miniflare の D1 binding は per-test 生成か共有か。共有時は test 間 state leak を疑う
- 戦略系: 先行タスク修復が main 未反映なら本タスクの効率は cherry-pick / re-apply が最適。新規 regression なら根本原因（特定 PR）を `git bisect` で探す
- 問題解決系: 修復難度「高」が複数あれば Phase 2 で分割、「低」のみなら 1 wave で完遂可能
