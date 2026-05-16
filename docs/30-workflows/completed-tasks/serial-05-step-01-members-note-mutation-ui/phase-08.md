# Phase 8: 統合テスト

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 統合テスト |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 7 (リファクタリング) |
| 次 Phase | 9 (品質検証) |
| 状態 | pending |

## 目的

`MemberDrawer` + `NoteForm` + `useAdminMutation` + API stub を結合した integration test を追加し、API 契約と UI の整合を保証する。

## 配置

- `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.notes.integration.spec.tsx`

## テスト戦略

- MSW (`msw`) で `POST /api/admin/members/:memberId/notes` / `PATCH /api/admin/members/:memberId/notes/:noteId` の API を mock
- `useRouter` の `refresh` mock を spy で観測
- toast (`sonner`) の呼び出しを spy で観測

## テストケース

| ID | シナリオ | 期待 |
| --- | --- | --- |
| IT-01 | drawer open → 「メモを追加」→ form 表示 | NoteForm が render される |
| IT-02 | 本文入力 → 「追加」→ MSW が POST を 201 で返す | toast.success / router.refresh / form close |
| IT-03 | 既存 note の「編集」→ initialBody 反映 → 「更新」→ MSW が PATCH を 200 で返す | toast.success / router.refresh / form close |
| IT-04 | 空文字 submit | validation error 表示 / fetch 未呼び出し |
| IT-05 | MSW が 409 を返す | toast.error に message 表示 / form 維持 |
| IT-06 | MSW が 401 を返す | FetchAuthedError throw（error boundary 委譲） |
| IT-07 | 並行送信 | 2 回目の trigger は no-op |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.notes.integration.spec.tsx
bash scripts/coverage-guard.sh
```

## 完了条件

- [ ] IT-01..IT-07 すべて green
- [ ] integration test 配置パスが既存 admin 系慣習と一致
- [ ] coverage AC 維持（>=80%）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク100%実行確認【必須】

- [ ] 7 ケース実装済
- [ ] MSW handler が API 契約 (`apps/api/src/routes/admin/member-notes.ts`) と一致

## 次Phase

Phase 9 (品質検証): typecheck / lint / coverage / design-token / build を一括検証。
