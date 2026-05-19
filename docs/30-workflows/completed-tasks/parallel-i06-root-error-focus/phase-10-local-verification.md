---
phase: 10
title: local 検証
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 10 — local 検証

[実装区分: 実装仕様書]

## 1. 検証コマンド一式

実装完了後、ワークツリー root で以下を順に実行する:

```bash
# 1. typecheck
mise exec -- pnpm typecheck
# 期待: exit 0

# 2. lint
mise exec -- pnpm lint
# 期待: exit 0

# 3. test (本 spec のみ)
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx
# 期待: 2 PASS / 0 FAIL / 0 SKIP

# 4. grep-gate (HEX 直書き)
grep -nE '#[0-9a-fA-F]{3,8}' apps/web/app/error.tsx || echo "OK: 0 件"

# 5. grep-gate (任意色クラス)
grep -nE '\b(bg|text)-\[#' apps/web/app/error.tsx || echo "OK: 0 件"

# 6. diff 確認
git diff apps/web/app/error.tsx --stat
# 期待: 4 +/- 程度
```

## 2. 期待出力サンプル

### typecheck

```
> tsc -p .
✓ 0 errors
```

### test

```
 ✓ apps/web/app/error.spec.tsx (2)
   ✓ RouteError > マウント直後に h1 へ自動 focus が当たる
   ✓ RouteError > digest が渡された場合は画面に表示する

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

## 3. PR pre-flight

CLAUDE.md PR 自律フローに従い、push 前に必ず以下を実行する:

```bash
bash scripts/verify-pr-ready.sh
```

期待: exit 0（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift がいずれも検出されない）。

## 4. 検証失敗時の自動修復方針

| Gate | 失敗パターン | 修復 |
|------|------------|------|
| typecheck | `ref<HTMLHeadingElement>` 型不一致 | h1 を ref bind しているか、要素種別を再確認 |
| lint | unused `useRef` import | T-02 で ref を実際に bind したか確認 |
| test TC-01 | `toHaveFocus` not a function | Phase 6 §4 jest-dom setup を補完 |
| test TC-01 | focus が当たらない | useEffect 内の順序、`tabIndex={-1}` 付与を再確認 |
