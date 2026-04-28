# Phase 11 NON_VISUAL Evidence Template Sync - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-B1-SKILL-FEEDBACK |
| タスク名 | Phase 11 NON_VISUAL 証跡テンプレート改善 |
| 分類 | 改善 |
| 対象機能 | task-specification-creator |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | Phase 12 skill-feedback-report |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

docs-only / NON_VISUAL の設計タスクでは、Phase 11 の「未実行の証跡受け皿」と、実装後に採取する「実測ログ」が混同されやすい。

### 1.2 問題点・課題

テンプレートが両者を明確に分けないと、未実行の placeholder が PASS 証跡として読まれる。

### 1.3 放置した場合の影響

後続 workflow で Phase 11 / Phase 12 の完了判定が過大評価され、実測ログなしで closeout される。

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-specification-creator` の Phase 11 テンプレートに、NON_VISUAL の `not_run` / `placeholder` / `executed` を区別する項目を追加する。

### 2.2 最終ゴール

Phase 11 成果物だけで、スクリーンショット不要理由、未実行理由、実測ログの有無、evidence path が判別できる。

### 2.3 スコープ

#### 含むもの

- Phase 11 関連テンプレート / reference の更新
- `SKILL.md` / `LOGS.md` の変更履歴更新
- mirror parity の確認

#### 含まないもの

- 個別 workflow の実測ログ採取
- UI screenshot の追加

### 2.4 成果物

- `.claude/skills/task-specification-creator/references/phase-11-*.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/LOGS.md`

---

## 3. どのように実行するか（How）

### 3.1 前提条件

`docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/skill-feedback-report.md` を発見元として読む。

### 3.2 依存タスク

なし。

### 3.3 必要な知識

Phase 11 / Phase 12 の docs-only / NON_VISUAL 判定ルール。

### 3.4 推奨アプローチ

既存テンプレートに項目を追加し、既存 workflow 互換性を壊さない。

---

## 4. 実行手順

### Phase構成

1. 現行テンプレート確認
2. NON_VISUAL evidence state 追加
3. skill 履歴更新
4. 検証

### Phase 1: 現行テンプレート確認

#### 目的

更新対象を最小化する。

#### 手順

1. Phase 11 関連 reference を検索する。
2. NON_VISUAL の記述箇所を特定する。
3. mirror の有無を確認する。

#### 成果物

- 更新対象一覧

#### 完了条件

編集対象が確定している。

### Phase 2: NON_VISUAL evidence state 追加

#### 目的

placeholder と実測ログを区別する。

#### 手順

1. `evidenceState` 相当の表を追加する。
2. `not_run` / `placeholder` / `executed` の意味を定義する。
3. Phase 12 compliance check で参照する項目を明記する。

#### 成果物

- 更新済み reference

#### 完了条件

未実行の受け皿が PASS 実測ログと誤読されない。

### Phase 3: skill 履歴更新

#### 目的

skill 改善を正本に記録する。

#### 手順

1. `SKILL.md` の変更履歴を更新する。
2. `LOGS.md` に実施記録を追加する。
3. mirror parity を確認する。

#### 成果物

- skill 履歴更新差分

#### 完了条件

canonical / mirror の扱いが記録されている。

### Phase 4: 検証

#### 目的

テンプレート変更が参照可能であることを確認する。

#### 手順

1. `rg -n "evidenceState|placeholder|not_run|executed" .claude/skills/task-specification-creator`
2. Phase 12 guide の関連記述と矛盾しないことを確認する。

#### 成果物

- 検証ログ

#### 完了条件

検索で新項目が確認でき、既存テンプレートリンクが壊れていない。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] NON_VISUAL Phase 11 の evidence state が定義されている
- [ ] Phase 12 compliance check で参照できる

### 品質要件

- [ ] 既存 VISUAL workflow のテンプレートを壊していない
- [ ] canonical / mirror policy が記録されている

### ドキュメント要件

- [ ] `SKILL.md` / `LOGS.md` が更新されている
- [ ] 変更理由が skill feedback とリンクしている

---

## 6. 検証方法

### テストケース

NON_VISUAL docs-only workflow で、placeholder と executed log が区別できる。

### 検証手順

```bash
rg -n "evidenceState|placeholder|not_run|executed" .claude/skills/task-specification-creator
```

期待: Phase 11 reference または template で状態区分が確認できる。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| テンプレート肥大化 | 低 | 中 | 既存 NON_VISUAL セクションに最小項目として追加する |
| VISUAL タスクへの誤適用 | 中 | 低 | `visualEvidence: NON_VISUAL` の場合のみ使うと明記する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/skill-ledger-b1-gitattributes/outputs/phase-12/skill-feedback-report.md`
- `.claude/skills/task-specification-creator/references/phase-11-guide.md`
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`

### 参考資料

なし。

---

## 9. 備考

## 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Phase 11 の placeholder が実測 PASS と誤読される |
| 原因 | docs-only / NON_VISUAL の証跡状態を明示する欄が弱い |
| 対応 | evidence state をテンプレート化する |
| 再発防止 | Phase 12 compliance check で evidence state を確認する |

### レビュー指摘の原文（該当する場合）

```
skill-feedback-report.md proposes a task-specification-creator Phase 11 template improvement, but no skill update task/log/backlog entry records it.
```

### 補足事項

本タスクは skill 改善の仕様化であり、現在の B-1 workflow の実測 smoke を採取するものではない。
