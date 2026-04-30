# task-utgov001-drift-fix-001

## メタ情報

```yaml
issue_number: 304
task_id: task-utgov001-drift-fix-001
task_name: Fix UT-GOV-001 second-stage branch protection documentation drift
category: 改善
target_feature: GitHub branch protection governance
priority: 中
scale: 小規模
status: 未実施
```

| 項目 | 値 |
| --- | --- |
| タスクID | task-utgov001-drift-fix-001 |
| タスク名 | Fix UT-GOV-001 second-stage branch protection documentation drift |
| 分類 | 改善 |
| 対象機能 | GitHub branch protection governance |
| 発見元 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/unassigned-task-detection.md |
| ステータス | 未実施 |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| taskType | docs-only / NON_VISUAL |
| 発火条件 | Phase 13 の actual GET と CLAUDE.md / deployment branch strategy の six-value comparison で drift が検出された場合 |

## 実装ガイド

### Part 1: 中学生でもわかる説明

なぜ必要か: 実際の決まりと説明書が違うと、次の作業で間違いが起きます。たとえば、体育館の鍵の置き場所が変わったのに古い案内だけが残っていると、探す人が迷います。

何をするか: GitHub の実際の branch protection と、CLAUDE.md / deployment branch strategy の説明を比べ、違っている場所だけを直します。

### Part 2: 技術者向け

- 入力: Phase 13 actual GET、`outputs/phase-09/drift-check.md`、CLAUDE.md、deployment branch strategy 正本
- 比較対象: `required_pull_request_reviews`、`enforce_admins`、`allow_force_pushes`、`allow_deletions`、`required_linear_history`、`required_conversation_resolution`
- 発火条件: drift が 1 件以上ある場合のみ
- 非発火時: 本タスクは open のままにせず、drift なし evidence として close 判断する

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-09/drift-check.md`
- 症状: GitHub の branch protection API は `null`、missing field、boolean field が混在し、文書側の「無効」と直接一致しない。値の正規化をせずに比較すると false positive の drift が出る。
- 参照: `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-12/unassigned-task-detection.md`

## スコープ

### 含む

- drift が出た値の原因分類
- CLAUDE.md または deployment branch strategy の追従更新
- 更新後の drift-check 再実行手順の記録
- 意図的差分がある場合の理由明文化

### 含まない

- drift が検出されていない状態での文書更新
- branch protection PUT の再実行
- UT-GOV-004 context 抽出ロジックの変更

## リスクと対策

| リスク | 対策 |
| --- | --- |
| API 表現差を実 drift と誤判定する | 比較前に `null` / missing / false の意味を対象フィールドごとに正規化する |
| GitHub 実値ではなく文書側に合わせてしまう | GitHub GET を正本とし、文書を追従させる。意図的差分のみ理由を明文化する |
| conditional task を無条件に実行する | Phase 13 drift-check で差分がある場合だけ着手する |

## 検証方法

```bash
rg -n "required_pull_request_reviews|enforce_admins|allow_force_pushes|allow_deletions|required_linear_history|required_conversation_resolution" CLAUDE.md docs .claude/skills/aiworkflow-requirements/references
sed -n '1,220p' docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-09/drift-check.md
```

期待: drift が 0 件、または意図的差分として理由と追跡先が記録されている。

## 完了条件

- actual GET と文書の差分がゼロ、または意図的差分として明文化されている

## 1. なぜこのタスクが必要か（Why）

実際の GitHub 設定と文書がずれると、後続 governance task が誤った前提で進むため。

## 2. 何を達成するか（What）

actual GET と文書の差分をゼロ、または意図的差分として説明済みの状態にする。

## 3. どのように実行するか（How）

drift-check を入力に、stale な文書だけを最小更新する。

## 4. 実行手順

drift 確認、原因分類、文書更新、再検証、記録更新の順で実行する。

## 5. 完了条件チェックリスト

- [ ] drift 発火条件が満たされている
- [ ] 差分原因が分類済み
- [ ] 再検証済み

## 6. 検証方法

上記 `## 検証方法` の rg / drift-check 確認を実行する。

## 7. リスクと対策

上記 `## リスクと対策` の表を適用する。

## 8. 参照情報

- `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-09/drift-check.md`

## 9. 備考

drift がなければ実行不要。
