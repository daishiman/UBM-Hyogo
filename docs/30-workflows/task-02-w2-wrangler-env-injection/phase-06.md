# Phase 6: 異常系検証

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理 / `apps/web/.dev.vars.example` 新規 / `apps/web/src/lib/env.ts` 新規 / `apps/web/src/lib/__tests__/env.test.ts` 新規 / `apps/web/next.config.ts` 最小修正を伴う）

## 6.1 目的

`getEnv()` および wrangler.toml 由来の env 注入経路における失敗ケースを網羅的に列挙し、各ケースで「どこで」「どのように」失敗が観測されるか、また「テストでどう機械検証するか」を確定する。Phase 1〜5 で確定した実装方針（zod 検証付き `getEnv()` / `[vars]` 経由注入 / `getCloudflareContext()` 優先 + `process.env` フォールバック）に対する負側のカバレッジを担う。

## 6.2 失敗ケース表

| # | ケース | 入力 / 状況 | 期待挙動 | 検証手段 | 検証ファイル |
|---|--------|------------|----------|----------|-------------|
| F-01 | zod parse 失敗時の throw 経路 | `NEXT_PUBLIC_API_BASE_URL` を欠落させて `getEnv()` を呼ぶ | `ZodError` を throw（`required` violation）。呼び出し側で catch されない場合は Next.js `error.tsx`（task-05）に到達 | `vi.stubEnv` で必須キーを undefined にし、`expect(() => getEnv()).toThrow(z.ZodError)` | `apps/web/src/lib/__tests__/env.test.ts` |
| F-02 | `getCloudflareContext()` 未定義（Node ランタイム） | `require("@opennextjs/cloudflare")` が throw する状況 | `try/catch` で握りつぶし、`process.env` にフォールバック。`getEnv()` は通常通り `process.env` から parse | `vi.mock("@opennextjs/cloudflare", () => { throw new Error("not in workers") })` で require throw を再現し、`process.env` 値が反映されることを assert | 同上 |
| F-03 | `getCloudflareContext()` は存在するが `ctx.env` が undefined | Workers ランタイムだが env binding 未注入 | `process.env` フォールバックに切り替わる。`process.env` も欠落していれば F-01 と同じ ZodError | mock で `getCloudflareContext` が `{}` を返すケースを検証。process.env だけ渡してパスすることを確認 | 同上 |
| F-04 | `SENTRY_TRACES_SAMPLE_RATE` 範囲外 | `"1.5"` または `"-0.1"` を注入 | `z.coerce.number().min(0).max(1)` により `ZodError` | `vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "1.5")` で throw を確認 | 同上 |
| F-05 | URL 形式不正 | `NEXT_PUBLIC_API_BASE_URL = "not-a-url"` | `z.string().url()` により `ZodError`（invalid_string / url） | `vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "not-a-url")` で throw 検証 | 同上 |
| F-06 | `AUTH_SECRET` 短すぎる | 16 文字未満の文字列を注入 | `z.string().min(16)` により `ZodError`（too_small） | `vi.stubEnv("AUTH_SECRET", "short")` で throw 検証 | 同上 |
| F-07 | `process.env` 完全欠落 | `process.env` を空 object に置換し getCloudflareContext も throw | 必須キー全件で violation を含む `ZodError` を throw。`error.issues.length >= 5` を assert | `vi.stubGlobal("process", { env: {} })` + getCloudflareContext throw mock | 同上 |
| F-08 | `wrangler.toml` の typo | `NEXT_PUBLIC_API_BASE_URL` の代わりに `NEXT_PUBLI_API_BASE_URL` 等の誤キーが配置 | wrangler dry-run 自体は通る（wrangler は任意キーを受け入れる）が、`getEnv()` が必須キー欠落で F-01 経路に落ちる | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` 通過後の build 段階で観測。CI gate `pnpm --filter @ubm-hyogo/web build` で OpenNext build が env 解決を試みた段階で fail | Phase 9 staging dry-run + build ステップ |
| F-09 | `127.0.0.1:8888` 焼き込み残存 | grep で hit する箇所が apps/web/src 配下に残る | DoD §11 違反。CI gate `rg '127\.0\.0\.1:8888' apps/web/src` が 0 件でない場合は fail | `rg` の終了コード（hit 時 0）を NG とする逆判定 | Phase 9 grep ゲート |
| F-10 | `process.env.NEXT_PUBLIC_API_BASE_URL` の直接参照混入 | `lib/env.ts` 以外で `process.env.NEXT_PUBLIC_*` を直接参照 | env access 集約原則違反（Phase 8 DRY 原則）。CI gate `rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' apps/web/src` の hit が `lib/env.ts` のみであることを確認 | grep の出力を `--files-with-matches` で集計し allowlist 比較 | Phase 9 grep ゲート |
| F-11 | Cloudflare Secret が wrangler.toml に直書き | `SENTRY_DSN_WEB` 値がコミット済み wrangler.toml 内に存在 | DoD §11 違反。`rg 'oklch\|sk-\|whsec_'` 等 secret パターンで検出 | secret パターン grep、ヒット時 fail | Phase 9 grep ゲート |
| F-12 | `ENVIRONMENT` enum 違反 | `"prod"` 等 enum 外の値 | `z.enum(["local","staging","production"])` で `ZodError`（invalid_enum_value） | `vi.stubEnv("ENVIRONMENT", "prod")` で throw 検証 | env.test.ts |

## 6.3 観測ポイント

| 観測層 | 失敗ケース | ハンドラ |
|--------|-----------|---------|
| build 時（OpenNext） | F-08 | `pnpm --filter @ubm-hyogo/web build` の終了コード非ゼロ |
| runtime 初回 access | F-01〜F-07, F-12 | `app/error.tsx`（task-05 で実装） / Sentry（task-03 で実装）に伝搬 |
| CI gate（grep） | F-09, F-10, F-11 | `.github/workflows/` 既存 lint job に包含（task-18 で gate 化） |
| staging deploy dry-run | F-08（wrangler の任意キー受容のためここでは検出しない） | dry-run 自体は通過する。検出は build 時に委譲 |

## 6.4 ZodError 形状の固定

`getEnv()` が throw する `ZodError` の `issues[]` 形状は task-05 の `error.tsx` で reporter に渡されるため、以下の最低限のコントラクトを env.test.ts で固定する。

- `error.issues[i].path` が array で、最初の要素が違反した env キー名
- `error.issues[i].code` が `invalid_type` / `invalid_enum_value` / `too_small` / `invalid_string` のいずれか
- 複数違反時は `issues.length` で全件捕捉される（fail-fast せず一括 parse）

## 6.5 retry / fallback 方針

`getEnv()` は副作用なし read-only であるため retry は行わない。フォールバックは「`getCloudflareContext()` → `process.env`」の 1 段のみ。これ以上のフォールバック（例: dummy 値での continue）は **禁止**（zod 検証の意義を毀損するため）。

## 6.6 次フェーズへの引き渡し

Phase 7 の AC マトリクスでは、本フェーズで列挙した F-01〜F-12 の各ケースが AC のどれに紐付くかを N:M で結線する。特に F-01〜F-07 / F-12 は AC「zod 検証」、F-08〜F-11 は AC「grep ゲート」「dry-run」に対応する。
