# Phase 5: A-1 実装ランブック（自動生成 ledger を gitignore 化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 5 / 13 |
| Phase 名称 | A-1 実装ランブック |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 4 (テスト設計) |
| 下流 | Phase 6 (A-2 実装ランブック) |
| 状態 | pending |

## 目的

A-1「自動生成 ledger を gitignore 化」を、別タスクの実装担当者がそのまま実行できる
ステップ列に分解する。**本仕様書はコードを書かない**。実装ランブックの設計のみ。

## 対象施策 (A-1) の要点

- 対象ファイル:
  - `.claude/skills/aiworkflow-requirements/LOGS.md`
  - `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
  - `.claude/skills/aiworkflow-requirements/indexes/index-meta.json`
  - その他自動カウンタ系（`totalKeywords` 等を含む派生 JSON）
- Why: post-commit / post-merge hook で自動再生成される派生物が git 管理下にあるため、
  worktree ごとに同じ位置で書き換えが発生し、`totalKeywords: 2966` のような単純カウンタは
  4 worktree が同時に commit すると 100% 衝突する
- How:
  - `.gitignore` に登録（リポジトリ正本側、`.git/info/exclude` ではない）
  - 条件を満たす場合は worktree-local cache へ移動
  - skill 側 hook を `[[ -f <gitignore対象> ]] || regenerate` のガード付きにする

## 実装ランブック（別タスクで実行する手順）

### Step 1: gitignore 登録

1. リポジトリルート `.gitignore` を編集
2. 以下を追記:
   ```
   # skill 派生物（hook で再生成される）
   .claude/skills/*/LOGS.md
   .claude/skills/*/indexes/keywords.json
   .claude/skills/*/indexes/index-meta.json
   .claude/skills/*/indexes/*.cache.json
   ```
3. `git status` で対象ファイルが untracked / ignored になることを確認

### Step 2: 既存追跡解除

1. `git rm --cached <対象パス>` で git の追跡から外す（ファイル本体は残す）
2. commit メッセージは `chore(skill): untrack auto-generated ledger files`

### Step 3: hook ガード追加

1. 該当 hook スクリプトに以下のガードを追加（疑似コード、本実装は別タスク）:
   ```bash
   target="$1"
   if [[ -f "$target" ]]; then
     # 既存ファイルがあれば再生成しない（または timestamp 比較）
     :
   else
     regenerate "$target"
   fi
   ```
2. ローカル test として 1 度削除 → hook 起動で再生成されることを確認

### Step 4: 検証

1. Phase 4 の C-3 ケースを実行（2 worktree で再生成 → merge）
2. git tree に対象ファイルが現れず、衝突しないことを確認

## ロールバック手順

1. `.gitignore` の該当行を revert
2. 対象ファイルを `git add` し直す
3. hook ガードを revert

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-2/file-layout.md | gitignore 対象 |
| 必須 | outputs/phase-4/merge-conflict-cases.md | C-3 検証 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-5/main.md | Phase 5 サマリー |
| ドキュメント | outputs/phase-5/gitignore-runbook.md | A-1 実装ランブック |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | C-3 を手動検証 |

## 完了条件

- [ ] gitignore-runbook.md / main.md 作成
- [ ] Step 1〜4 の手順が実行可能な粒度で記載
- [ ] artifacts.json の Phase 5 を completed に更新

## 次 Phase

- 次: Phase 6 (A-2 実装ランブック)
- 引き継ぎ事項: A-1 ランブック

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

