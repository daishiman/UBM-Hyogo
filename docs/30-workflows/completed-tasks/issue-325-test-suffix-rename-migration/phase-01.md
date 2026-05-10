# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #325（UT-08A-06: 既存 `*.test.ts` → suffix 規約 段階的 rename）の要件を確定する。08a で導入された suffix 規約（`*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` / `*.spec.ts`）を、`apps/api/src/**/*.test.ts` 計 132 ファイル全件に **後追い適用** するための前提条件・Gate・真の論点を切り分け、Phase 2 で凍結する fixed list の構造定義まで本 Phase で決定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation（refactor-rename-only） |
| visualEvidence | NON_VISUAL |
| state | implementation_completed |
| 関連 Issue | https://github.com/daishiman/UBM-Hyogo/issues/325 (CLOSED) |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 1-1 | 真の論点 3 つを切り分ける（diff 0 保証 / glob 漏れ検出 / 規約 ADR 確定タイミング） |
| 1-2 | 因果と境界を 1 PR スコープに固定する（132 rename + glob 同期 + ADR を同 PR） |
| 1-3 | 価値とコストの 4 条件評価を行う |
| 1-4 | 入力（132 ファイル / index.md / artifacts.json / 08a 規約導出元）と出力（fixed list 構造定義 = `old_path,new_path,suffix_class,justification`）を確定する |

## 真の論点

### 論点 1: diff 0 保証（rename と test 内容変更の絶対分離）

- **問い**: 132 ファイル rename PR に「ついでの修正」が混入し、後日問題発生時に rename と本質的変更の切り分けが困難になるリスクをどう排除するか
- **結論**:
  1. rename は **`git mv` のみ**で実施し、テキストエディタによる一切の変更を禁止する
  2. PR 内で rename commit と config 同期 commit と ADR commit を **3 commit** に分離し、責務を明示する
  3. CI で `git log --diff-filter=R --name-status HEAD~N..HEAD` を用いて rename commit が「pure rename」であること（`R100` のみで `M` を含まない）を assert する
  4. Phase 11 evidence に `git diff --stat <rename-commit-parent>..<rename-commit>` を記録し、追加・削除行が 0 であることを示す

### 論点 2: glob 漏れ検出（CI が静かに skip しない保証）

- **問い**: `*.test.ts` を `*.spec.ts` 系へ rename した結果、`vitest.config.ts` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml` のいずれかが古い glob のまま残り、当該 test が CI で実行されない（fail せずに silent skip する）状態をどう検出するか
- **結論**:
  1. rename **前** に `mise exec -- pnpm --filter @ubm-hyogo/api test --reporter=verbose` を実行し、`Test Files X | Tests Y passed` を `outputs/phase-11/test-count-before.txt` に snapshot
  2. rename **後** に同コマンドを実行し `outputs/phase-11/test-count-after.txt` に snapshot
  3. before / after の `Tests Y` 値が完全一致することを CI assert（差分 1 でも fail）
  4. 補助として `find apps/api/src \( -name '*.test.ts' -o -name '*.spec.ts' \) | wc -l` が rename 前後ともに 132 であること、rename 後 `*.test.ts` 残存が 0 であることを assert
  5. `rg -n "test\.ts|spec\.ts" vitest.config.ts apps/api/package.json package.json lefthook.yml .github/workflows/` で glob 残存箇所を全列挙し、`outputs/phase-11/glob-coverage-grep.log` に保存

### 論点 3: 規約 ADR の確定タイミング

- **問い**: 後続 task が新規 test を `.test.ts` で書き続けると規約は破綻する。ADR を別 PR で後追いするか、本 PR 内に同梱するか
- **結論**:
  - 本 PR 内に同梱する。`outputs/phase-12/test-file-suffix-adr.md` を新設し、(1) 4 種 suffix 分類ルール、(2) 新規 test 作成時の判別フロー、(3) glob 正本（vitest / lefthook / CI）への参照リンクを含める
  - 理由: ADR を後追いにすると「rename 完了後・ADR 確定前」の隙間に新規 `.test.ts` が追加される race が発生する。本 PR 内同梱でその窓を塞ぐ

## 因果と境界

```
[原因]
  08a で suffix 規約導入時、既存 132 ファイル rename を「混在許容」としてスコープ外にした
    ↓
[現状]
  132 件の `*.test.ts` が新規 test の suffix 規約と混在し、suite 種別がファイル名から判別できない
    ↓
[本 PR スコープ]
  132 ファイル rename（git mv） + glob 同期 4 種 + ADR 確定 = 1 PR 完結
    ↓
[結果]
  apps/api 配下では `*.test.ts` 残存ゼロ。新規 test は ADR に従い `*.{contract,authz,repository}.spec.ts` または `*.spec.ts` で作成
