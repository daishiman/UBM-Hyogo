# Phase 4 出力 — テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 4 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1〜3 で固定した 6 query parameter（q / zone / status / tag / sort / density）の AC を、unit / integration / e2e / a11y のテスト level に分担し、追加するテストファイル・ケース・fixtures・性能計測方針・E2E 引き継ぎ・DoD を確定する。

実装区分は `実装仕様書`（CONST_004 / CONST_005 適用）。本 Phase はテスト戦略の固定であり、テストコードの実コミットは Phase 5 ランブック以降が担う。

## AC × test level マトリクス

| AC ID | 対象 | unit | integration | e2e (08b) | a11y | 主担当ファイル |
| --- | --- | --- | --- | --- | --- | --- |
| AC-Q1 | q 部分一致 | ◯ parser | ◯ repo + route | ◯ | - | search-query-parser.test.ts / publicMembers.test.ts / routes/public/index.test.ts |
| AC-Q2 | q trim/正規化/200字 truncate | ◯ parser | - | △ | - | search-query-parser.test.ts |
| AC-Q3 | q 制御文字 / SQL 特殊文字 | ◯ parser | ◯ repo（bind 安全性） | - | - | publicMembers.test.ts |
| AC-Z1 | zone enum 4 値 | ◯ parser | ◯ repo | ◯ | - | search-query-parser.test.ts / publicMembers.test.ts |
| AC-S1 | status enum 4 値 | ◯ parser | ◯ repo | ◯ | - | 同上 |
| AC-T1 | tag AND（HAVING COUNT） | ◯ parser | ◯ repo | ◯ | - | publicMembers.test.ts |
| AC-T2 | tag 5 件超 truncate | ◯ parser | - | - | - | search-query-parser.test.ts |
| AC-T3 | tag 重複 dedup | ◯ parser | - | - | - | search-query-parser.test.ts |
| AC-O1 | sort recent / name | ◯ parser | ◯ repo（ORDER BY 検証） | ◯ | - | publicMembers.test.ts |
| AC-D1 | density UI / appliedQuery echo | ◯ parser | ◯ route response | ◯ | - | search-query-parser.test.ts / routes/public/index.test.ts |
| AC-E1 | 空結果 + 絞り込みクリア | - | ◯ route 0 件 | ◯ | - | routes/public/index.test.ts / MembersFilterBar.test.tsx |
| AC-V1 | 不正値 fallback / HTTP 200 | ◯ parser | ◯ route | △ | - | search-query-parser.test.ts / routes/public/index.test.ts |
| AC-L1 | 大量ヒット（>=200）pagination | - | ◯ repo + route | ◯ | - | publicMembers.test.ts |
| AC-A1 | filter UI label / keyboard 到達 | - | - | ◯ | ◯ axe | MembersFilterBar.test.tsx |
| AC-A2 | role=status / aria-live 結果通知 | - | - | ◯ | ◯ axe | MemberList.test.tsx / MembersFilterBar.test.tsx |
| AC-INV4 | publish_state / is_deleted / public_consent 除外 | - | ◯ repo | - | - | publicMembers.test.ts |
| AC-INV5 | apps/web から D1 直アクセス禁止 | ◯ static check | - | - | - | apps/web/src/lib/__tests__/boundary.test.ts |
| AC-INV6 | admin-only field 非露出 | ◯ view strict | ◯ route response | - | - | publicMembers.test.ts / routes/public/index.test.ts |

凡例: ◯ 担保 / △ 補完的 / - 対象外

## 追加するテストファイル一覧

すべて既存ファイル拡張で対応する（新規ファイル作成は最小化）。

### apps/api 側

| パス | 区分 | 追加内容 |
| --- | --- | --- |
| `apps/api/src/_shared/__tests__/search-query-parser.test.ts` | 既存 拡張 | 6 param 既知ケース / fallback / clamp / dedup |
| `apps/api/src/repository/publicMembers.test.ts` | 既存 拡張 | tag AND / zone+status 複合 / sort=name / 大量件数 / admin-only 非露出 |
| `apps/api/src/routes/public/index.test.ts` | 既存 拡張 | `/public/members` の query → response 整合 / 不正値 fallback / appliedQuery echo |

### apps/web 側

