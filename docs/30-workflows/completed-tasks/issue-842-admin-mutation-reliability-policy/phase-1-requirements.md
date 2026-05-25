# Phase 1: 要件定義

## 0. 実装区分とタスク種別の確定

- **実装区分**: `[実装区分: 実装仕様書]`（CONST_004 デフォルト。コード変更を伴う）
- **タスク種別**: NON_VISUAL（admin hooks 内部の信頼性 policy。UI の視覚要素・レイアウトに変更なし）
- **implementation_mode**: `new`（RED/GREEN サイクルで新規実装）。一部 legacy 削除を含む。

## 1. なぜこのタスクが必要か（Why）

admin 配下の全 destructive/mutating 操作は `useAdminMutation` を通る（`MemberDrawer` / `MeetingPanel` / `IdentityConflictRow` / `TagsQueueResolveDrawer` / `SchemaDiffPanel` / `RequestQueuePanel`）。しかし現 hook は fetch ラッパ + エラーハンドリング + `router.refresh()` までしか持たず、以下の信頼性 gap が admin 全体に温存されている。

- **timeout 不在**: fetch がハングしても打ち切られない。管理者が無応答画面を放置 → リロード/別タブで重複操作 → audit log 汚染
- **retry 不在**: 一過性 5xx / network error が即失敗 toast になる
- **idempotency 不在**: 重複押下の保護（client デバウンス + `Idempotency-Key` header）が無い
- **404 解釈の分散**: caller ごとに try/catch で 404 を個別処理（例: `MeetingAttendancePanel`）
- **legacy 二重存在**: `lib/useAdminMutation.ts`（dead code）が import auto-suggest で誤誘導しうる（CLAUDE.md 不変条件 10 違反リスク）
- **abort 連携不在**: `useConfirmDialog` close 時に進行中 mutation を止める手段が無い

## 2. 現状コード inventory（実測・2026-05-24）

| ファイル | 現状 | 本タスクでの扱い |
|---|---|---|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | `useAdminMutation<T>(endpoint, method, options)`。method 型 `"POST"\|"PATCH"\|"PUT"`。AbortController なし。option は `mutationFn`/`onSuccess`/`onError`/`successMessage`/`refreshOnSuccess`/`redirector`/`currentPath` | 拡張（policy 追加・abort 追加・method に DELETE 追加） |
| `apps/web/src/features/admin/hooks/useConfirmDialog.ts` | dialog state + submit orchestration のみ。`closeConfirm` は `submitting` 時は閉じない。abort 連携なし | 拡張（`onCancelMutation?` 追加） |
| `apps/web/src/components/ui/ConfirmDialog.tsx` | presentational。focus trap / restore 実装済（step-06） | **変更なし** |
| `apps/web/src/features/admin/hooks/index.ts` | barrel export | 新規型の export 追加 |
| `apps/web/src/lib/useAdminMutation.ts` | legacy。`useAdminMutation({mutationFn,...})`（options object シグネチャ）。**production caller 0 件** | **削除** |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | legacy 専用テスト | **削除** |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | POST 登録専用。DELETE 未実装。404 を「開催日または会員が見つかりません」として失敗表示 | **変更なし**（AC-6 陳腐化のため。POST 404 は正当な失敗） |

### 既存 caller の method 実測

| caller | endpoint 例 | method |
|---|---|---|
| `MemberDrawer.tsx` | members notes | `PATCH` |
| `MeetingPanel.tsx` | meetings create/update/attendance | `POST` / `PATCH` |
| `IdentityConflictRow.tsx` | merge / dismiss | `POST` |
| `TagsQueueResolveDrawer.tsx` | tags queue resolve | `POST` |
| `SchemaDiffPanel.tsx` | schema aliases | `POST` |
| `RequestQueuePanel.tsx` | request resolve | `POST` |

→ 現 caller は全て **POST/PATCH（非冪等）**。retry を opt-in・idempotent 限定にしても現 caller の挙動は変わらない（後方互換）。

## 3. 命名規則（既存コードに整合）

- hook 名: camelCase（`useAdminMutation` / `useConfirmDialog`）
- 型名: PascalCase（`UseAdminMutationOptions` / `FetchAuthedError`）。新規型も `RetryPolicy` / `Treat404AsSuccess` / `MutationMethod` / `IdempotentMethod`
- option キー: camelCase（`timeoutMs` / `idempotencyKey` / `treat404AsSuccess`）
- テストファイル: `*.spec.ts(x)`（不変条件 8）。テストケース ID は `TC-NN` 形式（既存 spec が `TC-01..10` を使用）

## 4. 受入条件（AC）— 現コードに最適化して再定義

> 元 issue の AC-1〜AC-15 を継承しつつ、陳腐化した AC-6 を最適化。

- **AC-1**: `useAdminMutation` に `timeoutMs` / `retry` / `idempotencyKey` / `treat404AsSuccess` オプションを追加。型定義 + JSDoc を揃える
- **AC-2**: timeout 経過時に `AbortController.abort()` が発火し、AbortError は **失敗 toast を出さない**（silent）。`onError` も呼ばない
- **AC-3**: `retry` は idempotent method（`PUT`/`DELETE`）でのみ**型レベルで**受け付ける。`POST`/`PATCH` では `retry` を渡せない（overload）
- **AC-4**: `treat404AsSuccess` が `false | 'silent' | { toast: string }` の 3 値で型表現され、既定値は `false`
- **AC-5**: `useConfirmDialog` に `onCancelMutation?: () => void` を追加し、`closeConfirm` で呼ぶ。focus restore は `ConfirmDialog.tsx` 側責務のまま（回帰させない）
- **AC-6（最適化）**: `treat404AsSuccess` を hook の汎用 policy として実装する。**強制移行する caller は現状ゼロ**（DELETE attendance 未実装）。`MeetingAttendancePanel.tsx` は変更せず、POST 404 を既定 `false` で失敗扱いのまま維持する。本最適化の根拠を Phase 12 implementation-guide に明記する
- **AC-7（最適化）**: legacy `apps/web/src/lib/useAdminMutation.ts` と `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` を **物理削除**する（0 caller / 互換不能なため re-export 不能）。削除前に `grep` で production 参照 0 件を証跡化
- **AC-8**: 本タスクで触る caller は新基盤のみ参照（CLAUDE.md 不変条件 10）。新規に legacy 参照を増やさない
- **AC-9**: `apps/api` endpoint surface 追加なし
- **AC-10**: D1 schema 変更なし
- **AC-11**: `apps/web` から D1 直接アクセス追加なし
- **AC-12**: `useAdminMutation.spec.ts` に timeout 発火 / retry 上限・backoff / idempotency-key 注入 / 404 三値挙動 / abort 連携の 5 観点を追加し PASS
- **AC-13**: `mise exec -- pnpm typecheck` 0 error
- **AC-14**: `mise exec -- pnpm lint` 0 error / 0 warning（baseline 維持）
- **AC-15**: 該当 vitest が 0 fail で完走

## 5. carry-over 確認

- 直近 commit（`git log --oneline -5`）に admin-ui prototype alignment（#889）あり。本タスクは hooks 信頼性で別関心。重複なし。
- 前身 one-pager `completed-tasks/admin-mutation-timeout-policy.md`（status: pending）の AC を本仕様の §4 で current facts に再定義した。

## 6. 完了条件（Phase 1）

- [ ] 実装区分・タスク種別・implementation_mode を確定
- [ ] 現状コード inventory を実測で記録
- [ ] AC を現コードに最適化して再定義（特に AC-6 / AC-7）
- [ ] 命名規則を既存コードと整合
