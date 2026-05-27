# Phase 4 — テスト計画

## 方針

`implementation_mode: "new"` のため RED/GREEN サイクルで実装する。command suite は targeted run（`pnpm test` 全件は SIGKILL 既往ありのため不可）。

## テスト対象ファイル

| 種別 | パス | 目的 |
| ---- | ---- | ---- |
| route spec | `apps/web/app/api/auth/magic-link/route.route.spec.ts` | `getAuthEnv()` 経由の env stub → upstream URL 解決経路の確認 |
| route spec | `apps/web/app/api/auth/magic-link/verify/route.route.spec.ts` | 同上 |
| component | `apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx` | input/button DOM 属性が `data-size="lg"` のままで render されることを確認（CSS 適用は visual で見る） |
| component | `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | 既存テスト維持（regression） |
| visual | `apps/web/playwright/tests/visual/login.spec.ts` | baseline 差分が AC-1/AC-2 範囲のみであることを確認 |
| grep gate | `scripts/verify-no-process-env-internal-api.sh` | `apps/web/{src,app}` 配下に `process.env.INTERNAL_API_BASE_URL` 直参照が残らないことを assert |

## RED → GREEN シナリオ

### C-1 route.route.spec.ts

```ts
vi.stubEnv("INTERNAL_API_BASE_URL", "https://api.test.example/");
const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
await POST(new Request("https://web.test/api/auth/magic-link", { method: "POST", body: JSON.stringify({ email: "x@example.com" }) }));
expect(fetchMock).toHaveBeenCalledWith(
  "https://api.test.example/auth/magic-link",
  expect.objectContaining({ method: "POST" })
);
// trailing slash 正規化も確認
```

### C-2 verify route

同パターン。`POST /api/auth/magic-link/verify` で `https://api.test.example/auth/magic-link/verify` に fetch することを assert。

### C-3 grep gate

```bash
#!/usr/bin/env bash
# scripts/verify-no-process-env-internal-api.sh
set -euo pipefail
if rg -n "process\.env(?:\.INTERNAL_API_BASE_URL|\[['\"]INTERNAL_API_BASE_URL['\"]\])" \
  apps/web/src apps/web/app --glob '!**/*.spec.ts' --glob '!**/*.spec.tsx' 2>/dev/null; then
  echo "::error::process.env.INTERNAL_API_BASE_URL direct access detected; use env.ts accessors instead" >&2
  exit 1
fi
echo "ok: no direct process.env.INTERNAL_API_BASE_URL references"
```

### A-1 / B-1 / B-2 visual

```bash
pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts --update-snapshots
# 差分目視 → 採用なら commit
```

### D-1 prototype serve

```bash
bash scripts/serve-prototype.sh 5180 &
SERVE_PID=$!
sleep 1
curl -fsSI http://127.0.0.1:5180/index.html | head -1                  # 200
curl -fsSI http://127.0.0.1:5180/data.jsx | grep -i 'content-type:.*javascript'
kill $SERVE_PID
```

## targeted run コマンド集

```bash
# C 系 unit/route
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/api/auth/magic-link/route.route.spec.ts \
  apps/web/app/api/auth/magic-link/verify/route.route.spec.ts

# A/B 系 component（既存 + 追加）
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx \
  apps/web/app/login/_components/MagicLinkForm.component.spec.tsx

# grep gate
bash scripts/verify-no-process-env-internal-api.sh

# visual
mise exec -- pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts

# 静的 / 型
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 期待結果

| テスト | RED（修正前） | GREEN（修正後） |
| ------ | ------------- | --------------- |
| C-1 route spec | mock 効かず fallback URL fetch → assertion fail | `https://api.test.example/auth/magic-link` fetch → pass |
| C-2 verify route spec | 同上 | pass |
| C-3 grep gate | 2 件 hit → exit 1 | 0 件 → exit 0 |
| A-1/B visual | baseline 差分大（input サイズ・Google アイコン） | baseline 更新後 0 diff |
| D-1 prototype | `curl /data.jsx` で `text/plain` または 404 | `application/javascript` 200 |

## カバレッジ目標

C-1/C-2 の `resolveApiBase()` 100%（fallback path / 正常 path / trailing slash 正規化）。それ以外は既存 coverage 維持。
