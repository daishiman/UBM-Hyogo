# task-specification-creator skill: docs-only / NON_VISUAL テンプレ整備 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | UT-GOV-005-docs-only-nonvisual-template-skill-sync                            |
| タスク名     | task-specification-creator skill への docs-only / NON_VISUAL テンプレ追加     |
| 分類         | スキル改善 / docs-only テンプレ整備                                           |
| 対象機能     | `.claude/skills/task-specification-creator/` および `.agents/skills/` mirror  |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | task-github-governance-branch-protection                                      |
| 発見元       | outputs/phase-12/unassigned-task-detection.md current U-5                     |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

本親タスク（task-github-governance-branch-protection）は docs-only / NON_VISUAL タイプであり、Phase 6-11 の標準テンプレ（screenshot 取得・ビジュアル検証）を額面通り適用すると過剰成果物が発生する。Phase 11 では実際に `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点のみが意味のある canonical artefact となり、screenshot は存在意義がなかった。
また Phase 12 Part 2（実装ガイド技術者向け）の必須要件は SKILL.md に明記されているが、`phase12-task-spec-compliance-check.md` 側にチェック項目として落ちておらず、実運用ではドリフトしている。

### 1.2 問題点・課題

- docs-only タスクで Phase 11 が screenshot を要求する誤判定が頻発（visualEvidence メタ未設定が主因）
- Phase 12 Part 2 の必須要件（TypeScript 型定義 / API シグネチャ / 使用例 / エラー処理 / 設定可能パラメータ・定数）が validator / compliance-check 側で明示的に検証されない
- `spec_created` ステータスのまま Phase 12 close-out で `completed` に誤って書き換えられるパターンがある（workflow root と ledger の状態分離が未定義）
- `.claude/skills/` を更新後 `.agents/skills/` mirror 同期忘れで参照ドリフトが発生

### 1.3 放置した場合の影響

- 次回以降の docs-only / spec_created / NON_VISUAL タスクで同じ冗長成果物・判定ドリフトが再発
- Phase 12 Part 2 の品質低下（型・API シグネチャ・例の欠落）
- skill 本体と mirror の不一致でエージェントの参照経路が不安定化

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-specification-creator` skill に docs-only / NON_VISUAL タスク向けの縮約テンプレ・判定ルール・compliance-check ブランチを追加し、`.agents/skills/` mirror へ同期する。

### 2.2 想定 AC

1. `references/phase-templates.md`（または既存 phase-template ファイル群）に docs-only / NON_VISUAL の Phase 6-11 縮約テンプレが追記されている
2. Phase 11 縮約テンプレで canonical artefact を `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点に固定し、screenshot を不要と明記
3. `artifacts.json.metadata.visualEvidence=NON_VISUAL` を入力として Phase 11 縮約テンプレが発火する判定ルールが SKILL.md / phase-template-phase11.md に記述されている
4. Phase 12 Part 2 の必須要件チェックに以下が含まれる（`phase12-task-spec-compliance-check.md` 側に項目化）:
   - TypeScript 型定義
   - API シグネチャ
   - 使用例
   - エラー処理
   - 設定可能パラメータ・定数
5. `phase12-task-spec-compliance-check.md` に docs-only 用の判定ブランチが追加され、`spec_created` と `completed` の状態を分離する記述がある
6. `.claude/skills/task-specification-creator/` 配下の更新が `.agents/skills/task-specification-creator/` mirror に同期されている（差分 0）

### 2.3 スコープ

#### 含むもの
- SKILL.md の「タスクタイプ判定フロー（docs-only / NON_VISUAL）」追記
- `references/phase-template-phase11.md` の縮約テンプレ追加
- `references/phase-template-phase12.md` Part 2 必須要件のチェック項目化
- `references/phase12-task-spec-compliance-check.md` への docs-only ブランチ追加
- `.agents/skills/` mirror 同期

#### 含まないもの
- skill 本体のリファクタ（テンプレ追加に留める）
- 親タスク本体（branch protection）の仕様変更

### 2.4 成果物

- `.claude/skills/task-specification-creator/SKILL.md` 差分
- `references/phase-template-phase11.md` / `phase-template-phase12.md` 差分
- `references/phase12-task-spec-compliance-check.md` 差分
- `.agents/skills/task-specification-creator/` mirror 差分
- 縮約テンプレの適用例として本親タスクの outputs/phase-11, outputs/phase-12 を参照リンク化

---

## 3. 影響範囲

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase12-task-spec-compliance-check.md`
- `.agents/skills/task-specification-creator/` 同名ファイル群（mirror）
- 今後の docs-only / NON_VISUAL タスク全般の Phase 6-12 進行

---

## 4. 依存・関連タスク

- 関連: 親タスク `task-github-governance-branch-protection`（適用第一例）
- 関連: UT-GOV-001〜UT-GOV-007 の docs-only 系 unassigned-task（縮約テンプレ適用候補）
- 関連: skill-fixture-runner（テンプレ追加後の検証経路）

---

## 5. 推奨タスクタイプ

skill-improvement / docs-only

---

## 6. 参照情報

- `.claude/skills/task-specification-creator/SKILL.md` の「タスクタイプ判定フロー（docs-only / NON_VISUAL）」
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase12-task-spec-compliance-check.md`
- 本親タスク `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-11/`
- 本親タスク `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/`

---

## 7. 備考

本タスクは「次回以降の docs-only / NON_VISUAL タスクの再発防止」が主目的であり、親タスクの完了条件には含まれない。優先度中だが、UT-GOV-001〜007 のような docs-only governance タスクが Wave で続く場合は先行して着手することで効果が大きい。

---

## 8. 苦戦箇所・落とし穴

- **visualEvidence メタ未設定問題**: docs-only タスクでも Phase 11 が screenshot を要求する誤判定が頻発する。`artifacts.json.metadata.visualEvidence=NON_VISUAL` を Phase 1 / Phase 5 で必須入力化しないと縮約テンプレが発火しないため、テンプレ追加と同時に「メタ設定の Phase 1 強制」ルールが必要
- **Phase 12 Part 2 必須要件のチェック漏れ**: SKILL.md には箇条書きされているが validator / compliance-check 側が項目化していないため、テンプレ追加時に compliance-check 側の判定基準と一対一で対応させる必要がある
- **状態分離の罠**: `spec_created` ステータスのまま Phase 12 close-out で `completed` に誤って書き換えられるパターンがあるため、workflow root と ledger の状態を明示的に分離する記述が必須（例: workflow root = `spec_created`, ledger = `completed` の差を許容するルール）
- **skill mirror 同期忘れ**: `.claude/skills/` を更新しても `.agents/skills/` mirror 同期忘れで参照ドリフトが発生するため、本タスクの AC に「mirror 差分 0」を必ず含めること。可能なら mirror 同期を pre-commit / CI で強制
- **既存 docs-only タスクへの遡及適用の判断**: 既に進行中の docs-only タスクへ縮約テンプレを遡及適用するか、新規タスクからのみ適用するかの方針を明文化しないと運用が割れる
