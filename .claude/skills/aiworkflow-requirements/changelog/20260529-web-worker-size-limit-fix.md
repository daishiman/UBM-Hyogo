# 2026-05-29 web-worker-size-limit-fix

`web-worker-size-limit-fix` を `implemented_local_evidence_captured / implementation / NON_VISUAL`
として同期した。`next/og` / `ImageResponse` を Worker server bundle から撤去し、
静的 `apps/web/public/og-default.png` を `SITE.ogImagePath` の正本にした。
`scripts/check-worker-size.sh` と `web-cd.yml` deploy 前 gate を追加し、OpenNext
worker/handler 5 files gzip 2100KiB を確認した。

`@opennextjs/cloudflare@1.19.4` には `minify` config key が存在しないため、
無効な `minify:true` ではなく production minify 既定維持、`OPEN_NEXT_DEBUG` /
`debug:true` 禁止、OpenNext worker/handler gzip size gate を正本化した。
