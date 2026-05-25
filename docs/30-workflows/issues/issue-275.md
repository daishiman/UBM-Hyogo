# [#275] UT-06B: MagicLinkForm 429 Retry-After server-truth restore

## メタ情報

```yaml
issue_number: 275
title: UT-06B: MagicLinkForm 429 Retry-After server-truth restore
state: OPEN
priority: 中
scale: -
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/275
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | 未実施 |

---

## Summary

06b `MagicLinkForm` が API 429 `Retry-After` を受けたとき、server-side rate limit を正本として cooldown 表示を復元する。

## Why

現状の 60 秒 cooldown は client state で、reload / 別タブでは失われる。05b API rate limit が正本なので、429 応答の `Retry-After` を UI に反映すると UX と依存関係が整う。

## Acceptance Criteria

- [ ] `sendMagicLink` が 429 応答時に `Retry-After` 秒数を typed error として返す
- [ ] `MagicLinkForm` が typed error を受け、該当秒数で button disabled / countdown を開始する
- [ ] reload 後の永続化はこの task では必須にしない。API 429 応答を受けた session 内復元を最小要件にする
- [ ] Vitest で 429 + `Retry-After: 60` の UI 復元を検証する

## Dependencies

- 05b `/auth/magic-link` 429 contract
- 06b `MagicLinkForm` / `sendMagicLink`

## Source

- 仕様書: `docs/30-workflows/completed-tasks/UT-06B-MAGIC-LINK-RETRY-AFTER.md`
- 親タスク: 06b-parallel-member-login-and-profile-pages

## Priority

Medium
