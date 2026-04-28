# skill-creator SKILL.md の Progressive Disclosure 分割 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-ledger-a3-split-skill-creator-001                                  |
| タスク名     | skill-creator/SKILL.md を 200 行 SLO 以下に分割                               |
| 分類         | ドキュメント / リファクタリング                                               |
| 対象機能     | `.claude/skills/skill-creator/` の Progressive Disclosure 構造                |
| 優先度       | 高                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-2)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (skill-ledger Progressive Disclosure) Phase 12 で、`task-specification-creator` 等の SKILL.md を 200 行 SLO に整える対応を完了したが、メタスキルである `.claude/skills/skill-creator/SKILL.md` 自体が **約 402 行** 残存しており、SLO 違反が確定した（U-2）。

### 1.2 問題点・課題

- skill-creator は Collaborative / Orchestrate / Runtime の 3 系統の状態遷移ロジックを SKILL.md 本体に集中させており、責務境界が曖昧
- 「他スキルに 200 行 SLO を強制する skill 生成元」が自身は SLO を満たさない**ドッグフーディング矛盾**を抱えている
- A-3 完了時点では検出のみ・分割は未着手のため、後続スキル生成の参照点が曖昧なまま運用される

### 1.3 放置した場合の影響

- 新規スキル作成時に skill-creator 本体を全文読み込む負荷が継続し、Progressive Disclosure 全体の費用対効果が下がる
- ドッグフーディング矛盾が他スキル作者の「200 行を守らなくてよい」誤学習を誘発する
- Collaborative / Orchestrate / Runtime のセクション肥大が今後さらに進行し、分割コストが累積する

---

## 2. 何を達成するか（What）

### 2.1 目的

`.claude/skills/skill-creator/SKILL.md` を 200 行未満に圧縮し、状態遷移詳細を `references/` 配下へ責務分離する。

### 2.2 最終ゴール（受入基準 AC）

1. `.claude/skills/skill-creator/SKILL.md` が **200 行以下**
2. Collaborative / Orchestrate / Runtime の状態遷移詳細が `references/` 配下に分離されている
3. Anchors / trigger / allowed-tools などフロントマター相当のメタ情報は SKILL.md 本体に保持する
4. `.agents/` mirror の同期が完了し、本体と差分ゼロ
5. skill-creator が出力するテンプレート自体には変更を加えない（テンプレ修正は U-6 で別対応）

### 2.3 スコープ

#### 含むもの

- SKILL.md からの状態遷移セクション切り出し（機械的 cut & paste 原則）
- `references/collaborative.md` / `references/orchestrate.md` / `references/runtime.md` 等の新設
- 本体からの参照リンク追記
- `.agents/` mirror への反映

#### 含まないもの

- skill-creator が生成する出力テンプレートの構造変更（U-6 で対応）
- 他スキルの再分割
- skill-creator のロジック変更（決定論的な再配置のみ）

### 2.4 成果物

- 200 行未満の `.claude/skills/skill-creator/SKILL.md`
- 新設 `references/*.md` 群
- mirror 同期済みの `.agents/skills/skill-creator/`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 Phase 12 完了（U-2 検出済み）
- PR-1（A-3 本体）マージ済み

### 3.2 依存タスク

- A-3 (skill-ledger-a3-progressive-disclosure) — 完了済み
- U-6 (skill-creator 出力テンプレ修正) — 直列依存（本タスク後に実施）

### 3.3 推奨アプローチ

PR-3 として A-3 後続で独立 PR 化する。PR-1 で確立した「機械的 cut & paste 原則」を継承し、文言改変は禁止。Anchors / trigger / allowed-tools は本体維持を厳守。

---

## 4. 影響範囲

- `.claude/skills/skill-creator/SKILL.md`（圧縮対象）
- `.claude/skills/skill-creator/references/*.md`（新設）
- `.agents/skills/skill-creator/`（mirror 同期）
- 後続 U-6（出力テンプレ修正）の前提条件

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-2
- index: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md`
- フィードバック: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/skill-feedback-report.md`
- PR-1 機械的 cut & paste 原則（A-3 本体 PR）

---

## 7. 備考（苦戦箇所への対応）

A-3 Phase 12 で報告された苦戦箇所のうち以下に対応する:

- **#2 責務境界判断**: Collaborative / Orchestrate / Runtime の境界を `references/` 単位で明示的に切り出すことで再現性を確保
- **#4 ドッグフーディング矛盾**: skill 生成元自身が 200 行 SLO を満たすことで、他スキル作者への学習効果と運用一貫性を回復

skill-creator は出力先テンプレート（生成されるスキルの雛形）も統括する責務を持つため、本タスク（SKILL.md 分割）と U-6（出力テンプレ修正）は **直列依存** となる点に注意。本タスクを先行し、テンプレ側の調整は U-6 で実施する。
