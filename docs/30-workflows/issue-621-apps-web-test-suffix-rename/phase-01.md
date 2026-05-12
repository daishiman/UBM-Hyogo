# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #621（apps/web `*.test.ts(x)` → 種別別 `*.spec.ts(x)` rename）の要件を確定する。Issue #325 で apps/api に導入された suffix 規約を **apps/web に拡張** するための前提条件・Gate・真の論点を切り分け、Phase 2 で凍結する fixed list の構造定義まで本 Phase で決定する。apps/api の 4 分類（contract / authz / repository / unit）はそのまま流用せず、UI 層に適した分類軸を新設する点が #325 との最大の違い。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation（refactor-rename-only） |
| visualEvidence | NON_VISUAL |
| state | completed |
| 関連 Issue | https://github.com/daishiman/UBM-Hyogo/issues/621 (OPEN) |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 1-1 | 真の論点 4 つを切り分ける（diff 0 保証 / glob 漏れ検出 / `.tsx` 拾い漏れ防止 / apps/web 用 ADR 分類軸） |
| 1-2 | 因果と境界を 1 PR スコープに固定する（70 rename + glob 同期 + ADR を同 PR） |
| 1-3 | 価値とコストの 4 条件評価を行う |
| 1-4 | 入力（70 ファイル / index.md / 親 #325 ADR / `apps/web/package.json:19`）と出力（fixed list 構造定義 = `old_path,new_path,suffix_class,justification`）を確定する |

## 真の論点

### 論点 1: diff 0 保証（rename と test 内容変更の絶対分離）

- **問い**: 70 ファイル rename PR に「ついでの修正」（jsdom 環境注釈の変更・import 更新等）が混入し、後日問題発生時に rename と本質的変更の切り分けが困難になるリスクをどう排除するか
- **結論**:
  1. rename commit は **`git mv` のみ**で実施し、テキストエディタによる一切の変更を禁止する
  2. PR 内で rename commit と self-reference / config / lint guard 同期 commit と ADR commit を **3 commit** に分離し、責務を明示する
  3. CI で `git log --diff-filter=R --name-status HEAD~N..HEAD` を用いて rename commit が「pure rename」（`R100` のみで `M` を含まない）であることを assert する
  4. Phase 11 evidence に `git diff --stat <rename-commit-parent>..<rename-commit>` を記録し、追加・削除行が 0 であることを示す
  5. `// @vitest-environment jsdom` 注釈は rename で破損しないため、追加検証として rename 後ファイルの先頭 5 行 grep を Phase 11 で取得する

### 論点 2: glob 漏れ検出（CI が静かに skip しない保証）

- **問い**: `*.test.ts(x)` を `*.spec.ts(x)` 系へ rename した結果、`apps/web/package.json:19` の `verify-design-tokens` script が古い `tokens.test.ts` を参照したまま残り、当該 test が CI で実行されない（fail せずに silent skip する）状態をどう検出するか
- **結論**:
  1. rename **前** に `mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose` を実行し、`Test Files X | Tests Y passed` を `outputs/phase-11/test-count-before.txt` に snapshot
  2. rename **後** に同コマンドを実行し `outputs/phase-11/test-count-after.txt` に snapshot
  3. before / after の `Tests Y` 値が完全一致することを assert（差分 1 でも fail）
  4. 補助として `find apps/web -path '*/node_modules' -prune -o -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | wc -l` が rename 前後ともに 87 であること、rename 後 `*.test.ts(x)` 残存が 0 であることを assert
  5. `rg -n "apps/web.*\.test\." -g '!**/node_modules/**' -g '!docs/**'` で apps/web 関連の `.test.` 残存ヒットを全列挙し、`outputs/phase-11/glob-coverage-grep.log` に保存。0 件が合格条件
  6. `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens` が exit 0 であることを Phase 11 で別途 assert

### 論点 3: `.tsx` 拾い漏れ防止

