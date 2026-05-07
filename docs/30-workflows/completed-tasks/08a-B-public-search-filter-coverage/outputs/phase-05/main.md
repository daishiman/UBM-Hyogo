# Phase 5 出力 — 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 5 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜4 で固定した contract / AC / テスト戦略を、実装ステップに分解した runbook として確定する。

実装区分は `実装仕様書`（CONST_004 / CONST_005 適用）。本 Phase はランブック仕様の固定であり、コード差分の commit / push / PR は Phase 13 まで行わない。Step 7 のテスト追加はローカル Vitest 実行までを許可し、commit は Phase 13 のみで行う。

## 既存実装の現状サマリ（Phase 3 差分影響範囲ベース）

既存実装が大半完成しており、本タスクの実装ステップは「仕様の固定化 / テスト追加 / a11y 補強」が中心となる。

| 領域 | 実装状況 | 残作業 |
| --- | --- | --- |
| `apps/api/src/_shared/search-query-parser.ts` | 6 param parse / fallback / clamp 実装済み | テスト網羅 + コメント整備 |
| `apps/api/src/repository/publicMembers.ts` | base WHERE / q LIKE / zone / status / tag AND / sort / pagination 実装済み | `sort=name` 仕様の MVP 受容と test 追加 |
| `apps/api/src/use-cases/public/list-public-members.ts` | parsed query → repo 呼び出しまで実装済み | allowlist 整理（admin-only field を渡さない確認） |
| `apps/api/src/routes/public/members.ts` | hono handler / `Cache-Control: no-store` 実装済み | route test 補強 |
| `apps/web/src/lib/url/members-search.ts` | parseSearchParams / toApiQuery / 省略ルール実装済み | round-trip テスト追加 |
| `apps/web/app/(public)/members/page.tsx` | searchParams parse → fetchPublic 実装済み | 変更不要 |
| `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | filter UI / router.replace / debounce 実装済み | a11y（aria-label / role=status / 順序）追加 |
| `apps/web/app/(public)/members/_components/MemberList.tsx` | density 切替 / EmptyState 実装済み | role=status 領域 / aria-live 追加 |
| `packages/shared/src/zod/viewmodel.ts` (`PublicMemberListViewZ`) | strict 定義済み | 変更不要 |

## 変更対象ファイル一覧

### 編集

| パス | 編集内容 | 関連 AC |
| --- | --- | --- |
| `apps/api/src/_shared/search-query-parser.ts` | 6 param のコメント整備（fallback ルール記載）/ 必要なら enum 配列を const 化 | AC-V1 / AC-T2 / AC-T3 |
| `apps/api/src/repository/publicMembers.ts` | `sort=name` 暫定挙動コメント明記 / SELECT 句 admin-only 非露出コメント | AC-O1 / AC-INV6 |
| `apps/api/src/use-cases/public/list-public-members.ts` | parser 戻り値の allowlist key のみを repo に渡すことを明示 | AC-INV6 |
| `apps/api/src/routes/public/members.ts` | `Cache-Control: no-store` の責務コメント / appliedQuery エコー確認 | AC-D1 / AC-V1 |
| `apps/web/src/lib/url/members-search.ts` | 省略ルールのコメント / round-trip 要件コメント | AC-V1 / 不変条件 #8 |
| `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | aria-label 追加 / Tab 順序確認 / role=status 領域追加 | AC-A1 / AC-A2 |
| `apps/web/app/(public)/members/_components/MemberList.tsx` | role=status / aria-live=polite で結果件数を通知 | AC-A2 |

### 新規

| パス | 内容 |
| --- | --- |
| `apps/api/src/repository/__fixtures__/publicMembers.fixture.ts` | Phase 4 で定義した 5 種 fixture |
| `apps/web/app/(public)/members/_components/__tests__/MembersFilterBar.test.tsx` | a11y / 動作テスト |
| `apps/web/app/(public)/members/_components/__tests__/MemberList.test.tsx` | density / 空状態 / a11y |
| `apps/web/app/(public)/members/_components/__tests__/_fixtures.ts`（任意） | mockMemberListView |

### 拡張（既存に it 追加のみ）

| パス | 追加 it 数（目安） |
| --- | --- |
| `apps/api/src/_shared/__tests__/search-query-parser.test.ts` | +18 |
| `apps/api/src/repository/publicMembers.test.ts` | +12 |
| `apps/api/src/routes/public/index.test.ts` | +8 |
| `apps/web/src/lib/url/__tests__/members-search.test.ts` | +9 |
| `apps/web/src/components/public/__tests__/MemberCard.test.tsx` | +1 |

### 削除

なし。

## 実装ステップ

### Step 1: zod schema の追加 / 補強

対象: `apps/api/src/_shared/search-query-parser.ts` / `packages/shared/src/zod/viewmodel.ts`

