---
spec_classification: implementation_spec
state: spec_created
phase: 7
phase_name: カバレッジ
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 7: カバレッジ

## 7.1 追加 spec の coverage 寄与

| spec | 対象 file | branch / function 寄与 |
|------|-----------|------------------------|
| `useFocusTrap.spec.tsx` | `useFocusTrap.ts` | open/close 両 branch、Escape/Tab の各ハンドラ branch、`focusables.length===0` の真偽、`browserDocument()` undefined（SSR no-op）、previousFocus 復帰を網羅（trap の真実の coverage はここに集約） |
| `SidebarMobileTrigger.spec.tsx` | `SidebarMobileTrigger.tsx` | function（`onClick` ハンドラ）100% / branch は分岐が無く 1 経路で full |
| `SidebarDrawer.spec.tsx` | `SidebarDrawer.tsx` | open/close 両 branch、backdrop ハンドラ、scroll-lock 属性 effect の付与/除去、hook 結線 smoke を網羅（trap 詳細は `useFocusTrap.spec` 側） |
| `primitives.component.spec.tsx`（既存・回帰） | `Drawer.tsx`（refactor 後） | 内部 refactor 後も既存 Drawer ケースが green を維持（公開 API 不変の回帰担保） |
| `useSidebarState.spec.tsx`（追記分） | `useSidebarState.ts`（Task E 追加 effect） | route-close effect、初期 collapsed effect の `hasPersistedMode` / `matchMedia` 有無 / `isLg` 真偽の 4 branch |
| `SidebarShell.spec.tsx`（追記分） | `SidebarShell.tsx`（編集分） | `<aside>` class・drawer mount 経路 |

新規 2 file は Client component の表層 + focus trap ロジックを対象とし、ロジック密度の高い `SidebarDrawer.tsx` が coverage の主寄与。

## 7.2 coverage threshold への影響

- 既存 coverage threshold は 3 lane（lines / branches / functions）で sync（issue-255）。
- Task E は新規 component を 2 件追加するため、当該 file が threshold を満たすよう新規 2 spec で全 branch を carve する（特に `SidebarDrawer.tsx` の open/close・Escape/Tab・SSR no-op）。
- `useSidebarState.ts` の追加 effect は Task A 所有 spec への追記で branch を埋める（route-close は `pathname` 変化、初期 collapsed は localStorage 有無 × matchMedia 有無 × `isLg` 真偽）。

## 7.3 threshold 割れ時の回復ケース

threshold drop が起きた場合、以下の不足しがちな branch を追加して回復する:

1. **`useFocusTrap.ts`**: (a) `open=false` 早期 return、(b) `open=true` 通常経路、(c) `browserDocument()=undefined`（SSR no-op）— jsdom では出にくいため `vi.spyOn` で `browserDocument` を undefined 返却に mock する補助ケース、(d) `focusables.length===0`（子に focusable が無い）の Tab 分岐スキップ。`SidebarDrawer.tsx` 側は (a) `open=false` null return、(b) scroll-lock 属性 effect の付与/除去、(c) backdrop click 経路。
2. **`useSidebarState.ts`**: (a) `matchMedia` true（expanded）、(b) false（collapsed）、(c) `window.matchMedia` 未定義（SSR fallback expanded）、(d) localStorage 既存値優先で effect が early return する経路。
3. **`SidebarMobileTrigger.tsx`**: click 1 経路で full。追加不要。

## 7.4 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

（Phase 9 の品質ゲートと同一コマンド。lane ごとの threshold は既存設定を正本とする。）

## 7.5 完了条件

- coverage CI gate が green。
- pre-existing threshold（lines / branches / functions の 3 lane）を割らない。
- `SidebarDrawer.tsx` の open/close 両 branch・matchMedia true/false 両 branch・SSR no-op branch がいずれも covered。
