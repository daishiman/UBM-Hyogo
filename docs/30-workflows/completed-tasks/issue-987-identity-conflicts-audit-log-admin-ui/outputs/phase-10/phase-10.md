# Phase 10: 最終レビュー

**[実装区分: 実装仕様書]**

Issue #987（dismiss → audit_log 根本解決）の受け入れ判定仕様。acceptance criteria の各項目について判定基準と evidence を定義し、blocker / partial fix / MINOR 指摘の扱いを明文化する。本フェーズは「根本解決が達成されたか」「回帰がないか」「consumer（`/admin/audit` UI）まで通っているか」を最終確認する。

---

## 1. Acceptance Criteria 判定

| # | criterion | 判定基準 | evidence ソース | 判定 |
| --- | --- | --- | --- | --- |
| 1 | dismiss 実行で `audit_log` に `identity.dismiss` 行が 1 件作成される | dismiss 後の `audit_log` に `action='identity.dismiss'` / `target_type='member'` / `target_id=target` / `actor_email` / `before_json={sourceMemberId,targetMemberId}` / `after_json={dismissalId,dismissedAt}` が 1 行存在し、reason は含まれない | `identity-conflicts.contract.spec.ts`（Phase 4/9） | spec green で PASS |
| 2 | `/admin/audit` で `action=identity.dismiss` フィルタにより時系列閲覧でき、`actorEmail` / `targetId` でも絞り込める | audit endpoint が当該行を返し、3 フィルタ（action / actorEmail / targetId）で絞り込める | `audit.contract.spec.ts`（Phase 4/9）+ Phase 11 手動 DoD（user-gated） | spec green + 手動確認で PASS |
| 3 | 既存 contract / 全テスト green | `identity-conflicts.contract` / `audit.contract` / merge 系 / API 全体テストが green。存在しない source/target は 404 `MEMBER_NOT_FOUND` で audit を残さない | Phase 9 一括判定 | 全 green で PASS |
| 4 | merge への回帰なし | `identity.merge` 記録・merge contract が従来通り。merge コードへ触れていない | merge contract spec green + Phase 8 の「共通化見送り＝merge 非改変」記録 | PASS |

> criterion 2 の自動判定は `audit.contract.spec.ts` が担う。UI 上での実閲覧（時系列・フィルタ操作）は consumer wiring が既存で通っているため Phase 11 の user-gated 手動 DoD で最終確認する。

---

## 2. blocker 判定

| 観点 | 判定 |
| --- | --- |
| 機能 blocker | なし（dismiss の audit 記録が contract spec で担保される） |
| 回帰 blocker | なし（merge 非改変。Phase 8 で merge への共通化を見送り、merge コードに触れない方針を確定） |
| surface blocker | なし（route 外形不変・新規 migration 0 件・apps/web 変更 0 件） |
| 型 / lint blocker | Phase 9 の typecheck / lint green が前提条件。fail 時は実装サイクルで修復 |

---

## 3. partial fix の有無（consumer wiring 確認）

本タスクは partial fix ではなく **end-to-end で完結**する。理由:

- producer（dismiss が audit_log に書く）= 本サイクルで実装。
- consumer（`/admin/audit` UI が audit_log を読み action / actorEmail / targetId でフィルタ表示）= **既存実装で通っている**。`apps/web/app/(admin)/admin/audit/page.tsx` + `apps/web/src/components/admin/AuditLogPanel.tsx` は action 自由入力フィルタ + actorEmail / targetType / targetId / 期間フィルタを持つため、`action=identity.dismiss` が書かれた瞬間に追加実装なしで閲覧可能になる。

→ 「producer だけ実装し consumer が未配線」という partial fix の典型は発生しない。consumer wiring が既存で閉じていることを確認済み。

---

## 4. MINOR 指摘 → 未タスク化ルール

根本解決に不要な軽微改善は本サイクルで実装せず、Phase 12 で未タスク候補として記録する（CONST_007 スコープ厳守）。

| MINOR 指摘候補 | 扱い | 理由 |
| --- | --- | --- |
| `AuditLogPanel` に `identity.dismiss` プリセット選択肢（ドロップダウン）を追加 | 未タスク候補（Phase 12） | 既存の action 自由入力で閲覧可能。UX 改善であり根本解決に不要 |
| `audit_log` INSERT ヘルパ抽出（merge / dismiss DRY 化） | 未タスク候補にしない（no-op） | Phase 8 判断: 重複 2 箇所のみ・batch 全体は共通化不可・投機的抽象化 |
| identity.* operation 用の汎用 audit emitter | 未タスク候補にしない（no-op） | 現状 2 操作のみ。操作増加時に再評価すべき YAGNI |

---

## 5. DoD

- [x] acceptance criteria 1-4 が contract spec（+ user-gated 手動 DoD）で PASS と判定できる（D1 focused spec 3 files / 28 tests PASS。staging 手動 DoD は user-gated pending）
- [x] blocker なしを確認
- [x] consumer wiring（`/admin/audit` UI）が既存で通っており partial fix でないことを確認
- [x] MINOR 指摘を未タスク化ルールに従い分類（実装 0 件・Phase 12 連携）
- [x] merge 回帰なしを確認（identity-conflicts contract の duplicate merge 409 既存回帰 PASS）

---

## 6. 参照

- 前段: `outputs/phase-8/phase-8.md`（リファクタリング / 共通化判断）、`outputs/phase-9/phase-9.md`（品質保証）
- 後段: `outputs/phase-11/phase-11.md`（NON_VISUAL 手動テスト）、`outputs/phase-12/`（未タスク検出・compliance）
- consumer: `apps/web/app/(admin)/admin/audit/page.tsx` / `apps/web/src/components/admin/AuditLogPanel.tsx`