- **問い**: 70 ファイル中に `.test.tsx`（React component test）が含まれる。`find -name '*.test.ts'` のみではマッチせず、rename 漏れが発生する。どう防ぐか
- **結論**:
  1. すべての `find` コマンドは `\( -name '*.test.ts' -o -name '*.test.tsx' \)` の形で `.ts` と `.tsx` 双方を網羅する
  2. Phase 2 fixed list は `.tsx` を別行で必ず含める。component 分類は `*.component.spec.tsx`（拡張子 .tsx を保持）
  3. rename 後の new path 拡張子は old path の拡張子と一致させる（`.test.ts → .spec.ts` / `.test.tsx → .component.spec.tsx`）
  4. CSV schema レベルで `oldPath.endsWith('.test.ts') || oldPath.endsWith('.test.tsx')` 不変条件を Phase 5 で明文化

### 論点 4: apps/web 用 ADR 分類軸の確定タイミング

- **問い**: apps/api ADR の 4 分類（contract / authz / repository / unit）は backend 層に最適化されており、UI 層にそのまま流用すると意味的にずれる。apps/web 用分類軸をどのタイミングで誰が確定するか
- **結論**:
  - 本 PR 内で確定する。`outputs/phase-12/test-file-suffix-adr-apps-web.md` を新設し、(1) UI 層に適した分類軸、(2) 新規 test 作成時の判別フロー、(3) apps/api ADR との対比表、(4) glob 正本（apps/web/package.json）への参照リンクを含める
  - 採用分類軸（凍結値）: **component**（React component test）/ **runtime**（build output / instrumentation / static invariants / design tokens 等の runtime 検証）/ **lib-unit**（純粋 unit）。route / action / hook は Phase 2 fixed list 確定時にファイルが該当する場合のみ追加採用し、強引な細分化は避ける
  - 理由: ADR を後追いにすると「rename 完了後・ADR 確定前」の隙間に新規 `.test.ts(x)` が追加される race が発生する。本 PR 内同梱でその窓を塞ぐ

## 因果と境界

```
[原因]
  Issue #325 で suffix 規約導入時、apps/web は親 issue 責務外として scope-out された
    ↓
[現状]
  apps/web/**/*.test.ts(x) 70 ファイルが apps/api と非対称な命名のまま残存
  apps/web/package.json:19 の verify-design-tokens script が tokens.test.ts を直接参照
    ↓
[本 PR スコープ]
  70 ファイル rename（git mv） + apps/web/package.json glob 同期 + apps/web 用 ADR 確定 = 1 PR 完結
    ↓
[結果]
  apps/web 配下では `*.test.ts(x)` 残存ゼロ。新規 test は apps/web ADR に従い `*.{component,runtime}.spec.ts(x)` または `*.spec.ts` で作成
```

境界:
- **in**: `apps/web/**/*.test.ts(x)` 70 件
- **out**: `apps/api/src/**/*.spec.ts`（既に rename 完了）/ `packages/**/*.test.ts`（followup-002）/ `tests/e2e/*.spec.ts`（既に `.spec.ts`）/ Storybook / Playwright

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 必要性 | suite 種別の判別性（component / runtime / lib-unit）を得ることで、CI matrix 分割・選択実行・jsdom vs node 環境分離が可能になる。apps/api との非対称性を解消し、リポジトリ全体の規約を一本化する |
| 十分性 | 70 件全件 rename + glob 1 点同期 + apps/web 用 ADR で「規約適用率 100%」を達成する。途中で止めると次回の境界判定コストが残る |
| 妥当性 | git history は `git log --follow` で rename を跨いで追跡可能。rename ノイズは許容範囲。apps/api ADR との対比表を ADR に置くことで意味的ズレを文書化する |
| 整合性 | apps/api で確定した命名規約と「suffix を `.spec.ts(x)` に統一」「種別を中間修飾子で表現」という構造原則は完全互換。test 内容を変更しないため CLAUDE.md 不変条件 #5（D1 直接アクセス境界）等とは独立 |

## 価値とコスト

