# Phase 9: local 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | spec_created |

## 目的

local（runtime mutation 前）段階で達成可能な AC を全てチェックし、user-gated 操作に進める状態であることを確認する。

## local 段階チェックリスト

### AC 局所充足

- [ ] AC-1: `outputs/phase-02/secret-investment-plan.md` 存在 + 4 secrets 明記
- [ ] AC-2: `outputs/phase-02/variable-mirror-plan.md` 存在 + 7 vars 明記
- [ ] AC-3: `outputs/phase-02/inventory-before.md` 存在 + PENDING_USER_GATE placeholder
- [ ] AC-4: `outputs/phase-11/workflow-dispatch-dryrun.md` placeholder 存在 / `runtime-evidence/6h-success.md` placeholder 存在 / `runtime-evidence/heartbeat-after.txt` placeholder 存在
- [ ] AC-5: Phase 08 で runbook ADR 追記計画記述済
- [ ] AC-6: Phase 12 で 7 必須 output が揃う計画記述済
- [ ] AC-7: PR base = dev で PR summary ドラフト記述済（Phase 13）
- [ ] AC-8: CONST_007 遵守確認

### static check

```bash
mise exec -- pnpm typecheck    # local readiness command; result must be recorded when executed
mise exec -- pnpm lint         # local readiness command; result must be recorded when executed
```

### lefthook pre-commit

```bash
git add docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/
mise exec -- lefthook run pre-commit
# local readiness command; result must be recorded when executed
```

### sync check

```bash
mise exec -- pnpm sync:check
# 期待: origin/dev とローカルが同期、他 worktree の遅れ通知のみ
```

## 不変条件

1. runtime AC (RAC-1 〜 RAC-4) は本 Phase でチェックしない（runtime gate のため）
2. user-gated 操作（T-02 / T-03 / T-04 / T-09）は本 Phase でチェックしない
3. local チェックがすべて PASS でも runtime gate を意味しない（user が次の操作に進むのは別判断）

## fail 時の対応

| fail | 対応 |
| --- | --- |
| AC-1〜AC-8 のいずれかが不充足 | Phase 02-08 に戻り該当成果物を補完 |
| typecheck / lint fail | 差分内容を確認し、根本修正（`--no-verify` 禁止） |
| pre-commit hook fail | hook の判定根拠を確認し、必要なら hook 改善（CLAUDE.md sync-merge 例外規則準拠） |

## 完了条件

- [x] AC-1〜AC-8 を本 Phase でチェックする手順明記
- [x] static check 手順明記
- [x] runtime AC との境界明記

## 次 Phase

- 次: 10 (リファクタ)
