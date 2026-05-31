# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

実装前に test ケースと expected を確定し、RED 状態を作る。命名規則（`*.spec.{ts,tsx}`）と props/state 区別を遵守する。

## テストファイル一覧（新規）

| パス | 対象 | harness |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | route 3 endpoint | Vitest + D1 test（`members.contract.spec.ts` / `tags-queue.contract.spec.ts` 踏襲） |
| `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` | repository 関数（既存に追補） | Vitest + D1 test |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 型 gate（存在すれば編集） | tsd / test-d |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | drawer 編集 | Vitest + Testing Library（jsdom） |

## API contract ケース（A-T1〜A-T11）

[task-A の表](tasks/task-A-tag-write-api-and-repository.md#テスト方針task-a-分) を正本。expected を厳密化:

- 各 mutation 後に `SELECT COUNT(*) FROM audit_log WHERE action=?` で件数 assert（A-T1=1, A-T2 据置, A-T7=+1, A-T8 据置）。
- 409 ケース（A-T6 / A-T9）は事前に `member_status` へ `is_deleted=1` を seed。
- 冪等（A-T2）は同一 tagId の 2 回 POST → 200 + `member_tags` row 1 + audit 1（PK `INSERT OR IGNORE` の no-op を確認。server idempotency middleware は無いため replay-header は検証しない）。
- regression（A-T11）は `GET /admin/members/:memberId` の `tags` が `{code,label,category,source}` のままであることを shape assert。

## repository ケース

| ID | 関数 | expected |
| --- | --- | --- |
| R-T1 | `assignTagToMemberByAdmin` 新規 | 戻り値 true + row 1 |
| R-T2 | `assignTagToMemberByAdmin` 重複 | 戻り値 false + row 増えない |
| R-T3 | `unassignTagFromMemberByAdmin` 既存 | 戻り値 true + row 0 |
| R-T4 | `unassignTagFromMemberByAdmin` 未存在 | 戻り値 false |
| R-T5 | `getTagDefinitionMaster` | `tag_definitions WHERE active=1` 全件を TagRef shape |
| R-T6 | `listAssignedTagsForMember` | JOIN で当該 member の付与済み tag |
| R-T7 | `getMemberDeletedFlag` | `false` / `true`（is_deleted=1）/ member 不在 null |

## 型 gate ケース（test-d 編集）

- `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` が export されても gate が **green**（allowlist 追加後）。
- それ以外の任意 write 関数追加は依然 **赤**（gate が機能している回帰確認）。

## web ケース（B-T1〜B-T8）

[task-B の表](tasks/task-B-member-drawer-editable-tags.md#テスト方針task-b-分) を正本。

- mock: `fetchMemberTags` と `useAdminMutation` を `vi.mock`。mutation は hook 標準 fetch 経路に寄せ、`assignMemberTag` / `unassignMemberTag` helper を mutation 実行の主経路にしない。
- **props/state 区別（VSCPKR-03）**: `assigned` / `pendingTagId` は MemberDrawer の internal state、`available` は fetch 由来。テストは fetch mock の解決後に pill を操作する。
- 失敗ケース（B-T4/B-T5）は mock を reject させ、rollback（DOM 上 selected 状態が戻る）+ toast 表示を assert。
- idempotency（B-T7）は `useAdminMutation` mock が受け取る `options.idempotencyKey` が truthy であることを assert。

## RED 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags.contract   # 実装前は赤
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags        # 実装前は赤
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 4 テストファイルの RED（実装フェーズで GREEN 化）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- 全ケース ID が expected 付きで列挙（達成済み）
- `*.spec.{ts,tsx}` 命名遵守（達成済み）
- props/state 区別を明記（達成済み）