```

境界:
- **in**: `apps/api/src/**/*.test.ts` 132 件
- **out**: `apps/web/src/**/*.test.ts` / `packages/**/*.test.ts` / `tests/e2e/*.spec.ts`（既に `.spec.ts`）

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 必要性 | suite 種別の判別性（contract / authz / repository / unit）を得ることで、CI matrix 分割・選択実行・coverage 集計が possible になる。混在許容は「規約導入の意義」を半分しか実現していない |
| 十分性 | 132 件全件 rename + glob 4 種同期 + ADR で「規約適用率 100%」を達成する。途中で止めると次回の境界判定コストが残る |
| 妥当性 | git history は `git log --follow` で rename を跨いで追跡可能。rename ノイズは許容範囲 |
| 整合性 | 08a で確定した命名規約と完全互換。test 内容を変更しないため CLAUDE.md 不変条件 #5（D1 直接アクセス境界）等とは独立 |

## 価値とコスト

| 観点 | 評価 |
| --- | --- |
| 価値 | (1) suite 種別判別性 100%、(2) 後続 task の新規 test 命名の迷い解消、(3) CI matrix 細分化の前提整備 |
| コスト | (1) git history の rename ノイズ（`--follow` で吸収可能）、(2) PR レビュー対象が 132 件 + config（ただし pure rename なので per-file 認知コストは均一） |
| 結論 | 価値 ≫ コスト。1 PR 完結が最も安全 |

## 着手 Gate（前提）

| Gate | 条件 | 本サイクルでの扱い |
| --- | --- | --- |
| 前提 1 | 08a で suffix 規約が導入済み | 確定（`docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/` 参照） |
| 前提 2 | `mise exec -- pnpm --filter @ubm-hyogo/api test` が rename 前 green | rename 着手前に確認、Phase 11 evidence に記録 |
| 前提 3 | 132 ファイル列挙が安定（test 追加 PR と衝突しない） | 本ブランチは rename 専用とし、他 PR を merge しない方針で固定 |
| 前提 4 | Issue #325 が CLOSED のまま運用される | ユーザー指示。PR は `Refs #325` のみで連携、`Closes` は禁止 |

## 入力

| 種別 | 内容 |
| --- | --- |
| 仕様 | `docs/30-workflows/issue-325-test-suffix-rename-migration/index.md` |
| メタ | `docs/30-workflows/issue-325-test-suffix-rename-migration/artifacts.json` |
| 元 task | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` |
| 規約導出元 | `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`（Phase 10 §5 リスク表 / Phase 12 unassigned-task-detection §6） |
| 対象ファイル | `apps/api/src/**/*.test.ts` 132 件（一覧は Phase 2 fixed list） |
| 既存 glob | `vitest.config.ts` / `apps/api/package.json` / `package.json` / `lefthook.yml` / `.github/workflows/*.yml` |

## 出力（Phase 2 で凍結する fixed list の構造定義）

CSV スキーマ:

| 列 | 型 | 説明 |
| --- | --- | --- |
| `old_path` | string（リポジトリ root 相対） | rename 前パス。`apps/api/src/...test.ts` |
| `new_path` | string（リポジトリ root 相対） | rename 後パス。`apps/api/src/...{contract\|authz\|repository}.spec.ts` または `...spec.ts` |
| `suffix_class` | enum | `contract` / `authz` / `repository` / `unit` のいずれか |
| `justification` | string | 分類根拠（path pattern / 内容種別の短評） |

行数: ヘッダ 1 + データ 132 = 133 行。配置先 `outputs/phase-11/rename-mapping.csv`（Phase 4 で I/O 契約を確定）。

合計件数の不変条件: `contract=41 + authz=4 + repository=38 + unit=49 = 132`。Phase 2 fixed list はこの内訳と完全一致しなければ凍結しない。

## 確定要件

- Phase 2 で 132 行 fixed list を凍結する（省略・「他多数」表記禁止）
- Phase 3 で suffix 分類ルールを ADR ドラフトとして確定する
- Phase 4 で rename mapping CSV / test count snapshot / glob coverage grep の I/O 契約を確定する
- Phase 11 evidence で「rename 前後の test 件数完全一致」「pure rename（diff 0）」「glob 残存ゼロ」の 3 点を実測値で記録する

## 完了条件チェック

- [ ] 真の論点 3 つ（diff 0 / glob 漏れ検出 / ADR タイミング）が結論まで明記されている
- [ ] 因果と境界が 1 PR スコープで閉じている
- [ ] 4 条件評価（必要性 / 十分性 / 妥当性 / 整合性）が記述されている
- [ ] 入力（5 種）と出力（fixed list CSV スキーマ）が確定している
- [ ] 件数不変条件 41+4+38+49=132 が明記されている
- [ ] Issue #325 を `Closes` で閉じない方針が記述されている
