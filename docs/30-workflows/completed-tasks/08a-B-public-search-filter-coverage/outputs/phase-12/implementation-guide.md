# 実装ガイド — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

このファイルは Phase 13 PR 作成時に diff-to-pr が PR 本文の根拠として参照する。Part 1（中学生レベル）と Part 2（技術者レベル）を独立に併存させる。

---

## Part 1: 中学生レベル概念説明

### なぜ検索とフィルタが必要か

UBM 兵庫支部のメンバー一覧ページ `/members` には、これから何百人ものメンバーの情報が並ぶ予定。全員を上から順に見ていくのは大変なので、「住んでいる地域で絞る」「ピアノが得意な人だけを見る」のような **絞り込み（フィルタ）** と、名前で探す **検索** が必要になる。

### 6 種類の絞り込み条件

`/members` ページには次の 6 つの操作枠がある。

- **q（キーワード検索）**: 入力した文字を含む人を見つける。「鈴木」と入れたら名前の一部に「鈴木」がある人だけが残る。
- **zone（地域）**: 神戸 / 阪神 / 播磨など、決まったリスト（enum＝決められた言葉だけを使うルール）から1つ選ぶ。書いていない地域名は受け付けない。
- **status（参加ステータス）**: 「正会員」「非会員」「アカデミー」のような UBM への参加区分で絞る。公開・非公開を選ぶ項目ではない。
- **tag（タグ）**: 「ピアノ」「合唱」のような印を複数つけられる。複数選んだときは「**全部当てはまる人**」だけが残る（AND 条件）。
- **sort（並び順）**: 名前順 / 新しい入会日順から選ぶ。
- **density（表示密度）**: カードを詰めて並べるか、ゆったり並べるかの見た目だけの設定。

### 図書館の例え

図書館で本を探す場面に例える。

- **q** はタイトル検索の入力欄。「ハリー」と入れると「ハリー・ポッター」が出る。
- **zone** は「文学コーナー / 児童書コーナー / 専門書コーナー」のフロア選択。
- **status** は「一般向け / 研究者向け / 子ども向け」。本の種類で絞る。見せてよい本だけを棚に置く判断は、別の決まり（#4 公開状態フィルタ正確性）が先に守る。
- **tag** は本に貼られた「冒険」「ミステリー」シール。2 枚選んだら両方貼られた本だけが残る（AND 条件の意味）。
- **sort** は「あいうえお順 / 新着順 / 人気順」の並べ替え。
- **density** は「本棚に詰めて並べるか / 表紙を大きく見せるか」の陳列方法。

司書（API＝裏側でデータを返す仕組み）が本（メンバー）を絞り込み、利用者（公開ページの訪問者）が見る棚には、最初から見せてよいものだけが並ぶ、という構造になっている。

### 不変条件 #4 を中学生語で

「公開ページには、掲載に同意していて、管理上公開中で、削除されていない人だけを出す」という決まり。これは status の選択肢とは別に、API が必ず先に守る土台である。

### 専門用語セルフチェック

| 専門用語 | 日常語への言い換え |
| --- | --- |
| query parameter（クエリパラメータ） | URL の末尾に付ける「絞り込み条件」 |
| enum（イーナム） | 「使ってよい言葉のリスト」 |
| AND 条件 | 「両方とも当てはまる」という絞り方 |
| API（エーピーアイ） | 裏側でデータを返してくれる仕組み |
| public boundary（パブリック境界） | 「公開ページから見てはいけないものを見せない壁」 |
| fallback（フォールバック） | 「変な値が来ても怒らずに既定値で動かす」 |

---

## Part 2: 技術者レベル

### 変更対象ファイル一覧（Phase 2/3 設計確定済み）

#### apps/api 側

