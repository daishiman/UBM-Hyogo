# Gate metadata structured ledger

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |

## 1. なぜこのタスクが必要か（Why）

Gate-A〜D が文章だけだと、どの gate がいつ誰により通過したかを機械的に検証できない。

## 2. 何を達成するか（What）

`artifacts.json.metadata.gates[]` の schema と validator を導入する。

## 3. どのように実行するか（How）

gate id、status、passed_at、evidence_path、approver を構造化する。

## 4. 実行手順

1. gate metadata schema を作る。
2. Phase 12 compliance check に schema validation を追加する。
3. 既存 approval-gated workflows へ適用可否を確認する。

## 5. 完了条件チェックリスト

- [ ] schema が存在する。
- [ ] validator が exit 0。
- [ ] Issue #549 に適用済み。

## 6. 検証方法

schema validation と Phase 12 compliance check を確認する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| false approval | evidence path と approver を必須化 |

## 8. 参照情報

- `docs/30-workflows/issue-549-cf-audit-ml-production-switch/artifacts.json`

## 9. 備考

production switch 実行は含めない。
