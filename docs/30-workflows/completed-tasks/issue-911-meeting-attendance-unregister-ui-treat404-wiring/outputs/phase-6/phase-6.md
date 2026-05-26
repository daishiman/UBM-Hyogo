**[実装区分: 実装仕様書]**

# Phase 6: エラーハンドリング設計

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `implemented_local_evidence_captured` |
| 入力 | Phase 1-5 |
| 対象 | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` |

## 1. FetchAuthedError status 別 UI 扱い

| status | 発生条件 | UI 上の扱い | toast 種別 | UI 副作用 |
|---|---|---|---|---|
| 200 | 解除成功（API 側 `removeAttendance` 成功） | success path | status 「出席を解除しました」 | registered Set から memberId を削除し、解除 button を非表示 |
| 404 | 既に解除済 / race 同時操作 | **success 相当** （`treat404AsSuccess` 経由） | status 「既に解除済みです」 | success path と同じ local 反映、追加 refresh しない（`refreshOnSuccess: false`） |
| 409 | unregister では通常発生しないが返却された場合 | error path | status 「解除に失敗 (409)」 | UI 状態を変えず、`logger.error` に status を残す |
| 422 | バリデーション失敗（API が `attended` 不在等を弾いた場合） | error path | status 「解除に失敗 (422)」 | UI 状態を変えず、`logger.error` に status を残す |
| 5xx | サーバ不調 | error path | status 「解除に失敗 (status)」 | UI 状態を変えず、`logger.error` に status を残す |
| network | fetch 自体が失敗（offline 等） | error path | status 「解除に失敗 (unknown)」 | UI 状態を変えず、`logger.warn` に error を残す |

## 2. register / unregister mutation の責任分離

| mutation | endpoint | method | body | options |
|---|---|---|---|---|
| register | `/api/admin/meetings/{id}/attendances` | `POST` | `{ memberId, attended: true }` | `refreshOnSuccess: false`（既存 local Set 反映）/ `treat404AsSuccess` 不指定 |
| unregister | `/api/admin/meetings/{id}/attendances` | `POST` | `{ memberId, attended: false }` | `refreshOnSuccess: false` / `treat404AsSuccess: { toast: "既に解除済みです" }` |

### 不変条件

1. 2 つの `useAdminMutation` は **別インスタンス**として宣言する（option 衝突を構造的に防止）。
2. register 側に `treat404AsSuccess` を渡してはならない（誤適用すると「未登録から登録した直後の 404」を success に誤判定する）。
3. unregister 側は `refreshOnSuccess: false` を必須にする（API 側 audit log は発火するが、UI の再 fetch は不要 / 連打 race を避ける）。
4. caller は `@/features/admin/hooks/useAdminMutation` を経由する（CLAUDE.md 不変条件 10）。`@/lib/useAdminMutation` は import 禁止。

## 3. 404 success path の戻り値整形

`useAdminMutation` の `treat404AsSuccess` 適用時、`trigger` の resolve value は `undefined` になる仕様。`MeetingAttendancePanel.tsx` の caller は以下を満たす:

```ts
const result = await unregisterMutation.trigger({ memberId, attended: false });
setRegistered((s) => {
  const next = new Set(s);
  next.delete(memberId);
  return next;
});
setToast(result === undefined ? "既に解除済みです" : "出席を解除しました");
```

resolve value は 404 success-equivalent と 200 success の toast 分岐にのみ使い、レスポンス body の詳細には依存しない。

## 4. toast 文言一覧（i18n key 不在の文字列直書き）

| key | 文言 |
|---|---|
| register success | `出席を登録しました` |
| unregister success (200) | `出席を解除しました` |
| unregister already-removed (404) | `既に解除済みです` |
| unregister FetchAuthedError | `解除に失敗 (status)` |
| unregister unknown/network | `解除に失敗 (unknown)` |

## 5. logger 連携

| 状況 | logger 呼出 | 含めるフィールド |
|---|---|---|
| 404 success path | `logger.info({ event: "attendance.unregister.already_removed", meetingId, memberId })` | task / actor は API 側 audit に残るため UI は最小限 |
| 409 / 422 / 5xx | `logger.error({ event: "attendance.unregister.failed", meetingId, memberId, status, error })` | 既存 admin error pattern と整合 |
| network / unknown | `logger.warn({ event: "attendance.unregister.network", meetingId, memberId, error })` | unknown failure の観察 |

## 6. Phase 6 完了条件

- [x] FetchAuthedError status 別 UI 扱いを表形式で確定
- [x] register / unregister mutation 責任分離 4 不変条件を明記
- [x] 404 success path の戻り値整形ルールを確定
- [x] toast 文言を一覧化
- [x] logger 連携を確定

## 7. 次 Phase への引き継ぎ

Phase 7 では本 Phase で確定した logger 呼出ポイントと、API 側既存 audit (`apps/api/src/routes/admin/meetings.ts:241-248`) との責任境界を再確認する。
