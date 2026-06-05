# task-A: web tag master client の contract 修正 + pagination 対応

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
区分: 実装仕様書（CONST_005）
依存: なし（task-B / task-C がこの task に依存する）
不変条件: apps/api は変更しない（接続先 `GET /admin/tags` は #1035 landed 済）。

---

## 0. root-cause（このタスクで直す本体）

- API `GET /admin/tags`（`apps/api/src/routes/admin/tags.ts` L110-129）は `{ total, items }` を返す。
  - `items` は `{ tagId, code, label, category, active }` の配列（`rowBody`）。
  - query は `ListTagsQueryZ`（L38-42）: `q?`（max120）/ `page`（int min1 default1）/ `pageSize`（int min1 **max100** default50）。
  - proxy（Next.js `/api/admin` route）は pass-through。
- 現 `fetchTagMaster()`（`apps/web/src/features/admin/api/members.ts` L88-94）は応答を `{ available: AdminTagRef[] }` として cast している。
  - 実際の応答に `available` キーは存在しないため `r.available === undefined`。
  - 呼び出し元 `BulkActionBar.tsx` L67 が `setAvailable(undefined)` → L80 `for (const t of available)` が `undefined` 反復でクラッシュ／picker 空表示になる。
- テスト mock（`BulkActionBar.spec.tsx` L61）が `{ available: AVAILABLE }` を返すため緑のまま隠蔽されている（→ task-C で mock を実 API 形へ是正）。

> 注（設計との整合）: 確定設計の `pageSize` 既定は `TAG_PAGE_SIZE_MAX=100`。API 側 `ListTagsQueryZ` の server default は 50 だが、client は常に明示 `pageSize` を送るため server default には依存しない。`max100` は API zod 上限と一致するので client 既定 100 は上限内で安全。

---

## 1. 変更対象ファイル一覧 + 変更種別

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/api/members.ts` | 編集 | `fetchTagMaster` を contract 是正 + 引数追加、型 `TagMasterPage` / `FetchTagMasterOptions` / `TagMasterFullResult` 追加、`fetchAllTagMaster` 追加、`TAG_PAGE_SIZE_MAX` 定数追加 |
| `apps/web/src/features/admin/api/__tests__/members.spec.ts` | 新規 | task-C で記述（本 task では空ファイル不要・参照のみ） |

---

## 2. 追加する型・関数の完全シグネチャ

```ts
// apps/web/src/features/admin/api/members.ts に追加

/** GET /admin/tags の pageSize 上限（API zod ListTagsQueryZ.pageSize.max = 100 と一致）。 */
export const TAG_PAGE_SIZE_MAX = 100;

/** API GET /admin/tags の生応答（#1035 landed）。 */
type TagMasterApiResponse = {
  total?: number;
  items?: AdminTagRef[];
};

/** fetchTagMaster の 1 ページ分の正規化結果。後方互換のため `available` キーを保持する。 */
export type TagMasterPage = {
  available: AdminTagRef[];
  total: number;
};

/** fetchTagMaster の query option（全て optional = 既存無引数呼び出し互換）。 */
export type FetchTagMasterOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
};

/** fetchAllTagMaster の全件（cap 上限で打ち切り）結果。 */
export type TagMasterFullResult = {
  available: AdminTagRef[];
  total: number;
  truncated: boolean;
};

/**
 * bulk UI の tag picker 用 tag master read（1 ページ）。
 * API 応答 `{ total, items }` を `{ available, total }` へ正規化する。
 * 引数は全て optional のため `fetchTagMaster()` の既存無引数呼び出しと後方互換。
 */
export async function fetchTagMaster(
  opts?: FetchTagMasterOptions,
): Promise<TagMasterPage>;

/**
 * tag master を最終ページまで周回して全件取得する。
 * cap（既定 500）と最終ページ判定（available.length < pageSize）の二重ガードで停止する。
 * cap に達して未取得が残る場合は truncated=true を返す。
 */
