# Phase 5 — 実装手順

## 前提

- ブランチ: `feat/login-ui-balance-and-runtime-fix`（dev 起点）
- 実装 mode: `new`
- lane 並列可: lane-1（UI: A/B）/ lane-2（runtime: C）/ lane-3（prototype: D）。lane-4（gate/visual）は lane-1/2 完了後

## 事前確認（必須）

1. `apps/web/src/lib/env.ts` に `getAuthEnv()` / `getPublicFetchEnv()` と `INTERNAL_API_BASE_URL` が存在することを確認。
   ```bash
   rg -n "INTERNAL_API_BASE_URL" apps/web/src/lib/env.ts
   ```
   schema 追加は行わない。full `EnvSchema` は required、auth/proxy path は `AuthEnvSchema.partial()` で unset fallback を扱う。
2. `apps/web/wrangler.toml` の `[env.staging.vars]` に `INTERNAL_API_BASE_URL` が staging API URL で設定済みであることを確認。
3. `git status` がクリーンであることを確認。

## lane-1: UI 修正

### A-1: `apps/web/src/styles/auth.css`

```css
/* Before (94-106) */
.auth-card .ui-input[data-size="lg"] {
  min-height: 44px;
  padding: 0 var(--ubm-space-3);
  font-size: var(--ubm-text-base);
}

/* After */
.auth-card .ui-input[data-size="lg"] {
  height: 44px;
  padding: 0 var(--ubm-space-4);
  font-size: var(--ubm-text-base);
  line-height: 1.25;
}
.auth-card .ui-input[data-size="lg"]:focus-visible {
  outline: 2px solid var(--ubm-color-accent);
  outline-offset: 2px;
}
```

### B-1 / B-2: `apps/web/src/styles/legacy-public.css`

該当 `[data-size]` / `[data-size="lg"]` セレクタ群（195-220 付近）を以下に置換:

```css
[data-size]:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button) {
  /* 既存ブロック中身そのまま */
}
[data-size="lg"]:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button) {
  /* 既存ブロック中身そのまま */
}
```

`::after` 系も同パターンで `:not([data-component="google-brand-icon"])` を前置する。

### B-1 防御層: `apps/web/src/styles/auth.css`（末尾追加）

```css
.auth-card [data-component="google-brand-icon"] {
  background: transparent;
  border: 0;
  padding: 0;
}
.auth-card [data-component="google-brand-icon"]::before,
.auth-card [data-component="google-brand-icon"]::after {
  content: none;
}
```

### `GoogleBrandIcon.tsx`

変更なし（Decision 通り）。

## lane-2: runtime 修正

### C-1: `apps/web/app/api/auth/magic-link/route.ts`

```ts
// Before (5-12)
const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return "http://127.0.0.1:8787";
};

// After
import { getAuthEnv } from "@/lib/env";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = getAuthEnv().INTERNAL_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};
```

### C-2: `apps/web/app/api/auth/magic-link/verify/route.ts`

同パターンで置換。`process.env` 残置ゼロを `rg -n "process\.env" apps/web/app/api/auth` で確認。

### C-2 追加 sweep

```bash
rg -n "process\.env\[?['\"]INTERNAL_API_BASE_URL" apps/web/src apps/web/app
```

ヒットした production code を全て同パターンで `getAuthEnv()` / `getPublicFetchEnv()` 経由に置換。テストファイルは grep gate の除外対象。

### C-3: grep gate スクリプト

`scripts/verify-no-process-env-internal-api.sh` を Phase 4 のテスト計画通り新規作成し、`chmod +x`。

## lane-3: prototype 修正

### D-1-a: `docs/00-getting-started-manual/claude-design-prototype/index.html`

行 1025-1027 を以下に置換（SRI 撤去 + jsdelivr 固定）:

```html
<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
```

### D-1-b: `scripts/serve-prototype.sh`

Phase 2 D-1 セクションのスクリプトを新規作成し、`chmod +x scripts/serve-prototype.sh`。

`docs/00-getting-started-manual/claude-design-prototype/index.html` の `<head>` 末尾近くに 1 行コメント追加:

```html
<!-- Local dev: run `bash scripts/serve-prototype.sh 5180` then open http://127.0.0.1:5180/ -->
```

## lane-4: gate / visual（lane-1/2/3 完了後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-no-process-env-internal-api.sh
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/api/auth/magic-link/route.route.spec.ts \
  apps/web/app/api/auth/magic-link/verify/route.route.spec.ts
mise exec -- pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts --update-snapshots
```

visual baseline 差分を目視確認し、AC-1/AC-2 起因のみであれば commit。

## 変更ファイル一覧（DoD チェック）

| 種別 | ファイル |
| ---- | -------- |
| 編集 | `apps/web/src/styles/auth.css` |
| 編集 | `apps/web/src/styles/legacy-public.css` |
| 編集 | `apps/web/app/api/auth/magic-link/route.ts` |
| 編集 | `apps/web/app/api/auth/magic-link/verify/route.ts` |
| 追加 | `apps/web/app/api/auth/magic-link/route.route.spec.ts`（必要なら） |
| 追加 | `apps/web/app/api/auth/magic-link/verify/route.route.spec.ts`（必要なら） |
| 追加 | `scripts/verify-no-process-env-internal-api.sh` |
| 編集 | `docs/00-getting-started-manual/claude-design-prototype/index.html` |
| 追加 | `scripts/serve-prototype.sh` |
| 編集 | `apps/web/playwright/tests/visual/login.spec.ts` の baseline png（自動更新） |
| 確認 | `apps/web/src/lib/env.ts`（既存 accessor 確認、schema 追加なし） |

## ローカル実行コマンド（再掲）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck && mise exec -- pnpm lint
bash scripts/verify-no-process-env-internal-api.sh
mise exec -- pnpm --filter @repo/web exec vitest run \
  apps/web/app/api/auth/magic-link/route.route.spec.ts \
  apps/web/app/api/auth/magic-link/verify/route.route.spec.ts \
  apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx
mise exec -- pnpm --filter @repo/web exec playwright test playwright/tests/visual/login.spec.ts
bash scripts/serve-prototype.sh 5180  # 別ターミナルで起動して manual 確認
```

## DoD

- `pnpm typecheck` / `pnpm lint` green
- 上記 vitest targeted run green
- `scripts/verify-no-process-env-internal-api.sh` exit 0
- playwright baseline 更新差分が AC-1/AC-2 範囲のみ
- staging deploy 後 `POST /api/auth/magic-link` が 200/202（Phase 11）
- `bash scripts/serve-prototype.sh` でプロトタイプが描画される（Phase 11）
