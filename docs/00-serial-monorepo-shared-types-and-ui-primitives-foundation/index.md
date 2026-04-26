# 00-serial-monorepo-shared-types-and-ui-primitives-foundation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| ディレクトリ | docs/00-serial-monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| 作成日 | 2026-04-26 |
| 担当 | platform |
| 状態 | completed |
| タスク種別 | spec_created |

## 目的

pnpm workspace の app 層を成立させ、後続全 Wave（1〜9）の土台となる共通基盤を準備する。`apps/web`（Next.js App Router via `@opennextjs/cloudflare`）と `apps/api`（Hono）の雛形、`packages/shared` の型 4 層スケルトン、`packages/integrations/google` の Forms client 雛形、UI primitives 15 種、`tones.ts`（zoneTone / statusTone）を生成し、`pnpm install + typecheck + lint + test` を pass させる。

## スコープ

### 含む
- `apps/web/`: Next.js App Router skeleton（route group `(public)`, `(member)`, `(admin)` の最小化）
- `apps/api/`: Hono skeleton（`/public/*`, `/me/*`, `/admin/*` の health endpoint だけ）
- `packages/shared/`: 型 4 層（schema / response / identity / viewmodel）の `index.ts` 雛形のみ（実装は 01b）
- `packages/integrations/google/`: Forms client interface 雛形のみ（実装は 01b）
- `apps/web/src/components/ui/` UI primitives 15 種（Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills）
- `apps/web/src/lib/tones.ts`（`zoneTone` / `statusTone` / `ChipTone` 列挙）
- `pnpm-workspace.yaml`、ルート `package.json` の `typecheck` / `lint` / `test` / `dev` script
- ESLint / Prettier / TypeScript 6 / Vitest の root config
- `apps/web/src/components/ui/index.ts` の barrel export

### 含まない
- ビジネスロジック実装（query / mutation handlers）
- ページ実装（`/`, `/members`, `/admin/*` の中身）
- D1 テーブル / migration（01a）
- zod schema / view model 実装（01b）
- Forms API 実装（01b）
- 認証実装（05a/b）
- レイアウト系コンポーネント（`AppHeader` / `AdminSidebar` 等）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01-infrastructure-setup 全体（Cloudflare account / wrangler / GitHub） | runtime 基盤が必要 |
| 下流 | 01a, 01b, 02a/b/c, 03a/b, 04a/b/c, 05a/b, 06a/b/c, 07a/b/c, 08a/b, 09a/b/c | 全 Wave の土台 |
| 並列 | なし（serial、Wave 0 単独） | - |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | システム全体構成、3 層責務 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層の境界 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives 15 種仕様 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | apps/web↔apps/api↔D1 の分離方針 |
| 参考 | doc/00-getting-started-manual/specs/05-pages.md | route group の最小要件 |
| 参考 | doc/00-getting-started-manual/specs/09-ui-ux.md | a11y / focus trap の最低基準 |

## 受入条件 (AC)

- AC-1: `pnpm install` がルートで成功する（lockfile 生成）
- AC-2: `pnpm -w typecheck` が exit 0（apps/web, apps/api, packages/shared, packages/integrations/google）
- AC-3: `pnpm -w lint` が exit 0（ESLint rule で `apps/web` から `@cloudflare/d1` 系 import 禁止 placeholder ルール定義）
- AC-4: `pnpm -w test` が exit 0（Vitest dummy spec 1 件以上）
- AC-5: UI primitives が 15 種すべて `apps/web/src/components/ui/index.ts` から export される
- AC-6: `tones.ts` が `zoneTone(zone: string): ChipTone` と `statusTone(status: string): ChipTone` を export
- AC-7: `apps/web` の Next.js が `@opennextjs/cloudflare` ビルド対応の `next.config.ts` を持つ
- AC-8: `apps/api` の Hono アプリが `GET /healthz` を返す（200 OK + `{ ok: true }`）
- AC-9: `packages/shared/src/index.ts` から `MemberId`, `ResponseId`, `ResponseEmail`, `StableKey` が型として export（型定義のみ、実装は 01b）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md, monorepo-layout.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md, test-matrix.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md, runbook.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md, implementation-guide.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/monorepo-layout.md | pnpm workspace ディレクトリ図 |
| ドキュメント | outputs/phase-04/test-matrix.md | typecheck / lint / unit test スコープ |
| ドキュメント | outputs/phase-05/runbook.md | scaffold 実行 runbook |
| ドキュメント | outputs/phase-12/implementation-guide.md | 後続 Wave への引き渡しガイド |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| pnpm workspace | monorepo 管理 | 無料 |
| Next.js + @opennextjs/cloudflare | apps/web | 無料 |
| Hono | apps/api | 無料 |
| TypeScript 6 | 型 | 無料 |
| Vitest | unit test | 無料 |
| ESLint / Prettier | lint / format | 無料 |

## Secrets 一覧（このタスクで導入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| なし | - | - | - |

このタスクは scaffolding のみで secrets を扱わない。

## 触れる不変条件

- #1 実フォーム schema をコードに固定しすぎない（型は 4 層分離で抽象を維持）
- #5 apps/web から D1 直接アクセス禁止（lint rule placeholder で防御）
- #6 GAS prototype を本番仕様に昇格させない（primitive 移植時に `localStorage` 依存除去）
- #8 `localStorage` を route / session / data の正本にしない（Avatar 等の primitive 仕様に明記）

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC-1〜AC-9 が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の implementation-guide.md が後続 Wave 1a/1b の入力として参照可能
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- Wave 設計: ../_design/phase-2-design.md
- 共通テンプレ: ../_templates/phase-template-app.md
