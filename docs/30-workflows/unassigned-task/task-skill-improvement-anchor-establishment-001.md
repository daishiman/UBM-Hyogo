# skill 改修 Anchor 恒久化（`skill-progressive-disclosure-200-line-rule`） - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-improvement-anchor-establishment-001                               |
| タスク名     | skill-improvement Anchor establishment (`skill-progressive-disclosure-200-line-rule`) |
| 分類         | ドキュメント / skill ガバナンス                                               |
| 対象機能     | `.claude/skills/task-specification-creator/references/` 配下の skill 改修指針 |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-5)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3（skill ledger Progressive Disclosure 改修）で 5 skill（task-specification-creator / automation-30 / skill-creator / github-issue-manager / claude-agent-sdk）を 200 行未満の SKILL.md + fragment references 構成へリファクタした。しかし「fragment で書け」「200 行を超えたら分割」「mirror 同期義務」という skill 改修ルール自体に固定 ID 付き Anchor が存在せず、外部 skill / 未タスク仕様書から参照できない状態にある。

### 1.2 問題点・課題

- A-3 AC-10「再発防止 Anchor の恒久化」が、Anchor 発行先未確定のため未充足
- skill 改修ガイドが SKILL.md 本文中に散在し、参照リンクが不安定（行番号依存）
- ドッグフーディング矛盾（苦戦箇所 #4）の恒久解消策が未着地。skill-creator 自身が 200 行ルールを Anchor として参照できないため、再発リスクが残る
- 将来の loader doctor / skill 監査スクリプト（U-7）からの参照先が未確定

### 1.3 放置した場合の影響

- 別 skill 改修時に再び 200 行超過 / fragment 化忘れが発生する
- A-3 PR をマージしても再発防止が「個別 skill の SKILL.md 文言」依存となり、横断ルールとして強制できない
- mirror（`.agents`）同期忘れが検知不能

---

## 2. 何を達成するか（What）

### 2.1 目的

skill 改修ルールに固定 ID 付き Anchor を発行し、外部 skill / タスク仕様 / 監査スクリプトからの安定参照点を確立する。

### 2.2 最終ゴール（想定 AC）

1. `.claude/skills/task-specification-creator/references/skill-improvement.md`（新規）または既存 references への追記で Anchor `skill-progressive-disclosure-200-line-rule` を発行する
2. 以下 4 原則を明文化する:
   - **200 行未満ルール**: SKILL.md は 200 行未満。超過時は references/ へ分割
   - **fragment 原則**: references は単一トピック単位の fragment ファイルとする
   - **mechanical split 原則**: 分割は機械的（章単位）に行い、加筆・解釈変更を伴わない
   - **mirror 同期義務**: `.claude/skills/` 変更は `.agents/` へ同期する
3. 既存 5 skill（task-specification-creator / automation-30 / skill-creator / github-issue-manager / claude-agent-sdk）の SKILL.md Anchors セクションから本 Anchor への後方リンクを追加する
4. `.agents` mirror へ同期する

### 2.3 スコープ

#### 含むもの

- skill-improvement Anchor の文書化と固定 ID 発行
- 5 skill SKILL.md Anchors セクションの後方リンク追加
- `.agents` mirror 同期

#### 含まないもの

- skill 改修ルール自体の内容変更（A-3 で確定済みルールの転記のみ）
- loader doctor / 監査スクリプトの実装（U-7 で別途）

### 2.4 成果物

- `.claude/skills/task-specification-creator/references/skill-improvement.md`（または既存 references への追記）
- 5 skill SKILL.md Anchors セクション差分
- `.agents/` 同期差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 Phase 12 完了（5 skill が 200 行未満化済み）
- AC-10 ロールバック独立性確保のため、本 A-3 PR とは独立した PR-N で実施

### 3.2 依存タスク

- 親: skill-ledger-a3-progressive-disclosure（A-3 本体）
- 並列可: U-1〜U-4（同 Phase 12 で検出された他の未タスク）

### 3.3 推奨アプローチ

A-3 マージ後、Anchor ID を含む単発 PR として独立提出。U-1〜U-4 と並列実施可能。

---

## 4. 影響範囲

- `.claude/skills/task-specification-creator/references/`（新規 fragment または既存追記）
- `.claude/skills/{task-specification-creator,automation-30,skill-creator,github-issue-manager,claude-agent-sdk}/SKILL.md` の Anchors セクション
- `.agents/` 配下の mirror

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL

---

## 6. 参照情報

- A-3 AC-10（再発防止 Anchor 恒久化）
- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-5
- 親 index: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md`（苦戦箇所 #4 ドッグフーディング矛盾）

---

## 7. 備考

苦戦箇所 #4「skill-creator 自身が Progressive Disclosure ルールを fragment として保持していない」というドッグフーディング矛盾の恒久解消策として位置付ける。本 Anchor `skill-progressive-disclosure-200-line-rule` は将来の skill 監査スクリプト（U-7 loader doctor）からも参照点として利用される想定。Anchor ID 命名は変更不可（外部参照の安定性確保のため）。
