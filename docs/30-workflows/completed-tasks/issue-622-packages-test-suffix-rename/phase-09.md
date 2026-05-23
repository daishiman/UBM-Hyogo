# Phase 9 — テスト計画

## 9.1 テスト方針

本タスクは rename-only でテスト本体は変更しないため、**新規テスト追加は行わない**。検証は既存テストの「件数一致 + PASS」で完結する。

## 9.2 検証マトリクス

| Test | コマンド | 期待 |
| --- | --- | --- |
| T-1: typecheck | `mise exec -- pnpm typecheck` | baseline と同 exit code・新規エラー 0 |
| T-2: lint | `mise exec -- pnpm lint` | baseline と同 exit code・新規エラー 0 |
| T-3: pnpm -r test 件数 | `mise exec -- pnpm -r test 2>&1 \| grep -E "Tests +[0-9]+ passed"` | baseline と同件数 |
| T-4: shared test PASS | `mise exec -- pnpm --filter '@ubm-hyogo/shared' test` | exit 0 |
| T-5: integrations test PASS | `mise exec -- pnpm --filter '@ubm-hyogo/integrations' test` | exit 0 |
| T-6: integrations-google test PASS | `mise exec -- pnpm --filter '@ubm-hyogo/integrations-google' test` | exit 0 |
| T-7: rename 残存ゼロ | `find packages -name '*.test.ts' -o -name '*.test.tsx' \| wc -l` | 0 |
| T-8: spec 件数一致 | `find packages -name '*.spec.ts' -o -name '*.spec.tsx' \| wc -l` | 28 |
| T-9: glob 参照ゼロ | `rg "packages/.*\.test\." .github/ apps/ scripts/` | 0 件 |
| T-10: git mv 履歴連続性 | `git log --follow packages/shared/src/errors.spec.ts` | rename 前の commit が表示 |

## 9.3 件数比較ベースライン取得

Phase 4 で取得した baseline log を `outputs/phase-11/evidence/baseline/` に保存し、rename 後の log と diff を取る。

```bash
diff /tmp/baseline-test-count.log outputs/phase-11/evidence/after-test-count.log | grep -E "^[<>].*Tests +"
```

passed 件数が一致していれば PASS。
