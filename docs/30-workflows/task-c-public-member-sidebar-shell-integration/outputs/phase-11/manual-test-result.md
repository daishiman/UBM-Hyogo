# Manual Test Result

Status: `implemented_local_evidence_captured / pixel-screenshots pending Gate-C`

## evidence 境界（メタを厚く: Feedback 4）

本タスクは **VISUAL**。今サイクルで依存 Task A/B/E（`apps/web/src/components/shell/`）を
先行新規実装したうえで Task C（layout 統合・route 移動・旧 header 削除）まで実装完了した。
よって **source-level 証跡（focused vitest）は本サイクルで GREEN を取得済み**。

実 pixel screenshot capture / staging visual baseline は、認証済みセッション・API Worker・D1 を
要する running stack 上でしか撮れないため **user-gated runtime/release wave（Gate-C）** に残す。
これは「running staging 環境依存」という構造的理由による許容された後段化（CONST_009 例外）であり、
スコープ縮小ではない。canonical ファイル名は本ファイルで確定済み（下表）。

## 主ソース: focused vitest（実装済み・実測 PASS）

実行コマンド:

```bash
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts --reporter=basic \
  "apps/web/app/(public)" "apps/web/app/(member)" "apps/web/src/components/shell"
# → Test Files 39 passed (39) / Tests 199 passed (199)
# 全 apps/web suite: Test Files 189 passed | 2 skipped / Tests 1321 passed | 2 skipped（回帰 0）
```

| spec ファイル | 検証内容 | 実測 | 状態 |
| --- | --- | --- | --- |
| `apps/web/app/(public)/layout.spec.tsx` | `SidebarShellServer` mount / `data-shell-mode="sidebar"` / `PublicFooter` 描画 / activePath fallback / 旧 topbar 不在 / axe | 10 | PASS |
| `apps/web/app/(member)/layout.spec.tsx` | `SidebarShellServer` mount / `data-route-group="member"` / activePath `/profile` fallback / 旧 topbar 不在 / axe | 8 | PASS |
| `apps/web/app/(public)/page.spec.tsx` | 移動後 `/` が header/footer を持たず content のみ返す（MV-1） | 1 | PASS |
| `apps/web/app/(member)/profile/page.spec.tsx` | `MemberHeader` 直 mount 2 箇所除去 + 既存 degrade/redirect/notFound 回帰 | 6 | PASS |
| `apps/web/app/(public)/login/**` | 移動後 `/login` の相対 import / co-located test / vi.mock path 整合 | （login spec 群） | PASS |
| `apps/web/src/components/shell/__tests__/*` | Task A/B/E primitive（shell-config / useSidebarState / SidebarShell / UserMenu / MobileTrigger / Drawer / user-menu-config） | 34 | PASS |

## screenshot canonical 名一覧（Gate-C で取得・ファイル名固定）

| TC-ID | ロール | route | shell 状態 | canonical ファイル名 | 状態 |
| --- | --- | --- | --- | --- | --- |
| TC-01 | guest | `/` | sidebar expanded | `screenshots/public-sidebar-guest.png` | present（local Playwright） |
| TC-02 | member | `/` | sidebar expanded | `screenshots/public-sidebar-member.png` | pending（Gate-C） |
| TC-03 | admin | `/` | sidebar expanded（ADMIN） | `screenshots/public-sidebar-admin.png` | pending（Gate-C） |
| TC-04 | guest | `/` | sidebar collapsed | `screenshots/public-sidebar-collapsed.png` | pending（Gate-C） |
| TC-05 | guest | `/` | mobile drawer open | `screenshots/public-sidebar-mobile-drawer.png` | pending（Gate-C） |
| TC-06 | member | `/profile` | sidebar expanded | `screenshots/member-sidebar-logged-in.png` | pending（Gate-C） |
| TC-07 | admin | `/profile` | sidebar expanded（ADMIN） | `screenshots/profile-sidebar-admin.png` | pending（Gate-C） |
| TC-08 | member | `/profile` | mobile drawer open | `screenshots/member-sidebar-mobile-drawer.png` | pending（Gate-C） |
| TC-09 | guest | `/login` | sidebar expanded（footer） | `screenshots/login-sidebar-guest.png` | present（local Playwright） |

> TC-ID は本テーブル（metadata）にのみ保持し、ファイル名には焼き込まない（FB-LLM-MOD-05-001）。

## runtime boundary

| Boundary | Status |
| --- | --- |
| 依存 Task A/B/E primitive 実装（`apps/web/src/components/shell/`） | **done（本サイクル先行実装）** |
| apps/web 実装（layout 統合・route 移動・header 削除・shell 配線） | **done** |
| local focused vitest | **PASS（39 files / 199 tests）** |
| typecheck / lint | **PASS** |
| local pixel screenshots | **PARTIAL PASS**（guest `/` + `/login`: shell=1 / shellMode=1 / routeError=0） |
| staging visual baseline | pending（Gate-C） |
| commit / push / PR | pending（Gate-C） |
