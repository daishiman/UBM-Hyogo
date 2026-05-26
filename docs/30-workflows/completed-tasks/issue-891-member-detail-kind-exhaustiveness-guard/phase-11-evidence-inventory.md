# Phase 11: エビデンス目録

実装完了後に以下を `outputs/phase-11/` 配下に格納する。spec 作成時点では空ディレクトリのみを用意し、実装サイクルで埋める。

## エビデンス一覧

| ID | 名称 | パス | 種別 | 取得タイミング |
|----|------|------|------|--------------|
| EV-01 | typecheck pass log | `outputs/phase-11/typecheck.log` | log | 実装後 `pnpm typecheck` |
| EV-02 | lint pass log | `outputs/phase-11/lint.log` | log | 実装後 `pnpm lint` |
| EV-02b | web lint pass log | `outputs/phase-11/web-lint.log` | log | 実装後 `pnpm --filter @ubm-hyogo/web lint` |
| EV-03 | focused adapter spec log | `outputs/phase-11/focused-tests.log` | log | 実装後 focused vitest |
| EV-03b | focused MemberLinks component spec log | `outputs/phase-11/member-links-focused-tests.log` | log | `linkSections` 接続後 focused vitest |
| EV-04 | coverage report 抜粋 | `outputs/phase-11/coverage-summary.txt` | log | 実装後 `pnpm test:coverage` |
| EV-05 | web 全体 unit test log | `outputs/phase-11/web-tests.log` | log | regression 確認 |
| EV-06 | build log | `outputs/phase-11/build.log` | log | 実装後 `pnpm build` |
| EV-07 | typecheck fail 証跡（`KIND_ROUTE` 1 key 削除時） | `outputs/phase-11/typecheck-fail-evidence.md` | md | Phase 10 手順 |
| EV-08 | visual snapshot diff rationale | `outputs/phase-11/visual-diff-rationale.md` | md | 差分発生時のみ |
| EV-09 | `__testInternals` 参照漏れ検査結果 | `outputs/phase-11/test-internals-grep.log` | log | Gate-B grep |
| EV-10 | Phase 12 compliance verify | `outputs/phase-11/phase12-compliance-verify.log` | log | Phase 12 compliance validator |

## 取得コマンド

```bash
OUT=docs/30-workflows/issue-891-member-detail-kind-exhaustiveness-guard/outputs/phase-11

mise exec -- pnpm typecheck 2>&1 | tee "$OUT/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$OUT/lint.log"
pnpm --filter @ubm-hyogo/web lint 2>&1 | tee "$OUT/web-lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts 2>&1 | tee "$OUT/focused-tests.log"
pnpm exec vitest run apps/web/src/components/public/__tests__/MemberLinks.component.spec.tsx \
  --root . --config vitest.config.ts 2>&1 | tee "$OUT/member-links-focused-tests.log"
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- \
  src/lib/adapters/__tests__/member-detail.spec.ts 2>&1 | tee "$OUT/coverage-summary.txt"
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee "$OUT/web-tests.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$OUT/build.log"
rg "__testInternals" apps/web/src -g '!**/__tests__/**' -g '!**/lib/adapters/member-detail.ts' \
  2>&1 | tee "$OUT/test-internals-grep.log" || true
pnpm verify:phase12-compliance docs/30-workflows/issue-891-member-detail-kind-exhaustiveness-guard \
  2>&1 | tee "$OUT/phase12-compliance-verify.log"
```

## ステータス

- spec 作成時点: ディレクトリ作成済み、ファイル未生成（実装サイクルで生成）
