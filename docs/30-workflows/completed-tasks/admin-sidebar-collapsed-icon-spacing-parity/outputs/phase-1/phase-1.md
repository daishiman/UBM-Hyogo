# Phase 1: 要件定義

**[実装区分: 実装仕様書]**

## 0. メタ

| key | value |
|-----|-------|
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION（UI 間隔変更 → screenshot 必須） |
| implementation_mode | new（className 変更の小規模実装） |
| タスク分類 | **UI task**（Phase 11 で VISUAL 判定） |
| 影響層 | `apps/web` 表現層のみ。`apps/api` / D1 / Google Form 非接触 |

## 1. 課題（ユーザー報告）

> サイドバーを閉じた時と開いた時とでアイコンの縦の幅が異なる。閉じた時の間隔が広すぎて気持ち悪い。開いた時と同じ間隔にしたい。

- 添付2枚: 折りたたみ状態（アイコンのみ）と展開状態（アイコン+ラベル）。折りたたみ時のアイコン縦間隔が明らかに広い。

## 2. 受入条件（Acceptance Criteria）

| ID | 条件 | 検証方法 |
|----|------|---------|
| AC-1 | 折りたたみ時の nav アイコン行の縦ピッチが、展開時の nav 行ピッチと一致する（±2px） | Phase 11 スクリーンショット（折りたたみ/展開）の目視＋ピクセル比較 |
| AC-2 | アイコングリフの**視覚サイズ（18px）は不変**（折りたたみでアイコンが小さく/大きく見えない） | スクリーンショット比較。`ShellIcon` SVG は固定 18px のため container 縮小で不変 |
| AC-3 | 折りたたみ時のアイコンは引き続き水平中央寄せ | 既存 `w-full justify-center` 維持・スクリーンショット |
| AC-4 | アクセシビリティ属性・DOM 構造が不変（`aria-hidden` / `sr-only` ラベル / `aria-current` / `data-shell-block` / tooltip） | 既存 `SidebarNavItem.spec.tsx` 全 PASS 維持 |
| AC-5 | 「公開サイトに戻る」フッターリンクも同じ縦リズムに統一（折りたたみ時） | スクリーンショット（フッター部） |
| AC-6 | `apps/api` 差分ゼロ・D1 schema 変更ゼロ・HEX 直書きゼロ | `git diff` / `verify-design-tokens` |
| AC-7 | 既存 web vitest が回帰なし、追加した collapsed 高さ回帰テストが PASS | `pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` |

## 3. 既存コードベース命名規則（FB-01 / FB-SDK-07-4 対応）

| 対象 | 規則 | 実例 |
|------|------|------|
| コンポーネント | PascalCase | `SidebarNavItem`, `SidebarShell` |
| スタイリング | Tailwind utility class（CSS-in-JS なし） | `h-[18px]`, `w-10`, `py-2`, `gap-0.5` |
| 状態フラグ | `mode: "expanded" \| "collapsed"` → `collapsed = mode === "collapsed"` | `useSidebarState.ts` |
| 機械可読属性 | `data-shell-block` / `data-role` / `data-component` / `aria-*` | `data-shell-block="nav-item"` |
| 任意値クラス | `h-[18px]` の角括弧 arbitrary value が既存パターン | 展開時アイコン箱が既に `h-[18px] w-[18px]` |

> 本タスクは新 IPC surface / 新規 API / 新規型を**追加しない**ため、Preload API 規約（FB-SDK-07-2）・命名ドリフト（FB-SDK-07-4）は非該当。className 値の変更のみ。

## 4. 対象ファイル inventory（artifact 命名 canonical 先行確定 / Feedback 1 対応）

| # | path | 種別 | 変更概要 |
|---|------|------|---------|
| 1 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | L35 アイコンコンテナ className: collapsed `h-10 w-10` → `h-[18px] w-10` |
| 2 | `apps/web/src/components/shell/SidebarShell.tsx` | 編集 | L36 公開サイトに戻るリンクのアイコンコンテナ: collapsed `h-10 w-10` → `h-[18px] w-10` |
| 3 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 編集 | collapsed 時のアイコンコンテナ高さ回帰テストを追加 |

## 5. targeted test 対象ファイル列挙（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` は重いため、対象を事前列挙:

```
apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx
apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx
```

## 6. carry-over 確認

- 直近 commit（`git log --oneline -5`）はタグ定義UI統合・profile 観測性・出席追加是正等。本タスクと重複なし。
- スクリーンショットに映る「セッション情報を取得できませんでした」は profile session 観測性タスク（#1194 系・対応済み）の別事象であり、本タスクのスコープ外（OOS-4）。

## 7. スコープ確定（CONST_007: 1 サイクル完結）

本タスクは className の高さ値変更のみで 1 サイクル内に完結する。分割・先送りなし。OOS-1（Brand）/OOS-2（Avatar）は**別関心**（nav アイコン行ではない独立プリミティブ）であり、本タスクの先送りではなく対象外。
