# claude-agent-sdk SKILL.md 分割 (Progressive Disclosure 適用) - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-ledger-a3-split-claude-agent-sdk-001                               |
| タスク名     | claude-agent-sdk SKILL.md 200 行 SLO 適合化（references 分離）                |
| 分類         | ドキュメント / リファクタリング                                               |
| 対象機能     | `.claude/skills/claude-agent-sdk/SKILL.md` の Progressive Disclosure 化       |
| 優先度       | 高                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-4)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (skill-ledger Progressive Disclosure 適用) Phase 12 で、`.claude/skills/claude-agent-sdk/SKILL.md` が約 324 行存在し、skill-ledger が定める **200 行 SLO** に違反していることが検出された。Direct SDK / SkillExecutor / AuthKeyService の 3 種類の実装パターンと、query() API / Hooks / Permission Control / Streaming のサンプルコードが SKILL.md 本体に集中している。

### 1.2 問題点・課題

- 200 行 SLO 違反により Claude Code セッション起動時の文脈消費が肥大化
- 3 パターン（Direct SDK / SkillExecutor / AuthKeyService）が 1 ファイルに同居し、責務境界が不明瞭
- query() API / Hooks / Permission Control / Streaming の実装サンプルが trigger 判断に必要なメタ情報を埋もれさせている

### 1.3 放置した場合の影響

- skill-ledger A-3 の AC（全 SKILL.md ≤ 200 行）が未達のまま残る
- 同種の SKILL.md（automation-30 等）の分割判断との整合が取れない
- SDK バージョンアップ時に編集対象が広く、レビュー負荷が増大

---

## 2. 何を達成するか（What）

### 2.1 目的

`.claude/skills/claude-agent-sdk/SKILL.md` を 200 行未満に圧縮し、詳細サンプルを `references/` に分離する。

### 2.2 最終ゴール（AC）

1. `SKILL.md` が **200 行以下** に収まる
2. Direct SDK / SkillExecutor / AuthKeyService の各パターンが `references/<pattern>.md` として分離される
3. query() API / Hooks / Permission Control / Streaming のサンプルコードが references 側へ移動する
4. SKILL.md の Anchors / trigger / allowed-tools / SDK バージョン記述が維持される
5. `.agents/` mirror が同期される（skill-ledger の mirror ルールに準拠）

### 2.3 スコープ

#### 含むもの

- `SKILL.md` 本体の圧縮（200 行 SLO 適合）
- `references/` ディレクトリ新設とパターン別ファイル分割
- query() / Hooks / Permission Control / Streaming サンプルの references 化
- `.agents/` mirror 同期

#### 含まないもの

- SDK バージョンアップそのもの（別タスク）
- 他 SKILL.md の分割（U-1〜U-3 各タスクで個別対応）

### 2.4 成果物

- `.claude/skills/claude-agent-sdk/SKILL.md`（200 行未満）
- `.claude/skills/claude-agent-sdk/references/*.md`（新設）
- `.agents/` mirror 差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 Phase 12 完了済み
- skill-ledger の references 分離パターンが他スキルで確立済み

### 3.2 依存タスク

- skill-ledger-a3-progressive-disclosure（親タスク）

### 3.3 推奨アプローチ

- 別 PR (PR-5) として A-3 後続で独立実装
- U-1〜U-3 (他 SKILL.md 分割タスク) と並列実行可能
- 既存サンプルコードは意味的書き換えを避け、機械的に references へ切り出す

---

## 4. 影響範囲

- `.claude/skills/claude-agent-sdk/SKILL.md`
- `.claude/skills/claude-agent-sdk/references/`（新設）
- `.agents/skills/claude-agent-sdk/` mirror
- Claude Code セッション起動時の SKILL ロード挙動（軽量化）

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-4
- 対象ファイル: `.claude/skills/claude-agent-sdk/SKILL.md`（約 324 行）
- 親タスク: skill-ledger-a3-progressive-disclosure

---

## 7. 備考

- A-3 振り返りの苦戦箇所 **#2 責務境界判断**: Direct SDK / SkillExecutor / AuthKeyService の境界はパターン名単位で機械的に分割する。意味推論で再構成しない
- A-3 振り返りの苦戦箇所 **#6 意味的書き換え混入注意**: サンプルコードは原文を維持し、移動のみに留める。コメント追記や変数リネームを行わない
- SDK バージョン情報（`@anthropic-ai/claude-agent-sdk` / `@anthropic-ai/sdk` のバージョン記述）は trigger 判定に必要なため SKILL.md 本体に最小限残す
