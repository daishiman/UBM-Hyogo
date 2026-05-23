# Phase 2: アーキテクチャ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 区分 | 設計（実装なし） |
| 想定所要 | 0.25 人日 |

## 目的

`useConfirmDialog` hook と既存 `useAdminMutation` の責務境界を確定し、
admin meetings 画面における呼び出し関係を図式化する。

## レイヤ構成

```
┌─────────────────────────────────────────────┐
│ apps/web/app/(admin)/admin/meetings/        │
│   ├─ page.tsx (Server Component)            │
│   └─ [id]/page.tsx (Server Component)       │
│        ↓ props (server fetch 済データ)        │
│ ┌─────────────────────────────────────┐     │
│ │ MeetingPanel.tsx ("use client")     │     │
│ │ MeetingAttendancePanel.tsx          │     │
│ │   ↓ uses                            │     │
│ │ ┌───────────────────────────────┐  │     │
│ │ │ features/admin/hooks/         │  │     │
│ │ │  ├─ useAdminMutation (既存)    │  │     │
│ │ │  └─ useConfirmDialog (新規)   │  │     │
│ │ └───────────────────────────────┘  │     │
│ │   ↓ render                          │     │
│ │ components/ui/ConfirmDialog (新規)  │     │
│ └─────────────────────────────────────┘     │
│        ↓ HTTP                                │
└────────┼─────────────────────────────────────┘
         ↓
  apps/api/src/routes/admin/meetings.ts
  (`POST /meetings/:id/attendances`)
         ↓ D1 binding
       D1 (Cloudflare)
```

## 責務分離

| モジュール | 責務 |
| --- | --- |
| `useAdminMutation` | HTTP mutation 実行 / loading / error / auth redirect / toast 発火 |
| `useConfirmDialog` | UI state 管理（open/kind/note/submitting/validation）+ submit orchestration |
| `ConfirmDialog` | presentational（aria 属性 / backdrop / button 配置）。state を持たない |
| `MeetingPanel` | 一覧 + 編集 + 出席選択 + confirm 表示 |
| `MeetingAttendancePanel` | 詳細画面の候補リスト + 出席登録 |

## hook の関係

```
MeetingPanel
  ├ useAdminMutation(attendance POST/DELETE)  → trigger()
  └ useConfirmDialog(async (kind, note, ctx) => {
        if (kind === "remove") await removeMutation.trigger(ctx);
        if (kind === "delete") await meetingUpdateMutation.trigger({ ...ctx, deletedAt: now });
      })
        → openConfirm("remove", { sessionId, memberId })
        → submit() が trigger を呼ぶ
        → 完了で closeConfirm()
```

MeetingAttendancePanel は MVP では confirm dialog を使わず、
`useAdminMutation` 直接 + 重複時 toast のみで完結する（破壊的操作ではないため）。
削除を伴う UI を MeetingAttendancePanel に追加する場合は将来 task で `useConfirmDialog` を導入。

## error → UI mapping

| status | error code | UI |
| --- | --- | --- |
| 200 | — | toast "出席を追加しました" / "出席を削除しました" |
| 404 | `session_not_found` / `member_not_found` / `attendance_not_found` | toast "開催日または会員が見つかりません" |
| 409 | `attendance_already_recorded` | toast "既に出席登録済み" + 楽観 UI で attended Set に追加 |
| 422 | `member_is_deleted` | toast "削除済み会員は登録できません" |
| 401 | — | `useAdminMutation` の AuthRequiredError → login redirect |
| 5xx | — | toast "登録に失敗 (status)" |

`AdminMutationError.status` を分岐キーとし、`useAdminMutation` の `onError` で `setToast(...)`。

## 楽観 UI 戦略

- 追加 / 削除は **API 成功後** に `attended` Set を更新（楽観前更新はしない、ロールバック処理を避ける）
- 409 受信時のみ「既に登録済み」として Set に追加する後方更新を行う
- `router.refresh()` は meeting 自体の create/update/softDelete のみで実行。attendance 単発では呼ばない（既存挙動を踏襲）

## 完了条件

- [ ] レイヤ図に基づく依存方向（UI → hook → API helper → fetch）が単方向であること
- [ ] `useConfirmDialog` が presentational に依存しない（ConfirmDialog import を持たない）こと
- [ ] error → UI mapping 表が Phase 4 / Phase 5 / Phase 11 で参照可能であること
- [ ] API path が現行 UI alias `/api/admin/meetings/:id/attendances` に統一されていること

## リスク

- `useConfirmDialog` の submit が長時間ブロックされた場合のキャンセル → MVP では submitting=true 中の close 不可とする
- 多重 confirm（同時複数 open）→ 単一 dialog 前提。openConfirm 呼び出し時に既存 state を上書きする設計
