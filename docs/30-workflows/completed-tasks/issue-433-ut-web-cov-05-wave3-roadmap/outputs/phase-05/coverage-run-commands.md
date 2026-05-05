# Coverage Run Commands

Status: `COMPLETED`

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
mise exec -- pnpm --filter @ubm-hyogo/shared test:coverage
mise exec -- pnpm --filter @ubm-hyogo/integrations test:coverage
```

## 実行ログ要約

- **web**: PASS。total line 86.88%, branch 90.17%, function 88.01%, statements 86.88% (3072 lines / 845 branches / 217 functions)。
- **api**: PASS。total line 88.76%, branch 83.01%, function 88.88%, statements 88.76% (10951 lines / 2631 branches / 567 functions)。
- **shared**: PASS。total line 95.51%, branch 86.00%, function 95.45%。
- **integrations**: PASS (58 tests)。`index.ts` 限定で 100% / 100% / 100%。

各 summary JSON はこのディレクトリ配下に複製済み。
