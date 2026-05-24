# Phase 11: 証跡インベントリ

| 種別 | パス | 取得方法 | 必須 |
|------|------|---------|------|
| adapter ソース | `apps/web/src/lib/adapters/member-detail.ts` | 実装で作成 | 必須 |
| adapter test | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 実装で作成 | 必須 |
| typecheck ログ | `outputs/phase-11/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/typecheck.log` | 必須 |
| lint ログ | `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/lint.log` | 必須 |
| adapter test ログ | `outputs/phase-11/adapter-test.log` | unit test 実行結果 | 必須 |
| component test ログ | `outputs/phase-11/component-test.log` | 既存テスト更新後の実行結果 | 必須 |
| visual snapshot 不変確認 | `outputs/phase-11/visual-snapshot-status.md` | `git status apps/web/playwright/tests/visual-full/` が clean であることを記録 | 必須 |
| PR pre-flight ログ | `outputs/phase-11/verify-pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 | tee ...` | 必須 |

## ディレクトリ

```
docs/30-workflows/issue-827-member-detail-adapter-and-visibility-defense/
├── phase-01..13.md
└── outputs/
    └── phase-11/
        ├── typecheck.log
        ├── lint.log
        ├── adapter-test.log
        ├── component-test.log
        ├── visual-snapshot-status.md
        └── verify-pr-ready.log
```
