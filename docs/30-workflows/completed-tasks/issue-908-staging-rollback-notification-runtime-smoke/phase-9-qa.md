---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 9: 品質保証 — タスク仕様書

| Phase | 9 | Phase名 | 品質保証 |
| --- | --- | --- | --- |

---

## 検証コマンドと期待結果

```bash
mise exec -- pnpm typecheck     # PASS（本タスクは TS コード変更なし）
mise exec -- pnpm lint          # PASS（同上）
bash -n scripts/runtime-smoke/schema-alias-rollback.sh                # PASS
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy --dry-run   # exit 0
mise exec -- pnpm gate-metadata:validate        # ERROR 0
mise exec -- pnpm verify:phase12-compliance     # status=pass
mise exec -- pnpm indexes:rebuild               # exit 0; generated indexes refreshed
bash scripts/verify-pr-ready.sh                 # all gates green
```

---

## QA Result（spec 記載・実行は本仕様書策定時に AI 側で実施）

| Item | Status |
| --- | --- |
| helper syntax | PASS |
| helper dry-run | PASS |
| implementation guide validator | PASS |
| Phase 11 canonical paths | PASS |
| gate-metadata:validate | PASS (`ERROR: 0`) |
| verify:phase12-compliance | PASS |
| typecheck | PASS |
| lint | PASS |
| indexes:rebuild | PASS |

---

## 次Phase

`phase-10-final-review.md`