| パス | 区分 | 追加内容 |
| --- | --- | --- |
| `apps/web/src/lib/url/__tests__/members-search.test.ts` | 既存 拡張 | parseSearchParams / toApiQuery / URL 省略ルール / round-trip |
| `apps/web/app/(public)/members/_components/__tests__/MembersFilterBar.test.tsx` | 新規 | a11y / keyboard / aria 属性 / router.replace 呼出し検証 |
| `apps/web/app/(public)/members/_components/__tests__/MemberList.test.tsx` | 新規 | density 切替 / 空結果 / role=status |
| `apps/web/src/components/public/__tests__/MemberCard.test.tsx` | 既存 拡張 | admin-only field 非露出（型レベル） |

### a11y test の配置

- `MembersFilterBar.test.tsx` 内に `it("axe-core: no a11y violations")` を 1 ケース追加（`@axe-core/react` または `vitest-axe` を `apps/web` の test deps に追加。導入は Phase 5 Step 6）
- `MemberList.test.tsx` 内に同様の axe ケースを追加（density=list / dense 双方）
- 実 Playwright 上の axe レポートは 08b で別途実施し、本タスクは Vitest ベースの component-level a11y を担保

## 各テストファイルの追加ケース（it / describe）

### `apps/api/src/_shared/__tests__/search-query-parser.test.ts`

```text
describe("parsePublicMemberQuery / 6 query parameters")
  describe("q")
    it("AC-Q1: 通常文字列を trim + 連続空白 1 つに正規化する")
    it("AC-Q2: 200 文字超は 200 文字で切り詰められる")
    it("AC-Q2: 空文字 / undefined は \"\" を返す")
    it("AC-Q3: 制御文字 / SQL 特殊文字 (%, _, ', \") をそのまま保持し parse 失敗しない")
  describe("zone")
    it("AC-Z1: enum 4 値（all / 0_to_1 / 1_to_10 / 10_to_100）が通る")
    it("AC-V1: enum 外は \"all\" に fallback")
  describe("status")
    it("AC-S1: enum 4 値（all / member / non_member / academy）が通る")
    it("AC-V1: enum 外は \"all\" に fallback")
  describe("tag")
    it("AC-T1: repeated string を string[] に展開する")
    it("AC-T2: 6 件以上は先頭 5 件のみ採用")
    it("AC-T3: 重複は dedup（順序保持）")
    it("AC-V1: tag に非 string が混入したら除外する")
  describe("sort")
    it("AC-O1: recent / name が通る")
    it("AC-V1: enum 外は \"recent\" に fallback")
  describe("density")
    it("AC-D1: comfy / dense / list が通る")
    it("AC-V1: enum 外は \"comfy\" に fallback")
  describe("page / limit")
    it("page<1 は 1 に clamp / NaN は 1 に fallback")
    it("limit は [1,100] に clamp / NaN は 24 に fallback")
```

期待値: `safeParse + catch` により例外を投げない。型は `ParsedPublicMemberQuery`（Phase 2 シグネチャ）。

### `apps/api/src/repository/publicMembers.test.ts`

```text
describe("listPublicMembers / 公開可視性 + フィルタ")
  it("AC-INV4: publish_state != 'public' の member は除外される")
  it("AC-INV4: is_deleted=1 の member は除外される")
  it("AC-INV4: public_consent != 'consented' の member は除外される")
  it("AC-INV4: identity_aliases.source_member_id は除外される")
  it("AC-Q1: search_text LIKE で部分一致する（fullName / nickname / tags 等）")
  it("AC-Q3: q に SQL 特殊文字が含まれても 500 にならず prepared bind で安全")
  it("AC-Z1: zone='1_to_10' で response_fields.value_json='1_to_10' のみ hit")
  it("AC-S1: status='member' で ubmMembershipType='member' のみ hit")
  it("AC-T1: tag=[a, b] で AND 条件（HAVING COUNT(DISTINCT)=2）が成立")
  it("AC-T1: tag=[a] のみ持つ member は tag=[a,b] 検索に hit しない")
  it("AC-O1: sort=recent で last_submitted_at DESC, fullName ASC, member_id ASC")
  it("AC-O1: sort=name で fullName ASC, member_id ASC")
  it("AC-INV6: SELECT 句に responseEmail / publishState / publicConsent 等を含まない")
describe("countPublicMembers")
  it("AC-L1: total が COUNT(DISTINCT mi.member_id) と一致")
describe("性能 / 大量件数")
  it("AC-L1: 母集団 200 件 / limit=24 / page=1 で listPublicMembers が < 50ms（D1 mock 計測）")
```

### `apps/api/src/routes/public/index.test.ts`

