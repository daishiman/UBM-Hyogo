# Phase 6: テスト実装・カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

workflow yml 変更タスクのため新規 test 実装は不要。代わりに、リポジトリ全体の coverage が ≥80% を維持していることを `coverage-guard.sh` で確認する。

## 実行タスク

### Task 6-1: coverage-guard.sh ローカル実行

```bash
bash scripts/coverage-guard.sh 2>&1 | tee outputs/phase-6/coverage-guard.log
echo "exit=$?" >> outputs/phase-6/coverage-guard.log
```

期待: exit 0 / 全 package / 全 metric ≥80%

### Task 6-2: package 別 coverage-summary.json 集計

```bash
for f in apps/*/coverage/coverage-summary.json packages/*/coverage/coverage-summary.json packages/integrations/*/coverage/coverage-summary.json; do
  [ -f "$f" ] || continue
  pkg=$(echo "$f" | sed 's|/coverage/coverage-summary.json||')
  echo "== $pkg =="
  jq '.total | {l: .lines.pct, b: .branches.pct, f: .functions.pct, s: .statements.pct}' "$f"
done | tee outputs/phase-6/per-package-coverage.md
```

### Task 6-3: 未達 package があれば差戻し

| 状況 | アクション |
| --- | --- |
| 全 package / 全 metric ≥80% | Phase 7 へ進む |
| いずれか < 80% | 本タスク中断、Task C / D へ差戻し（Phase 1 NO-GO 条件と整合） |

## 成果物

- `outputs/phase-6/coverage-guard.log`
- `outputs/phase-6/per-package-coverage.md`

## 完了条件

- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] 全 package 全 metric (Statements / Branches / Functions / Lines) ≥80% を per-package-coverage.md で確認
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（apps/api / apps/web / packages/* 全パッケージ）

## タスク 100% 実行確認【必須】

- [ ] coverage-guard.log に exit code 記録あり
- [ ] per-package-coverage.md に全 package が列挙されている

## 次 Phase

Phase 7（テストカバレッジ確認）。
