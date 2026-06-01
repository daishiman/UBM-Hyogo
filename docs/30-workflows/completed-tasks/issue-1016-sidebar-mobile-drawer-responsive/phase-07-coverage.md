# Phase 7 — カバレッジ確認

カバレッジは **本タスクで変更した関数 / 分岐に限定** して確認する（FB-BEFORE-QUIT-002: リポジトリ全体カバレッジを論点化しない）。Phase 4/6 で追加したテストが、変更行の line / branch を網羅していることを実測値で残す。

## 計測対象（変更ファイル / 関数に限定）

| ファイル | 対象 | 種別 |
|---------|------|------|
| `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | コンポーネント全体（新規） | 新規 |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | コンポーネント全体（新規） | 新規 |
| `apps/web/src/components/shell/useSidebarState.ts` | `readInitialCollapsed()` の追記分岐 + route-close `useEffect` | 追記分のみ |

> `SidebarShell.tsx` の編集は mount 配線のみ（分岐追加なし）で、`SidebarShell.spec.tsx` の T-SH-1/2 でレンダリング経路を通す。新規ロジック分岐は持たないため line/branch の新規網羅対象から除外し、回帰のみ担保。
> `icons.tsx`（MenuIcon 追加時）/ `tokens.css`（scrim トークン）は描画用静的アセットでロジック分岐なし。網羅対象外。

## 網羅すべき branch（変更行）

| ファイル / 関数 | branch | 網羅テスト |
|-----------------|--------|-----------|
| `SidebarDrawer` | `open=false → return null` / `open=true → dialog` | T-DR-1 / T-DR-2 |
| `SidebarDrawer` body lock effect | `open` true（attr set）/ false（attr remove）/ cleanup | T-DR-6 / T-DR-7 / E-DR-1 / E-DR-4 |
| `SidebarDrawer` Esc effect | `open` true（listener 登録 + Escape 一致）/ false（早期 return） | T-DR-3 / E-DR-3 / E-DR-2 |
| `SidebarDrawer` focus effect | `open` true（focusable あり focus）/ focusable 無し（optional chain） | T-DR-8 / E-DR-6 |
| `SidebarDrawer` backdrop vs panel | backdrop click（close）/ panel click（非 close） | T-DR-4 / T-DR-5 |
| `SidebarMobileTrigger` | click → setDrawerOpen(true) / aria-expanded（open 反映） | T-MT-1 / T-MT-3 / T-MT-4 |
| `useSidebarState.readInitialCollapsed` | localStorage あり（true/false/破損）/ 未設定 → matchMedia（md / lg / sm / throw） | T-SS-3/5/8, E-SS-1..4, E-SS-6/7 |
| `useSidebarState` route effect | pathname 変化（close）/ 不変（非 close） | T-SS-9 / T-SS-10 / E-SS-5 |

これらにより、変更ファイル 3 点の **新規分岐をすべて少なくとも 1 ケースで通過**させる。

## 実測値の記録方針（FB-Feedback-5）

実装時（GREEN 後）に、対象ファイルに絞って coverage を計測し、**変更行の line% / branch%（実数）を本 Phase に追記**する。ハッピーパスのみでなく Phase 6 の fail path / cleanup / 境界を含めた合算値を残す。目標は変更行の line / branch とも全分岐到達（未到達 branch があれば追加ケースで埋めるか、到達不能な理由を明記）。

記録テンプレート（実装後に実数を埋める）:

| ファイル | Stmts % | Branch % | Funcs % | Lines % | 未到達 branch（理由） |
|---------|---------|----------|---------|---------|----------------------|
| `SidebarMobileTrigger.tsx` | — | — | — | — | — |
| `SidebarDrawer.tsx` | — | — | — | — | — |
| `useSidebarState.ts`（追記分） | — | — | — | — | — |

## 計測コマンド

対象ファイルに限定した coverage 計測（targeted）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage \
  --coverage.include='src/components/shell/SidebarMobileTrigger.tsx' \
  --coverage.include='src/components/shell/SidebarDrawer.tsx' \
  --coverage.include='src/components/shell/useSidebarState.ts' \
  src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  src/components/shell/__tests__/useSidebarState.spec.tsx \
  src/components/shell/__tests__/SidebarShell.spec.tsx
```

> `--coverage.include` は対象 3 ファイルに限定し、リポジトリ全体スコアを論点化しない（FB-BEFORE-QUIT-002）。Vitest の coverage provider 設定が `include` を受けない場合は、上記 4 spec を実行した上で coverage レポート（`coverage/` の HTML / text-summary）から対象 3 ファイル行のみを抜粋して本 Phase に転記する。

## 完了条件

- [ ] coverage 対象を変更ファイル / 関数（`SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` / `useSidebarState.ts` 追記分）に限定して明記（FB-BEFORE-QUIT-002）
- [ ] 網羅すべき branch（drawer open/close、matchMedia md/lg/sm 境界、route-close effect）と網羅テストの対応表を記載
- [ ] 変更行の line / branch カバレッジ実測値を記録する方針を記載（FB-Feedback-5・実装後に実数追記）
- [ ] targeted な計測コマンドを記載（全体スコアを論点化しない）
