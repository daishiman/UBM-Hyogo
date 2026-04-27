# 06a-parallel-public-landing-directory-and-registration-pages — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| ディレクトリ | doc/02-application-implementation/06a-parallel-public-landing-directory-and-registration-pages |
| Wave | 6 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | web/public |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

公開ディレクトリの 4 画面（`/`, `/members`, `/members/[id]`, `/register`）を Next.js App Router + `@opennextjs/cloudflare` で実装する仕様を確定する。`/members` の検索コントロール `q / zone / status / tag / sort / density` を URL query 駆動にし、`/register` は Google Form responderUrl への遷移ページとして form-preview を表示する。GAS prototype の `localStorage` / `window.UBM` を本番に持ち込まず、stableKey 参照を徹底する。

## スコープ

### 含む
- `/` ランディング: Hero、`StatCard`、UBM区画説明、最近の支部会 `Timeline`、FAQ、CTA
- `/members` 一覧: `FilterBar` + `MemberCard` + density 切替、空状態、URL query contract
- `/members/[id]` 詳細: `ProfileHero` + `KVList` + `LinkPills`、404 表示
- `/register` 登録案内: form-preview 表示 + `responderUrl` への遷移、設問プレビュー（visibility 区分明示）
- Server Component / Client Component 境界の確定
- 04a public API endpoints 4 種の呼び出し（fetch + RSC）
- 09-ui-ux.md 準拠（desktop / mobile）

### 含まない
- `/login` `/profile` 画面（06b）
- `/admin/*` 画面（06c）
- 04a public API endpoints 本体（04a）
- theme / nav / detailLayout / editMode のユーザー機能化
- localStorage 正本化、`window.UBM` 参照
- 本人 / 管理者の編集 UI

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04a-parallel-public-directory-api-endpoints | `GET /public/stats|members|members/:id|form-preview` を呼ぶ |
| 上流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | `/login` への CTA 接続のため session 状態を取得 |
| 上流 | 05b-parallel-magic-link-provider-and-auth-gate-state | login 導線の前段で AuthGateState を反映 |
| 上流 | 00-serial-monorepo-shared-types-and-ui-primitives-foundation | UI primitives 15 種、tones.ts、view model 型 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | 公開導線 contract test |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | 09-ui-ux.md の検証マトリクス E2E |
| 並列 | 06b, 06c | 互いに独立、共通 UI primitives 経由で連携 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | URL contract、画面責務、空状態 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 情報設計、検証マトリクス |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | `q/zone/status/tag/sort/density` 仕様 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives とディレクトリ構成 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey 一覧、form-preview のセクション分割 |
| 参考 | doc/00-getting-started-manual/specs/00-overview.md | 3 レイヤ |
| 参考 | doc/00-getting-started-manual/claude-design-prototype/ | UI 視覚品質下限 |

## 受入条件 (AC)

- AC-1: `/`, `/members`, `/members/[id]`, `/register` 4 ルートが Next.js App Router で動作（404 / 200 が正しく分岐）
- AC-2: prototype と同等の公開導線が URL ベースで完結（`/` → `/members` → `/members/[id]` の遷移が history 戻り含めて成立）
- AC-3: `/members` の検索コントロール `q / zone / status / tag / sort / density` が全て URL query で表現され、reload で復元される
- AC-4: density は `comfy | dense | list` のみ（`comfortable` `compact` を使わない）
- AC-5: `tag` は repeated query parameter として複数受け取り、API へ AND で渡る
- AC-6: 不明な `zone / status / tag / sort / density` は無視し初期値へフォールバック
- AC-7: `window.UBM` への参照が apps/web 配下にゼロ件（grep で 0）
- AC-8: stableKey を直書き（questionId 直書き）した箇所がゼロ件（spec の stableKey に一致するもののみ参照）
- AC-9: `localStorage` を route / session / data の正本にしている箇所がゼロ件
- AC-10: `/members/[id]` は API のレスポンスに含まれる public visibility field のみ表示し、member / admin field を一切描画しない
- AC-11: `/register` は Google Form responderUrl `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` へリンクし、`form-preview` を `GET /public/form-preview` で取得して表示
- AC-12: 09-ui-ux.md の検証マトリクスのうち本タスク担当の row（`/`, `/members`, `/members/[id]`）が desktop / mobile で pass

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/page-tree.md | 4 ルート × Server / Client 境界 |
| 設計 | outputs/phase-02/url-query-contract.md | `q/zone/status/tag/sort/density` の正規化 |
| 設計 | outputs/phase-02/data-fetching.md | RSC fetch + 04a API 呼び出し |
| ランブック | outputs/phase-05/runbook.md | 4 page 実装手順 + placeholder |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 |
| ドキュメント | outputs/phase-12/implementation-guide.md | apps/web 公開層の最終ガイド |
| メタ | artifacts.json | 13 phase 状態 |

## services / secrets

| 種別 | 名称 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| service | Cloudflare Workers (apps/web via `@opennextjs/cloudflare`) | runtime | 2 |
| service | apps/api 経由で D1 アクセス | runtime | 2 |
| var | `PUBLIC_API_BASE_URL` | wrangler vars | 5 |
| var | `GOOGLE_FORM_RESPONDER_URL` | 静的 const（公開 URL） | 5 |
| secret | なし（公開層は secret 不要） | - | - |

## ui_routes

- `/`
- `/members`
- `/members/[id]`
- `/register`

## invariants touched

| # | 名称 | 関連箇所 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | stableKey 参照のみ、questionId 直書き禁止 |
| #5 | apps/web から D1 直接禁止 | 全データ取得は 04a API 経由 |
| #6 | GAS prototype を本番仕様に格上げしない | `window.UBM` `localStorage` 不採用 |
| #8 | localStorage を正本にしない | density / sort も URL query 正本 |
| #9 | `/no-access` 専用画面に依存しない | `/register` から `/login` への導線で吸収 |
| #10 | Cloudflare 無料枠 | RSC キャッシュ + 04a の `Cache-Control` を活用 |

## completion definition

- 13 phase すべてが `completed`
- artifacts.json の各 phase status 一致
- AC-1〜AC-12 が phase-07 で完全トレース
- phase-12 で `implementation-guide.md` ほか 6 種が生成
- phase-13 はユーザー承認後にのみ実行
