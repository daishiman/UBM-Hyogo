# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

Phase 2 の設計を 3 系統（システム / 戦略・価値 / 問題解決）でレビューし、blocking 級の論点を解消する。

## 実行タスク

- [ ] レビュー観点表を本 Phase で reify する
- [ ] 残課題（task-12 / task-15 / task-18 引き継ぎ）を index.md と整合させる

## 参照資料

- Phase 2 成果物
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` §6 diff scope 規律
- 一次原典 §11（リスク） / §3.x（コンポーネント分解）

## 成果物

- `outputs/phase-03/main.md`

## 統合テスト連携

- Phase 4 の test matrix にレビュー論点を反映する。
- Phase 11 の evidence で URL 状態、a11y、token grep gate を確認する。

## レビュー観点

### システム系

| 観点 | 評価 |
| --- | --- |
| 既存 API endpoint surface を侵さないか | OK。`/public/stats` / `/public/members` の **consumer 側のみ**実装 |
| D1 直接アクセス禁止（不変条件 #5） | OK。`apps/web` から `D1Database` import 0 件、`lib/api/public.ts` 経由のみ |
| `getEnv()` 強制（task-02 契約） | OK。`process.env.*` 直参照は test runner / playwright config に限定 |
| Cloudflare Workers ランタイム制約 | OK。`'use client'` は MemberFilters / DensityToggle のみ。Server Component が searchParams を消費 |
| Zod strict parse | OK。`PublicStatsViewZ` / `PublicMemberListViewZ` / `PublicMemberListItemZ` を `.parse()（strict 定義済み schema）` |
| `apps/api` への変更なし | OK。`git diff --name-only` で `apps/api/**` 0 件 |

### 戦略・価値系

| 観点 | 評価 |
| --- | --- |
| プロトタイプ正本順位（CLAUDE.md UI prototype alignment §正本順位） | OK。`pages-public.jsx` 由来 4 セクション + Filters / density / card↔table 派生 |
| token 正本化（task-08）整合 | OK。`var(--ubm-color-*)` のみ |
| primitives（task-10）の上に乗る | OK。新規 primitive を生やさない（`Card` / `Badge` / `Input` / `Select` / `Button` / `Stat` / `Avatar` / `EmptyState` / `Field` のみ使用） |
| task-18 への引き継ぎが明確か | OK。`apps/web/src/components/public/**` を verify-design-tokens 走査対象に追加する経路を `data-page=...` anchor 経由で確保 |
| 19 routes 中の 2 画面のみ完結 | OK。残り 17 画面は task-12〜17 |

### 問題解決系

| リスク | 緩和策 |
| --- | --- |
| 既存 `Hero.tsx` / `MemberCard.tsx` / `Timeline.tsx` の現行利用箇所と干渉 | Phase 5 §Step 0 で grep し、変更が現行 caller を壊さないことを確認 |
| primitives 未完成（task-10 未マージ）状態で着手 | 原典 §0.6.1 のシグネチャに合わせて `import { ... } from "@/components/ui"` で先行実装。task-10 が後で接続 |
| `searchParams: Promise<...>` の Next.js 15 契約 | `await searchParams` を 1 回のみ使う。test 側は `Promise.resolve(sp)` を渡す |
| URL query 不正値で Server Component が throw | `parseSearchParams` が `default` fallback を使い throw しない |
| Playwright で staging URL が必要 | local では `webServer` で `pnpm --filter @ubm-hyogo/web dev` を起動、staging は `STAGING_BASE_URL` を 1Password から injection |
| MemberFilters の URL 書換で history が膨らむ | `router.replace("?...")` を使う（push ではなく） |
| accessibility: tag pill / density radio | Phase 4 で keyboard / aria 属性を明示的に検証 |

## 設計判断の追認

- `lib/api/public.ts` は `lib/fetch/public.ts` の上に薄く乗せる（既存テスト維持 + Zod strict 集約）
- `MemberFilters.client.tsx` と `DensityToggle.client.tsx` は分離（後者は再利用可能）
- `'use client'` directive は MemberFilters / DensityToggle のみ。Hero / Stats / ZoneIntro / Timeline / MemberCard / MemberGrid / MemberTable は Server Component で render

## 残課題（本 task では未着手・他 task に渡す）

- `/(public)/members/[id]`（詳細）→ task-12
- `/register` / `/privacy` / `/terms` → task-12
- a11y axe 自動 CI gate 全画面化 → task-18
- token 適用 grep gate 全画面 → task-18
- error UI 最終デザイン → task-15 周辺
- primitives 内部実装の確定 → task-10

これらはすべて既存タスクが引き受ける（CONST_007 例外なし、先送り発生なし）。

## 完了条件

- [ ] システム / 戦略 / 問題解決の 3 系統で blocking 級の指摘がない
- [ ] リスク表が原典 §11 と整合
- [ ] 残課題は本 task ではなく既存タスク（task-10 / task-12 / task-15 / task-18）が引き受けると確認済み
