# issue-842-admin-mutation-reliability-policy

> Source issue: [#842](https://github.com/daishiman/UBM-Hyogo/issues/842)（**CLOSED のまま仕様書化**）
> 前身 one-pager: `docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md`（status: `pending`・単一指示書）
> 発見元 workflow: `docs/30-workflows/step-06-meetings-attendance-implementation/`（Phase 12 unassigned-task-detection）
> 実装区分: **実装仕様書**（CONST_004 デフォルト。コード変更を伴う）
> タスク種別: **NON_VISUAL**（admin hooks 内部の信頼性 policy。UI 視覚変更なし）
> 状態: `implemented`（実装完了・ローカル QA 全 PASS・未コミット。commit/PR/push はユーザー明示承認後）
> 作成日: 2026-05-24
> 実装完了日: 2026-05-24

## 調査サマリ（CLOSED 状態の妥当性検証 + issue の陳腐化検証）

issue #842 のコード実装が他タスクで解決済みかを、関連 7 ファイルを直接読んで検証した結果。

| AC | 対象 | 現状（2026-05-24 時点） | 判定 |
|---|---|---|---|
| AC-1 | `useAdminMutation.ts` の policy オプション | `timeoutMs`/`retry`/`idempotencyKey`/`treat404AsSuccess` いずれも無い。method 型は `"POST"\|"PATCH"\|"PUT"`（DELETE すら無い） | **未実装** |
| AC-2 | timeout abort silent | `AbortController` 自体が未使用 | **未実装** |
| AC-3 | retry idempotent 限定（型） | retry 機構が無い | **未実装** |
| AC-4 | `treat404AsSuccess` 3 値 | 無し。404 は一律 `FetchAuthedError` | **未実装** |
| AC-5 | `useConfirmDialog` abort 連携 | dialog state のみ。abort 連携なし（focus restore は `ConfirmDialog.tsx` 側に有り） | **部分**（focus restore のみ） |
| AC-6 | `MeetingAttendancePanel.tsx` 404→hook | **現パネルは POST 登録のみ。DELETE 未実装**でコメントに「破壊操作は将来 task」。issue が前提とする「DELETE 404 = 他管理者先行解除」シナリオが現コードに存在しない | **前提が陳腐化** |
| AC-7 | legacy `lib/useAdminMutation.ts` 処置 | ファイル本体 + 専用テスト `lib/__tests__/useAdminMutation.spec.tsx` が残存。**production caller は 0 件**（dead code） | **未実施** |
| AC-8 | caller 新基盤参照 | legacy 参照 0 件。全 caller が `features/admin/hooks/useAdminMutation` のみ参照 | **達成済** |
| AC-12 | spec test 5 観点 | timeout/retry/idempotency/404-3値/abort のテストなし（既存 TC-01..10 は基本系のみ） | **未実装** |

**結論**: issue #842 は **不要ではない**。timeout / retry / idempotency / abort 連携という admin 全 mutation 共通の信頼性 gap が現存し、コード実装が必要。
ただし issue は **陳腐化している**ため、最新コードに最適化した（下記「issue 陳腐化への最適化方針」）うえで根本問題を解決する。Issue は CLOSED のまま、PR 文言は `Refs #842` を使う。

## issue 陳腐化への最適化方針（最新コード整合）

| 元 issue の前提 | 現コードの実態 | 本仕様での最適化 |
|---|---|---|
| AC-6: `MeetingAttendancePanel.tsx` の DELETE 404「他管理者先行解除」を hook へ移譲 | パネルは POST 登録専用。DELETE 未実装。404 は正当な「not found」失敗 | `treat404AsSuccess` は **汎用 policy オプションとして実装するが、強制移行する caller は現状ゼロ**。MeetingAttendancePanel の POST 404 は既定 `false`（失敗扱い）のまま維持。将来 DELETE attendance 実装時に当該 policy を宣言で使える土台のみ整える |
| AC-3: retry は GET/PUT/DELETE 限定 | 現 caller は全て POST/PATCH（非冪等）。GET は mutation で未使用 | retry は **opt-in・既定オフ**。idempotent method（`PUT`/`DELETE`）でのみ型レベルで受け付ける。現 caller（POST/PATCH）は型で retry を渡せない |
| AC-7: 削除 / re-export / deprecate を判断 | legacy は 0 caller の dead code。新旧シグネチャが互換不能（legacy=options object / 新=positional） | **削除**を採用（re-export は不能、deprecate は dead code を温存するだけ）。legacy 本体 + 専用テストを物理削除 |

## 概要

`apps/web/src/features/admin/hooks/useAdminMutation` を admin destructive/mutating 操作の **唯一の reliability policy 注入点**に確立する。timeout（`AbortController`）/ retry（idempotent 限定・exponential backoff）/ idempotency-key 送出 / 404 success-relaxation の共通 edge case を hook 内部に吸収し、`useConfirmDialog` の close → 進行中 mutation abort → focus restore の責務境界を確定する。legacy dead code を物理削除して SSOT を一本化する。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（inventory / 命名規則 / AC 再定義） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（型・シグネチャ・abort 連携契約・404 policy） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（Phase 4 進行可否判定） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（RED ケース・期待値） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（変更ファイル・差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（fail path / 回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認（変更行 line/branch） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証（typecheck/lint/build） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー（AC 判定） |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL 宣言・代替証跡） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明 + 技術詳細 + spec sync） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（ユーザー明示承認後のみ） |

## 変更対象ファイル

| パス | 種別 | 内容 |
|---|---|---|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 編集 | policy オプション拡張 + AbortController timeout + retry + idempotency-key + 404 policy + `abort()` 返却 + method 型に `DELETE` 追加 + overload で retry を idempotent 限定 |
| `apps/web/src/features/admin/hooks/useConfirmDialog.ts` | 編集 | `onCancelMutation?` option 追加・`closeConfirm` で abort 連携 |
| `apps/web/src/features/admin/hooks/index.ts` | 編集 | 新規 export 型（`RetryPolicy`/`Treat404AsSuccess`/`MutationMethod`）追加 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | 編集 | timeout / retry / idempotency / 404-3値 / abort の 5 観点追加 |
| `apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx` | 編集 | `onCancelMutation` 連携の回帰テスト追加 + 既存 U7（submit 中 close = no-op）を新仕様（abort して閉じる）へ改訂 |
| `apps/web/src/lib/useAdminMutation.ts` | **削除** | legacy dead code（0 caller） |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | **削除** | legacy 専用テスト |

> `MeetingAttendancePanel.tsx` は **本サイクルでは変更しない**（POST 404 は既定 `false` で現挙動維持）。issue AC-6 の陳腐化に伴う最適化。

## スコープ外（本仕様内では新規バックログ化しない）

- API endpoint surface の追加・変更（CLAUDE.md UI prototype alignment 不変条件 1）
- D1 schema 変更 / `apps/web` からの D1 直接アクセス（不変条件 5）
- server 側 idempotency-key の永続化（client 送出と header 設計まで。server 永続化は元 issue でも明示スコープ外）
- DELETE attendance route 自体の新規実装（step-06 が「将来 task」と明記。本タスクは hook 基盤のみ整備）
- 公開 / 会員 mypage の mutation 経路への波及（admin scope 限定）
- ConfirmDialog 自体の UI/UX 変更（focus trap / restore は step-06 完了済）

## 不変条件

1. **既存 API endpoint surface のみ利用**（新 endpoint・D1 schema・Google Form 変更禁止）
2. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由を標準（CLAUDE.md 不変条件 10）。legacy `lib/useAdminMutation` への新規参照を増やさず、本タスクで物理削除する
3. `apps/web` から D1 binding への直接アクセス禁止（不変条件 5）
4. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（不変条件 8）
5. AbortError は hook 内で握り、失敗 toast を出さない（silent abort）。focus restore は dialog 責務、通信ライフサイクルは hook 責務に層を切る
6. retry は idempotent method（`PUT`/`DELETE`）に型レベルで限定し、既定オフ
