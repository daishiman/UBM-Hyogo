# Phase 1 — 要件定義

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | No（`SidebarMobileTrigger`/`SidebarDrawer` 不在、`drawerOpen` state は未消費） | 通常の実装 Phase とする（`implementation_mode: new`） |
| upstream（dev/main）にマージ済み | No（HEAD `37134247b` = origin/dev に存在せず） | 未マージとして扱う |
| 前提タスク（Task A 基盤）が完了済み | Yes（`useSidebarState`/`SidebarShellContext`/`SidebarShell` 実装済・dev マージ済） | 依存解消済。Task E は基盤の上に積む |

`implementation_mode: new`（RED/GREEN 新規実装）。ただし `useSidebarState` は既存 hook の**拡張**であり、新規ファイルではない。

## タスク分類

| 項目 | 値 | 根拠 |
|------|----|----|
| taskType | `implementation` | 新規 React コンポーネント追加 + 既存 hook/shell 編集 |
| visualEvidence | `VISUAL` | drawer overlay / collapsed-expanded の見た目が受入条件（375/768/1280px） |
| docs-only か | No | CONST_004: 「drawer を表示」「Esc で閉じる」等コード変更なしで達成不可能 |

## 既存コードの命名規則分析（FB-01 / FB-SDK-07-4）

| 対象 | 規則 | 本タスクでの踏襲 |
|------|------|----------------|
| コンポーネントファイル | PascalCase `.tsx`（`SidebarBrand.tsx` / `SidebarNav.tsx`） | `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` |
| hook ファイル | camelCase `.ts`（`useSidebarState.ts`） | 既存 `useSidebarState.ts` を編集 |
| test ファイル | `__tests__/<Name>.spec.tsx` | 同形式 |
| data 属性 | `data-component="shell-*"`（kebab） | `data-component="shell-mobile-trigger"` / `shell-drawer` |
| context 消費 | `useSidebarShellContext()` | trigger が消費 |
| storage key | `ubm:shell:collapsed` | 既存利用（変更なし） |
| ブラウザ API 境界 | `@/lib/is-browser`（`isBrowser` / `browserDocument`）, `getBrowserStorage()` | matchMedia / focus も同境界経由 |

## targeted test 対象ファイル列挙（FB-UI-02-2）

全件 `pnpm test` は重いため、本タスクは以下 targeted run のみを正とする:

```
apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx
apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx
apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```

## carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5` で確認した直近 commit（#1021/#1023/#1026/#1020/#1025）は親 sidebar shell 系の Task A〜D/F 群。Task E（mobile drawer）のみ未着手であることを確認。本タスクはこれら既存実装を**消費**するのみで再実装しない。

## スコープ（含む / 含まない）

index.md「スコープ」セクションを正とする。要点:

- 含む: `SidebarMobileTrigger` / `SidebarDrawer`（新規）, `useSidebarState` / `SidebarShell`（編集）, 4 spec
- 含まない: layout 置換（Task C/D）, visual baseline commit（Task F）, nav contract 定義（Task A） — いずれも親 workflow で別 Task 責務分離済

## 受入条件

index.md「受入条件 (AC-1〜AC-10)」を正とする。

## 不変条件 inventory

index.md「不変条件 (INV-1〜INV-6)」を正とする。特に:

- **INV-3**: `window`/`document`/`localStorage` 直接参照禁止。focus trap は `browserDocument()`、breakpoint 判定は `isBrowser()` ガード後に `window.matchMedia` を呼ぶ（`is-browser.ts` が唯一の `window` 正規参照点である点に留意し、必要なら `is-browser.ts` に matchMedia getter を追加するか、`isBrowser()` ガード + scoped `eslint-disable` を Phase 2 で決定）。
- **INV-5**: breakpoint は CSS 正、JS matchMedia は「md 初期 collapsed」1 点のみ・SSR 非参照。

## 完了条件

- [ ] タスク分類（implementation / VISUAL）を記録した
- [ ] 命名規則を分析し記録した
- [ ] targeted test 対象を列挙した
- [ ] AC / INV を固定した
