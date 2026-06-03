# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 7 / 13 |
| 名称 | カバレッジ確認（変更範囲限定）|
| 前提 | Phase 5（実装）/ Phase 6（テスト追加）完了 |
| カバレッジ方針 | [Feedback BEFORE-QUIT-002][Feedback 5] **変更したファイル / ブロックのみ**を対象とし、全体一律カバレッジは要求しない |

## 目的

本タスクで**変更した関数 / 分岐**に絞ってカバレッジを測定し、C1〜C4 の挙動が機械検証で覆われていることを line / branch で可視化する。CSS（静的）・未変更コードはカバレッジ対象外であることを明記し、過剰な全体カバレッジ要求を回避する。

## 実行タスク

### カバレッジ対象 / 対象外の切り分け（[Feedback 5]）

| ファイル | カバレッジ対象か | 理由 |
|---------|----------------|------|
| `SidebarShell.tsx`（aside 2 段化 / `<main>` flex-col / `AdminPublicReturn` collapsed 分岐 / collapse-toggle 行 justify 分岐）| **対象**（変更行のみ）| C1/C2/C4 のレンダリング分岐 |
| `SidebarUserMenu.tsx`（新 `useEffect`: 外側クリック / Escape / cleanup / `details.open` 早期 return、summary collapsed 分岐）| **対象**（変更行のみ）| C3/C2 のロジック分岐 |
| `SidebarNavItem.tsx`（collapsed `justify-center` 分岐 / badge collapsed=ドット vs expanded=Chip 分岐 / badge 有無分岐）| **対象**（変更行のみ）| C2 の分岐 |
| `globals.css`（`[data-shell="sidebar"]`）| **対象外** | 静的 CSS（実行カバレッジの概念がない）|
| `legacy-public.css`（`public-footer`）| **対象外** | 静的 CSS |
| 未変更コード（`SidebarBrand` / `SidebarNav` / `useSidebarState` / `SignOutButton` 等）| **対象外** | 本タスクで変更していない |

### カバレッジ測定コマンド（変更ファイル限定）

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/components/shell/SidebarShell.tsx' \
  --coverage.include='apps/web/src/components/shell/SidebarUserMenu.tsx' \
  --coverage.include='apps/web/src/components/shell/SidebarNavItem.tsx' \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
