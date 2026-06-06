# Phase 12: ドキュメント更新（main）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: NON_VISUAL`

> 本ワークフローは Issue #1094（FU-AIDC-008）の Phase 1-13 実装仕様書として作成後、automation-30 改善で **local 実装と focused evidence 取得まで同一サイクルで完了**した。commit・push・PR・Issue mutation・staging 手動 SR 検証のみ user-gated。

## このフェーズの目的

`/admin/identity-conflicts` の optimistic 消失（merge / dismiss 直後の row 非表示）時の screen reader アナウンスを、(1) focus stealing 非依存、(2) 連続処理で競合・欠落しない、(3) 文言を単一導出、へ最適化する実装仕様の close-out を strict 7 成果物として固定する。設計核心（ページレベル単一 live region `IdentityConflictAnnouncer` + append-children + `ANNOUNCE_TTL_MS` 自動除去 + 文言 pure module `announcementFor` + row 側 `hasAnnouncedRef` の1回固定/rollback reset）を identifier drift なく記録する。

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い（spec_created） | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | Part 1（中学生レベル・例え話）+ Part 2（型 / 定数 / シグネチャ / 副作用 / エラー / エッジケース）+ 視覚証跡（NON_VISUAL）を記述 | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を implemented local evidence として同期。Step 2 は新規 export 型 / component / hook 追加に該当し、aiworkflow-requirements へ同一サイクル反映 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | 全 Step 結果を個別明記。workflow-local 同期と global skill sync を別ブロックで記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | Phase 3 MINOR-1/2/3 を個別評価。current/baseline 分離。新規未タスク 0 件 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | NON_VISUAL + row-local→page-level 集約 + Server→client children の spec 化知見を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 見出し + strict 7） | canonical 9 見出し逐語・strict 7 全 present・spec_created 一致を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | （本ファイル） | Phase 12 全体サマリと strict 7 へのリンク |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡（NON_VISUAL） |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・spec_created 状況・関連タスク）+ Step 2 判定 |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録（workflow-local / global skill sync 別ブロック） |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（新規 0 件 + MINOR 評価 + current/baseline 分離 + 関連タスク差分確認） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 見出し + strict 7 present 確認 |

## 実装対象（local 実装済み）

| パス | 種別 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | **新規**（実装済み） |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | **新規**（実装済み） |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集（row-local status / focus 撤去、announce 配線済み） |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編集（`IdentityConflictAnnouncer` wrapper 配置済み） |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集（provider 配下の非 focus-steal / dismiss announcement assertion 更新済み） |
| `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | **新規**（5 tests 実装済み） |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 変更なし（NON_VISUAL のため focused Vitest を主証跡化） |

> API contract / D1 schema / `useAdminMutation` / `tokens.css` / `globals.css` / `role="alert"` inline error は一切変更しない（不変条件 #1 / #2 / #5 / #10・AC-5）。

## 設計核心（implementation-guide と一致させる識別子）

| 項目 | 値 |
| --- | --- |
| 新規 export 型 | `IdentityConflictAction = "merge" \| "dismiss"` |
| 新規 export const / 関数 | `IDENTITY_CONFLICT_ANNOUNCEMENTS: Record<IdentityConflictAction, string>` / `announcementFor(action)` |
| 新規 component / hook | `IdentityConflictAnnouncer`（単一 live region + provider）/ `useIdentityConflictAnnounce()`（context reader・provider 外 no-op） |
| 新規定数 | `ANNOUNCE_TTL_MS = 1000`（child 自動除去の TTL） |
| row 側差分 | `announce` 呼び出し + `hasAnnouncedRef`（1回固定 / rollback reset）。row-local status node（136-148）・focus useEffect（81-84）・`optimisticStatusRef`（35）を撤去し `return null` 化 |
| 競合回避 | 単一 region への append-children（`messages: {id,text}[]`）。同一 tick 上書き / 文言 collapse を回避 |

## Issue 状態の注記

- GitHub 上 **Issue #1094 は `CLOSED`**（closed 2026-06-04T22:10:15Z）。
- 本ワークフローでは Issue 状態を変更しない（reopen も close もしない）。`CLOSED` のままメタ情報へ反映する。
- 実装・commit・push・PR・Issue mutation はすべて user-gated。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1。merge / dismiss endpoint / payload 不変）
2. OKLch トークン正本（#2。live region は sr-only。HEX 直書き / inline `style={{}}` / 新規 token / keyframes なし）
3. admin form input は FormField / primitive 経由（#9。新規 primitive を生やさない）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10。legacy `@/lib/useAdminMutation` 不使用）
5. D1 直接アクセス禁止（#5。`apps/web` から D1 binding 不可）

## Local Evidence

| コマンド | 結果 |
| --- | --- |
| `pnpm install` | PASS（node_modules missing 解消） |
| `pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | PASS（2 files / 26 tests） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm verify:tokens` | PASS |
| `rg "optimisticStatusRef|\\.focus\\(\\)|@/lib/useAdminMutation|#[0-9a-fA-F]{3,8}|style=\\{" ...` | 0 件 |

## 残 user-gated 境界

- `git commit` / `git push` / `gh pr create --base dev`
- GitHub Issue #1094 の状態変更（CLOSED のまま変更しない）
- staging 認証環境での手動 SR（VoiceOver / NVDA）確認
