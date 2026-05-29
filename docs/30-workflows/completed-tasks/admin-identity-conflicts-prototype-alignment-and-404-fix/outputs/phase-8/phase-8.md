# Phase 8: 観測性 / Logging 仕様

**[実装区分: 実装仕様書]**

`/admin/identity-conflicts` の (A) UI prototype alignment + (B) staging ADMIN_FETCH_404 修正サイクルにおける、観測性 (logging / metrics / tracing) の追加・既存活用仕様。実コード変更は最小限に保ち、既存 `AdminSectionErrorClient` + Sentry tag scheme を再利用する。

## 1. 観測対象イベント

| イベント | 種別 | 既存/新規 | 発火点 |
|----------|------|-----------|--------|
| `admin_section_error` | client log + Sentry breadcrumb | 既存 (`AdminSectionErrorClient`) | `safeServerFetch` の `!ok` 分岐 / B 系 404 再発時 |
| `identity_conflict_merge_success` | server log (info) | 既存 (API route 側) | `POST /admin/identity-conflicts/:id/merge` 成功 |
| `identity_conflict_merge_failure` | server log (warn) + Sentry | 既存 | merge route 例外 / 409 conflict |
| `identity_conflict_dismiss_success` | server log (info) | 既存 | `POST /admin/identity-conflicts/:id/dismiss` 成功 |
| `admin_fetch_404` (新規 narrow event) | server log (warn) + Sentry tag | **新規** | `safeServerFetch` が status=404 を返した場合に Sentry に `section=admin.identity-conflicts` tag 付き warn を発火 |

> 新規 `admin_fetch_404` の目的は「B 系再発を tag 検索 1 回で staging から拾えること」。実装は `apps/web/src/lib/admin/safe-server-fetch.ts` 内で 404 時のみ `Sentry.captureMessage` を 1 行追加する。

## 2. Sentry tag scheme

| tag key | value | 用途 |
|---------|-------|------|
| `area` | `admin.identity-conflicts` | route 単位フィルタ |
| `event` | `admin_fetch_404` / `admin_section_error` | event 種別 |
| `upstream.status` | HTTP status 数値 | 404/500 切り分け |
| `upstream.path` | `/admin/identity-conflicts...` (cursor 等 query は redact) | proxy path 一致確認 |

PII (responseEmail 等) を tag に載せない。`upstream.path` は query string を `?…redacted` に置換した値のみ。

## 3. ログ出力フォーマット (server)

```ts
logger.warn("admin_fetch_404", {
  area: "admin.identity-conflicts",
  upstreamStatus: 404,
  upstreamPath: redactQuery(path),
  requestId: c.var.requestId,
});
```

- `apps/web` 側は `console.warn` ベース + Sentry 連携 (既存 logger module を使用)
- `apps/api` 側は merge/dismiss 既存 logger を流用、追加なし

## 4. メトリクス (任意 / 後段)

| metric | 取り方 | 採否 |
|--------|--------|------|
| identity_conflict.list_404_rate | Sentry tag 検索 + 期間内件数 | **採用** (Sentry dashboard で 24h ウィンドウ) |
| identity_conflict.merge_success_count | 既存 server log | 採用 (既存 dashboard 流用) |
| identity_conflict.dismiss_count | 既存 server log | 採用 |
| Cloudflare Workers Analytics の per-route 404 ratio | Workers Analytics | 後段 / FU 候補 |

## 5. tracing / breadcrumb

- `AdminSectionErrorClient` は既に Sentry breadcrumb を 1 件 push する設計。本サイクルでは挙動変更なし。
- 新規 `admin_fetch_404` のみ Sentry `captureMessage` を 1 件追加し、breadcrumb は既存経路に委ねる。

## 6. 検証コマンド

```bash
# local: warn ログが Sentry mock に渡るかを vitest で検証
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/admin/safe-server-fetch.spec.ts

# staging: Sentry UI で tag 検索
#   area:admin.identity-conflicts event:admin_fetch_404
# 直近 24h で 0 件 (修復後) を期待
```

## 7. DoD

- [ ] `safe-server-fetch.ts` に `admin_fetch_404` 1 行 warn が追加されている
- [ ] vitest で 404 mock 時に warn が発火することを検証
- [ ] Sentry tag scheme (`area` / `event` / `upstream.status`) が PII を含まない
- [ ] B 系修復後、staging で `admin_fetch_404` の発生件数が 0 件 / 24h であることを Phase 11 evidence に記録
- [ ] 既存 `admin_section_error` 挙動に regression なし (既存 spec green)

## 8. 参照

- 親: `outputs/phase-1/phase-1.md` (スコープ宣言)
- 隣接: `outputs/phase-7/phase-7.md` (エラーハンドリング設計)
- 後段: `outputs/phase-9/phase-9.md` (PII redaction invariant 検証)
- 後段: `outputs/phase-11/phase-11.md` (Sentry tag 0 件の evidence 取得)
