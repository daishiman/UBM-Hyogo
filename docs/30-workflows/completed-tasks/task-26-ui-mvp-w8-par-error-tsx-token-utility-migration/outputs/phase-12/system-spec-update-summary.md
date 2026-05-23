# Phase 12 — システム仕様更新サマリ

## Step 1-A: 完了タスク記録

task-26 は `spec_created` ではなく `implemented_local_evidence_captured` として記録する。現行 App Router topology は `apps/web/app/` であり、旧 topology path は本 close-out で撤回した。

## Step 1-B: 実装状況テーブル

| Task | 状態 | 備考 |
|------|------|------|
| task-26 | `implemented_local_evidence_captured` | `apps/web/app/error.tsx` / `not-found.tsx` / `loading.tsx` の token utility migration、focused test、Phase 11 screenshot を同一サイクルで完了 |

## Step 1-C: 関連タスクテーブル

| 関連 task | 関係 | 状態 |
|----------|------|------|
| task-05 | upstream（error boundary 実装） | implemented-local-runtime-pending |
| task-08 | upstream（design token SSOT） | completed |
| task-09 | upstream（Tailwind v4 `@theme inline` bridge） | completed |
| task-18 | downstream（verify-design-tokens / Playwright smoke） | runtime gate |
| task-24 | related（広域 invariant audit） | spec_created |

## Step 1-H: Skill feedback routing

| Feedback | Routing | 判定 |
| --- | --- | --- |
| FB-T26-01 | task-specification-creator template candidate | no-op（既存の `verify_existing` / VISUAL Phase 11 evidence ルールで表現可能） |
| FB-T26-02 | design-token migration pattern candidate | no-op（本 task は consumer migration の単発実例。2例以上蓄積後に汎化） |
| FB-T26-03 | Phase 1 current topology / file existence gate | already covered by stale topology gate in task-specification-creator references |
| FB-T26-04 | visual baseline代替基準 | local対応済み（本 task は VISUAL として Phase 11 screenshot を保存。task-18 broad visual は downstream gate） |
| FB-T26-05 | mapping table section | local workflow only（Phase 2 / implementation-guide に反映済み） |

## Step 2: システム仕様変更（新規 interface 追加判定）

| 項目 | 判定 |
|------|------|
| 新規 interface / 型 | なし |
| 既存 interface 変更 | なし |
| 新規定数 / 設定値 | なし |
| API / IPC 仕様変更 | なし |
| 結論 | Step 2 N/A（既存 token SSOT / bridge に consumer を合わせたのみ） |

## 影響範囲

- Runtime code: `apps/web/app/error.tsx`, `apps/web/app/not-found.tsx`, `apps/web/app/loading.tsx`
- Focused test: `apps/web/app/__tests__/error.component.spec.tsx`
- SSOT / bridge: unchanged
- aiworkflow-requirements: workflow ledger sync only
