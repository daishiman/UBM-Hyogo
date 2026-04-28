# automation-30 SKILL.md Progressive Disclosure 分割 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-ledger-a3-split-automation-30-001                                  |
| タスク名     | automation-30 SKILL.md を 200 行未満化（Progressive Disclosure 分割 PR-2）    |
| 分類         | ドキュメント / リファクタリング                                               |
| 対象機能     | `.claude/skills/automation-30/SKILL.md` および `.agents/` mirror              |
| 優先度       | 高                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-1)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3（skill-ledger Progressive Disclosure 第一弾 = task-specification-creator 分割 PR-1）の Phase 12 検出で、`automation-30/SKILL.md` が **約 432 行**あり Progressive Disclosure SLO の **200 行**を大幅に超過していることが確定した。Layer 1〜7 の説明セクションが entry / detail で二重化しており、構造的に冗長。

### 1.2 問題点・課題

- SKILL.md ロード時の loader context 消費が大きく、他 skill との同時起動時にトークン圧を生む
- 1 ファイル肥大化により他タスクが同時に SKILL.md を編集すると並列衝突しやすい（A-3 の苦戦箇所 #3）
- task-specification-creator 側で「200 行未満」を強制するルールを発行したのに、自スキル群（automation-30 ほか）が遵守していないドッグフーディング矛盾が継続する（苦戦箇所 #4）

### 1.3 放置した場合の影響

- skill 改修ルール（200 行 SLO）が空文化し、後続 skill も SLO 違反が常態化
- 他 skill の references 切り出し PR と SKILL.md 編集が衝突して再 rebase コストが膨らむ

---

## 2. 何を達成するか（What）

### 2.1 目的

`automation-30/SKILL.md` を **200 行未満**に縮め、Layer 1〜7 の重複セクションを `references/` 配下へ機械的に切り出す。意味的書き換えは一切行わない。

### 2.2 最終ゴール（AC）

1. `.claude/skills/automation-30/SKILL.md` が **200 行未満** になっている
2. 重複 Layer 1〜7 セクションは `.claude/skills/automation-30/references/*.md` へ **cut & paste のみ**で移設（語句・順序の意味的書き換え禁止）
3. SKILL.md ヘッダの Anchors / trigger / allowed-tools / description 等のメタは現状維持
4. 旧アンカー先（旧見出し ID）への内部・外部参照が残らないことを `rg` で grep 確認し、残存ゼロを記録
5. `.claude` canonical と `.agents` mirror の内容が完全同期している（diff = 0）

### 2.3 スコープ

#### 含むもの
- SKILL.md の本文セクション分割と references/ 配下への移設
- mirror 同期確認

#### 含まないもの
- automation-30 のロジック / トリガ条件 / Anchor 内容の改変
- 他 skill（skill-creator / github-issue-manager / claude-agent-sdk）の分割（U-2〜U-4 として独立タスク化）

### 2.4 成果物

- 縮小された `SKILL.md`
- 新規 `references/*.md`（複数）
- 旧アンカー残存ゼロを示す grep ログ
- canonical / mirror diff = 0 の確認ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 PR-1（task-specification-creator 分割）の references 切り出しパターンが merge 済み
- 1 PR = 1 skill 厳守（並列衝突回避）

### 3.2 依存タスク

- 親: skill-ledger-a3-progressive-disclosure（PR-1）
- 直列順序: PR-1 → **PR-2 (本タスク)** → PR-3 (U-2) → PR-4 (U-3) → PR-5 (U-4)

### 3.3 推奨アプローチ

PR-1 で確立した「機械的 cut & paste のみ」原則を踏襲する。ファイル分割の判断境界も PR-1 の `references/<topic>.md` 命名パターン（`patterns-*` / `phase-*-guide` / `spec-update-*`）に倣う。書き換えを混入させず、行数削減のみをゴールとする。

---

## 4. 影響範囲

- `.claude/skills/automation-30/SKILL.md`（縮小）
- `.claude/skills/automation-30/references/*.md`（新規複数）
- `.agents/skills/automation-30/`（mirror、同内容で同期）
- automation-30 を参照する skill ledger / index ドキュメント（旧アンカーが指されていれば追従）

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL（SKILL.md は仕様ドキュメント。UI 影響なし）

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-1 行
- フィードバック: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/skill-feedback-report.md`
- index: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md`（苦戦箇所一覧）
- 先行 PR: A-3 PR-1（task-specification-creator 分割、`references/` 切り出しパターンの正本）

---

## 7. 備考（苦戦箇所カバー）

A-3 で確認された苦戦箇所のうち以下に該当し、本タスクで継承的に対処する:

- **#2 entry / references の責務境界判断**: PR-1 の命名規約に従い judgement を最小化
- **#3 並列衝突回避**: 1 PR = 1 skill 厳守。他 skill 分割タスク (U-2〜U-4) と直列化
- **#6 機械的書き換え徹底**: 「cut & paste のみ・意味的書き換え禁止」原則を継承。語順入れ替えや要約化は AC 違反とみなす

ドッグフーディング矛盾（苦戦箇所 #4）は U-5（skill 改修ガイド Anchor 追記）と U-6（skill-creator テンプレ整備）で恒久対処されるが、本 PR では「200 行未満」事実関係を解消する責務を負う。
