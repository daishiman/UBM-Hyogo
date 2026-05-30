# web-worker-size-limit-fix lesson

2026-05-29 / task_type: implementation / NON_VISUAL / Cloudflare Workers (OpenNext)。

## L-WWSL-001: implementation workflow を spec-only で close しない

Implementation workflows that identify concrete code targets must not close as
docs-only/spec-only when the same cycle can safely implement the fix. 本タスクは
Worker gzip 3316KiB > 3072KiB 超過に対し、具体的な code target（OG generator 2
ファイル削除 + 静的 PNG + size gate）を特定できたため、同サイクルで実装まで完遂し
`implemented_local_evidence_captured` とした。

## L-WWSL-002: adapter config key を install 済み型定義で検証してから spec を書く

Verify adapter config keys against installed type definitions before writing
the spec. `@opennextjs/cloudflare@1.19.4` does not expose a `minify` config key,
so `minify:true` is not a valid remediation. 無効な設定を追加せず production 既定の
minify を維持し、`OPEN_NEXT_DEBUG` / `debug:true` 禁止を regression spec で担保する。

## L-WWSL-003: 重量依存の除去 + 静的 fallback を優先する

Prefer dependency removal + static asset fallback for `next/og` / `ImageResponse`
when the Worker Free 3MiB gzip limit is the governing constraint. `next/og` は
`resvg.wasm`（1346KB）+ `yoga.wasm`（70KB）+ Geist フォント（123KB）≒ 1539KB を
bundle に焼き込む。動的 OG を静的共通 PNG（`public/og-default.png`）に置換して 700KB+
を削減する。

## L-WWSL-004: gzip 計測対象は handler.mjs（bootstrap worker.js ではない）

Measure `apps/web/.open-next/server-functions/default/apps/web/handler.mjs`
gzip size in local/CI gates, not the tiny `.open-next/worker.js` bootstrap.
閾値（hard 3072KiB / warn 2800KiB）を `scripts/check-worker-size.sh`・`web-cd.yml`・
正本 spec・実装ガイドで一貫させる。

## anti-pattern

- ❌ 制約根拠が確定しているのに実装可能な fix を spec-only で先送りする。
- ❌ 存在しない adapter config key を推測で追加する。
- ❌ size gate を bootstrap `worker.js` に当てて軽量と誤判定する。
- ❌ 再発防止 gate（CI size gate）を入れずに依存撤去だけで close する。
