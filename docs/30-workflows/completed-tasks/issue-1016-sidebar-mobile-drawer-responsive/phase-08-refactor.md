# Phase 8 — リファクタリング

## 0. 前提

本サイクルは **implemented_local_runtime_pending**。下表の Before/After は実装済みコードと staging visual gate の境界を示す。staging runtime PASS は主張しない。

リファクタリングの主目的は Phase 3 の MINOR **M-1〜M-3 の本サイクル内判定**である。判定の結果、M-1 は helper 抽出より現状維持が低複雑、M-2/M-3 は実装で解消済み。新規未タスク化はしない。

## 1. リファクタリング対象（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `SidebarShell.tsx` の brand+nav+footer 周辺 | `<aside>` と drawer の両方で `SidebarBrand` / `SidebarNav` / footer を使う | helper 抽出は不採用。drawer は close button と expanded footer、aside は collapse toggle と responsive width を持つため、共通化すると variant 分岐が増える | M-1 判定。小規模な近接重複より、条件分岐 helper の方が複雑 |
| `SidebarMobileTrigger.tsx` の hamburger icon | Phase 2 設計では icon 部分が未確定（コメント `{/* hamburger icon */}`） | 3 本線を `aria-hidden` span で描画。新規 primitive ファイルは作らない | INV-6（新規 primitive を生やさない）。用途がこの trigger に閉じるため局所実装が妥当 |
| `SidebarDrawer.tsx` の effect 群 | body scroll lock / focus restore / Esc close / focus trap | cleanup 付きの単一 effect + `trapFocus` callback として維持 | 副作用の入口が `open` に閉じており、現状が最小 |
| `useSidebarState.ts` の matchMedia 参照 | `is-browser.ts` に getter がなく、直接参照の候補だった | `browserMatchMedia(query)` を `apps/web/src/lib/is-browser.ts` に追加し、`useSidebarState` はその境界のみを利用 | M-3 解消。SSR/jsdom では undefined fallback |

## 2. M-1 判定（helper 抽出不採用）

`SidebarBody` helper は候補として検討したが、不採用とする。

| 比較軸 | helper 抽出 | 現状維持 |
|--------|-------------|----------|
| 重複削減 | brand/nav/footer の一部は減る | 一部重複は残る |
| 条件分岐 | drawer close button / aside collapse toggle / footer class 差を variant props 化する必要がある | それぞれの責務が JSX 上で明確 |
| drift リスク | nav 自体は既に `SidebarNav` / `shell-config.ts` に集約済み | nav item の二重定義は発生しない |
| 複雑性 | helper props が増える | 小規模な近接重複に留まる |

結論: `SidebarNav` と `shell-config.ts` が実質的な nav SSOT なので、M-1 は未タスク化せず現状維持で解消判定とする。

## 3. navigation drift / duplicate の確認

| 確認項目 | 方針 |
|---------|------|
| nav 項目の二重定義 | `shell-config.ts` + `SidebarNav` に集約済み。drawer/aside は同じ `navGroups` を消費 |
| 既存 `shell-config.ts`（nav contract） | 変更しない（Task A 責務）。drawer/aside は同じ config 由来の `navGroups` を消費するのみ |
| 重複 component の新設 | しない。drawer 内も `SidebarNav` 等既存 shell 群を再利用（INV-6） |
| 新規 primitive | 追加しない。helper も新設しない |

## 4. 適用順序（本サイクルで適用）

1. Phase 5 で `SidebarMobileTrigger` / `SidebarDrawer` を新規作成し、drawer/aside の差分を明示したまま実装。
2. Phase 8 で helper 抽出の複雑性を再評価し、不採用を確定。
3. Phase 9 QA（typecheck / lint / verify-design-tokens / targeted vitest）を再実行し regression が無いことを確認。

## 完了条件

- [x] M-1（ツリー重複）を helper 抽出不採用として判定（未タスク化しない）
- [x] 対象 / Before / After / 理由テーブルを作成
- [x] navigation drift / duplicate の確認方針を明記
- [x] 新規 primitive を生やさない（INV-6）ことを確認
- [x] M-3（matchMedia getter 化）は `browserMatchMedia()` 追加で解消
