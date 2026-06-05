# Implementation Guide — issue #1078 BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正

> 段階: **implemented_local_evidence_captured**。本書は local 実コード差分へ最終整合済み。
> 識別子は `phase-2-design.md` と一致させること。

---

## Part 1 — 中学生にもわかる説明（例え話）

### 困っていたこと その1: 付箋（タグ）が多すぎて箱からあふれる

会員一人ひとりに「役割」や「分類」を表す付箋（タグ）を貼れます。
これまでは付箋の種類が少なかったので、画面に全部並べても問題ありませんでした。

ところが種類が 60 個に増えると、画面に全部ベタッと並んでしまい、
「あの付箋どこ？」と探すのに苦労するようになりました。箱から付箋があふれている状態です。

そこで箱を改造しました:

- **検索**: キーワードを打つと、その言葉を含む付箋だけを出す。
- **折りたたみ**: 付箋が多いときは最初は閉じておき、開いたときだけ全部見せる。
- **高さ制限の箱（max-height）**: 箱の高さを決めて、あふれたぶんは箱の中をスクロールして見る。だから画面そのものは伸びすぎない。
- **選んだ付箋を上に固定**: 自分が選んだ付箋は、スクロールで見えなくならないように、いつも箱の一番上に貼っておく。
- **少しずつ取り寄せる（ページめくり）**: 付箋が大量にあるときは、一度に全部ではなく、決めた枚数ずつ取り寄せる。

### 困っていたこと その2: 窓口で違う形の紙を受け取っていた（contract バグ）

付箋の一覧は「窓口（API）」に頼んで受け取ります。
窓口は実は **「合計枚数（total）と中身のリスト（items）」** という形の紙を返していました。

ところがこちらのプログラムは **「使える一覧（available）」** という別の形だと思い込んで受け取っていました。
形が違うので、中身を取り出そうとしても **いつも空っぽ**。だから付箋が 1 枚も表示されなかったのです。

さらに困ったことに、テスト（動作確認の自動チェック）では
**わざと「available の形」のニセ窓口**を用意していたので、この食い違いに誰も気づけませんでした。

今回はこれを直します:

- 受け取る側を、窓口が本当に返している **「total と items」** の形に合わせる。
- テストのニセ窓口も **本物と同じ形**にして、二度と食い違いを見逃さないようにする。

これが「**contract（約束）の不一致**」の修正です。

---

## Part 2 — 型・API・コード例

> 対象は `apps/web` のみ（`apps/api` 非変更）。`GET /api/admin/tags` は既に `{ total, items }`（`q` / `page` / `pageSize` 対応・pageSize 上限 100）を返しており、web client 側の contract を実 API 形へ合わせる。

### 2.1 既存の実 API レスポンス形（正本・変更しない）

`apps/api/src/routes/admin/tags.ts` の `GET /tags` は次を返す:

```jsonc
{
  "total": 60,
  "items": [
    { "tagId": "tag_xxx", "code": "manager", "label": "マネージャー", "category": "役割", "active": true }
    // ...
  ]
}
```

クエリ: `q`（部分一致・最大120）/ `page`（>=1, 既定1）/ `pageSize`（1..100, 既定50）。

### 2.2 web client 型定義

```ts
// apps/web/src/features/admin/api/members.ts

export type AdminTagRef = {
  tagId: string;
  code: string;
  label: string;
  category: string;
};

/** tag master の 1 ページ分。UI 互換のため `available` キーへ正規化する。 */
export type TagMasterPage = {
  available: AdminTagRef[];
  total: number;
};

/** fetchTagMaster の取得オプション。未指定時は page=1, pageSize=100 を明示する。 */
export type FetchTagMasterOptions = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type TagMasterFullResult = {
  available: AdminTagRef[];
  total: number;
  truncated: boolean;
};
```

### 2.3 `fetchTagMaster`（contract 修正・AC-0）

