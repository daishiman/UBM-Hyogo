# Phase 5 — データモデル / rename-mapping.csv schema

## 5.1 rename-mapping.csv schema

`outputs/phase-05/rename-mapping.csv` を生成する。

```csv
package,before,after,category
shared,packages/shared/src/auth.test.ts,packages/shared/src/auth.spec.ts,unit
shared,packages/shared/src/db/transaction.test.ts,packages/shared/src/db/transaction.spec.ts,db
shared,packages/shared/src/errors.test.ts,packages/shared/src/errors.spec.ts,unit
shared,packages/shared/src/gate-metadata/__tests__/schema.test.ts,packages/shared/src/gate-metadata/__tests__/schema.spec.ts,zod
shared,packages/shared/src/index.test.ts,packages/shared/src/index.spec.ts,unit
shared,packages/shared/src/logging.test.ts,packages/shared/src/logging.spec.ts,unit
shared,packages/shared/src/retry.test.ts,packages/shared/src/retry.spec.ts,unit
shared,packages/shared/src/schemas/admin/admin-request-resolve.test.ts,packages/shared/src/schemas/admin/admin-request-resolve.spec.ts,zod
shared,packages/shared/src/schemas/admin/tag-queue-resolve.test.ts,packages/shared/src/schemas/admin/tag-queue-resolve.spec.ts,zod
shared,packages/shared/src/schemas/identity-conflict.test.ts,packages/shared/src/schemas/identity-conflict.spec.ts,zod
shared,packages/shared/src/types/ids.test.ts,packages/shared/src/types/ids.spec.ts,unit
shared,packages/shared/src/utils/consent.test.ts,packages/shared/src/utils/consent.spec.ts,unit
shared,packages/shared/src/zod/field.test.ts,packages/shared/src/zod/field.spec.ts,zod
shared,packages/shared/src/zod/identity.test.ts,packages/shared/src/zod/identity.spec.ts,zod
shared,packages/shared/src/zod/index.test.ts,packages/shared/src/zod/index.spec.ts,zod
shared,packages/shared/src/zod/response.test.ts,packages/shared/src/zod/response.spec.ts,zod
shared,packages/shared/src/zod/viewmodel.test.ts,packages/shared/src/zod/viewmodel.spec.ts,zod
integrations,packages/integrations/google/src/forms/auth.test.ts,packages/integrations/google/src/forms/auth.spec.ts,unit
integrations,packages/integrations/google/src/forms/backoff.test.ts,packages/integrations/google/src/forms/backoff.spec.ts,unit
integrations,packages/integrations/google/src/forms/client.branches.test.ts,packages/integrations/google/src/forms/client.branches.spec.ts,unit
integrations,packages/integrations/google/src/forms/client.test.ts,packages/integrations/google/src/forms/client.spec.ts,unit
integrations,packages/integrations/google/src/forms/index.test.ts,packages/integrations/google/src/forms/index.spec.ts,unit
integrations,packages/integrations/google/src/forms/mapper.test.ts,packages/integrations/google/src/forms/mapper.spec.ts,mapper
integrations,packages/integrations/google/src/forms-client.test.ts,packages/integrations/google/src/forms-client.spec.ts,unit
integrations,packages/integrations/google/src/index.test.ts,packages/integrations/google/src/index.spec.ts,unit
integrations,packages/integrations/google/src/sheets/auth.contract.test.ts,packages/integrations/google/src/sheets/auth.contract.spec.ts,contract
integrations,packages/integrations/google/src/sheets/auth.test.ts,packages/integrations/google/src/sheets/auth.spec.ts,unit
integrations,packages/integrations/src/index.test.ts,packages/integrations/src/index.spec.ts,unit
```

**行数: 28 + header 1 = 29 行**

## 5.2 category 列の解釈

ADR 上の参考情報。本タスクでは category を **ファイル名に反映しない**（既存 `auth.contract.test.ts` 等の既存 prefix は温存）。新規 prefix 導入は将来別タスク。

## 5.3 CSV 正本化方針

本タスクでは、上記 29 行の `rename-mapping.csv` を `outputs/phase-05/rename-mapping.csv` に配置し、その CSV を `git mv` ループの唯一の入力にする。追加の `scripts/issue-622/generate-rename-mapping.sh` は作成しない。

```bash
OUT="docs/30-workflows/issue-622-packages-test-suffix-rename/outputs/phase-05/rename-mapping.csv"
test "$(wc -l < "$OUT" | tr -d ' ')" = "29"
tail -n +2 "$OUT" | cut -d, -f2 | sort > /tmp/issue-622-before.txt
find packages/shared packages/integrations -name '*.test.ts' -o -name '*.test.tsx' | sort > /tmp/issue-622-current.txt
diff -u /tmp/issue-622-current.txt /tmp/issue-622-before.txt
```

> category 列は ADR の補助情報であり、rename の機械入力は `before` / `after` のみ。精密分類のためにファイル名へ prefix を追加しない。
