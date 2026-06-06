---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 11
phase_name: 手動テスト / Evidence
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
visual_category: VISUAL
---

# Phase 11: 手動テスト / Evidence

## 11.0 VISUAL 宣言

本タスクは **VISUAL**（`visual_category: VISUAL`）。3 レーンとも UI の見た目・ホバー挙動・スクロール固定という視覚的成果を持つため、screenshot evidence を伴う。

> local browser screenshot は automation-30 review cycle で取得済み。staging visual screenshot は user gate で取得する。screenshot は取得済み範囲と pending 範囲を分離して記録し、staging 証跡の捏造は行わない。

## 11.1 3 層評価

| 層 | 観点 | 本タスクでの評価 |
|----|------|------------------|
| **Semantic（意味）** | DOM 契約・a11y・role が要件を満たすか | RTL unit（`SidebarTooltip.spec` / `SidebarNavItem.spec` / `SidebarShell.spec` / `SidebarCollapseToggle.spec`）で `role="tooltip"` / `aria-describedby` 連携 / collapsed 分岐 / mobile-bar class を assert（AC-A1〜A6 / C1〜C3） |
| **Visual（見た目）** | 実画面でツールチップが出る / フッターが下端固定 / ヘッダーが上端固定 | Phase 11 Playwright visual baseline 3 枚（§11.3）+ 手動スクロール確認（§11.4）。レーン B の sticky 挙動は jsdom 不可のため visual / 手動が一次担保 |
| **AI UX（体験）** | collapsed で機能が分かる / 常に文脈が見える | ホバーでラベルが即時表示（native title の遅延を排除）/ スクロール中もフッター・ヘッダーが消えない → 「viewport 端で常に文脈を保持」という単一価値（Phase 3.1）を満たすか目視評価 |

## 11.2 canonical screenshot（3 名・全成果物で一致）

| canonical 名 | レーン | viewport | 状態 |
|--------------|--------|----------|------|
| `sidebar-collapsed-tooltip.png` | A | 1280（desktop collapsed） | collapsed サイドバーで nav item をホバーし、ツールチップ（ラベルバブル）が表示されている状態 |
| `public-footer-sticky-bottom.png` | B | 768 or 1280 | 公開ページをスクロール中、フッターが画面下端に固定表示されている状態 |
| `mobile-header-sticky.png` | C | 375（mobile） | モバイル viewport で本文をスクロールした後も、ヘッダー帯（mobile-bar）が上端に固定表示されている状態 |

## 11.3 Playwright visual baseline 取得計画

staging visual user gate で以下の 3 spec を追加または実行し、baseline を取得する。

| canonical | project / spec | 取得方針 |
|-----------|----------------|----------|
| `sidebar-collapsed-tooltip.png` | `staging-visual-authenticated`（viewport 1280 / admin storageState）<br>新規 spec `apps/web/playwright/tests/visual-staging-authenticated/admin-shell-collapsed-tooltip-authenticated.spec.ts` | 認証付き `/admin` で sidebar を collapse → nav item を `hover()` → tooltip 可視を待って `toHaveScreenshot("sidebar-collapsed-tooltip.png")`。`admin-dashboard-authenticated.spec.ts` を雛形にし、`addStyleTag` で animation/transition を無効化 |
| `public-footer-sticky-bottom.png` | `staging-visual`（viewport 1280 / 公開 route・認証不要）<br>新規 spec `apps/web/playwright/tests/visual-staging/public-footer-sticky-bottom.spec.ts` | 公開ページ（`/` または `/members`）へ goto → `page.mouse.wheel` / `scrollIntoView` で中段までスクロール → フッターが viewport 下端に可視のまま `toHaveScreenshot("public-footer-sticky-bottom.png")` |
| `mobile-header-sticky.png` | `staging-visual`（viewport 375 を spec 内 `setViewportSize` で指定）または mobile project<br>新規 spec `apps/web/playwright/tests/visual-staging/mobile-header-sticky.spec.ts` | viewport 375 → 公開 / member route へ goto → 本文を下方スクロール → mobile-bar が上端固定のまま `toHaveScreenshot("mobile-header-sticky.png")` |

