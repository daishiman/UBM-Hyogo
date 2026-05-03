# Phase 5: 実装ランブック — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 5 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

`fetchPublic` を service-binding 優先 + HTTP fallback に統一する実装と、
staging / production deploy・tail 観測・local fallback smoke の実行手順を、
再現可能な runbook として固定する。本仕様書はランブックの定義のみを行い、
実 deploy（特に production）は user 明示指示後の Phase 11 で実行する。

## 実行タスク（ランブック構造の確定のみ）

1. 仕様化対象のコード差分（擬似 diff）を確定する
2. typecheck / build / staging deploy / staging curl smoke / staging tail の順序を確定する
3. production deploy / production curl smoke の gate（user 明示指示）を明記する
4. local `pnpm dev` での HTTP fallback regression smoke を確定する
5. evidence 集約先（`outputs/phase-11/`）と redaction ルールを確定する

## 参照資料

- apps/web/src/lib/fetch/public.ts（実コード・編集禁止）
- apps/web/wrangler.toml（実コード・編集禁止）
- apps/web/src/lib/auth.ts（参考: 既存 service-binding 実装）
- scripts/cf.sh / scripts/with-env.sh

## 仕様化対象の擬似 diff

### `apps/web/src/lib/fetch/public.ts`

```ts
// 経路:
// 1. Cloudflare Workers 上 (production/staging)
//    → service-binding `env.API_SERVICE.fetch(url, init)`
//      （同一 account workers.dev への外向き fetch loopback で 404 になる事象を回避）
// 2. それ以外 (local `next dev`)
//    → process.env.PUBLIC_API_BASE_URL の外向き fetch

import { getCloudflareContext } from "@opennextjs/cloudflare";

interface ServiceBinding { fetch: typeof fetch }
interface PublicEnv { API_SERVICE?: ServiceBinding; PUBLIC_API_BASE_URL?: string }

function readEnv(): PublicEnv {
  try { return getCloudflareContext().env as PublicEnv } catch { return {} }
}

async function doFetch(path: string, init: RequestInit & { next?: { revalidate: number } }) {
  const binding = readEnv().API_SERVICE;
  if (binding) {
    const url = `https://service-binding.local${path}`;
    return binding.fetch(url, init);
  }
  const baseUrl = readEnv().PUBLIC_API_BASE_URL
    ?? process.env.PUBLIC_API_BASE_URL
    ?? "http://localhost:8787";
  return fetch(`${baseUrl}${path}`, init);
}
```

### `apps/web/wrangler.toml`

```toml
[[env.staging.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api-staging"

[[env.production.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api"
```

> いずれも本タスクスコープでは「仕様化のみ」。実コード差分は実装済前提で参照する。

## 実行手順（ランブック詳細）

### 0. 前提

- `bash scripts/cf.sh whoami` で認証確認
- `wrangler` 直接実行は禁止（必ず `bash scripts/cf.sh` 経由）
- `apps/web/wrangler.toml` の `[[env.staging.services]]` `[[env.production.services]]` が
  binding `API_SERVICE` で `ubm-hyogo-api-staging` / `ubm-hyogo-api` を指している

### 1. 静的検証

```bash
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web build:cloudflare
```

### 2. staging deploy

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### 3. staging curl smoke（AC-3）

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<staging-web-host>/
curl -s -o /dev/null -w "%{http_code}\n" https://<staging-web-host>/members
```

evidence: `outputs/phase-11/staging-curl.log`（200 を期待）

### 4. staging tail 観測（AC-5）

```bash
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging
```

- 複数リクエスト（最低 2 件）を発生させ、log に `transport: 'service-binding'` が含まれることを確認
- redaction 後に `outputs/phase-11/wrangler-tail-staging.log` へ保存

### 5. production deploy（user 明示指示後の gate）

> 本ステップは user の明示 GO（例: 「production deploy 実行してよい」）が
> 出るまで実行しない。phase-05 では **手順の定義のみ** を行う。

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
curl -s -o /dev/null -w "%{http_code}\n" https://<production-web-host>/
curl -s -o /dev/null -w "%{http_code}\n" https://<production-web-host>/members
```

evidence: `outputs/phase-11/production-curl.log`（AC-4）

### 6. ローカル fallback smoke（AC-6）

```bash
# .dev.vars に以下を設定（実値はログに残さない）
#   PUBLIC_API_BASE_URL=http://localhost:8787
mise exec -- pnpm --filter web dev
# 別ターミナルで
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/members
```

evidence: `outputs/phase-11/local-dev-fallback.log`（200 を期待）

### 7. evidence 集約

- `outputs/phase-11/main.md` に各 AC の PASS / FAIL を集約
- `outputs/phase-11/code-diff-summary.md` に AC-1 / AC-2 の実装内容を要約
- `outputs/phase-11/redaction-checklist.md` で token / cookie / 個人情報の redaction を確認

## 多角的チェック観点

- ランブックを「実行する」のではなく「定義する」フェーズである
- production deploy は user 明示 GO まで実行しない
- secret は `op://` 参照経由で `bash scripts/with-env.sh` を介して動的注入

## 統合テスト連携

Phase 11 の `manual-smoke-log.md` / `link-checklist.md` / curl・tail・fallback evidence に接続する。Phase 5 は手順定義のみであり、runtime PASS は Phase 11 の実行結果だけで判定する。

## サブタスク管理

- [ ] 0〜7 の各ステップを実行可能な粒度で定義
- [ ] 擬似 diff が実コードと一致している（編集はしない）
- [ ] production deploy gate を明記
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- ランブックの 0〜7 ステップが実行可能な粒度で確定している
- production deploy が user 明示 GO で gate されている
- evidence path が Phase 7 AC マトリクスと一致している

## タスク100%実行確認

- [ ] `wrangler` 直接呼出が含まれていない
- [ ] secret 値が含まれていない
- [ ] 仮置きパスが含まれていない（host 名は `<staging-web-host>` など placeholder）

## 次 Phase への引き渡し

Phase 6 へ、ランブックの異常系・失敗時手順を渡す。
