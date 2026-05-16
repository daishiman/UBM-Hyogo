# Phase 4: タスク分解

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 6 で実コードを書く前提のサブタスク分解。各 T1..Tn は実ファイル変更を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー / GO) |
| 次 Phase | 5 (実装計画) |
| 状態 | pending |

## 目的

Phase 3 GO 判定後の設計を、単一責務原則 (SRP) に沿った T1..T7 のサブタスクに分解し、依存関係・DoD を Phase 5 に引き渡す。

## サブタスク一覧

| ID | 内容 | 変更対象 | 依存 | 所要 |
| --- | --- | --- | --- | --- |
| T1 | `useAdminMutation.ts` 新規作成 | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | なし | 1.5h |
| T2 | hook barrel export 整備 | `apps/web/src/features/admin/hooks/index.ts` | T1 | 0.2h |
| T3 | `useAdminMutation.spec.ts` 新規 unit test | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | T1 | 1.5h |
| T4 | `NoteForm.tsx` 新規作成 | `apps/web/src/features/admin/components/_members/NoteForm.tsx` | T1, T2 | 1.5h |
| T5 | `NoteForm.spec.tsx` 新規 unit test | `apps/web/src/features/admin/components/_members/__tests__/NoteForm.spec.tsx` | T4 | 1.5h |
| T6 | `MemberDrawer.tsx` notes section 拡張 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | T4 | 1h |
| T7 | integration smoke 動作確認 (`pnpm dev` + 手動) | dev server | T6 | 0.5h |

合計: ~7.7h

## サブタスク詳細

### T1: useAdminMutation hook

**DoD**:
- export 関数シグネチャが Phase 2 設計と一致
- `router.refresh()` を `useRouter().refresh` 経由で呼び出し
- 2xx で `onSuccess` + toast.success
- 4xx/5xx で toast.error + `onError`
- 401/403 で parallel-10 の auth error contract に従って throw（parallel-10 未完了なら step-01 着手 NO-GO）
- `isSubmittingRef` による二重送信防止

**実装方針**:
- `useCallback` で `trigger` を memoize
- `useState<boolean>` で `isLoading`
- `useState<Error | null>` で `error`

### T2: barrel export

**DoD**:
```ts
// apps/web/src/features/admin/hooks/index.ts
export { useAdminMutation } from "./useAdminMutation";
export type { UseAdminMutationOptions, UseAdminMutationReturn } from "./useAdminMutation";
```

### T3: useAdminMutation.spec.ts

**テストケース**:
- TC-01: trigger → fetch with correct method/headers/body
- TC-02: 2xx → onSuccess called with parsed data
- TC-03: 2xx → router.refresh called (mock `useRouter`)
- TC-04: 2xx → toast.success called
- TC-05: 4xx → toast.error called with `body.message ?? body.error`
- TC-06: 4xx → onError called
- TC-07: 401 → FetchAuthedError thrown
- TC-08: isLoading transitions: false → true → false
- TC-09: 並行 trigger → 2回目 no-op

### T4: NoteForm component

**DoD**:
- props: `memberId`, `initialBody?`, `noteId?`, `onSuccess?`, `onCancel?`
- zod validation (`body.min(1).max(2000)`)
- 新規モード: `POST /api/admin/members/${memberId}/notes`
- 編集モード: `PATCH /api/admin/members/${memberId}/notes/${noteId}`
- `useAdminMutation` 経由で送信
- `aria-invalid` / `aria-describedby` で a11y
- label の `htmlFor` で input と関連付け
- design token のみ使用

### T5: NoteForm.spec.tsx

**テストケース**:
- TC-10: form render (textarea + 2 buttons)
- TC-11: textarea change → state update
- TC-12: submit empty → validation error 表示
- TC-13: submit 2001 chars → validation error
- TC-14: submit valid → mutation trigger（mock useAdminMutation）
- TC-15: success → `onSuccess` callback
- TC-16: cancel button → `onCancel` callback
- TC-17: 編集モード（noteId あり）→ PATCH endpoint

### T6: MemberDrawer 拡張

**DoD**:
- 既存 identity / status / audit log section の下に notes section
- `isEditingNote` / `editingNoteId` state 追加
- NoteForm との接続
- design token のみ使用
- 既存 drawer test が green のまま

### T7: 動作確認

**DoD**:
- `pnpm dev` 起動
- admin login → `/admin/members` → member row → drawer
- notes section で add / edit / cancel 動作確認
- toast 表示確認
- drawer 再描画確認（router.refresh 経由）

## 並列実行可能性

- T1 → T2/T3 並列可
- T4 (depends on T1, T2) → T5/T6 並列可
- T7 は最後

## 完了条件

- [ ] T1..T7 全件に DoD 明記
- [ ] 依存矢印が DAG（循環なし）
- [ ] 所要時間合計 / 並列実行時の clock time 算出
- [ ] coverage AC を T3 / T5 完了条件に明記

## タスク100%実行確認【必須】

- [ ] 全サブタスクに変更対象ファイル / DoD / 依存が記載

## 次Phase

Phase 5 (実装計画): T1..T7 を実行順に並べ、コミット粒度・branch 戦略を確定。
