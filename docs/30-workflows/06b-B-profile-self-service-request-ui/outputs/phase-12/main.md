# Output Phase 12: ドキュメント更新

## status

EXECUTED

## implementation-guide.md

> このセクションが PR 本文の元になる。

### 概要（中学生でも分かる説明）

会員マイページ（`/profile`）に 2 つの「お願いボタン」を増やしました。

1. **公開停止 / 再公開のお願いボタン**
   会員名簿に自分の名前を出すかどうかを切り替えたい時に押します。
   いきなり切り替わるのではなく、運営が確認してから反映されます。
2. **退会のお願いボタン**
   会から抜けたい時に押します。「本当にいいですか？」という確認画面が出て、それでも OK の場合に申請が送られます。
   こちらも運営が確認してから削除されます。

押した後、確認画面で「申請する」を押すと、サーバに「お願い」が届きます。
すでに同じお願いを出していた場合（二重申請）は「もう申請を受け付け中です」と分かりやすく表示します。

### 技術的な変更点

- 追加: `apps/web/app/api/me/[...path]/route.ts`（`/me/*` への browser 用 proxy）
- 追加: `apps/web/src/lib/api/me-requests-client.ts`（client helper + `SelfRequestError`）
- 追加: `apps/web/app/profile/_components/VisibilityRequest.client.tsx`
- 追加: `apps/web/app/profile/_components/DeleteRequest.client.tsx`
- 編集: `apps/web/app/profile/page.tsx`（VisibilityRequest / DeleteRequest を `EditCta` の下に追加。`authGateState !== "active"` で disabled）
- 追加: 関連 unit / component テスト 14 cases

### 不変条件

| 不変条件 | 担保方法 |
| --- | --- |
| #4 本文編集 UI を作らない | static-invariants S-04（編集系 HTML 要素・submit button を profile 配下で禁止）が pass |
| #5 D1 直接アクセス禁止 | client → `/api/me/*` proxy → backend Worker のみ |
| #11 memberId を path に出さない | proxy は `[...path]` パススルー、backend は session で解決 |

### スクリーンショット / runtime evidence

このターンでは production runtime smoke を取得していない（06b-A の session resolver evidence 待ち）。
06b-A 完了後、06b-B は次の runtime smoke を保存し、06b-C が `docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` にスクリーンショットを保存する。

- `outputs/phase-11/profile-visibility-request-smoke.md`
- `outputs/phase-11/profile-delete-request-smoke.md`
- `outputs/phase-11/profile-request-duplicate-409.md`

### テスト

- `pnpm --filter @ubm-hyogo/web typecheck` : pass
- `pnpm --filter @ubm-hyogo/web lint` : pass
- 06b-B focused Vitest suite: pass
- Full `pnpm --filter @ubm-hyogo/web test --run`: known unrelated failure remains in `MemberDrawer.test.tsx`
