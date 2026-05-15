# Phase 6: リファクタ / 品質

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 前 Phase | 5 (実装 Green) |
| 次 Phase | 7 (パフォーマンス / セキュリティ) |
| 状態 | completed |

## 目的

Green 後の最低品質基準を満たす。

## チェックリスト

- [ ] 重複定数排除: `実 responder URL literal が `apps/web` 配下では `constants.ts` 以外 0 件（`grep -rn` で確認）
- [ ] HEX 直書きゼロ: `rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/public/CallToActionCTA*` が 0 件
- [ ] Tailwind arbitrary value 不使用: `rg -n "bg-\[#|text-\[#" apps/web/src/components/public/CallToActionCTA*` 0 件
- [ ] DEFAULT_BODY が prototype 137-145 行の本文と意味的に整合（逐語一致は不要、主旨一致）
- [ ] `it.todo` / `test.todo` 残留なし
- [ ] unused import / unused var ゼロ（`pnpm lint`）
- [ ] component file の export は named export 1 つのみ（default export しない）

## 検証コマンド

```bash
pnpm lint
pnpm typecheck
rg -n "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" apps/web --glob "!apps/web/src/lib/constants.ts"  # 期待: 0 件
```

## 完了条件

- 上記すべて PASS
