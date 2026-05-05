# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 |
| 次 Phase | 10 |
| 状態 | spec_created |

## 目的

Phase 4で定義した検証コマンドを実行し、fresh GET evidence、references/indexes、mirror、Issue参照形式を一括判定する。

## 実行タスク

1. evidence gateを実行する。
2. index生成を実行する。
3. references/indexes grepを実行する。
4. mirror差分を確認する。
5. AC matrixを更新する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 4 | phase-04.md | コマンド |
| Phase 7 | phase-07.md | AC |
| Phase 8 | phase-08.md | DRY化 |

## 実行手順

```bash
jq -e '.required_status_checks.contexts | type == "array"' outputs/phase-13/branch-protection-applied-dev.json
jq -e '.required_status_checks.contexts | type == "array"' outputs/phase-13/branch-protection-applied-main.json
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
rg -n "UT-GOV-001|Issue #303|Refs #303|branch protection|required_status_checks|contexts" .claude/skills/aiworkflow-requirements/references .claude/skills/aiworkflow-requirements/indexes
diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
```

## 統合テスト連携

NON_VISUAL のためUIテストは不要。検証ログを `outputs/phase-09/quality-gate.md` に保存する。

## 多角的チェック観点

- `jq` が失敗した場合はBLOCKEDであり、PASSにしない。
- GitHub API current facts とローカル evidence が違う場合、fresh GETを取り直す。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | evidence gate | pending |
| 2 | index生成 | pending |
| 3 | mirror確認 | pending |
| 4 | AC更新 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-gate.md | 品質ゲート結果 |

## 完了条件

- [ ] Phase 4の検証コマンド結果が記録されている
- [ ] BLOCKED項目がPASS扱いされていない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-09/quality-gate.md` を作成
- [ ] `artifacts.json` の Phase 9 状態を更新

## 次Phase

Phase 10: 最終レビュー
