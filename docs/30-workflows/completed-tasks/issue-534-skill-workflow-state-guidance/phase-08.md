# Phase 8: 単体・統合テスト実行

本タスクには runtime 単体テスト追加なし。Phase 4 で定義した静的検査（grep gate / link 到達性 / changelog 連番 / LOGS sync）を Phase 8 として実行し、log を `outputs/phase-11/evidence/` に保存する。

## 8.1 状態語彙網羅検査

```bash
rg -n 'spec_created|CONTRACT_READY_IMPLEMENTATION_PENDING|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING|implemented_local_evidence_captured|completed' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md \
  | tee outputs/phase-11/evidence/grep-vocabulary.log
```

期待: 5 識別子それぞれが 1 件以上ヒット。

## 8.2 禁止表記節の自己整合検査

```bash
rg -n 'PASS 単独|状態混在' .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md \
  | tee -a outputs/phase-11/evidence/grep-vocabulary.log
```

期待: 1 件以上ヒット。

## 8.3 SKILL.md References 表登録検査

```bash
grep -E 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md \
  | tee outputs/phase-11/evidence/link-reachability.log
```

期待: 2 件以上ヒット。

## 8.4 既存 reference link 検査

```bash
for f in phase-12-spec.md phase12-skill-feedback-promotion.md phase-template-phase11.md; do
  if grep -q workflow-state-vocabulary ".claude/skills/task-specification-creator/references/$f"; then
    echo "PASS: $f"
  else
    echo "FAIL: $f"
  fi
done | tee -a outputs/phase-11/evidence/link-reachability.log
```

期待: 3 件すべて PASS。

## 8.5 changelog 連番検査

```bash
head -10 .claude/skills/task-specification-creator/SKILL-changelog.md | grep 'v2026.05.08-skill-workflow-state-vocabulary' \
  | tee outputs/phase-11/evidence/changelog-sync.log
```

期待: 1 件ヒット（既存最新行の上に挿入されている）。

## 8.6 LOGS/_legacy.md sync 検査

```bash
grep 'issue-534' .claude/skills/task-specification-creator/LOGS/_legacy.md \
  | tee outputs/phase-11/evidence/logs-sync.log
```

期待: 1 件以上ヒット。

## 8.7 compliance-check テンプレ章構成検査

```bash
rg -n '^## ' .claude/skills/task-specification-creator/references/phase12-compliance-check-template.md \
  | tee outputs/phase-11/evidence/compliance-check-structure.log
```

期待: 「観点」「検証コマンド」「drift」を含む章見出しが揃っている。

## 8.8 失敗時の対処

- いずれかが FAIL の場合は Phase 5 ランブックの該当 Step に戻り修正
- 修正後は本 Phase 全体を再実行

## DoD

- [ ] grep-vocabulary.log / link-reachability.log / changelog-sync.log / logs-sync.log / compliance-check-structure.log が `outputs/phase-11/evidence/` に揃う
- [ ] 全検査が PASS（FAIL ゼロ）

## 次フェーズへの引き渡し

Phase 9 では不変条件・契約整合性（既存 reference との矛盾なし、状態名の不変、SKILL-changelog.md 過去行の不変）を確認する。