> staging-visual-authenticated project は `setup-authenticated-staging` が storageState を mint する（issue-901）。collapsed tooltip は認証付き admin shell で撮るのが最短。公開フッター / mobile header は認証不要 route のため `staging-visual` で足りる。
> snapshotPathTemplate（project ごとの命名規約）に従い、上記 canonical 名は arg 名として渡す。

## 11.4 手動スクロール / ホバー確認手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

### レーン A（tooltip がホバーで出る・viewport 1280）

1. 管理 route（`/admin`）または会員 route を開き、サイドバーを collapse（toggle で閉じる）。
2. collapsed の nav item（アイコンのみ）にマウスホバー → 右側にラベルバブル（例「会員ディレクトリ」）が即時表示されること。
3. キーボード Tab で nav item にフォーカス → 同様にバブルが表示されること（`:focus-within`）。
4. 「公開に戻る」/ ユーザーメニュー / collapse toggle でも同様にバブルが出ること（AC-A5）。
5. expanded（サイドバー展開）時はバブルが出ないこと（ラベルが既に可視・AC-A2）。
6. スクリーンリーダ（VoiceOver 等）で nav item の読み上げが label のまま（二重読み上げにならない）こと（AC-A6）。

### レーン B（footer が下端固定・viewport 768 / 1280）

1. 公開ページ（`/` / `/members` 等）でコンテンツが viewport より高い route を開く。
2. ページ上端から下へスクロールしている途中、フッター（プライバシー / 利用規約 / 著作権）が **画面下端に固定表示**されたままであること（AC-B1）。
3. フッター背景が不透明で、下を流れるコンテンツが透けないこと（AC-B2）。
4. 最下部に到達するとフッターが自然配置へ戻ること（sticky の正常挙動）。

### レーン C（mobile header が上端固定・viewport 375）

1. DevTools で viewport を 375px（`< md`）に設定し、公開 / 会員 route を開く。
2. 本文を下方へスクロール → ヘッダー帯（mobile-bar・ハンバーガー等）が **画面上端に固定表示**されたままであること（AC-C1）。
3. ヘッダー背景が不透明でコンテンツが透けないこと。
4. drawer を開いたとき、drawer（z-40）がヘッダー（z-30）より前面に出ること（z 階層・AC-C2）。
5. viewport を 768px 以上にすると mobile-bar が hidden になること（回帰なし・AC-C3）。

## 11.5 Evidence 配置

```
docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/outputs/phase-11/
├── manual-test-result.md            # local semantic evidence PASS・local screenshot present / staging pending を記録
├── sidebar-collapsed-tooltip.png    # pending（staging visual user gate・レーン A）
├── public-footer-sticky-bottom.png  # pending（staging visual user gate・レーン B）
└── mobile-header-sticky.png         # pending（staging visual user gate・レーン C）
```

`manual-test-result.md` には以下を記す（VISUAL 版・親 task-e の構成踏襲）:

- 実施日時 / 実施者
- focused vitest（新規 / 編集 spec 群）の PASS/FAIL
- 各 AC（A1〜A6 / B1〜B3 / C1〜C3）と検証 spec / visual のマッピング
- canonical screenshot 3 名の取得状態（= local present・staging visual user gateで取得）
- evidence_status は enum `present` / `pending` を使用（`passed` / `pending_user_approval` 等は使わない）

## 11.6 Gate-B 通過条件

- 新規 / 編集 spec が green:
  - `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx`（新規）
  - `SidebarNavItem.spec.tsx` / `SidebarShell.spec.tsx` / `SidebarCollapseToggle.spec.tsx`（編集 / 新規）
- canonical screenshot 3 枚が `outputs/phase-11/` 配下に present（local browser cycleで取得）。staging visual baseline は user gate で別途取得。
- `manual-test-result.md` に手動確認（tooltip ホバー / footer 下端固定 / mobile header 上端固定）の pass を記録。

→ local semantic evidence は **PASS**。local browser screenshot 3 枚を `outputs/phase-11/` に保存し、staging visual baseline / staging 手動確認 pass は user gate で `present` 化する。