```

> `--coverage.include` の glob は実 `vitest.config.ts`（v8 / istanbul provider）の設定に合わせて調整する。provider が `include` を尊重しない場合は、出力された per-file レポートのうち上記 3 ファイル行だけを抜き出して評価する（全体しきい値での fail は本タスク対象外）。

### 変更関数の line / branch カバレッジ実測欄（実装済みとして埋める）

| ファイル / 変更箇所 | 関数 / 分岐 | line cov | branch cov | 備考 |
|--------------------|------------|----------|------------|------|
| `SidebarShell.tsx` | `sidebarContent`（footer 2 段 / collapse-toggle `justify-center` vs `justify-end`）| _（実測）_ | _（実測）_ | TC-C1-* / TC-C2-06 |
| `SidebarShell.tsx` | `<main>` flex-col レンダリング | _（実測）_ | — | TC-C4-01/02 |
| `SidebarShell.tsx` | `AdminPublicReturn`（collapsed `justify-center` / sr-only）| _（実測）_ | _（実測）_ | TC-C2-06 |
| `SidebarUserMenu.tsx` | 外側クリック `useEffect`（`details.open` 早期 return / `browserDocument()` undefined no-op）| _（実測）_ | _（実測）_ | TC-C3-01/07/08/09 |
| `SidebarUserMenu.tsx` | `onPointerDown`（contains 判定: 外側 / 内側 / summary）| _（実測）_ | _（実測）_ | TC-C3-01/04/05/11 |
| `SidebarUserMenu.tsx` | `onKeyDown`（Escape / 非 Escape）| _（実測）_ | _（実測）_ | TC-C3-02/03/10 |
| `SidebarUserMenu.tsx` | route 変化 `useEffect`（既存維持）| _（実測）_ | _（実測）_ | TC-C3-06 |
| `SidebarUserMenu.tsx` | summary collapsed `justify-center` 分岐 | _（実測）_ | _（実測）_ | TC-C2-05 |
| `SidebarNavItem.tsx` | 行 `justify-center`（collapsed / expanded）| _（実測）_ | _（実測）_ | TC-C2-01/02 |
| `SidebarNavItem.tsx` | badge 分岐（collapsed=ドット / expanded=Chip / 無し）| _（実測）_ | _（実測）_ | TC-C2-03/04/07/08/09 |

> 目標: 上記**変更分岐は全て少なくとも 1 ケースが通過**（branch カバレッジ実質 100%）。`browserDocument()` が undefined を返す SSR no-op 分岐は jsdom 環境では到達しないため、I-5/I-6 の設計上の保証（SSR で window 未定義）で代替し、カバレッジ未達としてカウントしない（コメントで明記）。

### concern × dependency edge カバレッジ可視化

| concern | dependency edge | カバーするケース | カバレッジ状態 |
|---------|----------------|-----------------|---------------|
| C1 | `SidebarShell.sidebarContent` → `sidebar-footer` DOM | TC-C1-01〜06, TC-C1-07/08 | _（実装済み）_ |
| C2 | `SidebarNavItem` collapsed → `justify-center` / `nav-badge-dot` | TC-C2-01〜04, TC-C2-07〜10 | _（実装済み）_ |
| C2 | `SidebarUserMenu.summary` collapsed → `justify-center` | TC-C2-05 | _（実装済み）_ |
| C2 | `SidebarShell.AdminPublicReturn` collapsed → `justify-center` | TC-C2-06 | _（実装済み）_ |
| C3 | `SidebarUserMenu` `<details>.open` ↔ `details.open` guard ↔ document listener | TC-C3-01〜11 | _（実装済み）_ |
| C4 | `SidebarShell.<main>` flex-col | TC-C4-01/02/03 | _（実装済み）_ |

## 参照資料

- phase-4-test-plan.md / phase-6-test-additions.md（カバーするケース ID）
- phase-5-implementation.md（変更関数 / 分岐の正本）
- `vitest.config.ts`（coverage provider / include 設定）

## 実行手順

1. 変更ファイル限定でカバレッジ測定コマンドを実行する。
2. 上記実測欄に line / branch を記入する。
3. 未到達分岐があればケースを追加（Phase 6 へ戻す）か、設計上到達不能（SSR no-op）として明記する。
4. concern × edge 表で全 edge が 1 ケース以上でカバーされていることを確認する。
5. Phase 8（リファクタ）へ。

## 統合テスト連携

- 本 Phase は単体カバレッジに限定。統合（layout / footer）の回帰は Phase 6（RG-P5 / RG-PF）/ Phase 9（CI gate）で担保。

## 多角的チェック観点（AIが判断）

- **過剰検証の回避**: CSS / 未変更コードを対象外と明示し、変更分岐のみへ集中（[Feedback 5] 変更範囲限定）。
- **到達不能分岐の扱い**: SSR no-op（`browserDocument()` undefined）は jsdom で到達しないため設計保証で代替し、カバレッジ未達として扱わない。
- **edge 網羅**: concern × dependency edge を表で可視化し、抜けを構造的に検出。

## サブタスク管理

| concern | 測定対象関数 | カバーケース |
|---------|-------------|-------------|
| C1 | `sidebarContent` footer 部 | TC-C1-* |
| C2 | NavItem 分岐 / summary / AdminPublicReturn | TC-C2-* |
| C3 | 外側クリック / Escape effect | TC-C3-* |
| C4 | `<main>` flex-col | TC-C4-* |

## 成果物

- `outputs/phase-7/coverage.md`（本 Phase を正本とするカバレッジサマリ）
- 変更関数 line/branch 実測表（実装済みとして充足）
- concern × edge カバレッジ表

## 完了条件

- [ ] カバレッジ対象を変更ファイル / ブロックのみへ限定した（CSS / 未変更コード除外）
- [ ] 変更ファイル限定の coverage コマンドを実行した
- [ ] 変更関数の line / branch 実測値を実測欄へ記入した
- [ ] 変更分岐が全て 1 ケース以上でカバーされている（到達不能 SSR no-op は明記して除外）
- [ ] concern × dependency edge 表で抜けがないことを確認した

## タスク100%実行確認【必須】

- [ ] 全実行タスク（測定 / 記入 / edge 確認）を完了
- [ ] 必須成果物（カバレッジサマリ）を本ファイルに記載
- [ ] Phase 8 開始条件（変更範囲カバレッジ充足）を満たす

## 次Phase

[Phase 8: リファクタ](phase-8-refactor.md)
