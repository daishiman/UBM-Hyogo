# Implementation Guide: 06b-B profile self-service request UI

## Part 1: 中学生レベルの説明

会員マイページ（`/profile`）に 2 つの「お願いボタン」を増やしました。

1. **公開停止 / 再公開のお願いボタン**
   会員名簿に自分の名前を出すかどうかを切り替えたい時に押します。
   いきなり切り替わるのではなく、運営が確認してから反映されます。
2. **退会のお願いボタン**
   会から抜けたい時に押します。確認画面で「本当にいいですか？」と聞かれて、それでも OK の場合だけ申請が送られます。

押した後、確認画面で「申請する」を押すと、サーバに「お願い」が届きます。
すでに同じお願いを出していた場合（二重申請）は「もう申請を受け付け中です」と分かりやすく表示します。

| 用語 | 日常語での言い換え |
| --- | --- |
| UI | 画面上のボタンや確認ダイアログ |
| API | 画面から裏側へお願いを送る窓口 |
| 409 | 同じお願いがすでにあるという返事 |
| proxy | 画面と裏側を中継する受付窓口 |
| evidence | 実際に確認した記録 |

## Part 2: 技術者向け

### Scope

- `/profile` に `VisibilityRequest` / `DeleteRequest` の 2 セクションを追加。
- client helper は `/me/visibility-request` / `/me/delete-request` の 2 エンドポイントに限定。
- profile body edit UI は追加しない。
- runtime visual evidence は 06b-A の session resolver 完了後、06b-C で取得する。

### 追加 / 変更ファイル

| 種別 | path | 役割 |
| --- | --- | --- |
| add | `apps/web/app/api/me/[...path]/route.ts` | `/api/me/*` proxy（cookie 転送 + 401 早期 return） |
| add | `apps/web/src/lib/api/me-requests-client.ts` | `requestVisibilityChange` / `requestAccountDeletion` + `SelfRequestError` |
| add | `apps/web/app/profile/_components/VisibilityRequest.client.tsx` | 公開停止/再公開申請 UI |
| add | `apps/web/app/profile/_components/DeleteRequest.client.tsx` | 退会申請 UI |
| edit | `apps/web/app/profile/page.tsx` | 上記 2 component を `EditCta` の下に追加 |
| add | `apps/web/src/lib/api/__tests__/me-requests-client.test.ts` | 7 cases |
| add | `apps/web/app/profile/_components/__tests__/VisibilityRequest.test.tsx` | 4 cases |
| add | `apps/web/app/profile/_components/__tests__/DeleteRequest.test.tsx` | 3 cases |

### API contract（実装済み backend に合わせて確定）

```ts
// POST /me/visibility-request
interface VisibilityRequestBody {
  desiredState: "hidden" | "public";
  reason?: string;
}

// POST /me/delete-request
interface DeleteRequestBody {
  reason?: string;
}

// 共通 202 response
interface QueueAcceptedResponse {
  queueId: string;
  type: "visibility_request" | "delete_request";
  status: "pending";
  createdAt: string;
}
```

### Status code → UI message

| status | code | UI 文言 |
| --- | --- | --- |
| 202 | — | 「申請を受け付けました」 |
| 401 | UNAUTHENTICATED | 「セッションが切れました。再ログインしてください。」 |
| 403 | RULES_CONSENT_REQUIRED | 「利用規約への同意が必要です。最新の Google Form から再同意してください。」 |
| 409 | DUPLICATE_PENDING_REQUEST | 「既に同じ申請を受け付け中です。」 / 退会は専用文言 |
| 422 | INVALID_REQUEST | 「申請内容に不備があります。」 |
| 429 | — | 「短時間に申請が集中しました。しばらく待って再度お試しください。」 |
| その他 | UNKNOWN | 「申請に失敗しました。時間を置いて再度お試しください。」 |

### State machine

```
idle → confirm → submitting → accepted        （成功時に trigger を disabled）
                              ↘ error → idle  （キャンセルで idle へ）
```

### Edge cases

- 409 は専用メッセージで表示し、unknown error として扱わない。
- `authGateState !== "active"` の時は trigger ボタン自体を disabled にする。
- modal は submitting 中はキャンセル不可。
- network exception (`fetch` 失敗) は `SelfRequestError(0, "UNKNOWN")` として共通文言にフォールバック。

### Invariants

| invariant | 担保 |
| --- | --- |
| #4 profile body edit forbidden | static-invariants S-04（編集系 HTML 要素・submit button を profile 配下で禁止）が pass |
| #5 apps/web D1 direct access forbidden | client → `/api/me/*` proxy → backend Worker のみ |
| #11 member self-service boundary | proxy は `[...path]` パススルー、backend は `session.memberId` で解決 |

### Evidence

- Local focused: `pnpm --filter @ubm-hyogo/web typecheck` / `lint` pass。Focused UI/client/static-invariant tests pass when run directly through Vitest config.
- Full `pnpm --filter @ubm-hyogo/web test --run` currently has one pre-existing unrelated failure in `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` and does not invalidate 06b-B focused evidence.
- 06b-B runtime smoke evidence files remain blocked until 06b-A is available:
  - `outputs/phase-11/profile-visibility-request-smoke.md`
  - `outputs/phase-11/profile-delete-request-smoke.md`
  - `outputs/phase-11/profile-request-duplicate-409.md`
- Production screenshot: 06b-A 完了後に 06b-C の `outputs/phase-11/` で取得。
