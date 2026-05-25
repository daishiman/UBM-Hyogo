# Phase 2: 設計

## トポロジー

```
Request → apps/web/middleware.ts (edge)
            ├─ 既存: 認証ガード（admin/profile matcher）
            └─ env-driven CSP mode 取得
                  │
                  ├─ getSecurityHeaderEnv()  ← apps/web/src/lib/env.ts（新規 accessor）
                  │       └─ CSP_MODE（env var）→ cspMode: "report-only" | "enforce"
                  │
                  └─ applySecurityHeaders(response, cfg)
                           └─ buildSecurityHeaders(cfg)  ← apps/web/src/lib/security-headers.ts（変更なし）
```

## 変更ファイル一覧

| ファイル | 種別 | 責務 |
|---------|------|------|
| `apps/web/src/lib/env.ts` | 編集 | `EnvSchema` に `CSP_MODE` 追加 + `getSecurityHeaderEnv()` accessor 追加 |
| `apps/web/middleware.ts` | 編集 | `buildSecurityHeaderConfig()` を `getSecurityHeaderEnv()` 経由に差し替え |
| `apps/web/wrangler.toml` | 編集 | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `CSP_MODE` 追加 |
| `apps/web/src/lib/env.spec.ts` | 編集 or 新規 | `getSecurityHeaderEnv()` の unit テスト追加（既存ファイルの有無を実装時確認） |
| `apps/web/playwright/tests/security-headers.spec.ts` | 編集 | CSP ヘッダ名の動的解決 + 反対ヘッダ absent assert |

## `apps/web/src/lib/env.ts` 変更詳細

### EnvSchema への追加

```ts
// 既存 EnvSchema に以下フィールドを追加
CSP_MODE: z.enum(["report-only", "enforce"]).default("report-only"),
```

- `CSP_MODE` はレスポンスヘッダ制御値であり、クライアント公開秘匿値ではないため `NEXT_PUBLIC_` 接頭辞は不要
- 未設定時のデフォルト `"report-only"` により、env 未注入環境（ローカル開発・CI）は安全側動作を維持

### getSecurityHeaderEnv() 追加

```ts
const SecurityHeaderEnvSchema = EnvSchema.pick({
  NEXT_PUBLIC_API_BASE_URL: true,
  CSP_MODE: true,
});

export function getSecurityHeaderEnv(
  rawEnv: RawEnv = readRawEnv()
): { cspMode: "report-only" | "enforce"; apiBaseUrl: string } {
  const parsed = SecurityHeaderEnvSchema.parse(rawEnv);
  return { cspMode: parsed.CSP_MODE, apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL };
}
```

- `rawEnv` 引数によりテスト時に任意の env を注入可能（既存 `getEnv` パターンと同様）
- `env.ts` は `security-headers.ts` に依存させない（戻り型はシグネチャ上 `SecurityHeaderMode` と同一の文字列 union だが import 不要）
- `parse` 失敗時は zod throw → `app/error.tsx` の error boundary が補足（try/catch で握り潰さない）

## `apps/web/middleware.ts` 変更詳細

### 変更前（概念）

```ts
import { getPublicEnv } from "@/lib/env";

function buildSecurityHeaderConfig(): SecurityHeaderConfig {
  return {
    cspMode: "report-only",          // ← ハードコード
    apiBaseUrl: getPublicEnv().NEXT_PUBLIC_API_BASE_URL,
    authOrigin: "https://accounts.google.com",
  };
}
```

### 変更後（概念）

```ts
import { getSecurityHeaderEnv } from "@/lib/env";  // getPublicEnv は当ファイル内他箇所未使用のため import 差し替え

function buildSecurityHeaderConfig(): SecurityHeaderConfig {
  const env = getSecurityHeaderEnv();
  return {
    cspMode: env.cspMode,            // ← env-driven
    apiBaseUrl: env.apiBaseUrl,
    authOrigin: "https://accounts.google.com",
  };
}
```

- `getPublicEnv` が当 middleware ファイル内で他の用途に使われていない場合は import を差し替える
- `authOrigin` は Google OAuth の固定エンドポイントであり、env 変数化の必要なし

## `apps/web/wrangler.toml` 変更詳細

