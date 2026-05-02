# Output Phase 6: 異常系検証

## 異常系マトリクス E-1〜E-10

| # | 異常パターン | 検出経路 | 期待挙動 | HTTP / error | evidence |
| --- | --- | --- | --- | --- | --- |
| E-1 | production で `MAIL_PROVIDER_KEY` 未設定 | `POST /auth/magic-link` 実行時 | request 単位 fail-closed | 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }` | Phase 6 + 09c runtime evidence |
| E-2 | staging で `MAIL_PROVIDER_KEY` 未設定 | smoke 実行時 | dev 同等 no-op success | 200（smoke 上は AC fail） | Phase 11 |
| E-3 | `MAIL_FROM_ADDRESS` 未設定 | request 時 | `defaultFromAddress` fallback で送信成功（意図と異なる from） | 200 | 警告ログ（実装委譲） |
| E-4 | `MAIL_FROM_ADDRESS` 不正（`@` 含まず / 空） | Resend 422 → `ok: false` | route が 502 `MAIL_FAILED` 変換 | 502 | L1 単体 |
| E-5 | `AUTH_URL` 未設定 | メール本文 URL | `defaultBuildMagicLinkUrl` の localhost fallback → 受信者 click 不可 | 200（送信成功、click 後失敗） | Phase 11 staging click 試験 |
| E-6 | `AUTH_URL` 不一致（実 origin 異なる） | callback resolution | host mismatch → Auth.js 4xx | callback 4xx | Phase 11（status のみ、token 非記録） |
| E-7 | secret rotation 中 | 切替 window | `secret put` atomic、isolate 反映 1〜2 req lag。inflight は旧値完了 | 200（境界 1〜2 req は許容） | rotation 設計は Phase 11 委譲 |
| E-8 | staging→production env drift | `secret list` の name 比較 | name 集合不一致 → drift。runbook で再投入 | name 比較 diff | `outputs/phase-09/main.md` drift check |
| E-9 | 旧名 (`RESEND_API_KEY`) 誤投入 | Phase 5 Step 4 | `secret list` に旧名 → `secret delete` 後正本名で再投入 | `secret delete RESEND_API_KEY` | Phase 5 rollback |
| E-10 | docs に旧名残存 | L3 doc grep | rg hit → CI fail | grep サマリ | Phase 4 / Phase 9 |

## E-1: production fail-closed 詳細

- 対象: `POST /auth/magic-link` 等 mail 依存 endpoint
- 条件: `c.env.MAIL_PROVIDER_KEY` が undefined / 空文字
- 挙動: `resolveMailSender` が no-op sender、`sender.send()` が `ok: false, errorMessage: "MAIL_PROVIDER_KEY not configured"`、route が 502 `MAIL_FAILED` 変換
- ログ: `logger.error({ event: "mail_failed", reason: "MAIL_PROVIDER_KEY not configured" })`（値非出力）

boot fail 不採用 — `/healthz` / `/public/*` / cron が mail 非依存のため request 単位に閉じる（#14 free-tier monitor 衝突回避）。

## E-3 / E-4: `MAIL_FROM_ADDRESS`

- E-3: `defaultFromAddress` fallback は dev / test のみで許容。production は L2 契約テストで `wrangler.toml` 存在 assert
- E-4: Resend 422 を mock fixture で再現（L1）

## E-5 / E-6: `AUTH_URL`

- E-5: dev 専用 `http://localhost:3000` fallback。Phase 11 staging smoke で click 目視
- E-6: `[env.<env>.vars]` を deploy 実 origin に合わせる

## E-7: rotation 動作モデル

- Cloudflare Workers secret 更新は atomic、isolate 反映に 1〜2 req lag
- 旧値で送信中の inflight は失敗せず完了、新 req から新値
- staging で先行確認後 production
- rotation 直前直後 5 分の smoke は inflight 影響を受け得るため次 cold start 後で判定
- 旧 secret は新値投入 + smoke pass 後に `secret delete`

## E-8: drift 検出

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | jq -r '.[].name' | sort > /tmp/staging-names.txt
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | jq -r '.[].name' | sort > /tmp/production-names.txt
diff /tmp/staging-names.txt /tmp/production-names.txt
```

一致すべき項目: `MAIL_PROVIDER_KEY` / `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`。一時ファイルは `rm -f` で削除。

## E-9: 旧名 rollback

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep -E '^(RESEND_API_KEY|RESEND_FROM_EMAIL|SITE_URL)$'
bash scripts/cf.sh secret delete RESEND_API_KEY --config apps/api/wrangler.toml --env staging
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env staging
```

## E-10: 旧名残存検出

Phase 4 L3 rg を CI / lefthook で実行。hit 0 件 expected。例外マーカー `<!-- doc-grep-allow: legacy-name -->` は本タスク Phase docs のみ許可。

## #16 遵守

E-1〜E-10 の evidence は env 名 / state / status code / name 集合のみ記録。Resend body / token / 実アドレス / 値 hash を転記しない。ログは `logger.error({ event, reason })` 構造で値非含有。

## 次 Phase への引き渡し

- E-1〜E-10 マトリクスと evidence path
- E-1 production fail-closed 詳細仕様
- E-7 rotation 動作モデル / E-8 drift 検出 / E-9 旧名 rollback
- 異常系における #16 遵守ルール