```text
describe("GET /public/members")
  it("AC-Q1: q=ふじた で部分一致 hit / response.items 構造が PublicMemberListViewZ に適合")
  it("AC-V1: zone=invalid / status=invalid / sort=invalid で HTTP 200 + appliedQuery が default")
  it("AC-D1: density=dense をリクエストすると appliedQuery.density='dense' でエコー")
  it("AC-T1: ?tag=a&tag=b で repeated を受け取り tagCodes が [a,b]")
  it("AC-T2: ?tag=...×6 でも appliedQuery.tags は 5 件まで")
  it("AC-E1: 0 件 hit で items=[] / pagination.total=0 / hasNext=false")
  it("AC-INV6: response の items に admin-only field が含まれない（strict 通過）")
  it("Cache-Control: no-store header を返す")
```

### `apps/web/src/lib/url/__tests__/members-search.test.ts`

```text
describe("parseSearchParams")
  it("空 searchParams で全 default を返す")
  it("zone=invalid / status=invalid を default fallback する")
  it("?tag=a&tag=b を string[] に変換")
describe("toApiQuery")
  it("default 値（q='', zone=all, status=all, tag=[], sort=recent, density=comfy）は URL に含めない")
  it("非 default 値のみ URLSearchParams に出力")
  it("tag は repeated key で append される")
describe("round-trip")
  it("MembersSearch -> toApiQuery -> parseSearchParams が同値を復元する（不変条件 #8 URL 正本）")
```

### `apps/web/app/(public)/members/_components/__tests__/MembersFilterBar.test.tsx`

```text
describe("MembersFilterBar / a11y / URL 同期")
  it("AC-A1: q input に role=searchbox + aria-label が付与されている")
  it("AC-A1: zone / status / sort / density の select に aria-label が付与されている")
  it("AC-A1: Tab キーで q -> zone -> status -> tag -> sort -> density の順に到達できる")
  it("AC-A1: Enter / Space で各 select option を確定できる")
  it("q 入力 300ms debounce 後に router.replace が呼ばれる")
  it("filter 操作で router.replace のみ使用（router.push が呼ばれない）")
  it("初期値の query は URL に含めない（toApiQuery 経由）")
  it("AC-A2: role=status の領域に検索結果数が aria-live=polite で通知される")
  it("axe-core: no violations（vitest-axe）")
```

### `apps/web/app/(public)/members/_components/__tests__/MemberList.test.tsx`

```text
describe("MemberList")
  it("density=comfy / dense / list で class / layout が切替わる")
  it("items=[] のとき EmptyState を描画し『絞り込みをクリア』リンクが /members を指す")
  it("AC-A2: 結果件数が role=status 領域で表示される")
  it("axe-core: no violations（vitest-axe / 各 density）")
```

## fixtures 設計

### apps/api（D1 mock）

正本: `apps/api/src/repository/__fixtures__/members.fixture.ts` および `__fixtures__/d1mock.ts` を再利用し、本タスクで以下を追加する。

```ts
// apps/api/src/repository/__fixtures__/publicMembers.fixture.ts（追加候補）
export const PUBLIC_VISIBLE_MEMBER = {
  member_id: "M001",
  publish_state: "public",
  public_consent: "consented",
  is_deleted: 0,
  ubmZone: "1_to_10",
  ubmMembershipType: "member",
  search_text: "藤田 太郎 ふじた marketing 兵庫",
  tags: ["marketing", "saas"],
  last_submitted_at: "2026-04-01T00:00:00Z",
};

export const HIDDEN_PRIVATE_MEMBER     = { ...PUBLIC_VISIBLE_MEMBER, member_id: "M002", publish_state: "private" };
export const HIDDEN_DELETED_MEMBER     = { ...PUBLIC_VISIBLE_MEMBER, member_id: "M003", is_deleted: 1 };
export const HIDDEN_NO_CONSENT_MEMBER  = { ...PUBLIC_VISIBLE_MEMBER, member_id: "M004", public_consent: "withdrawn" };
export const HIDDEN_ALIAS_MEMBER       = { ...PUBLIC_VISIBLE_MEMBER, member_id: "M005" /* identity_aliases に source_member_id=M005 */ };
```

- 6 param × エッジを 1 fixture から派生させる方針で、test ごとにシード件数を制御。
- 大量ヒット（AC-L1）は `Array.from({length: 250}, ...)` で生成し、`d1mock` の `prepare/all` をモックして実 D1 binding を経由しない。
- `member_tags` / `tag_definitions` は既存 fixture を tag=[marketing, saas, ops, eng, finance] の 5 系統で揃える。

