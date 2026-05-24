# Phase 9: QA

## 1. 自動 QA

```bash
mise exec -- pnpm typecheck                                           # 全 workspace
mise exec -- pnpm lint                                                # 全 workspace
mise exec -- pnpm --filter @ubm-hyogo/web build                        # OpenNext build
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run                # vitest
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-prototype-alignment.spec.ts
mise exec -- pnpm verify:tokens                                      # token gate
```

すべて exit 0 を確認。

## 2. 手動 QA

| 確認項目 | 期待動作 |
|---|---|
| `/members` 初回ロード | header / footer / page-head / filter card / member-grid が描画 |
| Density: ゆったり / 密 / リスト 切替 | URL `density` query が変化し、レイアウトが対応する grid/table に切り替わる |
| 検索入力 | `q` query が反映、結果 0 件で empty-state |
| Sort 切替 | `sort` query 変化 |
| Mobile viewport (375px) | filter が 1 列、page-head が縦積み |
| Header「ログイン」リンク | hover で押下可能、`/login` へ遷移 |

## 3. 既存機能 regression 確認

- `/`、`/members/[id]`、`/login`、`/register` のレイアウトが本変更で崩れていないこと（同じ public layout を共有するため）
- `/admin/**` は admin layout なので影響なしのはず（layout 階層独立を確認）

## 4. 完了条件

- 自動 QA 全 pass
- 手動 QA 6 項目全 OK
- regression なし
