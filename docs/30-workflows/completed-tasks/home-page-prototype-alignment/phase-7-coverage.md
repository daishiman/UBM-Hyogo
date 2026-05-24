# Phase 7 — カバレッジ確認

## 目的

今回の UI/CSS 変更に対して、coverage 数値よりも selector contract と visual evidence の欠落を優先確認する。

## 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- public
mise exec -- pnpm verify:tokens
```

## 完了条件

- ✅ public component focused tests が PASS すること
- ✅ 追加 CSS 範囲の HEX grep 0 件
- ✅ `pnpm verify:tokens` PASS（review 中に検出した OG image 既存 HEX も同 cycle で修正済み）