| セクション | 設定値 | 理由 |
|-----------|--------|------|
| `[vars]`（ローカル dev / fallback） | `CSP_MODE = "report-only"` | 開発環境では report-only で安全側動作 |
| `[env.staging.vars]` | `CSP_MODE = "enforce"` | staging は実ユーザー無し → enforce で即時違反検出・動作確認 |
| `[env.production.vars]` | `CSP_MODE = "report-only"` | 違反レポート観測完了まで report-only を維持。enforce 実切替は ops runbook の設定変更 + redeploy のみ |

### 段階導入の根拠

```
staging (enforce) ─→ 違反ゼロ確認 ─→ production enforce 実切替（ops runbook）
                     └─ 違反あり → directive 修正 → staging 再確認
```

production が report-only のまま staging だけ enforce にすることで、本番への影響リスクを排除しながら enforce 経路の動作を検証できる。

### production enforce 実切替 ops runbook 概要

production 切替は以下の手順のみでコード変更不要:

1. staging での CSP 違反レポート 0 件（またはすべて許容済み）を確認
2. `apps/web/wrangler.toml` の `[env.production.vars]` の `CSP_MODE` を `"enforce"` に変更
3. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production`
4. 直後に Playwright smoke + curl でヘッダ名が `content-security-policy` に変わったことを確認

## `apps/web/playwright/tests/security-headers.spec.ts` 変更詳細

### 変更前（概念）

```ts
// mode 固定
const cspHeader = headers["content-security-policy-report-only"];
expect(cspHeader).toBeDefined();
```

### 変更後（概念）

```ts
// CSP_MODE 環境変数に応じてヘッダ名を動的解決
const mode = process.env.CSP_MODE === "enforce" ? "enforce" : "report-only";
const cspHeaderName =
  mode === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";
const oppositeHeaderName =
  mode === "enforce"
    ? "content-security-policy-report-only"
    : "content-security-policy";

// active mode のヘッダが存在する
expect(headers[cspHeaderName]).toBeDefined();
// 反対 mode のヘッダは absent
expect(headers[oppositeHeaderName]).toBeUndefined();

// connect-src も active mode のヘッダから読む
const cspValue = headers[cspHeaderName];
expect(cspValue).toContain(process.env.NEXT_PUBLIC_API_BASE_URL);
```

- ローカル CI は `CSP_MODE` 未注入 → `"report-only"` → 既存挙動を維持
- staging CI は `CSP_MODE=enforce` を注入 → enforce ヘッダを assert

## エラーハンドリング

| ケース | 動作 |
|--------|------|
| `CSP_MODE` が `"report-only"` / `"enforce"` 以外の値 | zod `parse` throw → edge runtime の unhandled error → Next.js error boundary で補足（`app/error.tsx`） |
| `CSP_MODE` 未設定 | `default("report-only")` により throw しない（安全側動作） |
| `NEXT_PUBLIC_API_BASE_URL` 未設定 | 既存 `EnvSchema` の既定動作（required）で throw |

## issue #868 ソフト依存の明記

`report-to` / `Reporting-Endpoints` ヘッダの追加は issue #868 スコープ。本タスクは Reporting-Endpoints 無しで enforce が機能する設計（CSP は reporting endpoint なしでも enforce モードで動作する）。
#868 完了後に `buildCspDirective` へ `report-to` ディレクティブを追加する別タスクが発生するが、本タスクの変更と衝突しない（lib API は変更しないため）。

## 責務境界サマリ

| 層 | ファイル | 責務 |
|----|---------|------|
| env schema | `env.ts` | CSP_MODE の型定義・デフォルト・validation |
| env accessor | `env.ts` | `getSecurityHeaderEnv()` — middleware への注入口 |
| ヘッダ生成（純関数） | `security-headers.ts` | `buildSecurityHeaders(cfg)` — Headers instance 生成（変更なし） |
| ヘッダ適用（副作用） | `security-headers.ts` | `applySecurityHeaders(response, cfg)` — response に merge（変更なし） |
| 配線 | `middleware.ts` | env → cfg → apply の接続 |
| 環境ごとの値 | `wrangler.toml` | 3 環境の CSP_MODE 値管理 |
