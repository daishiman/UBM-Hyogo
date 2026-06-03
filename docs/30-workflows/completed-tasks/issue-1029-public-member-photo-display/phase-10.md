# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書]**。本 Phase は AC-1..8 の acceptance 判定と、MINOR 指摘の Phase 12 未タスク化・partial fix 格下げ基準を固定する。local implementation と local runtime screenshot は完了済みで、staging/R2 実 URL capture のみ user-gated pending。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- 前提: Phase 9（品質保証）完了
- 判定方式: local source-level と local runtime visual は `PASS` / staging R2 visual は `pending_user_gate` で確定する

## 目的

public member photo display の実装サイクル成果を AC-1..8 単位で acceptance 判定し、MINOR 指摘を Phase 12 の未タスク化対象に振り分ける基準と、partial fix の格下げ基準（[FB-CANCEL-004-1]）を固定する。

## AC acceptance 判定表

| AC | 受入条件（要約） | 検証方法 | 検証 Phase | 判定 |
|----|-----------------|---------|-----------|------------------|
| AC-1 | 写真公開ポリシー（gate / TTL 300s / R2 read タイミング / Cache-Control）が specs に明文化 | `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` | Phase 12 | PASS |
| AC-2 | `PublicMemberListItemZ` / `PublicMemberProfileZ` に `photoUrl?` 追加で既存 parse 不変（`.strict()` 維持） | `viewmodel-photo.spec.ts` 16 tests PASS | Phase 4/5 | PASS |
| AC-3 | public list API は公開 gate 通過 かつ 写真登録済み member のみ presigned `photoUrl` 返却 | use-case tests + public route contract PASS | Phase 4/5/6 | PASS |
| AC-4 | public profile API も同 gate で `photoUrl` 返却。非公開・写真未登録は省略 | use-case tests + public route contract PASS | Phase 4/5/6 | PASS |
| AC-5 | photoUrl 未取得 member の avatar は現行 hue placeholder と pixel diff ゼロ（onError fallback 含む） | component tests PASS。local Playwright screenshot PASS | Phase 11 | PASS_LOCAL / staging R2 capture pending |
| AC-6 | public route に bucket 名・object key・admin audit data が一切露出しない（presigned `photoUrl` 文字列のみ） | zod `.strict()` + route response shape | Phase 5/9 | PASS |
| AC-7 | `apps/web` から R2/D1 直接アクセス無し | web receives `photoUrl` only; typecheck PASS | Phase 9 | PASS |
| AC-8 | list は `listMemberPhotosByIds` で 1 query batch（N+1 無し）。secret 未設定／presign 失敗は fail-soft（200 維持） | repository/use-case/route tests PASS | Phase 4/5/6 | PASS |

> local source-level acceptance と local runtime screenshot は PASS。staging/R2 実 URL screenshot は VISUAL_ON_EXECUTION の user-gated evidence として残す。

## MINOR 指摘の Phase 12 未タスク化基準

本実装サイクルで以下に該当する指摘は **MINOR** とし、本 task では修正せず Phase 12 の未タスク検出（`unassigned-task-detection`）対象として記録する。

| 区分 | 基準 | 例 |
|------|------|-----|
| MINOR（未タスク化） | AC-1..8 の受入を満たすが、scope 外の改善余地 | thumbnail/transcode（#983-followup-003 で分離済）、list 写真の lazy-load 最適化 |
| BLOCKER（本 task で修正必須） | AC-1..8 のいずれかが未達 | gate 不通過 member の photoUrl 漏れ、`apps/web` への R2 漏れ、pixel diff 非ゼロ |

## partial fix 格下げ基準（[FB-CANCEL-004-1]）

| 状況 | 判定 |
|------|------|
| AC を 1 つでも未達のまま「概ね対応」とする | **格下げ不可**。BLOCKER として完了まで実装する |
| AC を全達成し、scope 外の追加最適化のみ残る | partial ではなく**完了**。残余は MINOR 未タスク化 |
| 環境ブロッカー（R2 secret / staging deploy）で runtime 検証のみ未完 | `implemented_local_runtime_pending` として記録（partial fix ではない。source-level は完了） |

> partial fix を「完了」と誤格上げしない。AC 未達は BLOCKER。環境ブロッカーによる runtime 未検証は status 表現（`implemented_local_runtime_pending`）で区別し、source-level の達成と混同しない。

## 実行タスク

- AC-1..8 判定表の判定列を `PASS` / `PASS_LOCAL` で確定する。
- MINOR 指摘を Phase 12 未タスク検出へ振り分ける。
- partial fix 格下げ基準に従い、AC 未達を BLOCKER として扱う。

## 参照資料

- `index.md`（§2 AC-1..8）
- `phase-9.md`（QG ゲート結果）/ `phase-11.md`（visual evidence）
- `.claude/skills/task-specification-creator/references/review-gate-criteria.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-evaluation.md`

## 成果物

- Phase 10 最終レビュー（本ファイル・AC 判定表 + MINOR/partial fix 基準）

## 完了条件

- [ ] AC-1..8 判定表が検証方法・検証 Phase 付きで固定され、local 判定が PASS である
- [ ] MINOR（未タスク化）と BLOCKER（本 task 修正必須）の区分基準が固定されている
- [ ] partial fix 格下げ基準が固定され、AC 未達 = BLOCKER であることが明記されている
- [ ] 環境ブロッカーによる runtime 未検証が `implemented_local_runtime_pending` で区別されている

## 統合テスト連携

本 Phase の AC 判定表が Phase 12 compliance の acceptance 根拠になる。MINOR 指摘は Phase 12 unassigned-task-detection に連携する。