- `parsePublicMemberQuery` の戻り値型 `ParsedPublicMemberQuery`（Phase 2 シグネチャ）を export 確認。
- `tag` の dedup と slice(0,5) のロジックがテスト可能な純粋関数になっていることを確認。なければ `dedupTags(input: unknown[]): string[]` に切り出す。
- `q` の正規化（trim / 連続空白 1 つ / 200 字 truncate）を `normalizeQ(input: unknown): string` に切り出し（既存ならそのまま）。
- `PublicMemberListViewZ` は `.strict()` を維持。touch しない。

期待 diff: コメント追加と `dedupTags` / `normalizeQ` 切り出し（既存実装次第で no-op）。

### Step 2: repository の WHERE / HAVING / ORDER BY 拡張

対象: `apps/api/src/repository/publicMembers.ts`

- `buildBaseFromWhere` の base WHERE が Phase 2 の SQL と一致することを確認。差異なし想定。
- `sort=name` の氏名順挙動（`fullName ASC, member_id ASC`）に明示コメント:

  ```ts
  // fullName は response_fields.value_json に格納されており LATERAL JOIN なしで
  // ORDER BY は response JSON の fullName 抽出値と member_id で安定化する。
  ```
- `tag` AND の `HAVING COUNT(DISTINCT td.code) = ?` が tagCodes.length と bind されていることを確認。
- SELECT 句に admin-only field（`responseEmail` / `publishState` / `publicConsent` / `rulesConsent` / `internalNote`）が含まれていないことをコメントで明示。

期待 diff: コメントのみ。SQL 改変はテストで仕様逸脱が見つかった場合のみ。

### Step 3: use-case allowlist 整理

対象: `apps/api/src/use-cases/public/list-public-members.ts`

シグネチャ:

```ts
export const listPublicMembersUseCase = async (
  query: ParsedPublicMemberQuery,
  deps: { ctx: DbCtx },
): Promise<PublicMemberListResponse> => {
  const input: ListPublicMembersInput = {
    q: query.q,
    zone: query.zone,
    status: query.status,
    tagCodes: query.tags,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  };
  const [rows, total] = await Promise.all([
    listPublicMembers(deps.ctx, input),
    countPublicMembers(deps.ctx, input),
  ]);
  return toPublicMemberListView({ rows, total, query });
};
```

ポイント:

- `density` を repo に渡さない（density は UI のみ。`appliedQuery.density` は view 層でエコー）
- `query` の余剰フィールドを repo に流さない（allowlist 明示）

### Step 4: route handler の query 受け取り

対象: `apps/api/src/routes/public/members.ts`

- `c.req.queries()`（hono）で repeated `tag` を受け、`parsePublicMemberQuery` に通す。
- `c.header("Cache-Control", "no-store")` を維持。
- 例外時も 200 + `appliedQuery` default を返す（既に parser が catch しているため try/catch は不要、ただし最終 fallback は維持）。

### Step 5: web の URL ↔ state 同期

対象: `apps/web/src/lib/url/members-search.ts` / `apps/web/app/(public)/members/page.tsx`

- `parseSearchParams` の引数 `Record<string, string | string[] | undefined>` を `searchParams` から受ける。
- `toApiQuery` は default 値の key を URL に出さない（既存実装を維持し、テストで担保）。
- `page.tsx` は `parseSearchParams(searchParams)` → `toApiQuery` → `fetchPublic("/public/members?" + qs)` の流れを維持。

### Step 6: filter UI の a11y 強化

対象: `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` / `MemberList.tsx`

最小差分で以下を加える:

```tsx
// MembersFilterBar.client.tsx
<input
  type="search"
  role="searchbox"
  aria-label="メンバー検索キーワード"
  aria-describedby="members-search-hint"
  ...
/>
<select aria-label="UBM 接触頻度ゾーンで絞り込み" ... />  {/* zone */}
<select aria-label="会員種別で絞り込み" ... />            {/* status */}
<select aria-label="並び順" ... />                          {/* sort */}
<select aria-label="表示密度" ... />                        {/* density */}
{/* tag chips に role="group" aria-label="タグで絞り込み" を付与 */}
{/* 5 件 cap の hint を <p id="members-search-hint" className="sr-only"> で提供 */}
```

```tsx
// MemberList.tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {`${total} 件のメンバーが見つかりました`}
</div>
```

Tab 順序: `q` → `zone` → `status` → tag chips → `sort` → `density`。`tabIndex` 明示は不要（DOM 順で達成）。focus visible は既存 design tokens を使用。

### Step 7: テスト追加

Phase 4 の追加 it に従い、以下を順に作成:

1. `apps/api/src/repository/__fixtures__/publicMembers.fixture.ts` 新規追加
2. `apps/api/src/_shared/__tests__/search-query-parser.test.ts` 拡張（+18 ケース）
3. `apps/api/src/repository/publicMembers.test.ts` 拡張（+12 ケース）
4. `apps/api/src/routes/public/index.test.ts` 拡張（+8 ケース）
5. `apps/web/src/lib/url/__tests__/members-search.test.ts` 拡張（+9 ケース）
6. `apps/web/app/(public)/members/_components/__tests__/MembersFilterBar.test.tsx` 新規（a11y 含む）
7. `apps/web/app/(public)/members/_components/__tests__/MemberList.test.tsx` 新規（a11y 含む）
8. `apps/web/src/components/public/__tests__/MemberCard.test.tsx` 拡張（admin-only 非露出 1 ケース）

