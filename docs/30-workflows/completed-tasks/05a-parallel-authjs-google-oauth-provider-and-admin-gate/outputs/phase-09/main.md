# Phase 9 — 品質保証

## 検証結果

| コマンド | 結果 | 件数 |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | pass | shared / api / web / integrations / integrations-google 全 workspace |
| `mise exec -- pnpm lint` | pass | scripts/lint-boundaries.mjs (apps/web → D1 阻止) + tsc 全 workspace |
| `mise exec -- pnpm test` | 59 / 59 targeted pass | shared JWT/session-resolve/require-admin/admin route targeted suite |

## 不変条件マッピング再確認

| # | 検証手段 | 状態 |
| --- | --- | --- |
| #2 | session-resolve R-03 で rules_consent != consented を rules_declined にマップ | ✅ |
| #3 | OAuth profile email を `member_identities.response_email` に lookup | ✅ |
| #5 | `scripts/lint-boundaries.mjs` が apps/web に `D1Database` / `apps/api` token を禁止、boundary.test.ts も pass | ✅ |
| #7 | `SessionJwtClaims` に `responseId` 不在、auth.test.ts S-07 で payload key set 検証 | ✅ |
| #9 | middleware redirect 先 = `/login?gate=admin_required`、`/no-access` 不使用 | ✅ |
| #10 | `sessions` テーブル migration 追加無し | ✅ |
| #11 | UI gate (middleware.ts) + API gate (requireAdmin) 両方 fail-closed | ✅ |

## ライセンス / 依存追加

- `next-auth@5.0.0-beta.25` を `apps/web` に追加（MIT）
- 他の dependency 追加無し

## 既知の lint 警告

- mise が `.mise.toml` の trust 警告を出す（運用設定で抑制可、コードへの影響無し）
