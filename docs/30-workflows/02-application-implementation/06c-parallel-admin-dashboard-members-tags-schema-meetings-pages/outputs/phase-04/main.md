# Phase 4: テスト戦略

## レイヤー別

### Unit (Vitest, jsdom / node)
- `lib/admin/api.ts` 各 mutation 関数: 200/4xx/5xx 応答の result 型を検証
- `MeetingPanel.filterCandidates(members)`: `isDeleted=true` を除外
- `MemberDrawer` rendering: profile 本文 input が **存在しない** ことの assertion (`queryByLabelText` で null)
- `SchemaDiffPanel` 4 ペイン分類ロジック: added/changed/removed/unresolved 各分類

### Component (Vitest + Testing Library)
- `MemberDrawer`: status Switch を toggle → Confirm Modal が出る → 確定で `patchMemberStatus` 呼び出し
- `TagQueuePanel`: queue item クリック → review panel に表示 → resolve ボタンで POST
- `MeetingPanel`: 同一 memberId を 2 回追加すると 2 回目の Combobox option が disabled

### Contract (08a で実装、本 task ではフックのみ)
- 04c API view shape を `AdminDashboardViewZ` などで safeParse → unit test で確認

### E2E (08b Playwright)
- 未認証で `/admin` → `/login` redirect (AC-7)
- ドロワー DOM に profile 本文 input 不在 (AC-1)
- ドロワーの「タグ編集」リンクが `/admin/tags?memberId=...` に遷移 (AC-2)
- `/admin/meetings` で 422 受信時 Toast (AC-5)

## 不在テスト（明示的に書く）
- `expect(queryByLabelText(/事業概要|自己紹介/)).toBeNull()` — #11 を防御
- `expect(container.querySelector('[data-testid=tag-direct-edit]')).toBeNull()` — #13 を防御

## カバレッジ目標
- 新規 component (Drawer/Panel 4 件): 80%+
- `lib/admin/api.ts`: 90%+