| パス | 役割 | 変更分類 |
| --- | --- | --- |
| `apps/api/src/_shared/search-query-parser.ts` | `parsePublicMemberQuery`（fallback / clamp） | 編集（テスト追加中心） |
| `apps/api/src/routes/public/members.ts` | hono handler / `Cache-Control: no-store` | 編集（必要時） |
| `apps/api/src/use-cases/public/list-public-members.ts` | use case 組成 | 編集（必要時） |
| `apps/api/src/repository/publicMembers.ts` | D1 join / where / order by | 編集（`sort=name` の `fullName` 順検討時のみ） |
| `apps/api/src/view-models/public/public-member-list-view.ts` | `toPublicMemberListView` strict reject | 編集（必要時） |
| `apps/api/src/_shared/__tests__/search-query-parser.<additional>.test.ts` | 6 param × エッジケース | 追加 |
| `apps/api/src/repository/publicMembers.<additional>.test.ts` | tag AND / zone+status / sort=name | 追加 |

#### apps/web 側

| パス | 役割 | 変更分類 |
| --- | --- | --- |
| `apps/web/app/(public)/members/page.tsx` | Server Component / `searchParams` parse | 編集（必要時） |
| `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | filter UI / `router.replace` | 編集（aria-label 追加 AC-A1/A2） |
| `apps/web/app/(public)/members/_components/MemberList.tsx` | density 切替 | 編集（必要時） |
| `apps/web/src/lib/url/members-search.ts` | URL ↔ MembersSearch / `toApiQuery` | 編集（必要時） |
| `apps/web/src/lib/fetch/public.ts` | public API fetcher | 参照のみ |
| `apps/web/src/components/feedback/EmptyState.tsx` | 空状態 + reset link | 参照のみ |
| `apps/web/src/lib/url/__tests__/members-search.<additional>.test.ts` | URL ↔ MembersSearch round-trip | 追加 |

#### shared

| パス | 役割 | 変更分類 |
| --- | --- | --- |
| `packages/shared/src/zod/viewmodel.ts` (`PublicMemberListViewZ`) | response strict schema | 参照のみ |
| `packages/shared/src/types/viewmodel/index.ts` (`PublicMemberListView`) | TS interface | 参照のみ |

### 関数シグネチャ

```ts
// apps/api/src/_shared/search-query-parser.ts
export type ParsedPublicMemberQuery = {
  q: string;
  zone: "all" | "0_to_1" | "1_to_10" | "10_to_100";
  status: "all" | "member" | "non_member" | "academy";
  tags: string[];
  sort: "recent" | "name";
  density: "comfy" | "dense" | "list";
  page: number;
  limit: number;
};

export const parsePublicMemberQuery: (
  raw: Record<string, string | string[] | undefined>,
) => ParsedPublicMemberQuery;
```

```ts
// apps/api/src/repository/publicMembers.ts
export interface ListPublicMembersInput {
  readonly q: string;
  readonly zone: string;
  readonly status: string;
  readonly tagCodes: readonly string[];
  readonly sort: "recent" | "name";
  readonly page: number;
  readonly limit: number;
}

export const listPublicMembers: (
  c: DbCtx, input: ListPublicMembersInput,
) => Promise<PublicMemberRow[]>;
export const countPublicMembers: (
  c: DbCtx, input: ListPublicMembersInput,
) => Promise<number>;
```

```ts
// apps/web/src/lib/url/members-search.ts
export type MembersSearch = {
  q: string;
  zone: "all" | "0_to_1" | "1_to_10" | "10_to_100";
  status: "all" | "member" | "non_member" | "academy";
  tag: string[];
  sort: "recent" | "name";
  density: "comfy" | "dense" | "list";
};
export const parseSearchParams: (sp: Record<string, string | string[] | undefined>) => MembersSearch;
export const toApiQuery: (s: MembersSearch) => URLSearchParams;
```

### API contract

`GET /public/members`

- 認証: 不要
- Cache-Control: `no-store`
- query: 6 param + `page` / `limit`（zod safeParse + catch fallback）
- response: `PublicMemberListViewZ.strict()`（items / pagination / appliedQuery / generatedAt）
- HTTP status: enum 外も 200（fallback）。500 は内部例外時のみ

### テスト追加内容

| 階層 | ファイル | ケース |
| --- | --- | --- |
| unit (api) | `search-query-parser.<additional>.test.ts` | q 200 文字 truncate / 連続空白正規化 / enum 外 fallback / tag dedup + slice(0,5) / sort・density catch |
| integration (api) | `publicMembers.<additional>.test.ts` | tag AND（HAVING COUNT(DISTINCT)）/ zone+status 複合 / sort=recent / sort=name / 公開境界 #4 |
| unit (web) | `members-search.<additional>.test.ts` | parseSearchParams round-trip / toApiQuery 既定値省略 / repeated tag |
| view (api) | `public-member-list-view.test.ts`（既存） | `.strict()` で admin-only field reject |

### ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
```

