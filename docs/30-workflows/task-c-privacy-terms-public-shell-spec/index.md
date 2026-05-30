# task-c-privacy-terms-public-shell-spec

[実装区分: 実装仕様書]

> 判定根拠: 親タスク `task-c-privacy-terms-public-shell.md` は `apps/web/app/privacy/page.tsx` および `apps/web/app/terms/page.tsx` のコード編集（async 化 + `<PublicHeader />` + `<PublicFooter />` mount）と、両画面に対応する vitest spec の新規 / 編集を必須としている。ドキュメント・調査のみで完結する余地は無く、CONST_004 デフォルト（実装仕様書）に該当。

## メタ情報

| 項目                  | 値                                                                       |
| --------------------- | ------------------------------------------------------------------------ |
| Task ID               | TASK-PUBHDR-LOGGED-IN-NAV-CLEANUP-C                                      |
| Feature 名            | task-c-privacy-terms-public-shell                                        |
| Task type             | implementation                                                          |
| visualEvidence        | VISUAL_ON_EXECUTION（`/privacy`, `/terms` の shell 表示が変わる。Phase 11 visual evidence 取得済み） |
| implementation_mode   | `edit`                                                                   |
| workflow_state        | `implemented_local_evidence_captured`                                    |
| 影響 surface          | `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` および対応 spec |
| 親ワークフロー        | `docs/30-workflows/public-header-logged-in-nav-cleanup/`                |
| 親タスク仕様          | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-c-privacy-terms-public-shell.md` |
| 想定 1 cycle 完了     | はい（編集 2 ファイル + spec 2 ファイル + DoD 検証を 1 PR で完了）       |

## 親仕様サマリ（一次情報）

`/privacy`, `/terms` は現状ヘッダ / フッタを一切 mount しておらず（`page.tsx` 内で `<main>` 直書き）、公開系ナビゲーションが消失している。Task A の `PublicHeader` async 化に併せ、両ページを公開シェル（`<PublicHeader authView />` + `<PublicFooter />`）でラップする。

- `(public)` route group への移動は不採用。最小差分で各 `page.tsx` に shell を直接 mount。
- `data-testid="public-shell"` / `data-route-group="public"` / `data-theme="warm"` を root `<div>` に付与。
- 既存 metadata (title/description) は変更しない。

## 真の論点

1. **真の論点**: `/privacy`, `/terms` のヘッダ / フッタ消失により、ユーザーがホームや会員一覧へ戻る導線が無く、また session 状態が反映されない（ログイン中でも CTA が無く、新規 logged-in nav cleanup 契約から逸脱）。Task A で導入される `PublicHeader` async 版に揃え、両画面に shell を mount することで全公開画面で共通契約に整合する。
2. **依存関係・責務境界**: Task A（`PublicHeader` async 化 + `getAuthView()` ヘルパ導入）に依存。`(public)` route group の `layout.tsx` への寄せは「最小差分」原則と footer 整合のため不採用。`apps/web` → `apps/api` の D1 boundary や Auth.js セッション解決は Task A の `getAuthView()` が抽象化済みのため本 Task ではそのまま利用するのみ。
3. **価値とコストの不均衡**: 編集対象は 2 page + 2 spec。シェル mount のテンプレートは Task A と共通の primitive 構造で、新規 component 追加は不要。ユーザー価値（ナビ復活 / session-aware CTA）に対しコスト極小。
4. **改善優先順位**: ① `/privacy/page.tsx` を async + shell ラップ → ② `/terms/page.tsx` 同様 → ③ 既存 LegalProse の本文と `<h1>` を維持 → ④ vitest spec 2 本で `data-testid="public-shell"` / `data-component="public-header"` / `<h1>` テキストを固定 → ⑤ typecheck / lint / vitest green。
5. **4条件評価**:
   - 価値性: 公開層ナビ復活、session-aware CTA 統一、UX 整合
   - 実現性: 2 file edit + 2 spec の最小差分
   - 整合性: Task A `getAuthView()` API・既存 `PublicHeader` / `PublicFooter` primitive・既存 metadata 契約と整合
   - 運用性: vitest spec で `public-shell` 存在を固定し回帰検出可能

## Phase 構成

| Phase | 名称                 | 状態          | 出力先                                |
| ----- | -------------------- | ------------- | ------------------------------------- |
| 1     | 要件定義             | completed             | outputs/phase-1/phase-1.md            |
| 2     | 設計                 | completed             | outputs/phase-2/phase-2.md            |
| 3     | 設計レビュー         | completed             | outputs/phase-3/phase-3.md            |
| 4     | テスト作成           | completed             | outputs/phase-4/phase-4.md            |
| 5     | 実装手順             | completed             | outputs/phase-5/phase-5.md            |
| 6     | テスト拡充           | completed             | outputs/phase-6/phase-6.md            |
| 7     | カバレッジ確認       | completed             | outputs/phase-7/phase-7.md            |
| 8     | リファクタリング     | completed             | outputs/phase-8/phase-8.md            |
| 9     | 品質保証             | completed             | outputs/phase-9/phase-9.md            |
| 10    | 最終レビュー         | completed             | outputs/phase-10/phase-10.md          |
| 11    | 手動テスト           | completed             | outputs/phase-11/manual-test-result.md |
| 12    | ドキュメント更新     | completed             | outputs/phase-12/main.md              |
| 13    | PR作成               | pending_user_approval | outputs/phase-13/phase-13.md          |

## 不変条件（CLAUDE.md / 親ワークフローより）

- `apps/web` ランタイムでの env 参照は `getEnv()` / `getApiBaseEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ（`process.env.*` 直接禁止）
- D1 直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止）
- OKLch token 正本化、HEX 直書き禁止（`bg-[var(--ubm-color-...)]` 経由のみ）
- 既存 metadata（title/description）と LegalProse 本文は変更しない（法務確認済み暫定版温存）
- `(public)` route group への移動は禁止（最小差分原則）

## DoD（Definition of Done）

- `/privacy` / `/terms` 両 page で `<PublicHeader />` + `<PublicFooter />` がレンダーされる
- root `<div data-testid="public-shell" data-route-group="public" data-theme="warm">` が存在
- `data-auth-state` が session 状態に応じて切替（Task A `getAuthView()` 経由）
- 既存 metadata（title / description）が変わらない
- 既存 LegalProse 配下の本文テキストが変わらない（grep でも差分 0）
- 既存 `<h1>プライバシーポリシー</h1>` / `<h1>利用規約</h1>` がそのまま描画される
- `apps/web/app/privacy/__tests__/page.spec.tsx` / `apps/web/app/terms/__tests__/page.spec.tsx` の vitest が green
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が green
- `bash scripts/verify-pr-ready.sh` が green
