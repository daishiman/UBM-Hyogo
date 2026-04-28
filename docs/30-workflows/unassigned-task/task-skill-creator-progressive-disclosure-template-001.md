# skill-creator テンプレ Progressive Disclosure 内蔵化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-skill-creator-progressive-disclosure-template-001                        |
| タスク名     | skill-creator template progressive-disclosure built-in                        |
| 分類         | スキル基盤 / 再発防止                                                         |
| 対象機能     | `.claude/skills/skill-creator/` のテンプレ生成ロジック・scripts・agents       |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | skill-ledger-a3-progressive-disclosure                                        |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-6)                                  |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (Skill Ledger Progressive Disclosure 適用) で 5 つの既存 skill (U-1〜U-4) を順次分割・縮減したが、これらは「肥大化した後に削る」事後対処であった。一方、新規 skill 作成のメタスキルである `skill-creator` 自身が出力する SKILL.md 雛形は、

- 200 行未満ルールが built-in 化されていない
- `references/` 受け皿ディレクトリの初期作成が保証されていない
- 200 行超を検知する仕組みがない

ため、新規 skill が再び 300〜500 行に膨らみ Progressive Disclosure 違反が再発するリスクが残っている。

### 1.2 問題点・課題

- skill-creator のテンプレが「最小 SKILL.md 雛形」を提示せず、サンプル文・装飾を多く含む
- `references/` ディレクトリが雛形に含まれず、後付けで追加される運用になっている
- skill-creator のバリデーションは存在するが、行数閾値での警告ロジックが未実装
- ドッグフーディング矛盾（A-3 Phase 12 苦戦箇所 #4）の構造的再発防止が未着手

### 1.3 放置した場合の影響

- 新規 skill が再び肥大化し、A-3 と同種の縮減タスクが繰り返し発生
- Skill Ledger の Progressive Disclosure 規律が空洞化
- skill-creator がメタスキルでありながら自分の出力規律を強制できない矛盾が継続

---

## 2. 何を達成するか（What）

### 2.1 目的

skill-creator が生成する SKILL.md 雛形に「200 行未満」「`references/` 受け皿」を初期構造として built-in 化し、新規 skill の Progressive Disclosure 違反を構造的に防ぐ。

### 2.2 最終ゴール（想定 AC）

1. skill-creator の出力テンプレが SKILL.md に必須 10 要素のみ含むこと
   - (a) 概要 / (b) trigger / (c) allowed-tools / (d) Anchors / (e) クイックスタート / (f) モード一覧 / (g) agent 導線 / (h) references リンク表 / (i) 最小 workflow / (j) Reference 末尾
2. `references/` 雛形ディレクトリが空のまま初期作成される（`.gitkeep` 等で空ディレクトリを維持）
3. skill-creator のバリデーション時に SKILL.md が 200 行を超える場合、警告を出力する
4. 既存 5 skill のテンプレ反映は本タスクの対象外（U-1〜U-4 で個別対応済み）
5. SKILL.md と agents 仕様の双方から U-5 Anchor（Skill Progressive Disclosure 規律）へリンクされている

### 2.3 スコープ

#### 含むもの

- `.claude/skills/skill-creator/SKILL.md` テンプレ生成セクションの再設計
- `.claude/skills/skill-creator/scripts/` 配下のテンプレ展開ロジック修正
- `.claude/skills/skill-creator/agents/` 配下の生成 agent プロンプト更新
- 200 行警告バリデーションの追加
- mirror（生成物のミラー反映ルール）への波及確認

#### 含まないもの

- 既存 skill (skill-creator / task-specification-creator / github-issue-manager / aiworkflow-requirements / int-test-skill) の SKILL.md 縮減 → U-1〜U-4 で個別対応済み
- skill-creator 自身の SKILL.md 分割（U-2 と独立）
- 200 行を強制的に reject する hard fail 化（本タスクは warning レベルのみ）

### 2.4 成果物

- skill-creator テンプレ差分（SKILL.md 雛形 + references/ 雛形）
- バリデーションスクリプト差分と単体テスト
- 雛形を使った fixture 1 件の生成例（80〜180 行に収まること）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- U-5 Anchor（Skill Progressive Disclosure 規律）が確立済みであること
- A-3 Phase 12 完了（U-1〜U-4 の縮減反映済み）

### 3.2 依存タスク

- U-5 Anchor 確立タスク（先行）
- A-3 (skill-ledger-a3-progressive-disclosure) — 親タスク

### 3.3 推奨アプローチ

別タスクとして U-5 Anchor 確立後に着手。テンプレ生成ロジックの強化に集中し、既存 skill の追加縮減は混ぜない。

---

## 4. 影響範囲

- `.claude/skills/skill-creator/SKILL.md`（テンプレ生成セクション）
- `.claude/skills/skill-creator/scripts/`（テンプレ展開ロジック / バリデーション）
- `.claude/skills/skill-creator/agents/`（生成 agent プロンプト）
- skill mirror（生成物のミラー反映先）
- 今後新規作成される全 skill の初期構造

---

## 5. 推奨タスクタイプ

implementation / NON_VISUAL（scripts 変更を含むため CLI / バリデーションロジックの実装が主）

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-6
- 関連 Anchor: U-5 (Skill Progressive Disclosure 規律 Anchor)
- 関連タスク: skill-ledger-a3-progressive-disclosure（親）, U-1〜U-4（既存 skill 縮減・個別対応済み）, U-2（skill-creator SKILL.md 自体の分割・独立タスク）

---

## 7. 備考

A-3 Phase 12 苦戦箇所 #4「ドッグフーディング矛盾（メタスキル自身が Progressive Disclosure を破る構造）」の構造的再発防止が主旨。U-2（skill-creator SKILL.md 自体の分割）とは独立で、本タスクは「skill-creator が出力するテンプレ」のロジック強化に責務を限定する。U-5 Anchor を起点として、skill-creator・テンプレ・既存 skill が同一規律を共有する状態を目指す。
