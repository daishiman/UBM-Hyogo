# issue-274-public-pages-ogp-sitemap-robots — タスク仕様書 index

> [実装区分: 実装仕様書]
> 判定根拠: 本タスクの目的は `apps/web/app/` 配下に新規 metadata route（`sitemap.ts` / `robots.ts` / `opengraph-image.tsx`）と各公開ルートの `generateMetadata` を実装することであり、コード変更が必須。CONST_004 のデフォルト（実装仕様書）に該当する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | issue-274-public-pages-ogp-sitemap-robots |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/274 |
| Issue 状態 | OPEN（Issue 本文のラベルは `status:unassigned`。ユーザー指定により closed 扱いで仕様書化） |
| 統合元 | `docs/30-workflows/unassigned-task/task-06a-followup-002-ogp-sitemap.md`<br>`docs/30-workflows/unassigned-task/task-11-followup-002-public-og-sitemap-robots.md` |
| 作成日 | 2026-05-17 |
| Wave | 後続（11/06a 完了後の公開導線品質向上） |
| 実行種別 | single |
| 担当 | apps/web (public layer) |
| タスク種別 | implementation / VISUAL（OG image 含む） |
| 状態 | implemented_local_evidence_captured |

## 現状調査結果（コードベースの現実）

| 項目 | 現状 | 必要アクション |
| --- | --- | --- |
| `apps/web/app/sitemap.ts` | 実装済み | `/public/members?limit=100&page=N` から動的 member URL を取得 |
| `apps/web/app/robots.ts` | 実装済み | production は公開導線許可、非 production は `Disallow: /` |
| `apps/web/app/opengraph-image.tsx` | 実装済み | 1200x630 PNG を Phase 11 で保存済み |
| `apps/web/app/layout.tsx` の `metadata` | 実装済み | `buildBaseMetadata()` 経由で `metadataBase` / OGP / Twitter / robots を設定 |
| `apps/web/app/(public)/members/[id]/page.tsx` の `generateMetadata` | 実装済み | `openGraph` / `twitter` / `description` を拡張 |
| `apps/web/app/(public)/members/page.tsx` | 実装済み | `metadata` export 追加 |
| `apps/web/app/(public)/register/page.tsx` | 実装済み | `metadata` export 追加 |
| ルート `/` (`apps/web/app/page.tsx`) | 実装済み | `metadata` export 追加 |
| `apps/web/src/lib/env.ts` | `ENVIRONMENT` enum を持つ | sitemap/robots の env 分岐に流用 |
| Playwright smoke | OG meta assert 未追加 | spec 追加 |

> 結論: Issue #274 のローカル実装と Phase 11 evidence は取得済み。task-06a-followup-002 と task-11-followup-002 は本仕様書へ consumed trace 済み。commit / push / PR / Issue mutation はユーザー承認待ち。

## 目的

Next.js App Router の Metadata API と `MetadataRoute.Sitemap` / `MetadataRoute.Robots` 規約に従い、公開 4 ルート（`/`, `/members`, `/members/[id]`, `/register`）に対し SNS シェアと検索エンジン発見性を担保する。staging 環境は `noindex`、production 環境は公開ルートのみ許可する。

## スコープ

### 含む
- `apps/web/app/layout.tsx` の root metadata 拡張（`metadataBase` / `openGraph` / `twitter`）
- `apps/web/app/sitemap.ts`（静的 4 ルート + 動的 `/members/[id]`）
- `apps/web/app/robots.ts`（staging で `Disallow: /`、production で公開ルート許可）
- `apps/web/app/opengraph-image.tsx`（ルート共通 OG image、`next/og` ImageResponse）
- `/`, `/members`, `/register` の `metadata` export 追加
- `/members/[id]` の `generateMetadata` 拡張（`openGraph` / `twitter` / `description`）
- Playwright smoke: 公開 4 ルート（seed 済み member detail を含む）の `og:title` / `og:description` / `og:image` / `twitter:card` の存在 assert
- 公開 API `/public/members` を sitemap 動的部分の source として page ごとに呼び出す server fetch（`publicConsent=true` のみ返る既存契約に依存）

### 含まない
- `/members/[id]` 専用の動的 OG image 生成（別 followup）
- 管理画面（`(admin)/*`）の metadata
- 多言語 metadata（`alternates.languages`）
- OG 画像 CDN 化 / WebP 変換
- D1 schema 変更 / API endpoint の新規追加・変更
- Google Form 仕様変更

