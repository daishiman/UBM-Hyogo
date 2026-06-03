# Phase 11 手動テスト結果 / Evidence サマリ

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| visual_category | VISUAL |
| implementation_mode | new |
| 状態 | implemented_local_evidence_captured（local component evidence 取得済み。staging screenshot は user-gated）|

## 証跡の主ソース（primary evidence）

| tier | 証跡 | 取得状況 |
|------|------|---------|
| tier-1（自動・認証不要）| component spec の DOM/挙動契約。`SidebarShell.spec.tsx`（C1 footer 領域 / C4 main flex-col）、`SidebarUserMenu.spec.tsx`（C3 外側クリック / Escape / 内側維持）、`SidebarNavItem.spec.tsx`（C2 collapsed justify-center / badge ドット）| **PASS**: 3 files / 22 tests |
| tier-2（local screenshot）| `local-public-home.png` / `local-public-privacy.png`（public viewer shell・sidebar footer 固定のローカル視覚証跡）| **取得済み** |
| tier-3（staging authenticated screenshot）| `screenshots/` 配下 5 シーン（下記）| **未取得**（理由は下記）|

> 主証跡は tier-1（component spec）。VISUAL タスクのため screenshot は視覚的妥当性の補強として tier-2/3 に位置づけ、自動テスト代替としては扱わない。local screenshot は public viewer での sidebar footer 固定を確認する補助証跡であり、admin ログイン状態の staging screenshot 代替ではない。

## local screenshot evidence

| path | 対象 | 結果 |
|------|------|------|
| `outputs/phase-11/local-public-home.png` | `/` public viewer / desktop | sidebar footer（guest user menu + collapse toggle）が viewport 下端に固定表示されることを確認 |
| `outputs/phase-11/local-public-privacy.png` | `/privacy` public viewer / desktop | sidebar footer 固定表示を別 public route でも確認。本文が長いため public footer sticky の短コンテンツ判定は component/CSS 契約に委譲 |

## screenshot を今取得しない理由

1. **staging 認証必須**: 対象画面（公開ホーム `/` を管理者ログイン状態で閲覧した sidebar / footer）は `ubm-hyogo-web-staging` の管理者認証が前提であり、認証情報の利用は user-gated。
2. **local evidence は取得済み**: C1〜C4 は jsdom component spec で保護済み。staging screenshot は視覚的妥当性の補強証跡として、ユーザー承認後に取得する。

→ staging authenticated screenshot 取得は **user の明示承認後**に Task 11-5 手順で実施する。

## local verification evidence

| command | result |
|---------|--------|
| `pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | PASS: 3 files / 22 tests |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS: 1 file / 9 tests |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm dev:web` | PASS: Next dev server ready at `http://localhost:3000`（warnings: @next/swc version mismatch, middleware deprecation, experimental edge runtime）|
| `pnpm --filter @ubm-hyogo/web exec playwright screenshot ... local-public-home.png` | PASS |
| `pnpm --filter @ubm-hyogo/web exec playwright screenshot ... local-public-privacy.png` | PASS |

## 4 症状の確認チェックリスト（実装 + staging で確定）

| # | 症状 | 期待（修正後）| screenshot シーン | 確認 |
|---|------|-------------|------------------|------|
| C1 | footer 見える | nav 14 項目でも下部 3 要素がスクロールなしで最下部に固定。nav のみ内部スクロール | `sidebar-footer-pinned.png` | PASS（local DOM）/ screenshot pending |
| C2 | collapse はみ出しなし | collapse 時アイコンが 4rem 内に収まり横はみ出しゼロ・badge ドット | `sidebar-collapsed-no-overflow.png` | PASS（local DOM）/ screenshot pending |
| C3 | 外側クリックで閉じる | popover 開状態で外側クリック / Escape で閉じる・内側維持・route close 維持 | `account-popover-open.png` / `account-popover-dismissed-by-outside-click.png` | PASS（local behavior）/ screenshot pending |
| C4 | footer 最下部 | 短コンテンツページで PublicFooter が viewport 最下部・長コンテンツで自然配置 | `public-footer-sticky.png` | PASS（local DOM/CSS contract）/ screenshot pending |

## 3 層評価（Apple HIG）

| 層 | 観点 | 評価 |
|----|------|------|
| Semantic | 観測契約属性・aria 維持（`sidebar-footer` / `user-menu-popover` / `aria-haspopup="menu"`）| PASS（component spec）|
| Visual | 固定下部の border 分離・collapsed 中央整列・popover 影/角丸・footer breathing room | pending（staging screenshot / user-gated）|
| AI UX | 「見える・閉じる・はみ出さない」基本可用性 + 外側クリック閉じの予測可能性 | PASS（local behavior）/ staging 操作 pending |

## 既知制限

- staging 認証は solo 運用ポリシーで user の手で実施（AI は認証情報を保持しない）。
- playwright-smoke の visual baseline は `<main>` flex-column / footer 固定により差分が出る可能性があり、baseline 更新は user-gated（Phase 9 Task 9-6 から委譲）。
