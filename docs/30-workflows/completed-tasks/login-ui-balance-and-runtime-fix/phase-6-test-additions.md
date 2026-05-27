# Phase 6 — テスト拡充

## 追加テスト一覧

| ID | 種別 | ファイル | 検証内容 |
| -- | ---- | -------- | -------- |
| T-C-01 | route | `apps/web/app/api/auth/magic-link/route.route.spec.ts` | `getAuthEnv()` 経由で upstream URL = `${INTERNAL_API_BASE_URL}/auth/magic-link` へ fetch される |
| T-C-02 | route | 同上 | trailing slash が除去される（`https://api.x/` → `https://api.x/auth/magic-link`） |
| T-C-03 | route | 同上 | `INTERNAL_API_BASE_URL` 未設定時に fallback `http://127.0.0.1:8787` を使う（dev 互換） |
| T-C-04 | route | `apps/web/app/api/auth/magic-link/verify/route.route.spec.ts` | T-C-01..03 と同パターン |
| T-A-01 | component | `apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx` | `<input>` と submit button の DOM 高さ属性（`data-size="lg"`）が一致 |
| T-B-01 | component | 同上 | `img[data-component="google-brand-icon"]` が render され、`alt=""` と `aria-hidden="true"` を持つ |
| T-GATE-01 | shell | `scripts/verify-no-process-env-internal-api.sh` | `apps/web/{src,app}` 配下に `process.env.INTERNAL_API_BASE_URL` 直参照 0 件 |
| T-D-01 | shell | manual: `scripts/serve-prototype.sh` + `curl` | `/index.html` 200、`/data.jsx` `Content-Type: application/javascript` |
| T-V-01 | visual | `apps/web/playwright/tests/visual/login.spec.ts` | baseline 差分が AC-1/AC-2 範囲のみ |

## fail-path テスト（追加）

### T-C-05: env unset 時の fallback

```ts
vi.unstubAllEnvs();
await POST(req);
expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8787/auth/magic-link");
```

理由: auth/proxy path は `AuthEnvSchema.partial()` 経由で local fallback を維持する。

### T-C-06: 空文字列のときも fallback に落ちる

```ts
vi.stubEnv("INTERNAL_API_BASE_URL", "");
// fetch 先が fallback の http://127.0.0.1:8787/auth/magic-link であることを assert
```

## 回帰 guard

| guard | 配置 | 内容 |
| ----- | ---- | ---- |
| pre-push 候補 | `lefthook.yml`（提案のみ・本タスクでは追加しない） | `bash scripts/verify-no-process-env-internal-api.sh` |
| CI gate 候補 | `.github/workflows/*` | 本タスクでは追加しない（Phase 12 unassigned 候補に登録） |

## 補助 command

```bash
# 全 fail-path 含む targeted run
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/api/auth/magic-link \
  apps/web/app/login/_components

# visual のみ
mise exec -- pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts
```

## 期待カバレッジ

`apps/web/app/api/auth/magic-link/route.ts` の `resolveApiBase()` と handler は branch 100%（未設定 / 空文字 / 正常 / trailing slash の 4 分岐）。
