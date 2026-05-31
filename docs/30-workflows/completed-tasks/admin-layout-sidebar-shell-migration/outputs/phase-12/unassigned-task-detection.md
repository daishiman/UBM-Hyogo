# Unassigned Task Detection — admin-layout-sidebar-shell-migration

## Result

本 wave で Task A/B/D + Task E 最小を一括実装した。SF-03 4 パターンの新規未タスクは 0 件。
ただし**意図的に分離した follow-up が 1 件**ある（下記 FU-ALSSM-001）。

## SF-03 Check

| Pattern | Result | Reason |
| --- | --- | --- |
| Type definition to implementation | 0 | shell 型（`shell-config.ts`）と layout は本 wave で実装済み。未実装の型→実装ギャップなし |
| Contract to test | 0 | layout.spec.tsx（TC-01/02/03/07/08）+ shell `__tests__/*` + schema-diff-count.spec.ts で cover。web Vitest 1299 passed |
| UI spec to component | 0 | SidebarShell / SidebarUserMenu / SidebarMobileTrigger は本 wave で実装。親 workflow の Task C（public/member layout 統合）/ Task F / Task E 完全版は親 workflow の別タスクであり本タスクの未検出ではない |
| Spec drift to decision | 0 | source sketch drift（package 名 / test path / redirect / x-pathname / schema diff count）は index.md と Phase 1/2 で正規化済 |

## Deferred follow-up（CONST_008 例外条件該当）

### FU-ALSSM-001: sidebar collapse 状態の永続化（cookie 方式）

| 項目 | 内容 |
| --- | --- |
| 検出元 | `apps/web/src/components/shell/useSidebarState.ts` 実装時 |
| 内容 | 当初仕様は collapse 状態を Web Storage に永続化する想定だったが、`scripts/lint-boundaries.mjs` が `localStorage`/`sessionStorage` トークンを **forbidden**（apps/web/src 使用例ゼロ）としているため、永続化を撤廃し in-memory（session 単位）に限定した |
| 分離理由（CONST_008 条件1） | 永続化には storage 禁止制約を回避する **cookie ベースの新方式**（SSR/CSR 両対応・読み取り箇所の追加）が必要で、本タスクの「layout 移行 + 旧 sidebar 削除」とは独立した別スコープ。今 wave で混入すると関心が分裂し DOM contract 検証の焦点がぼやける |
| 実施時期・場所 | 親 workflow `unified-sidebar-shell-public-and-admin`（shell の所有者）配下。**GitHub Issue #1024 起票済み**（ユーザー承認・2026-05-29） |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/1024（type:followup / area:web,admin-ui / priority:low / wave:2-plus / scale:small） |
| 影響度 | low（機能上は in-memory で動作。UX 改善のみ） |

> CONST_008 に従いユーザー承認のうえ Issue #1024 を起票済み。

## Dependency Boundary

Task A/B/E は本タスクの blocking dependency だったが、ユーザー承認（CONST_009）のもと本 wave で一括実装し解消した。
親 workflow `unified-sidebar-shell-public-and-admin` の Task C / Task F / Task E 完全版は未実装で、親 workflow が引き続き所有する。