a11y test の依存:

```bash
mise exec -- pnpm --filter @apps/web add -D vitest-axe @axe-core/react
```

`vitest.setup.ts` に `expect.extend(toHaveNoViolations)` を 1 行追加（既存 setup を破壊しない）。

## ローカル実行・検証コマンド

すべて `mise exec --` 経由で Node 24 を保証する。

```bash
# 依存（a11y 用 dev dep を追加した場合のみ）
mise exec -- pnpm install

# 型・リント
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# テスト（filter で apps を絞る）
mise exec -- pnpm --filter @apps/api test
mise exec -- pnpm --filter @apps/web test

# 個別テストで反復実行
mise exec -- pnpm --filter @apps/api test -- search-query-parser
mise exec -- pnpm --filter @apps/api test -- publicMembers
mise exec -- pnpm --filter @apps/web test -- members-search
mise exec -- pnpm --filter @apps/web test -- MembersFilterBar

# dev server（curl 検証用）
mise exec -- pnpm --filter @apps/api dev   # http://127.0.0.1:8787
mise exec -- pnpm --filter @apps/web dev   # http://127.0.0.1:3000

# curl による 6 param 動作確認
curl -s "http://127.0.0.1:8787/public/members?q=&zone=all&status=all&sort=recent&density=comfy&page=1&limit=24" | jq .
curl -s "http://127.0.0.1:8787/public/members?q=ふじた" | jq '.appliedQuery, .pagination'
curl -s "http://127.0.0.1:8787/public/members?zone=1_to_10&status=member" | jq '.appliedQuery'
curl -s "http://127.0.0.1:8787/public/members?tag=marketing&tag=saas" | jq '.appliedQuery.tags'
curl -s "http://127.0.0.1:8787/public/members?sort=name" | jq '.items[0].memberId'
curl -s "http://127.0.0.1:8787/public/members?density=dense" | jq '.appliedQuery.density'
curl -s "http://127.0.0.1:8787/public/members?zone=invalid&status=invalid&sort=invalid" | jq '.appliedQuery'
```

## DoD（Definition of Done）

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| RB-DoD-1 | `mise exec -- pnpm typecheck` PASS | コンソール 0 error |
| RB-DoD-2 | `mise exec -- pnpm lint` PASS | コンソール 0 error |
| RB-DoD-3 | `pnpm --filter @apps/api test` 全 PASS（追加 +38 ケース含む） | green |
| RB-DoD-4 | `pnpm --filter @apps/web test` 全 PASS（追加 +20 ケース含む） | green |
| RB-DoD-5 | curl で 6 param 単独・複合・不正値の 7 通りを実行し、HTTP 200 + appliedQuery が期待形 | 手動ログ |
| RB-DoD-6 | axe-core（vitest-axe）が `MembersFilterBar` / `MemberList` で 0 violations | test green |
| RB-DoD-7 | `apps/web` から D1 binding の直接 import が無い（`grep -r "D1Database" apps/web/app apps/web/src/lib` が空） | grep |
| RB-DoD-8 | response の admin-only field が strict reject される（route test で担保） | test green |
| RB-DoD-9 | コミット・push・PR を本タスク内で行っていない | git log / git status |

## ロールバック方針

| 変更箇所 | ロールバック手順 |
| --- | --- |
| Step 6（a11y 強化）が UI を破壊した場合 | `aria-label` 追加と role=status 領域の追加のみで論理レイアウト不変なので、該当 commit を `git revert` で巻き戻し可能 |
| Step 7（テスト追加）が flaky | 該当 it を skip（`it.skip`）し、Phase 9 品質保証で再現性を Reproduce してから fix |
| `vitest-axe` 導入で他 test が失敗 | dev dep を撤去し、a11y 検証は 08b Playwright 側へ寄せる（本タスク Phase 4 の AC-A1/A2 担保レベルが component → e2e に移動するだけで AC は維持） |
| `sort=name` 仕様の expectations が UX チームから NG | 氏名順 を維持し、`fullName` 順は別 follow-up issue で扱う（Phase 3 リスクで明記済み） |

完全な巻き戻しは `git revert <merge-commit>` で実施。マイグレーション差分は本タスクで発生しないため、DB rollback は不要。

## 自走禁止操作

- `git commit` / `git push` / PR 作成（Phase 13 まで禁止）
- `scripts/cf.sh deploy` / `scripts/cf.sh d1 migrations apply` 等の本番影響操作
- `wrangler` 直接実行（CLAUDE.md 規定により禁止）
- secret / Cloudflare binding の追加・変更
- D1 production / staging への migration apply

## 次 Phase への引き渡し

Phase 6 へ以下を渡す:

- 実装ステップ 1〜7（変更対象ファイル / 関数シグネチャ / 期待 diff 方針）
- ローカル検証コマンド（typecheck / lint / test / curl）
- DoD 9 項目（RB-DoD-1〜9）
- ロールバック方針
- 自走禁止境界（commit / push / PR / deploy 禁止）
