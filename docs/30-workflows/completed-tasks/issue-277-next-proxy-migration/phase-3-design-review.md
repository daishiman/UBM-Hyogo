# Phase 3: 設計レビュー

## レビュー観点と結論

| 観点 | 評価 | 備考 |
|---|---|---|
| Next.js 16 公式 migration path 準拠 | ✅ | 公式 codemod `@next/codemod middleware-to-proxy` を採用 |
| 振る舞い変更の有無 | ✅ | function 名と file 名のみ変更、ロジック完全保持 |
| 不変条件 #5（D1 直接アクセス禁止）維持 | ✅ | `decodeAuthSessionJwt` の JWT verify のみ、D1 binding を触らない |
| 不変条件 #9（`/no-access` 専用画面に依存しない） | ✅ | redirect 先は `/login?...` のみ |
| 不変条件 #11（admin/profile HTML を未認証 SSR させない） | ✅ | proxy で先に redirect / 403、SSR に到達しない |
| Cloudflare Workers (`@opennextjs/cloudflare`) 互換 | ✅ | proxy.ts は Next.js 16 標準、OpenNext Workers が対応済 |
| 既存 test impact | ✅ | middleware に対する単体 test は現存しないので破壊なし。新規 proxy.spec.ts を追加 |

## 代替案検討

| 案 | 採否 | 理由 |
|---|---|---|
| codemod 不使用、完全手動 rename | 却下 | codemod は公式推奨かつ idempotent。手作業 risk を増やす意味がない |
| 一時的に `middleware.ts` と `proxy.ts` を併存 | 却下 | Next.js は両方存在時に warning/conflict、運用上 anti-pattern |
| 関数を `proxy` ではなく default export のみに統一 | 却下 | 公式 doc は `proxy` named export を例示、可読性のため踏襲 |

## リスク

| リスク | 対策 |
|---|---|
| codemod が想定外の差分を出す | Phase 5 step 1 で diff を確認、想定外なら手動 revert + 手動 rename |
| Cloudflare Workers build で proxy.ts が認識されない | Phase 5 step 4 で `pnpm --filter @ubm-hyogo/web build` を実行、warning/error 確認 |
| matcher 文字列の static analyze 失敗 | matcher は string literal のまま維持（変更しない） |

## 承認

設計通り Phase 4 へ進む。

## メタ情報

| 項目 | 値 |
|---|---|
| workflow | issue-277-next-proxy-migration |
| phase | 3 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

設計が公式 migration path、既存 auth gate、不変条件、Cloudflare Workers 境界に反していないことを確認する。

## 実行タスク

- 公式 codemod 方針をレビューする。
- 振る舞い変更がないことをレビューする。
- リスクと対策を Phase 5 / 6 / 11 に接続する。

## 参照資料

- Phase 1 要件。
- Phase 2 設計。
- `apps/web/middleware.ts`

## 成果物

- 本 Phase 3 設計レビュー。
- リスク対策表。

## 完了条件

- 代替案の採否理由が明記されている。
- Phase 4 へ進める review gate が成立している。

## 統合テスト連携

レビュー済みリスクは Phase 6 の unit tests と Phase 11 の smoke evidence で検証する。
