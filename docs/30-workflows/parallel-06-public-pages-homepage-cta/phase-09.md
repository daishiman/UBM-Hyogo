# Phase 9: 統合 / 回帰

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 前 Phase | 8 |
| 次 Phase | 10 |
| 状態 | completed |

## 目的

HomePage / RegisterPage への影響と既存回帰を確認する。

## 回帰チェック

- [ ] `/` (HomePage): 既存 Hero / Stats / ZoneIntro / Timeline / MemberGrid のレンダリングが変化しない（snapshot diff は CTA 追加分のみ）
- [ ] `/(public)/register`: `FORM_RESPONDER_URL` 参照差し替え後も既存 fallback 動作が同等
- [ ] `/privacy`, `/terms`: 変更なし（無影響を grep で確認）
- [ ] design-tokens CI gate (`verify-design-tokens`) PASS
- [ ] playwright-smoke (chromium) があれば PASS（既存 smoke が `/` を含むなら）

## コマンド

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
rg -n "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" apps/web --glob "!apps/web/src/lib/constants.ts"  # 0 件
```

## 完了条件

- 上記すべて GREEN
- 影響範囲が想定通り（CTA 新規追加 + RegisterPage 1 行差し替え + constants 1 行追加に限定）
