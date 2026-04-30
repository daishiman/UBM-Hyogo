# AC × 検証 × 実装

| AC | 内容 | 検証方法 | 実装位置 | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | ドロワー内に profile 本文 input 不在 | `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` で `queryByLabelText` null assertion | `MemberDrawer.tsx`（input/textarea を `body` 等のメモのみに限定） | PASS |
| AC-2 | tag 直接編集 form なし、`/admin/tags?memberId=` Link のみ | MemberDrawer test の link assertion | `MemberDrawer.tsx` `<Link>` | PASS |
| AC-3 | `SchemaDiffPanel` は `/admin/schema/page.tsx` のみで import | grep 検証 | `app/(admin)/admin/schema/page.tsx` | PASS |
| AC-4 | attendance 候補から削除済み除外 | `MeetingPanel.test.tsx` の `filterCandidates` unit test | `MeetingPanel.tsx` `filterCandidates` + `meetings/page.tsx` の server filter | PASS |
| AC-5 | 重複 disabled + 422 toast | UI: option `disabled={here.has(memberId)}` + `onAdd` 422 分岐 | `MeetingPanel.tsx` | PASS |
| AC-6 | apps/web から D1/repository 直接 import 禁止 | grep ベース検証（ESLint rule は phase-02 で設計記載） | 設計記載のみ。本タスクで rule 配置は未実装（lint = tsc 構成のため別 issue 提起） | DEFERRED |
| AC-7 | 未認証 → /login redirect | `app/(admin)/layout.tsx` で `getSession()` null → redirect | `app/(admin)/layout.tsx` | PASS |
| AC-8 | dashboard 1 fetch | `app/(admin)/admin/page.tsx` で `fetchAdmin("/admin/dashboard")` 単一呼び出し | `admin/page.tsx` | PASS |
| AC-9 | 管理メモはドロワー内のみ | `lib/admin/api.ts` の note 関数を MemberDrawer 内のみで使用、grep で確認 | `MemberDrawer.tsx` | PASS |
| AC-10 | `editResponseUrl` ボタン表示 | drawer 内の `<a target="_blank">` | `MemberDrawer.tsx` | PASS |

## DEFERRED の補足

AC-6 の ESLint rule: 当 monorepo は `eslint` 自体を使っておらず、`pnpm lint` は `tsc --noEmit`。`no-restricted-imports` はエコシステム導入と合わせて別タスクで適用するのが妥当。本 task では grep ガードと CODEOWNERS で代替する。
