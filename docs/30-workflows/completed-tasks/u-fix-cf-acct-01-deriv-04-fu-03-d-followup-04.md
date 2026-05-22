# Gate metadata structured ledger

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |

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

### 単体検証

```bash
test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json
jq '.metadata.gates // empty' docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json
```

期待: gate id / status / evidence_path / approver の構造化 metadata が存在する。

### 統合検証

```bash
rg -n "metadata.gates|evidence_path|approver" \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/phase12-task-spec-compliance-check.md \
  .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md
```

期待: Phase 12 compliance と workflow state 語彙が gate metadata を同じ意味で扱っている。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| false approval | evidence path と approver を必須化 |
| gate 文言 drift | artifacts schema を SSOT にし、Phase 12 compliance が実体確認する |

## 8. スコープ

### 含む

- `artifacts.json.metadata.gates[]` schema。
- schema validator と Phase 12 compliance check 連携。
- Issue #549 への適用。

### 含まない

- production switch 実行。
- gate 承認者の権限設計そのもの。
- Phase 11 evidence path schema の新設（followup-05）。

## 9. 苦戦箇所【記入必須】

- 対象: Gate-A〜D の approval / evidence ledger。
- 症状: gate 通過が文章だけだと、誰が何を根拠に通したか機械検証できない。
- 対策: gate id、status、evidence_path、approver を必須フィールドにする。

## 10. 参照情報

- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json`

## 11. 備考

production switch 実行は含めない。
