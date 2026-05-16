# Phase 9: 品質保証

> Phase: 9 / 13

---

## 目的

一括 gate コマンドで全 quality basis を確認する。

---

## 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
if mise exec -- pnpm verify:tokens; then
  echo "verify:tokens PASS"
else
  if rg -n 'bg-\[#|text-\[#|border-\[#|#[0-9A-Fa-f]{3,8}' apps/web/src; then
    echo "HEX or arbitrary color token found (NG)"
    exit 1
  else
    echo "fallback token grep PASS"
  fi
fi
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

---

## DoD（全 gate 成功必須）

- [ ] typecheck `completed (exit 0)`
- [ ] lint `completed (exit 0)`
- [ ] Vitest `completed (exit 0)`（既存 + 追加分）
- [ ] OpenNext build `completed (exit 0)`
- [ ] token gate `completed (0 violations)`
- [ ] Playwright visual `completed (exit 0)`
- [ ] axe `completed (0 violations)`