| 観点 | 評価 |
| --- | --- |
| 価値 | (1) suite 種別判別性 100%、(2) 後続 task の新規 test 命名の迷い解消、(3) jsdom / node 環境分離の前提整備、(4) リポジトリ全体規約の一本化 |
| コスト | (1) git history の rename ノイズ（`--follow` で吸収可能）、(2) PR レビュー対象が 70 件 + 1 glob 点（pure rename なので per-file 認知コストは均一） |
| 結論 | 価値 ≫ コスト。1 PR 完結が最も安全 |

## 着手 Gate（前提）

| Gate | 条件 | 本サイクルでの扱い |
| --- | --- | --- |
| 前提 1 | Issue #325 で apps/api 側 rename + ADR が完了 | 確定（`docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/` 参照） |
| 前提 2 | `mise exec -- pnpm --filter @ubm-hyogo/web test` が rename 前 green | rename 着手前に確認、Phase 11 evidence に記録 |
| 前提 3 | 70 ファイル列挙が安定（test 追加 PR と衝突しない） | 本ブランチは rename 専用とし、他 PR を merge しない方針で固定 |
| 前提 4 | Issue #621 が OPEN のまま運用される | ユーザー指示。PR は `Refs #621` のみで連携、`Closes` は禁止 |
| 前提 5 | followup-002 (packages) / followup-003 (vitest 収斂) が別 issue 化済み | 確定。本タスク scope-out として明記 |

## 入力

| 種別 | 内容 |
| --- | --- |
| 仕様 | `docs/30-workflows/issue-621-apps-web-test-suffix-rename/index.md` |
| 元 task | `docs/30-workflows/unassigned-task/task-issue-325-followup-001-apps-web-test-suffix-rename.md` |
| 親完了タスク | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`（フォーマット・ADR の参照元） |
| 対象ファイル | `apps/web/**/*.test.ts(x)` 70 件（一覧は Phase 2 fixed list） |
| 既存 glob | `apps/web/package.json:19` / `vitest.config.ts`(root) / `lefthook.yml` / `.github/workflows/*.yml` |

## 出力（Phase 2 で凍結する fixed list の構造定義）

CSV スキーマ:

| 列 | 型 | 説明 |
| --- | --- | --- |
| `old_path` | string（リポジトリ root 相対） | rename 前パス。`apps/web/src/...test.ts` または `...test.tsx` |
| `new_path` | string（リポジトリ root 相対） | rename 後パス。`apps/web/src/...{component\|runtime}.spec.ts(x)` または `...spec.ts` |
| `suffix_class` | enum | `component` / `runtime` / `lib-unit` のいずれか（Phase 2 で route/action/hook が必要と判明した場合のみ拡張） |
| `justification` | string | 分類根拠（path pattern / 内容種別の短評） |

行数: ヘッダ 1 + データ 70 = 71 行。配置先 `outputs/phase-11/rename-mapping.csv`（Phase 4 で I/O 契約を確定）。

合計件数の不変条件: `component=36 + route=4 + page=1 + runtime=5 + lib-unit=24 = 70`（Phase 2 凍結値）。Phase 2 fixed list はこの内訳と完全一致しなければ凍結しない。

## 確定要件

- Phase 2 で 70 行 fixed list を凍結する（省略・「他多数」表記禁止）
- Phase 3 で apps/web 用 suffix 分類ルールを ADR ドラフトとして確定する（apps/api ADR との対比表含む）
- Phase 4 で rename mapping CSV / test count snapshot / glob coverage grep の I/O 契約を確定する
- Phase 11 evidence で「rename 前後の test 件数完全一致」「pure rename（diff 0）」「`.test.` 残存ゼロ」「verify-design-tokens script exit 0」の 4 点を実測値で記録する

## 完了条件チェック

- [ ] 真の論点 4 つ（diff 0 / glob 漏れ検出 / `.tsx` 漏れ防止 / ADR 分類軸）が結論まで明記されている
- [ ] 因果と境界が 1 PR スコープで閉じている
- [ ] 4 条件評価（必要性 / 十分性 / 妥当性 / 整合性）が記述されている
- [ ] 入力（5 種）と出力（fixed list CSV スキーマ）が確定している
- [ ] 件数不変条件 36+4+1+5+24=70（凍結値）が明記されている
- [ ] Issue #621 を `Closes` で閉じない方針が記述されている
