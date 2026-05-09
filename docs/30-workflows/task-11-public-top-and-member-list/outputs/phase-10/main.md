# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

Phase 11 / 12 / 13 へ進む前に、コード品質 / 不変条件 / 上流契約整合 / Diff scope 規律を全件チェックする。

## 実行タスク

- [ ] チェックリスト全項目を [x] にする
- [ ] FAIL があれば該当 phase まで戻す

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- Phase 5 §実装手順 / Phase 9 §grep gate

## 成果物

- `outputs/phase-10/main.md`

## 統合テスト連携

- Phase 7 AC matrix と Phase 9/11 evidence の対応漏れを最終確認する。
- Diff scope と grep gate の結果を Phase 12 compliance check へ渡す。

## レビュー観点チェックリスト

### コード品質

- [ ] `Hero` / `Stats` / `ZoneIntro` / `Timeline` / `MemberCard` / `MemberGrid` / `MemberTable` がすべて Server Component（`'use client'` directive 無し）
- [ ] `MemberFilters.client.tsx` / `DensityToggle.client.tsx` のみ `'use client'` directive を持つ
- [ ] `<h1>` は `Hero` に 1 個のみ。`/` と `/members` の各ページで heading 階層が崩れていない
- [ ] aria 属性: tag pill `role="switch" aria-checked` / density `role="radiogroup"` + `role="radio"` / form `role="search"`
- [ ] `next/link` を内部遷移で使用、生 `<a>` は外部 URL のみ
- [ ] Server Component で `await searchParams` を 1 回のみ呼ぶ
- [ ] `router.replace` を使い history を肥大化させない
- [ ] token 直書き禁止（grep gate pass）

### 不変条件

- [ ] D1 直接アクセスなし（`apps/web` 配下に `D1Database` / `@cloudflare/workers-types` の D1 binding 参照 0 件）
- [ ] 既存 API endpoint surface への変更なし（`apps/api/**` 0 件）
- [ ] Google Form schema 関連の変更なし
- [ ] Sentry SDK 直 import なし（task-04 logger 経由）
- [ ] `getEnv()` / `getPublicEnv()` 経由の env 参照（playwright config の `process.env.*` を除く）

### 上流契約整合

- [ ] task-08 token のみ使用（`var(--ubm-color-*)` / `var(--ubm-color-zone-*)`）
- [ ] task-10 primitives のみ使用（新 primitive を生やさない）
- [ ] `@ubm-hyogo/shared` の Zod スキーマを strict parse
- [ ] task-04 `logger` を fetch wrapper 内で使用（直接 Sentry SDK を呼ばない）

### Diff scope 規律（SCOPE.md §6）

- [ ] `git diff --name-only main...HEAD` が以下に限定:
  - `apps/web/app/page.tsx`
  - `apps/web/app/(public)/layout.tsx`
  - `apps/web/app/(public)/members/page.tsx`
  - `apps/web/src/components/public/Hero.tsx`
  - `apps/web/src/components/public/Stats.tsx`
  - `apps/web/src/components/public/ZoneIntro.tsx`
  - `apps/web/src/components/public/Timeline.tsx`
  - `apps/web/src/components/public/MemberCard.tsx`
  - `apps/web/src/components/public/MemberGrid.tsx`
  - `apps/web/src/components/public/MemberTable.tsx`
  - `apps/web/src/components/public/MemberFilters.client.tsx`
  - `apps/web/src/components/public/DensityToggle.client.tsx`
  - `apps/web/src/components/public/PublicHeader.tsx`
  - `apps/web/src/components/public/PublicFooter.tsx`
  - `apps/web/src/components/public/__tests__/{Hero,Stats,MemberCard}.test.tsx`
  - `apps/web/src/lib/api/public.ts`
  - `apps/web/src/lib/api/__tests__/public.test.ts`
  - `apps/web/src/lib/url/members-search.ts`
  - `apps/web/src/lib/url/__tests__/members-search.test.ts`
  - `apps/web/playwright/tests/public-top-and-list.spec.ts`
  - `apps/web/playwright.config.ts`（任意・webServer 設定追加時）
  - `apps/web/package.json`（任意・script 追加時）
  - `docs/30-workflows/task-11-public-top-and-member-list/**`

### Phase 11 evidence 準備

- [ ] `outputs/phase-11/evidence/` directory が作成可能
- [ ] Playwright browser binary を install 済み（`pnpm exec playwright install --with-deps chromium`）
- [ ] Sentry dashboard へのアクセス権限（error boundary capture 確認用）
- [ ] local dev server を `pnpm --filter @ubm-hyogo/web dev` で起動可能

## 完了条件

- [ ] 上記チェックリストが全て [x]
- [ ] 残課題（task-12 / task-15 / task-18 への引き継ぎ）が index.md に明記
- [ ] FAIL がある場合は該当 phase まで戻されている