```ts
/**
 * bulk UI の tag picker 用 tag master read。
 * 実 API は `{ total, items }` を返す。旧実装は `{ available }` と誤読していた（issue #1078 P0）。
 */
export async function fetchTagMaster(
  opts?: FetchTagMasterOptions,
): Promise<TagMasterPage> {
  const params = new URLSearchParams();
  const q = opts?.q?.trim();
  if (q) params.set("q", q);
  params.set("page", String(opts?.page ?? 1));
  params.set("pageSize", String(opts?.pageSize ?? TAG_PAGE_SIZE_MAX));
  const res = await fetch(`/api/admin/tags?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = (await res.json()) as { total?: number; items?: AdminTagRef[] };
  const available = body.items ?? [];
  return { available, total: body.total ?? available.length };
}
```

> 後方互換: 戻り値の `available` キーは維持しつつ、実 API の `{ total, items }` を読む。呼び出し側（`BulkActionBar.tsx`）は `fetchAllTagMaster()` を使い、`members.spec.ts` で contract を固定する。

### 2.4 `fetchAllTagMaster`（全件取得・pagination・cap）

```ts
/**
 * pagination を辿り、cap に達するか total を満たすまで全 tag を取得する。
 * picker の「選択中固定行」「全件検索」を成立させるための全件 read。
 */
export async function fetchAllTagMaster(
  cap = 500,
): Promise<TagMasterFullResult> {
  const pageSize = TAG_PAGE_SIZE_MAX;
  const available: AdminTagRef[] = [];
  let page = 1;
  let total = 0;
  let truncated = false;

  while (available.length < cap) {
    const current = await fetchTagMaster({ page, pageSize });
    total = current.total;
    available.push(...current.available);
    if (current.available.length < pageSize) break;
    page += 1;
  }

  if (available.length > cap) {
    available.length = cap;
    truncated = true;
  }
  if (total > available.length) truncated = true;

  return { available, total, truncated };
}
```

### 2.5 設定可能パラメータ（識別子は phase-2-design.md に一致）

| 定数 | 役割 | 想定値 |
| --- | --- | --- |
| `TAG_PAGE_SIZE_MAX` | 1 ページの取得件数（API の `pageSize` 上限 100 を超えない） | 100 |
| `COLLAPSE_THRESHOLD` | これ以上の tag 数で picker を初期折りたたみにする閾値 | 例: 24 |
| `cap` | `fetchAllTagMaster` の全件取得上限 | 500（引数で上書き可） |
| debounce | 検索入力の debounce 時間 | 250ms |

> 上記の最終的な定数名・値は `phase-2-design.md` の定義を正本とし、本書はそれに整合させる。

### 2.6 BulkActionBar 側の利用例（AC-1..AC-5）

```ts
// 旧: r.available（常に undefined → 空 picker）
// 新: total/items を読む。大規模 catalog 用に全件 read。
useEffect(() => {
  let active = true;
  fetchAllTagMaster()
    .then((r) => {
      if (!active) return;
      setAvailable(r.available);
      setTagTotal(r.total);
      setServerSearchMode(r.truncated);
    })
    .catch(() => { if (active) setAvailable([]); });
  return () => { active = false; };
}, []);
```

- 検索 state は debounce 後に client filter（全件 read 済みのため再 fetch 不要）または `q` 付き再取得のどちらか（phase-2 の決定に従う）。
- 折りたたみ: `available.length > COLLAPSE_THRESHOLD` のとき初期 collapsed。
- 選択中固定行: `selectedTagIds` に含まれる tag をリスト先頭へ並べ替え（DOM 順でも先頭）。
- max-height: picker scroll 領域に `max-h-*` を付与し、超過分は領域内スクロール。

### 2.7 エラーハンドリング

- `fetchTagMaster` は `!res.ok` で `Error("HTTP <status>")` を throw（既存方針踏襲）。
- BulkActionBar は read 失敗時 `setAvailable([])` で picker を空にし、UI は「付与可能なタグがありません」を表示（既存の空状態を維持）。mutation 失敗は従来どおり `useAdminMutation` が toast 処理。

---

## 視覚証跡

Phase 11 で取得する canonical screenshot（`outputs/phase-11/screenshots/` 配下・実取得は staging 認証 + user-gated）:

| # | canonical 名 | 状態 |
| --- | --- | --- |
| S-1 | `bulk-tag-picker-large-catalog-collapsed.png` | 大規模 catalog（60 tag）初期表示・折りたたみ + max-height |
| S-2 | `bulk-tag-picker-search-filtered.png` | 検索で絞り込み（debounce 後） |
| S-3 | `bulk-tag-picker-selected-pinned.png` | 選択中 tag がリスト先頭に固定 |
| S-4 | `bulk-tag-picker-mobile-sticky.png` | モバイル幅で sticky 表示・picker max-height スクロール |

> 名称は `phase-11-manual-test.md` / `outputs/phase-11/manual-test-result.md` と完全一致（FB-LLM-MOD-05-001）。local deterministic evidence は取得済みで、staging 実画像のみ user-gated のため未取得。
