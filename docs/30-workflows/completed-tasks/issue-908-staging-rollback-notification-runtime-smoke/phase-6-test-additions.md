---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 6: テスト拡充 — タスク仕様書

## メタ情報

| Phase | 6 | Phase名 | テスト拡充（fail path 防御） |
| --- | --- | --- | --- |

---

## 追加検証

### T-1: helper redact pipe の grep 検証

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy --dry-run \
  2>&1 | grep -E '(T[A-Z0-9]{8}/B[A-Z0-9]{8}/[A-Za-z0-9]{24}|Bearer [A-Za-z0-9._-]{20,})'
```

期待: 0 hit（dry-run 出力に secret pattern が現れない）

### T-2: helper user-gate fail-closed

```bash
echo "n" | bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy
```

期待: exit code 2 / "aborted by user" / curl POST / cf.sh 共に発火しない

### T-3: 親 focused vitest 回帰

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/workflows/schemaAliasRollbackNotification.spec.ts \
  apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts
```

期待: 2 files / 13 tests PASS（本タスクで親 implementation を変更しないため回帰なし）

### T-4: 親 artifacts.json schema 整合

```bash
node scripts/gate-metadata/validate.ts
```

期待: ERROR 0。evidence_path = `outputs/phase-11/evidence/staging-smoke.md` の実在検証 PASS。

---

## 完了条件

- [x] T-1〜T-4 を確定

---

## 次Phase

`phase-7-coverage.md`
