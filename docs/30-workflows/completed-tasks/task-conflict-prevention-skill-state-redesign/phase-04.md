# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト設計（並列 commit シミュレーション / merge 衝突検証） |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 (設計レビュー) |
| 下流 | Phase 5 (A-1 実装ランブック) |
| 状態 | pending |

## 目的

A-1 〜 B-1 適用後に「並列 commit が衝突 0 件で merge できる」ことを検証する手順と
ケース集を設計する。Phase 11 の手動テストはこの設計を実行する形で進める。
本タスクは仕様書のみのため、自動テストコードは書かず **手順 / 観測点 / 期待値**を Markdown で固定する。

## 検証戦略

### 戦略 1: 並列 commit シミュレーション

4 worktree から同一 main 派生で並列に下記を行う:

| worktree | 操作 |
| --- | --- |
| wt-1 | `aiworkflow-requirements/LOGS/` へ fragment 1 件生成 |
| wt-2 | `aiworkflow-requirements/LOGS/` へ fragment 1 件生成（異なる timestamp） |
| wt-3 | `task-specification-creator/SKILL.md` の references 1 つを編集 |
| wt-4 | `task-specification-creator/changelog/` に新 version fragment 追加 |

各 worktree が commit → push → main へ PR → 順次 merge する。
**期待値**: いずれの merge でもコンフリクトが発生しない。

### 戦略 2: merge 衝突検証ケース

| ケース | 設定 | 期待 |
| --- | --- | --- |
| C-1 | 2 worktree が同一 fragment 名（同秒・同 branch）を生成 | 命名規約違反として **検知**（ファイル衝突は意味的に妥当な競合） |
| C-2 | 2 worktree が異なる fragment を生成 | 衝突なし |
| C-3 | A-1 対象（gitignore 化）を 2 worktree が再生成 | git tree に出ない、衝突なし |
| C-4 | `LOGS.md`（B-1 適用、A-2 移行前）に 2 worktree が末尾追記 | `merge=union` で両方の追記が保存 |
| C-5 | `SKILL.md`（A-3 後・index 役）を 2 worktree が編集 | 別箇所なら通常 merge で成功、同一行なら通常通り conflict（許容） |
| C-6 | render script を実行して fragment が時系列順に出力される | 出力順序が timestamp 降順 |
| C-7 | 異常 front matter（timestamp 欠損）を含む fragment を render | エラー or 該当 fragment スキップ（仕様で確定する） |

### 戦略 3: 後方互換検証

- 既存 `LOGS.md` を `LOGS/_legacy.md` に退避した状態で render script が
  legacy 内容を出力に含めること
- 旧 changelog ファイルが残っている場合、新 fragment と同居しても render が破綻しないこと

## 実行タスク

### タスク 1: parallel-commit-sim.md 作成

**実行手順**:
1. 4 worktree シナリオを step-by-step で記述
2. 各 step の観測コマンド（`git status` / `git merge --no-ff` / `git diff` 等）を併記
3. 期待される標準出力を併記
4. `outputs/phase-4/parallel-commit-sim.md` に固定

### タスク 2: merge-conflict-cases.md 作成

**実行手順**:
1. C-1 〜 C-7 を独立節で記述
2. 各ケースの再現手順、観測点、期待値、判定基準を表化
3. `outputs/phase-4/merge-conflict-cases.md` に固定

### タスク 3: テスト戦略サマリー

**実行手順**:
1. AC-5 / AC-6 / NFR-1 とのトレースを表化
2. `outputs/phase-4/main.md` に集約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-1/main.md | 並列シナリオ |
| 必須 | outputs/phase-2/fragment-schema.md | 命名規約 |
| 必須 | outputs/phase-2/gitattributes-pattern.md | merge=union 適用範囲 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-4/main.md | テスト戦略サマリー |
| ドキュメント | outputs/phase-4/parallel-commit-sim.md | 4 worktree 検証手順 |
| ドキュメント | outputs/phase-4/merge-conflict-cases.md | C-1〜C-7 ケース集 |

## TDD 検証

本タスクはコード非実装のため自動テストはなし。
ただし Phase 11 の手動検証で本ファイルが「実行可能な手順」として機能することを確認する。

## 完了条件

- [ ] parallel-commit-sim.md / merge-conflict-cases.md / main.md 作成
- [ ] AC-5 を満たす並列 commit シナリオが文書化済
- [ ] artifacts.json の Phase 4 を completed に更新

## 次 Phase

- 次: Phase 5 (A-1 実装ランブック)
- 引き継ぎ事項: 検証手順 / ケース集

## Skill準拠補遺

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

