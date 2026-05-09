# task-11-public-top-and-member-list

[実装区分: 実装仕様書]

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | W5（05-screens-public） |
| mode | parallel（task-12 / task-13..17 と並列可、上流 task-08/09/10 完了後に着手） |
| owner | - |
| 状態 | implemented-local / implementation / VISUAL_ON_EXECUTION |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| dependency order | task-08 (design-tokens-doc) / task-09 (tailwind-v4-setup) / task-10 (ui-primitives) → task-11 → task-18 (regression-smoke) |
| artifact ledger | root `artifacts.json` + `outputs/artifacts.json` parity |

## purpose

Cloudflare Workers + Next.js (`apps/web`) の公開層 2 画面（`/` トップ / `/(public)/members` 会員一覧）を、`docs/00-getting-started-manual/claude-design-prototype/` の構造（Hero + Stats + ZoneIntro + Timeline / 検索フィルタ + density + card↔table）に揃えて再構成する。データ取得は既存 API（`/public/stats`, `/public/members`）のみを利用し、OKLch tokens / ui-primitives（task-10 完成後）／ URL 正本検索状態の不変条件に整合させる。

## why this is not a restored old task

`apps/web/app/page.tsx` と `apps/web/app/(public)/members/page.tsx` は最小実装が既に存在するが、プロトタイプ要件（4 セクション構成、density 切替、card↔table、Filters の URL 正本化、Pagination meta、3 状態 boundary、stat anchor）に未到達。本 task は新規実装ではなく既存ファイルの**書き換え + 公開コンポーネント群の新設**であり、過去 archive の再開ではない。

## scope in / out

### Scope In
- `apps/web/app/page.tsx`（M: Hero / Stats / ZoneIntro / Timeline + recent 6 名 MemberGrid）
- `apps/web/app/(public)/layout.tsx`（M: PublicHeader / PublicFooter / Container 整理）
- `apps/web/app/(public)/members/page.tsx`（M: MembersSearch zod parse + MemberFilters + Grid|Table + Pagination meta + EmptyState）
- `apps/web/src/components/public/Hero.tsx`（M: eyebrow + h1 + 2 CTA + token グラデ）
- `apps/web/src/components/public/Stats.tsx`（C: 4 枚の StatCard、`data-stat` anchor）
- `apps/web/src/components/public/ZoneIntro.tsx`（C: 0→1 / 1→10 / 10→100 静的 3 カード）
- `apps/web/src/components/public/Timeline.tsx`（M: ol / time dateTime / 空時 EmptyState）
- `apps/web/src/components/public/MemberCard.tsx`（M: density=comfy/dense の 2 形態。list は MemberTable が担当）
- `apps/web/src/components/public/MemberGrid.tsx`（C: ul ベース grid）
- `apps/web/src/components/public/MemberTable.tsx`（C: table ベース）
- `apps/web/src/components/public/MemberFilters.client.tsx`（C: `'use client'` URL 書き換え）
- `apps/web/src/components/public/DensityToggle.client.tsx`（C: radiogroup）
- `apps/web/src/components/public/PublicHeader.tsx` / `PublicFooter.tsx`（C: layout 用）
- `apps/web/src/lib/api/public.ts`（C: `getStats` / `listMembers` / `getMemberProfile` / `getFormPreview` の薄い wrapper、Zod strict parse）
- `apps/web/src/lib/url/members-search.ts`（M: `density` / `tags[]` を Zod で parse、`toApiQuery` 提供）
- 単体テスト: `Hero.test.tsx` / `Stats.test.tsx` / `MemberCard.test.tsx` / `members-search.test.ts` / `lib/api/public.test.ts`
- Playwright smoke: `apps/web/playwright/tests/public-top-and-list.spec.ts`（`/`, `/members`, `/members?density=list`, `/members?density=invalid`, `/members?q=zzz_no_match_zzz`、各 axe critical=0）

### Scope Out
- `/(public)/members/[id]` / `/register` / `/privacy` / `/terms`（task-12）
- 認証層 `/login` / `/profile`、管理層 `/(admin)/**`
- 新 API endpoint 追加（既存 `/public/stats` `/public/members` のみ消費）
- `apps/api/**` への変更
- D1 schema / Google Form 仕様変更
- token 定義（task-08 正本）/ tailwind 設定（task-09 正本）/ primitive 内部実装（task-10 正本）
- 国際化（日本語固定）
- production smoke（staging 完結）

## dependencies

### Depends On
- task-08 W3 design-tokens-doc（`apps/web/src/styles/tokens.css` の `--ubm-color-*` / `--ubm-color-zone-{a..e}`）
- task-09 W3 tailwind-v4-setup（`var(--ubm-color-*)` を class から参照可能な状態）
- task-10 W4 ui-primitives（`Button` / `Card` / `Badge` / `Input` / `Select` / `Avatar` / `EmptyState` / `Field` / `Stat` の export）
- task-02 W2 wrangler-env-injection（`getEnv()` / `getPublicEnv()` 経由の `PUBLIC_API_BASE_URL` / Workers binding）
- task-04 W4 logger-and-error-reporting（fetch wrapper の失敗ログは logger 経由。Sentry SDK 直 import 禁止）
- task-05 W4 error-boundary-and-staging-smoke（`error.tsx` / `loading.tsx` の存在を前提に EmptyState / ErrorState を使い分け）

