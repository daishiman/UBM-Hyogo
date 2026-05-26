# issue-912-idempotent-attendance-remove-retry

> Source issue: [#912](https://github.com/daishiman/UBM-Hyogo/issues/912)（CLOSED のまま仕様書化）
> Source one-pager: `docs/30-workflows/unassigned-task/issue-842-followup-002-idempotent-caller-retry-enablement.md`
> Parent workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
> 実装区分: **実装仕様書**
> implementation_mode: `extend`
> タスク種別: **NON_VISUAL**（admin UI 内部の mutation 経路差し替え）
> 状態: `implemented_local_evidence_captured`（コード実装 + focused Vitest evidence 取得済み。commit/push/PR/staging runtime は user-gated）
> 作成日: 2026-05-25

## メタ情報

| key | value |
|---|---|
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 調査サマリ（前提依存 §3.4 の充足検証）

issue #912 の source one-pager（issue-842 followup-002）は「冪等 admin endpoint + caller が登場するまで未実施で待機」を前提依存（§3.4）に置いていた。本サイクルでコード調査した結果、**前提依存は既存 surface のみで成立可能** であることを確認したため仕様書化に進める。

| 項目 | コード調査結果（2026-05-25 / branch `task-20260525-161527-wt-14`） | 判定 |
|---|---|---|
| 冪等 DELETE endpoint | `apps/api/src/routes/admin/attendance.ts:177-199` に `app.delete("/meetings/:sessionId/attendance/:memberId", ...)` が**既に存在**（404 race を返し冪等） | ✓ 既存 surface（不変条件1適合・追加不要） |
| 既存 caller の retry/idempotency | `MeetingPanel.tsx:106-122` の `attendanceMutation` は POST + `mutationFn` 経路で `useAdminMutation.spec.ts` TC-27/28 により timeout/retry/abort/idempotency-key が**一切適用されない**ことが固定 | ✗ reliability 享受ゼロ |
| 現 helper の経路 | `apps/web/src/lib/admin/api.ts:556-566` の `removeAttendance` は `POST /meetings/.../attendances` + `{ attended: false }` で叩いており、冪等 DELETE endpoint を使っていない | ✗ 既存 surface 未活用 |
| 別タスクでの解決 | 直近 commit を確認。`removeAttendance` を DELETE に切り替え、`MeetingPanel` の `attendanceMutation` を分割した形跡なし | ✗ 解決されていない |

**結論**: 前提依存（§3.4）は「`DELETE /meetings/:sessionId/attendance/:memberId` が既存 surface として実在」によって充足済み。Issue は CLOSED のまま扱い、PR 文言は `Refs #912` のみを使う。CLAUDE.md 不変条件1（既存 API endpoint surface のみ利用）にも適合する。

### source one-pager からの「現コード最適化」差分

| 旧記述 | 現コードの事実 | 是正 |
|---|---|---|
| 「冪等 endpoint と caller が**先に**実装される必要がある」 | DELETE endpoint は実在。caller 側を helper + Panel の 2 改修で済む | 本サイクルで完結（serial dependent task を作らない） |
| 「`MemberDrawer` / `MeetingPanel` / 他 admin caller は全て POST/PATCH」 | `MeetingPanel.attendanceMutation` は POST だが**実体は出席登録(POST)/解除(DELETE 相当)を兼ねる**両用 mutation で、解除側は冪等 endpoint へ差し替え可能 | mutation を 2 本に分割し DELETE 側のみ retry/idempotency を opt-in |
| 「将来 caller の opt-in 宣言が主スコープ」 | 既存 caller の冪等経路への切替が本タスクの主スコープに昇格 | spec を「extend」（既存 caller 改修 + helper 経路差し替え）として書き直し |

## 概要

`MeetingPanel.tsx` の `attendanceMutation`（POST + `mutationFn` で出席登録/解除を兼ねる）を **2 つの mutation に分割** する:

1. `addAttendanceMutation`: 既存どおり `POST /api/admin/meetings/attendances`（非冪等。`useAdminMutation` overload で retry を型で渡せない）
2. `removeAttendanceMutation`: **`DELETE /api/admin/meetings/:sessionId/attendance/:memberId`** を素の fetch 経路（`mutationFn` を使わない）で叩き、`useAdminMutation(endpoint, "DELETE", { retry: { maxAttempts: 3 }, idempotencyKey: () => crypto.randomUUID() })` で reliability を opt-in

合わせて `apps/web/src/lib/admin/api.ts` の `removeAttendance` を **DELETE エンドポイント直叩き** に切り替え、helper 経由で叩いていた旧経路を整理する。MeetingPanel.tsx の 213 行目（`confirm` dialog 内の解除呼び出し）は `removeAttendanceMutation.trigger` に切り替える。

## 実装方針サマリ

| 項目 | 内容 |
|---|---|
| 改修ファイル | `apps/web/src/lib/admin/api.ts` / `apps/web/src/components/admin/MeetingPanel.tsx` |
| spec | `apps/web/src/lib/admin/__tests__/api.spec.ts` / `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx`（既存 spec 拡張。解除側の retry / idempotency-key / 4xx 非 retry / 既存挙動回帰） |
| 既存 spec への影響 | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` の TC-13..19 / TC-27..29 / TC-TY-01 は本タスクで触らない（回帰のみ確認） |
| hook 本体 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` は**触らない**（既に整備済み） |
| API 側 | 既存 `app.delete(...)` をそのまま使用。新 endpoint・schema 変更なし |

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（背景・AC・scope 固定） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（mutation 分割・helper 経路差替・retry/idempotency 既定値） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（Gate-A 判定） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（helper / component / hook focused Vitest・RED） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（fail path / 回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証 |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL・local vitest 証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント同期 |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 承認後のみ） |

## Phase 12 strict 7

`outputs/phase-12/` に strict 7 を物理配置:

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

## 変更対象ファイル

| path | 種別 |
|---|---|
| `apps/web/src/lib/admin/api.ts` | **修正**（`removeAttendance` を DELETE 直叩きへ差し替え） |
| `apps/web/src/components/admin/MeetingPanel.tsx` | **修正**（`attendanceMutation` を `addAttendanceMutation` / `removeAttendanceMutation` に分割。後者は素の fetch 経路 + retry + idempotency-key） |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | **修正**（helper が登録 POST と解除 DELETE endpoint を使い分けることを固定） |
| `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | **修正**（retry 発火 / Idempotency-Key header / 4xx 非 retry / 404 race 回帰） |

## スコープ外（本仕様内では新規バックログ化しない）

- `useAdminMutation.ts` 本体の型 / overload / runtime ガード / 定数の変更（既に整備済み）
- `apps/api/src/routes/admin/attendance.ts` の DELETE endpoint 仕様変更（既存挙動を活用）
- server 側 `Idempotency-Key` 永続化 / dedupe（issue-842-followup-003 担当・スコープ外明記）
- `MemberDrawer` / `IdentityConflictRow` / `TagsQueueResolveDrawer` / `SchemaDiffPanel` / `RequestQueuePanel` 等の POST/PATCH caller への変更（非冪等のため retry 適用不可）
- 公開 / 会員 mypage の mutation 経路への波及（admin scope 限定）
- D1 schema 変更 / 既存 endpoint 追加・I/O shape 変更

## 不変条件

1. **既存 API endpoint surface のみ**: 新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は禁止（CLAUDE.md 不変条件 #1）。
2. **D1 直接アクセス禁止の継続**: 本変更は `apps/web` 内に閉じる（CLAUDE.md 不変条件 #5）。
3. **test suffix は `*.spec.ts` / `*.spec.tsx` のみ**（CLAUDE.md 不変条件 #8）。
4. **admin mutation は `@/features/admin/hooks/useAdminMutation` 経由**（CLAUDE.md 不変条件 #10）。新 `removeAttendanceMutation` も hook 経由で宣言する。
5. **`mutationFn` 経路を使わない**: `removeAttendanceMutation` は素の fetch 経路（`endpoint` + `method`）を使用。`mutationFn` 経路は timeout/retry/abort/idempotency-key が一切適用されない後方互換罠（TC-27/28 で固定）。
6. **retry は idempotent method（DELETE）限定**: `addAttendanceMutation` は POST のため overload で retry を型レベルで渡せない（TC-TY-01 で固定）。
7. **既存挙動の保持**: 404 race（既に解除済み）の場合の楽観 UI 戻し、409/422 toast、`router.refresh` 等の挙動は本変更で改変しない。

## 正本順位（衝突時）

1. 本ワークフローの `phase-*.md`
2. `apps/api/src/routes/admin/attendance.ts` / `apps/web/src/features/admin/hooks/useAdminMutation.ts` の現行実装事実
3. source one-pager（`docs/30-workflows/unassigned-task/issue-842-followup-002-idempotent-caller-retry-enablement.md`）— 「将来 task として未着手で待機」を最劣後