export async function fetchAllTagMaster(
  cap?: number,
): Promise<TagMasterFullResult>;
```

---

## 3. 入出力・副作用

### `fetchTagMaster(opts?)`

- 入力: `opts.q`（検索語）/ `opts.page`（既定 1）/ `opts.pageSize`（既定 `TAG_PAGE_SIZE_MAX`=100）。
- query 組み立て:
  - `q` は `trim()` し、空文字列でなければ `q` を付与（空 trim 結果は付与しない）。
  - `page` 既定 1。`pageSize` 既定 100。両方 `URLSearchParams` に文字列で付与。
  - URL: `/api/admin/tags?` + querystring。
- fetch: `fetch(url, { cache: "no-store" })`。
- 例外: `!res.ok` なら `throw new Error(`HTTP ${res.status}`)`（既存挙動踏襲）。
- 変換: 応答 JSON を `TagMasterApiResponse` として読み、
  - `available = items ?? []`
  - `total = total ?? items?.length ?? 0`
  - を返す。`available` キー名は後方互換のため維持（BulkActionBar 既存 `r.available` 参照を壊さない）。
- 副作用: ネットワーク I/O のみ。state は持たない。

### `fetchAllTagMaster(cap = 500)`

- 入力: `cap`（取得総件数上限、既定 500）。
- 動作:
  - `page = 1` から `pageSize = TAG_PAGE_SIZE_MAX` で `fetchTagMaster({ page, pageSize })` を周回呼び出し。
  - 各ページの `available` を累積（`acc.push(...page.available)`）。
  - 最終ページ判定: `page.available.length < pageSize` なら最終ページ → ループ終了。
  - cap ガード: `acc.length >= cap` なら打ち切り。`acc` を `cap` 件で `slice` し `truncated = true`。
  - `total` は最初（または最終）ページ応答の `total` を採用。
- 返却: `{ available: acc, total, truncated }`。
  - `truncated = true` の条件: cap で打ち切った、または周回終了時に `total > acc.length`（cap 起因）。
- 例外: 周回中の `fetchTagMaster` 例外はそのまま伝播（呼び出し元 BulkActionBar が catch して空 picker にする）。
- 副作用: ネットワーク I/O のみ（最悪 `ceil(cap / pageSize)` = 5 リクエスト）。

---

## 4. 後方互換

- `fetchTagMaster()`（無引数）= `fetchTagMaster(undefined)` で `page=1, pageSize=100, q なし` として動作。
  - 既存呼び出し元 `BulkActionBar.tsx` L65 の `fetchTagMaster()` はコンパイル/挙動とも互換。ただし task-B で `fetchAllTagMaster` 呼び出しへ差し替える。
- 返り値の `available` キーは維持。`{ available }` を読む既存コードは壊れない（`total` が増えるだけ）。
- 既存 export（`AdminTagRef` / `MemberTagsResult` / `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` / `bulkApplyMemberTags` 等）は一切変更しない。

---

## 5. テスト方針（新規 `apps/web/src/features/admin/api/__tests__/members.spec.ts`）

`*.spec.ts` のみ（不変条件 #8）。`global.fetch` を `vi.stubGlobal` で stub し以下を検証（詳細は task-C）:

| ケース | 検証 |
| --- | --- |
| query 組み立て | `fetchTagMaster({ q: " eng ", page: 2, pageSize: 50 })` で URL が `q=eng&page=2&pageSize=50` を含む（q は trim 済み） |
| 既定値 | `fetchTagMaster()` で `page=1&pageSize=100`、`q` なし |
| 変換 | 応答 `{ total: 2, items: [...] }` → `{ available: items, total: 2 }` |
| total fallback | 応答 `{ items: [...] }`（total 欠落）→ `total = items.length` |
| items 欠落 | 応答 `{ total: 0 }` → `available = []` |
| HTTP エラー | `!ok`（500）で throw |
| ページ周回 | `fetchAllTagMaster` が 100件×フルページ → 次ページ呼び出し、`available.length < 100` で停止 |
| cap | `fetchAllTagMaster(cap=120)` で 100+100 取得しても 120 件に slice、`truncated=true` |
| truncated false | total ≤ 取得件数なら `truncated=false` |

---

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/api/__tests__/members.spec.ts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7. DoD

- [ ] `fetchTagMaster` が `{ total, items }` 応答を `{ available, total }` へ変換する。
- [ ] `FetchTagMasterOptions` の query（q trim / page / pageSize）を正しく組み立てる。
- [ ] `fetchAllTagMaster` が最終ページ判定 + cap 二重ガードで周回し `truncated` を返す。
- [ ] `TAG_PAGE_SIZE_MAX=100`、既定 pageSize=100。
- [ ] 無引数 `fetchTagMaster()` が後方互換（既存呼び出しがコンパイル・動作とも維持）。
- [ ] 新規 `members.spec.ts` の全ケース GREEN（task-C で記述）。
- [ ] `pnpm typecheck` / `pnpm lint` 緑。
- [ ] apps/api 差分 0。HEX 直書きなし（このファイルは color 非対象だが念のため）。
