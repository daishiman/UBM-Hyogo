# SKILL.md 内部アンカー外部リンク監査 - タスク指示書

## メタ情報

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| タスクID     | task-doc-link-audit-skill-anchors-001                      |
| タスク名     | SKILL.md 旧アンカーへの外部深いリンク監査                  |
| 分類         | ドキュメンテーション / 監査                                |
| 対象機能     | `.claude/skills/*/SKILL.md` の内部アンカーと外部参照整合性 |
| 優先度       | 低                                                         |
| 見積もり規模 | 小規模                                                     |
| ステータス   | 未実施 (proposed)                                          |
| 親タスク     | skill-ledger-a3-progressive-disclosure                     |
| 発見元       | A-3 Phase 12 unassigned-task-detection (U-8)               |
| 発見日       | 2026-04-28                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

A-3 (skill-ledger Progressive Disclosure) で `task-specification-creator/SKILL.md` の長大な内部セクションを `references/` 配下のサブドキュメント（`requirements-review.md` / `phase-12-spec.md` / `phase-12-pitfalls.md` / `quality-gates.md` / `task-type-decision.md` / `orchestration.md` 等）に分離した。

この分離に伴い、SKILL.md 内に存在していた見出しアンカー（例: `#要件レビュー思考法`、Phase 12 内のサブ見出し群）はファイル外部に移動した。一方、`doc/` `docs/` `.agents/` 配下の他ドキュメントから、これら旧アンカーへ深いリンク（`SKILL.md#要件レビュー思考法` のような形式）が貼られている可能性がある。

### 1.2 問題点・課題

- 旧アンカーへのリンクは「ページは開くがアンカーが効かない」状態となり、ユーザーが該当箇所を見つけづらい
- A-3 で再分割対象となった U-1 〜 U-4（追加の Progressive Disclosure 候補）が完了すると、同種のアンカー喪失が再発する
- 監査スクリプトや lint ルールが未整備のため、機械的に検出する手段がない

### 1.3 放置した場合の影響

- 内部リンク経由で SKILL ナレッジへ到達する経路が壊れ、Progressive Disclosure の効果（必要箇所へ最短到達）が損なわれる
- 後続の SKILL リファクタリングが行われるたびに同じデバッグ負荷が発生する

---

## 2. 何を達成するか（What）

### 2.1 目的

A-3 で発生した SKILL.md 内部アンカー移動による外部リンク切れを網羅的に検出し、修正方針を確定する。

### 2.2 最終ゴール（想定 AC）

1. `rg` で `.claude/skills/*/SKILL.md` 内部アンカー（`SKILL.md#...`、`skills/.../SKILL.md#...`、相対 `#anchor` 含む）への言及を `doc/` `docs/` `.agents/` 配下から全件抽出する
2. 旧アンカー → 新 references パス（例: `#要件レビュー思考法` → `references/requirements-review.md`）のマッピング表を本タスク仕様内に生成する
3. 切れリンクは件数と所在をリストアップし、修正コミット計画（単一 PR か分割 PR か）を本仕様の補遺として確定する
4. 各 SKILL.md 末尾に「移動済みセクション一覧 / redirect ノート」を追加するか否かを判断し、判断根拠を記録する
5. U-1 〜 U-4 完了後に同一監査を再実行する旨をチェックリスト化する

### 2.3 スコープ

#### 含むもの

- `doc/` `docs/` `.agents/skills/*` 配下の Markdown / MDX を対象とした静的検索
- 旧アンカー → 新 references パスのマッピング表生成
- redirect ノート追加可否の判断と理由記述

#### 含まないもの

- 検出された切れリンクの実修正（件数次第で別タスクへ分離する）
- SKILL.md 構造の追加分割（U-1 〜 U-4 の本体作業）
- CI への lint ルール追加（別タスク化候補）

### 2.4 成果物

- 抽出結果一覧（パス + 行番号 + 旧アンカー）
- 旧 → 新マッピング表
- redirect ノート追加可否の判断記録
- 後続再実行チェックリスト

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- A-3 Phase 11 までの SKILL.md / references 構成が main にマージ済み
- `rg` (ripgrep) が利用可能

### 3.2 依存タスク

- U-1 〜 U-4（追加の Progressive Disclosure 分割タスク）完了後に再実行することで網羅性を担保

### 3.3 推奨アプローチ

docs-only / 小規模監査として実施。修正は件数次第で別タスクに切り出し、本タスクは「検出 + マッピング + 修正計画」までを担う。

---

## 4. 影響範囲

- `doc/` 配下のすべての Markdown
- `docs/` 配下のすべての Markdown（特に `30-workflows/skill-ledger-a3-progressive-disclosure/` 内）
- 外部参照ファイル: ルート `README.md`、`CLAUDE.md`、`.claude/CLAUDE.md`
- `.agents/skills/*` 配下のスキル定義 / 参照ドキュメント

---

## 5. 推奨タスクタイプ

docs-only / NON_VISUAL（検証・監査タスク）

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-12/unassigned-task-detection.md` の U-8
- 苦戦箇所記録: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md` 苦戦箇所 #1
- 関連ファイル: `.claude/skills/task-specification-creator/SKILL.md` および `references/*.md`
- 関連タスク: U-1 〜 U-4（追加 Progressive Disclosure 分割タスク群）

---

## 7. 備考

本タスクは検出と計画策定が中心の検証タスクである。検出された切れリンクの件数が小規模（目安: 10 件未満）であれば本タスク内で修正まで一括実施するが、規模が大きい場合は修正コミットを別タスクへ分離する。U-1 〜 U-4 完了後の再走査は必須であり、各分割タスクの DoD に「本監査の再実行トリガ」を含めるよう連携する。
