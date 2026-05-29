# Phase 9 — 品質保証

> line budget / link / mirror parity / token gate / structure gate を一括判定する。

---

## 1. 静的検証 suite

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test -- requests
mise exec -- pnpm --filter web build
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual tests/visual/admin-staging.spec.ts
```

---

## 2. token / structure gate

```bash
# OKLch トークン外（HEX 直書き）禁止
grep -rnE '#[0-9a-fA-F]{3,8}' apps/web/src/components/admin/RequestQueue*.tsx \
  apps/web/app/\(admin\)/admin/requests/page.tsx || echo "HEX literal: 0 hit (OK)"

# `style={` broad guard（issue-924）
grep -rn 'style=' apps/web/src/components/admin/RequestQueue*.tsx \
  apps/web/app/\(admin\)/admin/requests/page.tsx || echo "inline style: 0 hit (OK)"

# 新 primitive 追加なし確認
git diff dev...HEAD -- apps/web/src/styles/tokens.css | wc -l   # 0 期待
```

---

## 3. link 検証

```bash
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

期待: gate-metadata OK / verify:phase12 ok / verify-pr-ready green。

---

## 4. mirror parity

`.claude/skills/...` と `.agents/skills/...` の mirror は本タスクで触らない（要件外）。`indexes:rebuild` は same-wave で実行。

```bash
mise exec -- pnpm indexes:rebuild   # idempotent 期待
```

---

## 5. DoD

- [ ] §1〜§4 全 green。
- [ ] `bash scripts/verify-pr-ready.sh` green。
- [ ] required check 候補（visual / api test）が CI 上で green。
