# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 背景

ユーザー報告（スクリーンショット 2026-05-27）: staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema` で:

- 画面下部に「Schema diff の読み込みに失敗しました / admin api /admin/schema/diff failed: 404 / code ADMIN_FETCH_404」が表示
- ページ本体は「Form schema 概要」+ `セクション1..6` の最小箇条書きのみで、プロトタイプ `SchemaDiffPage` のリッチ UI に未整合
- 左サイドバー nav で「schema」項目だけ小文字英字（他項目は「ダッシュボード」「会員管理」等の日本語）

API 側コード (`apps/api/src/routes/admin/schema.ts:200` + `apps/api/src/index.ts:275`) は `GET /admin/schema/diff` を正しく実装・mount しているため、staging deploy 同期・認証層・route 衝突のいずれかが疑われる。

## ゴール

| ID | ゴール | 検証 |
|----|-------|------|
| G1 | `/admin/schema` が staging で 404 を返さず diff JSON を取得し UI 表示する | Lane A 切り分け結果 + 修復 + contract spec |
| G2 | `/admin/schema` page UI が `SchemaDiffPage` プロトタイプと構造同型になる | Lane B page.tsx 全面リライト + visual baseline |
| G3 | `SchemaDiffPanel` の diff カードが `schema-field-card diff-{type}` + `Chip` を採用 | Lane C 改修 + spec |
| G4 | サイドバー nav 表記が「スキーマ」に統一される | Lane D 1 行修正 + spec |
| G5 | 上記すべてが回帰テストで保護される | Lane E (vitest + Playwright + contract) |

## 非ゴール（Out of Scope）

- 新規 API endpoint の追加（不変条件 #1 違反）
- D1 schema 変更（不変条件 #1 違反）
- Google Form 仕様変更
- `/admin/schema/history` page の構造変更（diff page にリンクのみ）
- Server-side rendering pipeline の刷新

## 不変条件（CLAUDE.md より継承）

1. 既存 API surface のみ利用（`GET /admin/schema/diff` / `GET /admin/schema/history` / `POST /admin/schema/aliases`）
2. OKLch tokens 正本化 — `apps/web/src/styles/tokens.css` を参照、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止
3. プロトタイプ primitives 正本順位 — `pages-admin.jsx` `SchemaDiffPage` の構造を踏襲、新 primitive を生やさない
4. D1 直接アクセス禁止 — `apps/web` は `safeServerFetch` 経由のみ

## 受け入れ基準（AC）

- AC-1: `apps/web/app/(admin)/admin/schema/page.tsx` に page-head（eyebrow / h-page / muted）+ CURRENT REVISION カード + stats grid-4 + SchemaDiffPanel + REVISIONS + ALIAS HISTORY grid-2 が描画される
- AC-2: HEX / `#[0-9a-f]{3,6}` 直書きが当該 page.tsx / SchemaDiffPanel.tsx に 0 件（`verify-design-tokens` で fail しない）
- AC-3: `apps/web/src/components/layout/AdminSidebar.tsx` の `/admin/schema` 行 label が `"スキーマ"`
- AC-4: `apps/api/src/routes/admin/schema.contract.spec.ts` が authenticated `GET /schema/diff` → 200 + items 配列 / recommendedStableKeys を assert
- AC-5: `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` と existing admin smoke specs が新 heading / landmark を使い、visual-chromium project で screenshot evidence を生成
- AC-6: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test --run` / `pnpm --filter @ubm-hyogo/api test --run` 全 PASS
- AC-7: Lane A の切り分け結果が phase-5 / phase-11 に文書化される

## ステークホルダー

- 単一オーナー: daishiman（solo 開発）
- 利用者: 管理者ロール（schema diff レビュー担当）

## 中学生レベル概念説明

「スキーマ差分の画面」は、Google フォームに項目が追加されたり名前が変わったりしたとき、データベース側との「ズレ」を一覧で見せる画面。今は画面が「ズレを取りに行く」 API（住所: `/admin/schema/diff`）に道路が通じていなくて 404（道がない）と言われている。今回の作業は:

1. その道路が通じてない原因を突き止めて開通させる（Lane A）
2. ズレ一覧の画面を、デザイナーが書いたお手本通りに作り替える（Lane B-D）
3. 二度と道路がふさがらないように見張りカメラ（テスト）を置く（Lane E）

の 3 つを 1 サイクルで終わらせる。
