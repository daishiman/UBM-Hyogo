# Phase 6: テスト実装・カバレッジ確認（適用外）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-05 |
| 状態 | spec_created |

## 目的

本タスクの差分は repo settings 適用 + SSOT docs 更新のみで、ソースコード追加なし。`coverage-summary.json` を更新する対象がないため新規 unit test 実装と coverage 計測は **適用外**。代わりに「コード変更が含まれていないこと」と「リポジトリ全体の現存 coverage が ≥80% を維持していること」を確認する。

## 実行タスク

### Task 6-1: コード変更不在の確認

```bash
git diff --name-only main...HEAD \
  | grep -Ev '^(docs/|\.claude/skills/aiworkflow-requirements/)' \
  | tee outputs/phase-6/non-doc-diff.log
```

期待: 出力が空（docs と skill SSOT 以外の変更なし）

### Task 6-2: 現存 coverage の確認

```bash
bash scripts/coverage-guard.sh 2>&1 | tee outputs/phase-6/coverage-guard.log
echo "exit=$?" >> outputs/phase-6/coverage-guard.log
```

期待: exit 0 / 全 package / 全 metric ≥80%

## 成果物

- `outputs/phase-6/non-doc-diff.log`
- `outputs/phase-6/coverage-guard.log`
- `outputs/phase-6/coverage-applicability.md`
