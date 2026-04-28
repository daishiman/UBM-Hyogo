# Phase 4: テスト戦略（TDD Red）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（TDD Red） |
| 作成日 | 2026-04-28 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending（仕様化のみ完了 / 実走は別 PR） |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 3 で PASS（with notes）が確定した base case（lane 1〜4 直列実行）に対して、**TDD Red 段階の失敗テスト一覧** を仕様レベルで固定する。本 Phase はテストの実走ではなく、Phase 5 実装着手前に「何を満たせば Green か」を 5 種類のテスト（T1〜T5）として確定する。実テストは Phase 5 / Phase 6 / Phase 11 で順次走らせる。

> **本 Phase は docs-only**。テスト本体スクリプトは作成しない。Phase 5 ランブック / Phase 11 smoke で参照するための **検証コマンド系列の正本** として固定する。

## 依存タスク順序（A-2 完了必須）— 重複明記の継続

A-2（task-skill-ledger-a2-fragment）が completed であること。A-2 未完了で T1〜T5 を走らせると、`LOGS.md` 系の untrack 対象選定が誤って `LOGS.md` 本体まで巻き込み、履歴喪失事故を再発させる。

## 実行タスク

- タスク1: T1〜T5 の Red/Green 条件を定義する。
- タスク2: A-2 完了前提をテスト開始条件として固定する。
- タスク3: 実走を Phase 5 / 6 / 11 に委譲する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | lane 1〜4 設計 / state ownership |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-03.md | base case PASS 判定 / open question |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | Step 1〜4 / target globs |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-04.md | テスト戦略フォーマット参照 |

## 実行手順

1. Phase 2 / Phase 3 の base case を入力として確認する。
2. T1〜T5 の対象 lane、検証コマンド、期待値、Red 状態を表に落とす。
3. docs-only のため、本 Phase ではコマンドを実走しないことを確認する。

## 統合テスト連携

T1〜T5 は実装 PR 側で Phase 5 / 6 / 11 の gate として実走する。本 Phase はテスト仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-04/main.md | T1〜T5 のテスト一覧 / 検証コマンド / 期待値 / 失敗時の切り分け |
| メタ | artifacts.json `phases[3].outputs` | `outputs/phase-04/main.md` |

## テスト一覧（TDD Red）

> 表記凡例: **期待値** = Green 成立条件 / **Red 状態** = 仕様確定時点（実装前）の現状値 / **対応 lane** = Phase 2 lane 番号

### T1: gitignore glob 全マッチ

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 | lane 1（gitignore patch） |
| 検証コマンド | `git check-ignore -v .claude/skills/<skill>/indexes/keywords.json .claude/skills/<skill>/indexes/index-meta.json .claude/skills/<skill>/indexes/<name>.cache.json .claude/skills/<skill>/LOGS.rendered.md` |
| 期待値 | 4 系列すべての行で `.gitignore` の追記行が hit すること（exit 0、各行の出力に `.gitignore:` プレフィックス） |
| Red 状態 | `.gitignore` 未追記のため exit 1（no match） |
| 失敗時切り分け | (a) glob の優先度衝突 / (b) `.git/info/exclude` 誤配置 / (c) 既存 `.gitignore` の上位 glob による打ち消し |

### T2: tracked 派生物 0 件

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 | lane 2（untrack） |
| 検証コマンド | `git ls-files .claude/skills \| rg "(indexes/.*\.json\|\.cache\.json\|LOGS\.rendered\.md)" \| wc -l` |
| 期待値 | `0` |
| Red 状態 | tracked のまま N 件残存（実態は Phase 5 ステップ 0 で `git ls-files` 棚卸しして確定） |
| 失敗時切り分け | (a) `git rm --cached` 漏れ / (b) glob と実体パスのズレ / (c) 棚卸し時に nested skill ledger を見落とし |

