# UT-06B-MAGIC-LINK-RETRY-AFTER

## Summary

06b `MagicLinkForm` が API 429 `Retry-After` を受けたとき、server-side rate limit を正本として cooldown 表示を復元する。

## Why

現状の 60 秒 cooldown は client state で、reload / 別タブでは失われる。05b API rate limit が正本なので、429 応答の `Retry-After` を UI に反映すると UX と依存関係が整う。

## Acceptance Criteria

- `sendMagicLink` が 429 応答時に `Retry-After` 秒数を typed error として返す
- `MagicLinkForm` が typed error を受け、該当秒数で button disabled / countdown を開始する
- reload 後の永続化はこの task では必須にしない。API 429 応答を受けた session 内復元を最小要件にする
- Vitest で 429 + `Retry-After: 60` の UI 復元を検証する

## Dependencies

- 05b `/auth/magic-link` 429 contract
- 06b `MagicLinkForm` / `sendMagicLink`

## Priority

Medium.
