# Output Phase 9: 品質保証

## status

EXECUTED

## Quality Gates 実測

| Gate | 内容 | コマンド | 結果 | Evidence |
| --- | --- | --- | --- | --- |
| Typecheck | apps/web 型検査 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS (exit=0) | `outputs/phase-11/typecheck.log` |
| Focused tests | callback / provider / verify helper | `pnpm --filter @ubm-hyogo/web test -- <2 file>` | 26 PASS | `outputs/phase-11/test.log` |
| Boundary check | apps/web → D1/apps/api 直接参照 0件 | `node scripts/lint-boundaries.mjs` | PASS (exit=0) | `outputs/phase-11/boundary-check.log` |
| Route smoke (manual) | callback success/failure | curl + dev server | NOT_EXECUTED（自動 route test で代替済） | — |
| Docs sync | Phase 12 の 7 成果物 | 既存 phase12-task-spec-compliance-check.md | PASS | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Command Resolution Rule

- `apps/web/package.json` の `typecheck` / `test` script を参照し、Phase 4 / 9 / 11 / 12 で同一コマンドを使用。
- root vitest config の `include` glob `apps/**/app/**/*.test.{ts,tsx}` に新 route test が含まれることを確認。