### T3: 単一 worktree クリーン再生成

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 | lane 3（hook 冪等ガード） |
| 検証コマンド | `pnpm indexes:rebuild && git status --porcelain` |
| 期待値 | `git status --porcelain` の出力が空（再生成しても tracked 差分が出ない） |
| Red 状態 | tracked 派生物が再生成で書き換わり diff 発生 |
| 失敗時切り分け | (a) generate-index.js が tracked path に書いている / (b) hook が canonical を上書きしている / (c) `.gitignore` 適用前のキャッシュ |

### T4: 4 worktree 並列再生成 → merge で unmerged 0

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 | lane 4（smoke verification） |
| 検証コマンド | Phase 2 §「4 worktree smoke 検証コマンド系列」全文 |
| 期待値 | `git ls-files --unmerged \| wc -l` => `0` |
| Red 状態 | 派生物 conflict が N 件残る（4 worktree がそれぞれ異なる JSON を tracked で書く） |
| 失敗時切り分け | (a) lane 1〜3 のいずれかが未適用 / (b) merge=union 不在（B-1 領域だが A-1 単独でも 0 になる想定） / (c) `pnpm indexes:rebuild` 自体の非決定性 |

### T5: hook 二重実行の冪等性

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 | lane 3（hook 冪等ガード） |
| 検証コマンド | `pnpm indexes:rebuild && tree1=$(git write-tree) && pnpm indexes:rebuild && tree2=$(git write-tree) && [ "$tree1" = "$tree2" ]` |
| 期待値 | `tree1 == tree2`（hook を 2 回走らせても tree が変わらない） |
| Red 状態 | 二重実行で mtime / 内容が変動し tree hash が変わる |
| 失敗時切り分け | (a) `[[ -f <target> ]] && exit 0` ガード未実装 / (b) JSON シリアライズの順序非決定 / (c) hook が tracked path に書いている |

## テストカバレッジ目標（仕様レベル）

| スコープ | 目標 |
| --- | --- |
| `.gitignore` 追記行 | T1 で全行被覆（4 系列 × 全 skill） |
| `git rm --cached` 対象 | T2 で 0 件確認（実態棚卸しベース） |
| hook ガード分岐 | T3 + T5 で「存在 → スキップ」「未存在 → 再生成」両分岐被覆 |
| smoke 統合 | T4 で 4 worktree merge path をエンドツーエンドで被覆 |

## 完了条件

- [ ] T1〜T5 が `outputs/phase-04/main.md` に表化されている
- [ ] 各テストに ID / 対象 lane / 検証コマンド / 期待値 / Red 状態 / 失敗時切り分けが記述されている
- [ ] A-2 完了が本 Phase の前提として明記されている
- [ ] base case PASS（Phase 3）が入力として参照されている
- [ ] 実テスト走行は Phase 5 / 6 / 11 に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
# 仕様の存在確認のみ（実テストは走らせない）
test -f docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-04/main.md
rg -c "^### T[1-5]:" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-04/main.md
# => 5
```

## 苦戦防止メモ

1. **T2 の glob と実態のズレ**: runbook 例示パスではなく `git ls-files .claude/skills` の実態で確認する。Phase 5 ステップ 0 の棚卸し結果を T2 の入力にする。
2. **T4 の非決定性**: `pnpm indexes:rebuild` が決定論的でない場合、merge=union（B-1）が無いと conflict が残る。A-1 単独でも 0 になる想定だが、B-1 完了後に再走で再確認する。
3. **T5 の tree 比較**: `git write-tree` は staging index のハッシュ。worktree の hook が tracked file を触っていないことの証拠として用いる。
4. **A-2 未完了で T1〜T5 を走らせない**: `LOGS.md` 本体が `.gitignore` glob に巻き込まれていないかを Phase 5 ステップ 0 で再確認すること。
5. **本 Phase は実走しない**: Red 状態の確認は Phase 5 着手直前に実施する。仕様化のみで Phase 5 へ進む。

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - T1〜T5 を Phase 5 ステップ 1〜4 の Green 条件として参照
  - Phase 11 smoke は T4 を実走する位置づけ
  - 実態棚卸し結果（`git ls-files .claude/skills`）が T2 の入力
- ブロック条件:
  - A-2 が completed でない
  - T1〜T5 のいずれかに期待値・検証コマンドが欠けている