### Blocks
- task-18 W6 regression-smoke（19 routes 包括 regression / verify-design-tokens の走査対象に `apps/web/src/components/public/**` を加える）

## refs

- 一次原典: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-w5-par-public-top-and-member-list.md`
- ワークフロー上位: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- phase 出力: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-{1,2,3}/phase-N.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- 設計仕様: `docs/00-getting-started-manual/specs/00-overview.md` / `01-api-schema.md` / `09-ui-ux.md`（存在時）
- Token 正本: `docs/00-getting-started-manual/specs/09b-design-tokens.md`（task-08 出力）+ `apps/web/src/styles/tokens.css`
- 既存 API contract: `apps/api/src/routes/public/{stats,members,member-profile,form-preview}.ts` + `@ubm-hyogo/shared` の `PublicStatsViewZ` / `PublicMemberListViewZ` / `PublicMemberListItemZ` / `PublicMemberProfileZ`

## AC

1. `apps/web/app/page.tsx` が **Hero / Stats / ZoneIntro / Timeline + 任意の MemberGrid（recent 6）** で構成され、`<h1>` が 1 個、`data-page="home"` / `data-component="hero"` / `data-stat="total|public|zones|sync"` を持つ
2. `apps/web/app/(public)/members/page.tsx` が `searchParams` を `parseSearchParams` で zod parse し、`listMembers(search, { revalidate: 30 })` の結果を **MemberFilters + (MemberGrid | MemberTable) + Pagination meta** で render する
3. `density=list` で `<table>` が出る、`density=invalid` で `comfy` fallback、`q` / `zone` / `status` / `tag[]` / `sort` がそのまま `/public/members?...` に転送される
4. `MemberFilters.client.tsx` が `useRouter` + `useSearchParams` で URL を書き換え、F5 / share URL で状態が復元される
5. `list.items.length === 0` 時に `EmptyState`（「該当するメンバーがいません」+ クリア link）が表示される
6. `apps/web/src/lib/api/public.ts` が `getStats` / `listMembers` / `getMemberProfile` / `getFormPreview` を提供し、すべての fetch を `XxxZ.parse()`（strict 定義済み schema） 経由で型安全化する
7. `D1Database` / `@cloudflare/workers-types` の D1 binding を `apps/web/**` で **import していない**（不変条件 #5）
8. 色は `var(--ubm-color-*)` または `var(--ubm-color-zone-*)` 経由のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` は 0 件（task-18 verify-design-tokens 整合）
9. revalidate: stats=60s、members=30s が `apps/web/app/page.tsx` / `apps/web/app/(public)/members/page.tsx` に明記される
10. Playwright smoke `apps/web/playwright/tests/public-top-and-list.spec.ts` が 5 ケース（`/` / `/members` / `?density=list` / `?density=invalid` / `?q=zzz_no_match_zzz`）を持ち、各で `axe critical=0` を確認する
11. vitest（filter ロジック / API wrapper / Hero / Stats / MemberCard）が pass し、`pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` が pass する
12. `apps/api/src/routes/public/**` への変更は **無し**（既存 endpoint 消費のみ）
13. PR 本文に Phase 12 implementation-guide.md 主要見出しが反映され、Phase 11 evidence canonical path が参照されている

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証（local PASS 5 点セット）
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/artifacts.json（root `artifacts.json` mirror。`cmp -s artifacts.json outputs/artifacts.json` で一致確認）
- outputs/phase-01..13/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## invariants touched

- #5 `apps/web` から D1 直接アクセス禁止（fetch wrapper 経由のみ）
- #1 stableKey 経由でのみ field を参照（一覧では `PublicMemberListItemZ` 固定フィールド）
- #2 consent キーは `publicConsent` / `rulesConsent` のみ（一覧は非表示・命名予約のみ）
- #4 GAS prototype を本番仕様に昇格させない（参照のみ）
- OKLch tokens 正本化（HEX 直書き禁止）
- URL query を search 状態の正本にする
- revalidate: stats=60s, members=30s（無料枠を意識）

## completion definition

全 13 phase 仕様書、root/output `artifacts.json` parity、Phase 12 strict 7 成果物、aiworkflow 導線が揃い、`apps/web` 側の変更対象ファイル・関数シグネチャ・テスト・Playwright smoke コマンド・DoD が明記されている。コード実装はローカル反映済み。staging deploy、runtime smoke、commit、push、PR 作成はユーザー承認後の実行ゲートで完遂する。
