# github-issue-manager SKILL.md 200行 SLO 準拠分割 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-ledger-a3-split-github-issue-manager-001                           |
| タスク名     | github-issue-manager SKILL.md の Progressive Disclosure 分割                  |
| 分類         | ドキュメント / リファクタリング                                               |
| 対象機能     | `.claude/skills/github-issue-manager/SKILL.md` の責務分離                     |
| 優先度       | 高                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-3)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (skill-ledger-a3-progressive-disclosure) で task-specification-creator の SKILL.md を 200 行未満に分割する Progressive Disclosure 適用を実施した際、姉妹スキルである `github-issue-manager/SKILL.md` も約 363 行に肥大化していることが U-3 として検出された。Part 1〜4 の構造（基本操作 / タスク仕様書連携 / ローカル同期 / スコアリング選択）が SKILL.md 本体に直書きされ、責務境界が曖昧なまま loader context を圧迫している。

### 1.2 問題点・課題

- SKILL.md が 363 行と 200 行 SLO を 1.8 倍超過
- Part 1〜4 が 1 ファイルに同居しており、Issue 操作の最小利用ケースでも全 Part がロードされる
- gh CLI のコマンドリファレンスが本文中に展開され、参照頻度の差を反映できていない
- A-3 で確立した task-specification-creator の分割パターン（PR-1）と整合していない

### 1.3 放置した場合の影響

- Skill 利用時の context 浪費が継続し、Claude Code の応答品質が劣化
- 追加機能（例: Sub-Issue 連携・bulk operation）を SKILL.md 本体に追加せざるを得ず、肥大化が加速
- A-3 で得た分割パターンが他スキルに展開されず、SLO 違反スキルが残存

---

## 2. 何を達成するか（What）

### 2.1 目的

`github-issue-manager/SKILL.md` を 200 行未満に圧縮し、Part 1〜4 を Progressive Disclosure される references/ ファイル群に再配置する。

### 2.2 最終ゴール（受け入れ条件 AC）

1. `.claude/skills/github-issue-manager/SKILL.md` が 200 行未満
2. Part 1〜4 を 4 個の `references/` ファイルに分離（例: `part1-basic-operations.md` / `part2-task-spec-linkage.md` / `part3-local-sync.md` / `part4-scoring-selection.md`）
3. gh CLI コマンドリファレンスを `references/gh-cli-reference.md` として独立
4. SKILL.md 冒頭の Anchors / trigger / allowed-tools / description 等のメタは現行通り維持
5. `.agents/` 配下の mirror が SKILL.md / references と同期

### 2.3 スコープ

#### 含むもの

- SKILL.md 本体の縮約と references/ への分離
- references/ 内の相互リンクと Progressive Disclosure index 追記
- `.agents/` mirror の同期

#### 含まないもの

- Skill の挙動変更・新機能追加
- gh CLI コマンドの追加・廃止
- 他スキル（task-specification-creator 等）の追加分割（A-3 別タスクで対応済 / 別タスク化）

### 2.4 成果物

- 分割後 `.claude/skills/github-issue-manager/SKILL.md`
- 新設 `references/*.md` 一式
- `.agents/` 配下の mirror 反映

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 PR-1 の task-specification-creator 分割パターンが merge 済
- SKILL.md の Part 1〜4 区切りが現行のまま維持されていること

### 3.2 依存タスク

- skill-ledger-a3-progressive-disclosure (PR-1) — 分割パターンの正本

### 3.3 推奨アプローチ

別 PR (PR-4) として A-3 の後続並列タスク扱い。Part 1〜4 を機械的に切り出して references/ に move し、SKILL.md からは見出しと参照リンクのみ残す cut & paste 主体の作業とする。論理境界が既に Part 構造で明示されているため、責務再設計は不要。

---

## 4. 影響範囲

- `.claude/skills/github-issue-manager/SKILL.md`
- `.claude/skills/github-issue-manager/references/`（新設）
- `.agents/` 配下の mirror
- 本スキルを参照する `/ai:close-task` / `/ai:diff-to-pr` 等のスラッシュコマンド経路（読み取り専用なので互換）

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-3
- 親ワークフロー: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md`
- 分割パターン正本: A-3 PR-1 (task-specification-creator)
- 対象ファイル: `.claude/skills/github-issue-manager/SKILL.md`（約 363 行）

---

## 7. 備考

A-3 苦戦箇所 #2「責務境界の判断」を継承するが、本タスクでは Part 1〜4 が論理境界として既に明瞭なため判断負荷は低く、機械的な cut & paste で完了する想定。PR-1 で確立した references/ 命名規約・index 付与方式に揃えること。
