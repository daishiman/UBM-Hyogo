# Phase 7: A-3 / B-1 実装ランブック（Progressive Disclosure / merge=union）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 7 / 13 |
| Phase 名称 | A-3 / B-1 実装ランブック（AC マトリクス含む） |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 (A-2 実装ランブック) |
| 下流 | Phase 8 (リファクタ) |
| 状態 | pending |

## 目的

A-3 と B-1 をひとつの Phase で扱う（どちらも「既存ファイルへの局所変更」で完結し、
A-2 のような大きな構造転換を伴わないため）。同時に、AC-1 〜 AC-9 のトレースを完了させる。

## 対象施策 (A-3) の要点

- 対象: 各 skill の `SKILL.md`
- Why: SKILL.md が 1000 行を超えると、全 worktree が触るたびに局所追記が発生する。
  `task-specification-creator/SKILL.md` で過去にこのパターンが起きている。
- How:
  - セクションごとに `references/<topic>.md` へ抽出
  - SKILL.md 本体は index 役（200 行未満を目標）
  - 各 reference は単一責務、worktree 間で同時編集しにくい粒度

## 対象施策 (B-1) の要点

- 対象: append-only ledger 全般のうち、A-2 fragment 化未完のもの / fragment 化不可なもの
- Why: A-2 を完全 fragment 化できないファイル（既存運用ログで履歴を保持したいもの等）に
  Git の `merge=union` ドライバを適用すれば、両ブランチの追記を機械的にマージし
  衝突自体を発生させない
- How:
  - `.gitattributes` に以下を追加:
    ```
    .claude/skills/**/LOGS.md merge=union
    .claude/skills/**/lessons-learned-*.md merge=union
    ```
  - 適用前提: 各行が独立した意味を持つフォーマット（行を超える構造体には適用不可）
  - A-2 fragment 化が優先。union は移行期の暫定策と明記する

## 実装ランブック（A-3 部分）

### A-3 Step 1: SKILL.md 棚卸し

1. `.claude/skills/*/SKILL.md` を行数で集計
2. 200 行を超えるものをリストアップ
3. 各セクションを「単一責務 topic」へ分類

### A-3 Step 2: references 抽出

1. 各 topic を `references/<topic>.md` として切り出し
2. SKILL.md 本体は index に書き換え、各 topic への相対リンクを記載
3. SKILL.md の行数が 200 行未満になることを確認（AC-3）

### A-3 Step 3: Progressive Disclosure 整合確認

1. skill loader / runtime が references を解決できることを確認
2. SKILL.md → references の参照が片方向であること

## 実装ランブック（B-1 部分）

### B-1 Step 1: 適用対象選定

1. A-2 移行が完了していないファイル、および A-2 適用外で append-only なファイルを列挙
2. 各ファイルが「行レベル独立」かを判定
3. 構造体 / YAML / JSON は除外

### B-1 Step 2: .gitattributes 追記

1. リポジトリルート `.gitattributes` に下記を追記:
   ```
   .claude/skills/**/LOGS.md            merge=union
   .claude/skills/**/lessons-learned-*.md merge=union
   # root CHANGELOG.md は skill ledger 範囲外のため既定では対象外
   ```
2. 注釈で「A-2 完了時に削除する暫定策」を明記
3. commit

### B-1 Step 3: 検証

1. Phase 4 C-4 を実行
2. 2 worktree からの末尾追記が両方とも保存されることを確認

## AC マトリクス（このフェーズで完了）

| AC | 確認 Phase | 確認方法 |
| --- | --- | --- |
| AC-1 | Phase 2 | file-layout.md / fragment-schema.md / render-api.md / gitattributes-pattern.md |
| AC-2 | Phase 2, 6 | fragment-schema.md の正規表現 |
| AC-3 | Phase 7 | SKILL.md 行数測定 |
| AC-4 | Phase 3 | impact-matrix.md の B-1 適用範囲レビュー |
| AC-5 | Phase 4 | parallel-commit-sim.md |
| AC-6 | Phase 11 | manual-smoke-log.md |
| AC-7 | Phase 12 | system-spec-update-summary.md / documentation-changelog.md |
| AC-8 | Phase 3 | backward-compat.md |
| AC-9 | Phase 1〜13 全体 | 生成物が Markdown / JSON / .gitkeep のみ |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-5/main.md | A-1 対象と gitignore 方針 |
| 必須 | outputs/phase-5/gitignore-runbook.md | B-1 適用前の派生物除外方針 |
| 必須 | outputs/phase-2/gitattributes-pattern.md | B-1 規約 |
| 必須 | outputs/phase-3/impact-matrix.md | A-3 適用安全性 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-7/main.md | Phase 7 サマリー + AC マトリクス |
| ドキュメント | outputs/phase-7/skill-split-runbook.md | A-3 実装ランブック |
| ドキュメント | outputs/phase-7/gitattributes-runbook.md | B-1 実装ランブック |

## 完了条件

- [ ] skill-split-runbook.md / gitattributes-runbook.md / main.md 作成
- [ ] AC-1〜AC-9 のトレース表が main.md に存在
- [ ] artifacts.json の Phase 7 を completed に更新

## 次 Phase

- 次: Phase 8 (リファクタ)
- 引き継ぎ事項: A-3 / B-1 ランブック、AC マトリクス

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
