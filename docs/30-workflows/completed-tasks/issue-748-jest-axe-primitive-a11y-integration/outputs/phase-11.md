# Phase 11 — Evidence

[実装区分: 実装仕様書]

## 11.1 取得する evidence

| 種別 | パス | 取得タイミング |
| --- | --- | --- |
| local test log | `outputs/phase-11/local-test.log` | 実装プロンプト Phase 6 T4 実行直後 |
| full web test log | `outputs/phase-11/web-test.log` | AC-6 local web test 実行直後 |
| typecheck log | `outputs/phase-11/typecheck.log` | Phase 6 T5 直後 |
| lint log | `outputs/phase-11/lint.log` | Phase 6 T5 直後 |
| diff サマリ | `outputs/phase-11/diff-summary.txt` | PR 作成直前（`git diff dev...HEAD --stat`） |
| untracked inventory | `outputs/phase-11/untracked-files.txt` | PR 作成前の未追跡成果物棚卸 |

## 11.2 取得コマンド

```bash
mkdir -p docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11

mise exec -- pnpm --filter web test -- apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx 2>&1 \
  | tee docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/local-test.log

mise exec -- pnpm --filter web test 2>&1 \
  | tee docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/web-test.log

mise exec -- pnpm typecheck 2>&1 \
  | tee docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/typecheck.log

mise exec -- pnpm lint 2>&1 \
  | tee docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/lint.log

git diff dev...HEAD --stat \
  > docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/diff-summary.txt

git ls-files --others --exclude-standard \
  > docs/30-workflows/issue-748-jest-axe-primitive-a11y-integration/outputs/phase-11/untracked-files.txt
```

## 11.3 visualEvidence

NON_VISUAL（test 内部の a11y 検証のみで UI 画面差分は無い）。
