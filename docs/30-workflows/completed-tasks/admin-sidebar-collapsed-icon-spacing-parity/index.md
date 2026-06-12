---
workflow_id: admin-sidebar-collapsed-icon-spacing-parity
workflow_state: implemented_local_runtime_pending
created_at: 2026-06-10
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_runtime_pending_staging_visual_pending
branch: feat/admin-sidebar-collapsed-icon-spacing-parity
relatedIssue: null
---

# サイドバー折りたたみ時のアイコン縦間隔を展開時と一致させる

**[実装区分: 実装仕様書]** — CSS（Tailwind className）変更を伴う UI 表現層タスク。`apps/web` のみ。API / D1 / Google Form 不変。

## 目的

staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`）の左サイドバーで、**折りたたみ（アイコンのみ）時のアイコン同士の縦の間隔が、展開（アイコン+ラベル）時より広く**、「間隔が広すぎて気持ち悪い」というユーザー報告。折りたたみ時の縦ピッチを**展開時と同じリズム**に揃える。

## 真因（root cause）

| 観点 | 内容 |
|------|------|
| 真因の所在 | `apps/web` 表現層の className 条件分岐のみ（API / データ無罪） |
| 直接原因 | `SidebarNavItem.tsx:35` のアイコンラッパー `<span>` が折りたたみ時 `h-10 w-10`（40px四方）、展開時 `h-[18px] w-[18px]`（18px四方） |
| 増幅要因 | `ShellIcon` の SVG グリフは**固定 18×18px**（`icons.tsx` `<Stroke width="18" height="18">`）。よって `h-10`(40px) はグリフを拡大せず、上下に約 11px ずつの**余白だけ**を生む |
| 行ピッチ計算 | 折りたたみ: `py-2`(8+8=16px) + コンテナ高 40px = **約 56px** ／ 展開: `py-2`(16px) + 行高 ~20px（18pxアイコン or 14pxラベル line-height） = **約 36px** |
| 無罪 | `<ul>` の `gap-0.5`(2px) は両状態で共通。`SidebarNav` `gap-3` / `SidebarNavGroup` `gap-1` も共通。間隔差は**アイコンコンテナ高の差 22px**に起因 |

## 修正方針

折りたたみ時アイコンコンテナの**高さ**を展開時の縦リズムに合わせて縮小する。グリフは固定 18px のため縮小されず、水平中央寄せは link 側 `w-full justify-center` が担保するため見た目のアイコンサイズ・配置は不変。縦の余白だけが詰まる。

| 変更対象 | Before | After（提案） | 備考 |
|---------|--------|--------------|------|
| `SidebarNavItem.tsx:35` | `collapsed ? "h-10 w-10"` | `collapsed ? "h-[18px] w-10"` | nav 項目（主対象）。高さを展開時グリフと同じ 18px に。幅 `w-10` は中央寄せ視覚バランス維持で残す |
| `SidebarShell.tsx:36` | `collapsed ? "h-10 w-10"` | `collapsed ? "h-[18px] w-10"` | 「公開サイトに戻る」フッターリンク。nav と同じ縦リズムへ統一 |

> 確定値（`h-[18px]` か `h-5`(20px) か）は Phase 11 スクリーンショットで折りたたみピッチ == 展開ピッチ（±2px）を確認して決める。`w-10` の幅は span に背景がなく hover 背景は link(`w-full`)が担うため視覚に影響しない（任意保持）。

## スコープ

| 区分 | 内容 |
|------|------|
| 含む | `SidebarNavItem.tsx`（主）/ `SidebarShell.tsx` 公開サイトに戻るリンク の折りたたみ時アイコンコンテナ高さ調整 + 回帰テスト + スクリーンショット証跡 |
| 含まない（スコープ外・OOS） | OOS-1: `SidebarBrand.tsx:20` ブランド "U" ロゴ箱（折りたたみ `h-10 w-10`）— 意図的に大きい独立ブロック・border 区切り、ユーザー指摘対象外 ／ OOS-2: `SidebarUserMenu.tsx:56` アバター "万" 箱（折りたたみ `h-10 w-10`）— 同上 ／ OOS-3: 水平方向の余白・アイコン色・トグル挙動 ／ OOS-4: スクリーンショット内に映る「セッション情報を取得できませんでした」は別事象（profile session 観測性、別タスクで対応済み） |

> OOS-1/OOS-2 を変更しない理由: ブランドロゴとユーザーアバターは nav アイコン行とは別の視覚プリミティブ（上下端・border 区切り）で、間隔の連続性に寄与しない。ここを縮めるとロゴ/アバターの存在感が損なわれる。ユーザー報告は「アイコン（nav 行）の縦間隔」に限定されるため対象外とする。1サイクル内で完了可能だが本タスクの関心外（CONST_007 の正当な分離ではなく、そもそも別関心）。

## 不変条件

1. 既存 API surface のみ（本タスクは API 非接触）
2. OKLch トークン正本化 / HEX 直書き禁止（`verify-design-tokens`）— 本変更は色トークンに非接触、間隔は Tailwind spacing utility（`h-[18px]` は任意値だが既存 `h-[18px]` パターンと同一）
3. プロトタイプ primitives 群を踏襲（新規 primitive を生やさない）
4. `apps/web` から D1 直接アクセス禁止（本タスクは無関係）
5. アクセシビリティ: `aria-hidden` アイコン / `sr-only` ラベル / `aria-current` / tooltip / `data-shell-block` などの機械可読属性・DOM 構造は不変（className の高さ値のみ変更）

## Phase 一覧

| Phase | File | 状態 |
|-------|------|------|
| 1 | outputs/phase-1/phase-1.md | completed |
| 2 | outputs/phase-2/phase-2.md | completed |
| 3 | outputs/phase-3/phase-3.md | completed |
| 4 | outputs/phase-4/phase-4.md | completed |
| 5 | outputs/phase-5/phase-5.md | implemented |
| 6 | outputs/phase-6/phase-6.md | completed |
| 7 | outputs/phase-7/phase-7.md | completed |
| 8 | outputs/phase-8/phase-8.md | completed |
| 9 | outputs/phase-9/phase-9.md | completed |
| 10 | outputs/phase-10/phase-10.md | passed（Gate-B） |
| 11 | outputs/phase-11/phase-11.md | local evidence captured（screenshot は staging user-gated） |
| 12 | outputs/phase-12/phase-12.md（集約 entry は outputs/phase-12/main.md） | completed |
| 13 | outputs/phase-13/phase-13.md | pending（user 明示承認後のみ） |

## 4 条件 verdict

- 価値性: 折りたたみ常用ユーザーの視覚的不快を解消。コストは className 1〜2 行の変更で最小。
- 実現性: 1 サイクル内・CSS のみで完結。RED/GREEN は className assertion で成立。
- 整合性: 表現層に閉じ、責務境界・状態所有権（`useSidebarState` の `mode`）に非接触。
- 運用性: `verify-design-tokens` / phase12-compliance / gate-metadata の既存 gate を阻害しない。

## 関連タスク / 未タスク候補

| 区分 | 内容 | 状態 |
|------|------|------|
| OOS-1/OOS-2 | Brand/Avatar 箱の折りたたみサイズ統一（仮に将来 IA 統一を行う場合） | 未起票（本タスクと別関心・必要性未確定のため起票しない） |