## 不変条件

1. **既存 API のみ利用** — `apps/api/src/routes/public/` 配下の現行 endpoint surface のみ。新 endpoint 追加禁止。
2. **`process.env` 直接参照禁止** — sitemap/robots/metadata は `apps/web/src/lib/env.ts` の helper を経由する。公開 metadata / robots 分岐は `getPublicEnv()`、server-only sitemap fetch は `INTERNAL_API_BASE_URL` が必要なため `getEnv()` を許可する。
3. **D1 直接アクセス禁止** — sitemap の動的部分は `/public/members` 経由のみ。
4. **`publicConsent=false` の member を sitemap に含めない** — `/public/members` API が既に filter する契約に依拠。
5. **OKLch トークン正本化** — OG image 内の色は `apps/web/src/styles/tokens.css` の token に対応する RGB を `--brand` 等から導出（HEX 直書きは画像生成時の `next/og` ImageResponse 内では許容するが、token と乖離させない）。
6. **`metadataBase` 必須** — Next.js が relative URL を resolve するために `new URL(env.AUTH_URL ?? "http://localhost:3000")` 相当を設定。
7. **新規 test ファイルは `*.spec.{ts,tsx}` のみ**（`*.test.*` 禁止 / CLAUDE.md 不変条件 #8）。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-11-public-top-and-member-list | `/`, `/members` 実装完了が前提 |
| 上流 | 06a-parallel-public-landing-directory-and-registration-pages | `/members/[id]`, `/register` 実装完了が前提 |
| 上流 | 04a-parallel-public-directory-api-endpoints | sitemap の動的部分が呼ぶ `/public/members` |
| 下流 | なし（公開後の認知度・SEO 計測は別タスク） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | 公開 4 ルート URL contract |
| 必須 | apps/web/src/lib/env.ts | `getPublicEnv()` 利用方法 |
| 必須 | apps/web/wrangler.toml | `ENVIRONMENT` env 値 |
| 必須 | apps/api/src/routes/public/members.ts | sitemap 動的取得元 API |
| 参考 | https://nextjs.org/docs/app/api-reference/file-conventions/metadata | Next.js Metadata API 公式 |
| 参考 | https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap | sitemap.ts 仕様 |
| 参考 | https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots | robots.ts 仕様 |
| 参考 | https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image | opengraph-image 仕様 |

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | データ / 型契約 | completed |
| 4 | 既存実装の調査と影響範囲確定 | completed |
| 5 | 環境 / 設定準備 | completed |
| 6 | 実装 — Metadata Routes (sitemap / robots) | completed |
| 7 | 実装 — OG image / Root layout metadata | completed |
| 8 | 実装 — 公開 4 ルートの per-page metadata | completed |
| 9 | テスト追加（unit / contract） | completed |
| 10 | テスト追加（Playwright smoke） | completed |
| 11 | 検証 / Evidence 収集 | completed |
| 12 | Phase 12 compliance & 完了判定 | completed |
| 13 | コミット / PR / リリース承認 | blocked_pending_user_approval |

## 完了条件（DoD: workflow 全体）

- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- `pnpm --filter @ubm-hyogo/web lint` PASS
- `pnpm --filter @ubm-hyogo/web build` PASS（`next build --webpack` で OpenNext 互換）
- `curl http://localhost:3000/sitemap.xml` が公開 4 ルート + 同意済み member URL を返す
- `curl http://localhost:3000/robots.txt` が ENVIRONMENT に応じて切替
- Playwright smoke `apps/web/playwright/tests/public-metadata.spec.ts` が PASS
- 公開 4 ルートの HTML response に `<meta property="og:title">` / `<meta property="og:description">` / `<meta property="og:image">` / `<meta name="twitter:card">` が含まれる

## スコープ設計（CONST_007 適用）

本タスクは 1 サイクル内で全 Phase を完了可能。先送り対象なし。
動的 OG image（`/members/[id]/opengraph-image.tsx`）は本サイクルに含めないが、これは「将来 followup」として既に別タスク化の対象と判明している（issue 本文「含まないもの: OGP 画像生成」）であり、CONST_007 例外条件 1（独立スコープ）に該当。
