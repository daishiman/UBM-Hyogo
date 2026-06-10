# Phase 10: 最終レビュー

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（className 設計）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画）/ Phase 5-8（実装手順・テスト拡充・カバレッジ・リファクタ）/ Phase 9（QA）
- workflow_state: `implemented_local_evidence_captured`（実装・focused vitest・local screenshot 取得済み。staging visual は user-gated）
- visualEvidence: `VISUAL`（collapsed の見え方は Phase 11 で user-gated runtime として確認）
- 本 Phase の責務: AC-1..AC-9 の spec レベル充足見込みを判定し、MINOR 指摘を洗い出して Phase 12 unassigned-task-detection へ渡す候補を確定したうえで「仕様書として実装サイクルへ進行可能」を判定する

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・QA gate）が AC-1..AC-9 へ漏れなく trace され、spec レベルで blocker がないことを最終確認する。
本タスクは実装済みであるため、各 AC は local evidence で充足確認済みとし、staging visual baseline のみ Phase 13 user-gated として分離する。

## 実行タスク

### 1. AC-1..AC-9 充足見込み判定表（spec レベル / blocker 有無）

判定語彙: `passed_local`（local code/test/screenshot で充足） / `staging_pending_user_gate`（staging visual baseline のみ user-gated）。

| AC | 主担当の変更点（設計確定） | 検証手段（Phase） | spec レベル判定 | blocker |
| --- | --- | --- | --- | --- |
| AC-1 collapsed px-0 中央寄せ | 4 コンポーネントの collapsed className に `px-0 w-full justify-center`（brand は分岐新設） | Phase 5/9 spec assert + Phase 11 視覚 | `passed_local`（class assert で担保） | なし |
| AC-2 はみ出し解消（64px 内収まり） | icon/avatar/mark を共通 40px 角枠中央化 | Phase 5/6 spec（40px 枠 class） + Phase 11 視覚 | `passed_local` ／ 実 pixel は `staging_pending_user_gate` | なし |
| AC-3 中心軸一致 | 全 4 行 + collapse-toggle が共通 40px 枠で縦中心線 32px に一致 | Phase 5/6 spec + Phase 11 視覚 | `passed_local` ／ 軸の見え方は `staging_pending_user_gate` | なし |
| AC-4 active border 維持 | `border-l-2` active 表現を collapsed 中央化と両立 | Phase 6/9 spec（collapsed+active） + Phase 11 視覚 | `passed_local` | なし |
| AC-5 expanded regression なし | expanded `gap` 値逐語保持（nav=gap-3 / user-menu=gap-2 / brand=gap-2） | Phase 9 既存 spec 無修正 green | `passed_local`（既存 spec で担保） | なし |
| AC-6 アカウント情報の意味的可視性 | displayName/role の sr-only（collapsed）/ 可視（expanded）分岐維持 | Phase 6/9 spec + Phase 11 視覚 | `passed_local` | なし |
| AC-7 token 厳守 | spacing/layout utility のみ変更・色トークン追加なし | Phase 9 verify:tokens + grep gate | `passed_local` | なし |
| AC-8 API 非変更 | `apps/web/src/components/shell/` のみ変更 | Phase 9 `git diff --name-only -- apps/api` 空 | `passed_local` | なし |
| AC-9 vitest green / collapsed contract | focused vitest が collapsed レイアウト contract を検証 | Phase 9 focused vitest + typecheck/lint | `passed_local`（実走は実装サイクル） | なし |

> AC-2/AC-3/AC-4/AC-6 の「CSS / レイアウトの効き（実 pixel での収まり・軸一致・border 表現）」は jsdom で検証不能なため、Phase 11 staging で **`staging_pending_user_gate`** として user-gated 確認する境界を残す。spec レベルでは DOM 上の className / 構造 assert で担保見込みであり、blocker はない。

### 2. MINOR 指摘の洗い出し → Phase 12 unassigned-task-detection へ渡す候補

> **MINOR → 未タスク化ルールを Phase 10 レビュー前に意識**（[unassigned-task-guidelines]）。本タスクは単一関心（collapsed/expanded レイアウト整合）で 1 サイクル完結する設計であり、主訴に直結する AC は本サイクル内で完結する。本サイクル外の別関心は以下 1 件を baseline として記録する。

| ID | 指摘内容 | 区分 | 解決判断 Phase | ステータス |
| --- | --- | --- | --- | --- |
| OOS-1 | collapsed 時の hover tooltip（`.ubm-shell-tooltip` は aside 右外に `position:absolute`）が `[data-shell="sidebar"]{overflow:hidden}` でクリップされうる問題。解決には aside の overflow 戦略変更（`overflow-x: visible` 化 or tooltip の `position: fixed` 化）が必要で、`height:100dvh` sticky レイアウトと全 viewport 縦スクロール挙動に影響するため独立検証を要する。主訴（はみ出し・中央揃え）とは因果が別の別関心 | MINOR / baseline | Phase 11 で clip の有無を実機確認 → clip 確認かつ改善判断時のみ別タスク化を検討 | **baseline（Phase 11 実機確認待ち。本サイクルでは起票しない）** |

> OOS-1 は「分量が多い」等の先送りではなく、overflow 戦略変更が `height:100dvh` sticky と相互作用する **回帰リスクの分離**（CONST_007 例外: 技術的破綻リスク + 実施場所明記）である。Phase 12 unassigned-task-detection に baseline として記録し、Phase 11 の実機確認結果（clip 有無）を待って起票要否を判断する。
> OOS-1 以外の MINOR 指摘は **0 件**（Phase 3 設計レビューは MINOR 0 件で PASS。`.ui-sidebar-*` legacy CSS の誤判定は実 Read で棄却済み・修正対象外）。

