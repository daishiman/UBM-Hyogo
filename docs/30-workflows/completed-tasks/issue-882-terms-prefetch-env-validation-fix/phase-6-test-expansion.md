# Phase 6 — テスト拡張

## 拡張対象

- `site-metadata.spec.ts`:
  - production / staging / local / undefined fallback の 4 ケースで `getSiteUrl()` の URL と `buildBaseMetadata().robots` を網羅。
- `env.spec.ts`:
  - `PLAYWRIGHT_TEST=1` 経路で `getPublicEnvSafe` が `process.env` 上書きを反映すること。
- 既存 `apps/web/app/__tests__/` 内の layout 関連 spec があれば metadata throw 0 件を回帰アサート。

## 完了条件

- 上記 4 + α ケース追加で coverage 維持。
- 既存 spec の regression なし。
