# Phase 10 — ローカル実行・検証手順

## 1. 初回セットアップ

```bash
# Node 24 / pnpm 10 を mise で固定
mise install
mise exec -- pnpm install

# Playwright browser binary
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install chromium
```

## 2. 本 spec 単体実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts
```

期待結果: `6 passed` / `0 skipped` / `0 failed` / 終了コード 0。

## 3. デバッグ実行

```bash
# headed mode（ブラウザを可視化）
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts --headed

# debug mode（inspector 起動・step 実行）
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts --debug

# 単一 test
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-identity-conflicts.spec.ts -g "成功系: merge"
```

## 4. 静的解析

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

## 5. drift gate 手動実行

```bash
SPEC=apps/web/playwright/tests/admin-identity-conflicts.spec.ts

grep -n "mergedMemberId" "$SPEC"               # 期待: 0 hit
grep -nE "test\.skip|test\.fixme" "$SPEC"      # 期待: 0 hit
grep -nE "fetch\(|http://" "$SPEC"             # 期待: 0 hit
grep -nE "bg-\[#|text-\[#" "$SPEC"             # 期待: 0 hit
wc -l "$SPEC"                                   # 期待: 200-240 行
```

## 6. DoD 自動検証（参考スクリプト）

```bash
SPEC=apps/web/playwright/tests/admin-identity-conflicts.spec.ts
[ -f "$SPEC" ] || { echo "FAIL: spec missing"; exit 1; }
LINES=$(wc -l < "$SPEC")
[ "$LINES" -ge 200 ] && [ "$LINES" -le 240 ] || { echo "FAIL: lines $LINES out of 200-240"; exit 1; }
grep -q "adminPage" "$SPEC" && grep -q "memberPage" "$SPEC" && grep -q "anonymousPage" "$SPEC" \
  || { echo "FAIL: 3 roles not all present"; exit 1; }
echo "OK"
```