### runtime path × evidence

| path | evidence 配置 |
| --- | --- |
| local dev (`pnpm dev`) | `outputs/phase-11/screenshots/members-default.png` ほか 9 枚（Phase 1 evidence path 表参照） |
| curl (apps/api ローカル) | `outputs/phase-11/curl-logs/*.log` |
| a11y axe-core | `outputs/phase-11/a11y/members-axe.json` |
| staging smoke | 09a-A タスクで取得（本タスク out-of-scope） |
| production | 本タスクでは触れない |

### スクリーンショット参照（Phase 11 出力）

`outputs/phase-11/screenshots/`:

- `members-default.png` — 初期表示
- `members-q-hit.png` — q 部分一致
- `members-zone.png` — zone+status 複合
- `members-tag-and.png` — tag AND
- `members-sort-name.png` — sort=name
- `members-density-dense.png` / `members-density-list.png` — density 切替
- `members-empty.png` — 空結果
- `members-large-hit.png` — 大量ヒット paginated

### DoD（Definition of Done / Phase 3 から継承）

| ID | 内容 |
| --- | --- |
| DoD-1 | 6 query parameter parse・default・fallback・bind 全テスト green |
| DoD-2 | API query/response が `12-search-tags.md` 一致 |
| DoD-3 | 不変条件 #4/#5/#6 を AC として記述 + 各 1 つ以上のテストで担保 |
| DoD-4 | 空結果 / 不正値 / 大量ヒットの UI 挙動を Phase 11 evidence で確認 |
| DoD-5 | a11y: filter UI の role / label / keyboard 全到達 + axe-core green |
| DoD-6 | URL 正本: reload で全 filter 状態が復元される |
| DoD-7 | evidence path が `outputs/phase-11/` 配下に揃う |
| DoD-8 | 自走禁止操作（実装・deploy・commit・push・PR）を Phase 12 内で行わない |

### エラーハンドリングとエッジケース

- enum 外値 → 黙って default fallback（HTTP 200）
- q 200 文字超 → 200 で truncate、500 を返さない
- tag 6 件以上 → 先頭 5 件のみ採用
- 0 件結果 → `EmptyState` + `絞り込みをクリア`（href=`/members`）
- 制御文字 / SQL 特殊文字 → prepared statement bind で安全
- 200 件超 → `limit=24` 固定 pagination、描画 1s 以内

### 設定可能なパラメータと定数

| 名称 | 値 | 場所 |
| --- | --- | --- |
| `SUMMARY_KEYS` | allowlist of public field stable_keys | `apps/api/src/repository/publicMembers.ts` |
| `MAX_TAGS` | 5 | `parsePublicMemberQuery` |
| `MAX_Q_LEN` | 200 | 同上 |
| `LIMIT_RANGE` | [1, 100] / default 24 | 同上 |
| zone enum | `all` / `0_to_1` / `1_to_10` / `10_to_100` | shared / parser |
| status enum | `all` / `member` / `non_member` / `academy` | 同上 |
| sort enum | `recent` / `name` | 同上 |
| density enum | `comfy` / `dense` / `list` | 同上 |
