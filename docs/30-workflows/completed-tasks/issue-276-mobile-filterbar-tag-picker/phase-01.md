# Phase 1: 要件定義 / AC 確定 / API 拡張可否

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 1 |
| 前提 | なし（先頭 Phase） |
| 後続 | Phase 2 |
| 機能名 | public members mobile FilterBar tag picker |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow_state | spec_created |
| scope | public_members_mobile_filterbar_tag_picker |

## 目的

Issue #276 の要件を AC として固定し、API response 拡張可否（案 A）を最終確定する。

## 実行タスク

1. **Step 0 P50 チェック**
   - `git log --oneline apps/web/src/components/public/MemberFilters.client.tsx | head -10`
   - `grep -rn "topTags\|TagPicker\|tag-picker" apps/ packages/` で既存実装ゼロを確認
2. acceptance criteria を以下の通り確定する
3. `spec-extraction-map.md` を `outputs/phase-01/` に書き出し、aiworkflow-requirements の current public members 正本（`01-api-schema.md` / `09-ui-ux.md` / `12-search-tags.md`）との対応関係を固定

## Acceptance Criteria

- **AC-1**: `/members` 初期描画で「候補 tag chip」が最低 5 件、`topTags` 由来で表示される
- **AC-2**: 候補 chip クリックで URL `?tag=...` に append され、`MEMBERS_SEARCH_LIMITS.TAG_LIMIT` (=5) を超えない
- **AC-3**: 選択済み tag が 5 件に達した時、未選択候補 chip は `aria-disabled="true"` + 「これ以上選択できません」hint を表示する
- **AC-4**: mobile viewport (width<=640px) で `data-component="member-filters"` は collapsible（初期 collapsed）になり、`<details>` 相当の summary に「絞り込み中: q + zone + status + tag×N」を表示する
- **AC-5**: `clear-all` ボタン押下で `/members` に router.replace される（query 全削除）
- **AC-6**: 既存 URL 不変条件（repeated `?tag=` / SSR-driven state）を破壊しない
- **AC-7**: `topTags` field 追加によって既存 fixture / consumer 全件が更新され、`pnpm typecheck` が pass する
- **AC-8**: coverage Statements/Branches/Functions/Lines >=80%（workspace 全体: `apps/api` / `apps/web` / `packages/*`）
- **AC-9**: `bash scripts/coverage-guard.sh` exit 0

## API 拡張仕様（案 A 確定）

`packages/shared/src/zod/viewmodel.ts` の `PublicMemberListViewZ` に追加:

```ts
topTags: z.array(
  z.object({
    code: z.string().min(1),
    label: z.string(),
    count: z.number().int().nonnegative(),
  }),
).max(20),
```

- 集計範囲: `member_status.public_consent='consented'` / `publish_state='public'` / `is_deleted=0` かつ canonical alias source 除外後の member に紐づく tag を `count` 降順で上位 20 件まで
- Cache-Control: 現行 `GET /public/members` の `no-store` 方針を維持する
- 並び順 tiebreaker: `count` desc → `code` asc
- `09e-screen-blueprints-public.md` の現行「タグ候補 API 接続なし」は prototype/foundation 時点の前提。Issue #276 実装完了時に `GET /public/members.topTags` 由来へ正本更新する。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `apps/web/src/components/public/MemberFilters.client.tsx`
- `packages/shared/src/zod/viewmodel.ts`
- `apps/api/src/routes/public/members.ts`
- `apps/api/src/use-cases/public/list-public-members.ts`
- `apps/api/src/repository/publicMembers.ts`

## 統合テスト連携

`outputs/phase-01/integration-touchpoints.md` に Web↔API 結合点（`fetchPublic("/public/members")` → `PublicMemberListViewZ.parse`）を明記する。

## 成果物

- `outputs/phase-01/main.md`（AC 確定記録）
- `outputs/phase-01/spec-extraction-map.md`
- `outputs/phase-01/integration-touchpoints.md`

## 完了条件

- [ ] AC-1 〜 AC-9 が確定し記録された
- [ ] 案 A 採用が記録された（または別案に切替された理由が記録された）
- [ ] Phase 4-6 ファイル変更先候補一覧が作成された

## タスク100%実行確認【必須】

- [ ] 既存実装の P50 grep を実行し結果を貼った
- [ ] 全 AC が番号付きで記述された
- [ ] aiworkflow-requirements 正本へのリンクが貼られた

## 次Phase

Phase 2 へ。