### 3. 不変条件の最終適合確認（CLAUDE.md）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ接続・endpoint / D1 / Form 変更禁止 | ✅ 適合 | 変更は `apps/web/src/components/shell/` の TSX className + test のみ。fetch URL・endpoint surface 不変。AC-8 で `git diff --name-only -- apps/api` 空を gate |
| #2 OKLch トークン正本・HEX 直書き禁止 | ✅ 適合 | 変更は spacing/layout utility（`px-*`/`w-*`/`h-*`/`justify-*`）のみ。色トークン追加なし。AC-7 で `verify:tokens` + grep gate |
| #5 D1 直接アクセス禁止（apps/web → D1） | ✅ 適合 | データ取得・state 管理を変更しない。表現層 className のみ修正 |
| #8 test は `*.spec.*` のみ | ✅ 適合 | 更新 test は `SidebarShell.spec.tsx`（`*.spec.tsx`）。`*.test.*` 不使用 |
| #9 admin form input は FormField 経由 / 新規 `<input>` を増やさない | ✅ 影響なし | 本タスクは form input を追加しない。shell ナビの className 修正のみ |

### 4. 実装サイクル（03.実装）で着手すべき項目

`_shared-context.md` §5 の変更ファイル表に対応し、本 wave で編集済みの対象を一覧化する。

| 対象 | 実装内容 | 対応 AC |
| --- | --- | --- |
| `SidebarNavItem.tsx` L30 | itemClassName を `px-3` 除去 + `${collapsed ? "justify-center gap-0 px-0 w-full py-2" : "gap-3 px-3 py-2"}`、icon span を collapsed 時 40px 枠中央化 | AC-1/2/3/4 |
| `SidebarUserMenu.tsx` L54 | summary を同様に collapsed `px-0 w-full justify-center`、avatar 40px 枠中央化 | AC-1/2/3/6 |
| `SidebarBrand.tsx` L16/L24 | **collapsed 分岐を新設**（`px-0 justify-center`）、mark 40px 枠中央化、text span sr-only 維持 | AC-1/2/3/6 |
| `SidebarShell.tsx` L32（AdminPublicReturn） | nav-item と同一 collapsed 規約（`px-0 w-full justify-center`）に統一 | AC-1/3 |
| `SidebarNav.tsx` L18（任意） | overflow の扱い見直し（はみ出し解消後の整合確認。挙動不変なら無変更） | AC-2 保険 |
| `__tests__/*.spec.tsx` | collapsed/expanded class assertion 追加、`SidebarShell.spec.tsx` 新規 | AC-1..6/9 |

> いずれも `apps/web/src/components/shell/` 内に閉じ、1 つの実装サイクル（03.実装.md）で完了可能。実装後に Phase 9 の focused vitest / gate で全 PASS を確認する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-1-requirements.md` | AC-1..AC-9 定義・根本原因 |
| 設計レビュー | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-3-design-review.md` | MINOR 0 件・不変条件適合・AC トレース |
| QA | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-9-qa.md` | grep gate・検証コマンド・AC マッピング |
| 共有設計 | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/_shared-context.md` | §5 変更ファイル・§6 AC・§7 OOS-1 baseline・§9 Phase 11 evidence・§10 gates |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/` 内 design tokens / UI 仕様 | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | shell ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-9 充足見込み判定（spec レベル / blocker 有無）・MINOR 洗い出し（OOS-1 baseline）・不変条件適合・実装着手項目 |
| 最終判定 | 判定 | 仕様書として実装サイクルへ進行可能 |

## 統合テスト連携

- 本 Phase の AC 充足見込み判定が Phase 12 `phase12-task-spec-compliance-check.md` の 4 条件 verdict / AC trace 節と一致すること。
- MINOR（OOS-1 baseline 1 件・それ以外 0 件）が Phase 3 → Phase 10 → Phase 12 unassigned-task-detection で一貫記録されること。
- 「本 wave で着手済みの項目」が `_shared-context.md` §5 変更ファイル・Phase 9 focused vitest と 1:1 で対応すること。
- Phase 11（視覚）の `staging_pending_user_gate` 行（AC-2/3/4/6 の実 pixel・OOS-1 clip 有無）が user-gated として本改善サイクルへ引き継がれること。

## 最終判定

**implemented_local_evidence_captured（blocker なし）**。

- AC-1..AC-9 がすべて `passed_local` として trace 済み。視覚依存（AC-2/3/4/6）は Phase 11 `staging_pending_user_gate` を明示して境界化。
- spec レベルの blocker なし。実装・focused vitest・local screenshot は完了済み。
- MINOR は OOS-1（baseline・Phase 11 実機確認待ち）の 1 件のみ。それ以外 0 件で Phase 3 と一致。
- 不変条件 #1/#2/#5/#8/#9 に最終適合。

## 完了条件

1. AC-1..AC-9 が spec レベルの充足見込み（`passed_local` / `staging_pending_user_gate`）で trace され、各 AC の blocker 有無が判定されていること。
2. MINOR 洗い出しで OOS-1 を baseline として Phase 12 unassigned-task-detection へ渡す候補に記録し、それ以外 0 件であることが Phase 3 と一致していること（MINOR → 未タスク化ルールを意識）。
3. 不変条件 #1/#2/#5/#8/#9 の最終適合が確認されていること。
4. 本 wave で着手済みの項目が `_shared-context.md` §5 / Phase 9 vitest と対応づけられていること。
5. 最終判定が「implemented_local_evidence_captured（blocker なし）」であること。