### apps/web（component test）

- `apps/web/app/(public)/members/_components/__tests__/_fixtures.ts`（新規 / 任意）に `mockMemberListView`（PublicMemberListView 形）を 3 件分定義。
- `next/navigation` の `useRouter` は `vi.mock` で `replace` を spy。
- `next/headers` 依存は不要（`MembersFilterBar` は client component）。

## 性能計測方針

| 観点 | 計測対象 | 方法 | 閾値 |
| --- | --- | --- | --- |
| N+1 検出 | `listFieldsByResponseId` の呼び出し回数 | repository test で `prepare` 呼出し回数を spy | 1 page あたり member 件数 + 2（COUNT 1 + LIST 1）以下 |
| 大量ヒット応答性 | `listPublicMembers` 単体（mock D1） | `performance.now()` で 200 件母集団 / limit=24 を計測 | < 50ms（CI 上）|
| route 全体応答 | `/public/members` を hono の `app.request` で 1 回叩く | Vitest 内で end-to-end | < 200ms（CI 上）|
| 大量ヒット UI | 250 件 mock を MemberList に流し込む | Vitest + `@testing-library/react` | render < 1s（環境依存ゆえ参考値、08b で実測） |

実 D1 への計測は本タスクで行わない（08b / 09a smoke で実施）。本 Phase は mock ベースの「回数・形」の検証に閉じる。

## E2E 引き継ぎ（08b 側）への要件

08b-A-playwright-e2e-full-execution に以下シナリオ要件を引き渡す（spec のみ。実コードは 08b）:

| シナリオ | 期待 |
| --- | --- |
| 6 param 全部入りの URL を直接開く | 初期描画で全 filter UI が URL 値を反映 |
| q 入力で 300ms 後に URL が更新される | `router.replace` 経由 / 履歴に追加されない |
| 戻るボタンで filter 適用前の URL に戻らない | `router.replace` 採用の証跡 |
| 0 件状態 → `絞り込みをクリア` クリックで `/members` 遷移 | EmptyState の link 動作 |
| Tab keyboard navigation のみで全 filter 操作可能 | a11y / focus 順序 |
| axe-core 実 Playwright run | violations=0 / レポートを `outputs/phase-11/a11y/members-axe.json` に保存（本タスクは path のみ約束） |

08b 側で fail した場合の修正窓口は本タスク owner（08a-B）でなく 08b owner。本仕様は受入条件のみ提供する。

## DoD（テスト追加完了条件）

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| TS-DoD-1 | 上記 7 ファイル全てに記載の it ケースが追加され green | `pnpm --filter @apps/api test` / `pnpm --filter @apps/web test` |
| TS-DoD-2 | search-query-parser のラインカバレッジ 95% 以上 | vitest --coverage |
| TS-DoD-3 | publicMembers repository のラインカバレッジ 90% 以上 | 同上 |
| TS-DoD-4 | members-search.ts のラインカバレッジ 95% 以上 | 同上 |
| TS-DoD-5 | MembersFilterBar / MemberList の axe-core ケースが 0 violations | vitest-axe |
| TS-DoD-6 | AC-INV4 / 5 / 6 が各 1 件以上のテストで担保 | マトリクス再点検 |
| TS-DoD-7 | 性能計測（N+1 spy / 200 件 < 50ms）が PASS | publicMembers.test.ts |
| TS-DoD-8 | 不正値 fallback で HTTP 200 を返すケースが route test に存在 | routes/public/index.test.ts |

カバレッジ目安は repo 全体ではなく **本タスクで触る 4 ファイル単位**。全体カバレッジ低下は coverage-guard 側の責務で本タスクは扱わない。

## 自走禁止操作

- アプリケーションコード（`apps/**`）の実改変はテスト追加 commit を含め Phase 5 以降
- `git commit` / `git push` / PR 作成
- `pnpm --filter ... test` を本 Phase の検証目的で実行することはない（テスト追加後の Phase 5 で実行）

## 次 Phase への引き渡し

Phase 5 へ以下を渡す:

- 7 テストファイルの追加 it 一覧（上記）
- fixture 拡張先（`__fixtures__/publicMembers.fixture.ts` を新規追加）
- 性能計測の閾値（N+1 / 200 件 < 50ms / route < 200ms）
- a11y 検証のための test deps 追加（`vitest-axe` または `@axe-core/react`）
- E2E 引き継ぎ要件（08b 側に提示する受入条件）
