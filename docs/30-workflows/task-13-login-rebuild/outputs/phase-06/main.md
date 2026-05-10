# Phase 6 単体テストログ — task-13-login-rebuild

## 追加ファイル

| 種別 | パス | テスト数 |
| --- | --- | --- |
| A | `apps/web/app/login/_components/__tests__/LoginCard.test.tsx` | 5 |
| A | `apps/web/app/login/_components/__tests__/LoginPanel.test.tsx` | 7 |
| M | `apps/web/src/lib/url/login-query.test.ts` | +2（`state="error"` / 200 文字超 truncate） |
| M | `apps/web/app/login/_components/MagicLinkForm.test.tsx` | +1（送信失敗時 `state=error` URL 遷移） |

## 実行結果

Focused run:

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/url/login-query.test.ts apps/web/app/login/_components/MagicLinkForm.test.tsx apps/web/src/lib/auth/magic-link-client.test.ts
```

Result: 3 files / 29 tests passed。

Full web run:

```bash
pnpm --filter @ubm-hyogo/web test
```

Result: 68 files passed / 1 skipped, 510 tests passed / 1 skipped。

## カバレッジ観点

- 6 状態 × 表示要素（Banner / link）を `getByText` / `getByRole` で確認
- gate=admin_required で warn Banner が input に追加されること
- error メッセージが `role="alert"` 配下に出ること
- LoginCard の `data-testid` / `data-component` / `data-state` 契約
- Magic Link 送信失敗時に local component state ではなく `/login?state=error&error=...` へ遷移すること
