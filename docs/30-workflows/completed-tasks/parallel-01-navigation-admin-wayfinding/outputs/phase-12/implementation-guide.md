# Implementation Guide

## Part 1: 中学生レベル

管理画面で作業している人が迷わないように、近道の案内板を 2 つ増やした。

1 つ目は、管理画面の横メニュー上部に「ホームに戻る」案内を置くこと。どこからでも公開トップへ戻れる。

2 つ目は、会員詳細の引き出しに「タグ管理へ」案内を置くこと。会員カードを見ているとき、その人のタグ管理画面へ直接行ける。

## Part 2: 技術契約

| 項目 | 契約 |
| --- | --- |
| AdminSidebar logo link | `<Link href="/" aria-label="ホームに戻る">` を `<nav aria-label="管理メニュー">` 直下に配置 |
| MemberDrawer tags link | `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>タグ管理へ</Link>` を drawer 最下部に配置 |
| API / schema | 新規 API endpoint、D1 schema、Google Form schema は追加しない |
| Target route | `apps/web/app/(admin)/admin/tags/page.tsx` の既存 `focusMemberId` contract を利用 |
| Tokens | `--ubm-color-accent` / `--ubm-color-border-default` を使用 |

## Part 3: 変更ファイル

| Path | Change |
| --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | home link を `<ul>` 前に追加 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | home link / token class assertion を追加 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `Link` import と encoded tags link を追加 |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | fetch mock + special-char memberId encode assertion を追加 |
| `docs/30-workflows/parallel-01-navigation-admin-wayfinding/outputs/phase-11/*.png` | mock fallback screenshot 2 枚を保存 |

## Part 4: 主要シグネチャ

```ts
export function AdminSidebar(): JSX.Element;

export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}
export function MemberDrawer(props: MemberDrawerProps): JSX.Element;
```

## Part 5: 入出力と副作用

| Component | Input | Output | Side effect |
| --- | --- | --- | --- |
| `AdminSidebar` | props なし | sidebar JSX | `/` への Next.js navigation |
| `MemberDrawer` | `memberId`, `onClose` | drawer JSX | `/admin/tags?memberId={encoded}` への navigation |

## Part 6: テスト方針

| Layer | Evidence |
| --- | --- |
| Component | `pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer` |
| Static | `pnpm typecheck`, `pnpm lint` |
| Build | `pnpm --filter @ubm-hyogo/web build` |
| Visual | mock fallback PNG + DOM snapshot captured; real authenticated screenshot remains runtime pending |

## Part 7: 実行コマンド

```bash
pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web build
```

## Part 8: 設計判断

| 判断 | 理由 |
| --- | --- |
| API/D1 を触らない | 既存 `/admin/tags?memberId=` contract で目的達成できる |
| `onClose()` を link click に紐付けない | route transition による unmount に任せ、余計な状態競合を避ける |
| 矢印なしの `タグ管理へ` を正式文言にする | 実装・テスト・Phase 11 DOM snapshot を簡潔な action label に統一 |
| 新規 primitive を作らない | 既存 `Link` と drawer section で十分 |

## Part 9: Phase 11 Evidence

| Evidence | State |
| --- | --- |
| `outputs/phase-11/dom-snapshot.txt` | completed_local fallback |
| `outputs/phase-11/admin-sidebar-logo-link.png` | mock_fallback_captured_real_runtime_pending |
| `outputs/phase-11/member-drawer-tags-link.png` | mock_fallback_captured_real_runtime_pending |
| `outputs/phase-11/evidence/playwright-admin-pages.log` | failed_external_mock_api_missing |

Real authenticated screenshots are not claimed complete in this guide.

## Part 10: ロールバック

| Scope | Step |
| --- | --- |
| Sidebar | Remove the home link block from `AdminSidebar.tsx` |
| Drawer | Remove the final tags-link section from `MemberDrawer.tsx` |
| Tests | Remove or revert matching component assertions |
| API / D1 | No rollback needed; unchanged |

## Part 11: DoD

| Item | State |
| --- | --- |
| apps/web implementation | completed_local |
| component tests | completed_local |
| Phase 1〜4 outputs | completed_local |
| Phase 12 strict 7 | completed_local |
| real VISUAL screenshot | runtime_pending |
| commit / push / PR | pending_user_approval |
