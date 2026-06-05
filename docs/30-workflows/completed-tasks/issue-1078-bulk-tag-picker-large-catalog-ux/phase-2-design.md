# Phase 2: 設計

apps/web のみ。新規 IPC / endpoint / D1 schema なし（不変条件: 既存 API のみ接続）。

## 2.1 topology / 責務境界

```
apps/api GET /admin/tags  (#1035 landed・変更なし)
  入力 query: { q?, page=1, pageSize=50(max100) }
  出力      : { total: number, items: TagDefinitionRow[] }  // items は {tagId,code,label,category,active}
        │  Next proxy /api/admin/[...path] (pass-through・変更なし)
        ▼
[task-A] fetchTagMaster(opts) ──── 変換層（API 形 {total,items} → UI 形 {available,total}）
        ▼
[task-B] BulkActionBar ─────────── UI state 所有（検索語 / 折りたたみ集合 / 選択集合 / known tag map）
        ▼
        TagPill (再利用・変更なし)
```

| レイヤ | 状態所有 | 本タスクの変更 |
|--------|----------|----------------|
| apps/api endpoint | tag master 永続 | なし |
| proxy | なし（透過） | なし |
| `fetchTagMaster`（fetch 層） | なし（純変換） | contract 修正 + query 引数 |
| `BulkActionBar`（component） | 検索語 / collapsed set / selected set / known map | large catalog UX 追加 |

## 2.1.1 確定定数・既定値（全 phase / tasks / outputs はこの値で統一）

| 定数名 | 値 | 用途 | 配置 |
|--------|----|------|------|
| `TAG_PAGE_SIZE_MAX` | `100` | `fetchTagMaster` 既定 pageSize（API 上限）。50 切り捨て解消（AC-3） | `members.ts` |
| `fetchAllTagMaster` `cap` 既定値 | `500` | 全件アセンブリ上限（無限ループ防止）。公開定数ではなく helper の既定引数で管理 | `members.ts` |
| `COLLAPSE_THRESHOLD` | `24` | この件数を超えたら検索 + 折りたたみ UI を出す（以下は現行全件表示維持） | `BulkActionBar.tsx` |
| `SEARCH_DEBOUNCE_MS` | `250` | server search mode の入力 debounce | `BulkActionBar.tsx` |

> 本表が値の正本。`fetchAllTagMaster(cap = 500)` の既定引数で明示し、magic number を
> 呼び出し側へ分散させない。

## 2.2 task-A: tag master read client contract（apps/web）

`apps/web/src/features/admin/api/members.ts` を修正。

### 型（追加）

```ts
// API のページレスポンスを UI 形へ正規化した結果。
export type TagMasterPage = {
  available: AdminTagRef[]; // 現ページ/クエリで取得した active tag（既存呼び出し互換のため available を維持）
  total: number;            // server 側の総件数（検索時は絞り込み後の総数）
};

export type FetchTagMasterOptions = {
  q?: string;        // server-side search（未指定/空文字は全件）
  page?: number;     // 既定 1
  pageSize?: number; // 既定 100（= API 上限。50 既定だと 51 件目以降が切り捨てられるため）
};
```

### `fetchTagMaster` 修正（**P0 contract 修正の核心**）

```ts
const TAG_PAGE_SIZE_MAX = 100; // apps/api ListTagsQueryZ.pageSize.max(100) に一致

/** bulk UI の tag picker 用 tag master read。API の {total,items} を UI 形 {available,total} へ正規化する。 */
export async function fetchTagMaster(
  opts: FetchTagMasterOptions = {},
): Promise<TagMasterPage> {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  if (q) params.set("q", q);
  params.set("page", String(opts.page ?? 1));
  params.set("pageSize", String(opts.pageSize ?? TAG_PAGE_SIZE_MAX));

  const res = await fetch(`/api/admin/tags?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  // API 正本形: { total, items }。旧 { available } 形は存在しない（#1035 で {total,items} 化済み）。
  const body = (await res.json()) as { total?: number; items?: AdminTagRef[] };
  return {
    available: body.items ?? [],
    total: body.total ?? body.items?.length ?? 0,
  };
}
```

### `fetchAllTagMaster`（全件アセンブリ・任意呼び出し）

小〜中規模 catalog（`total <= cap`）では全ページを取得して client-side 検索/折りたたみを可能にする。
無制限ループを避けるため上限 `cap`（既定 500）で打ち切り、打ち切り時は `truncated:true` を返す
（silent cap 禁止: 呼び出し側が「全 N 件中 M 件」を表示できるよう total も返す）。

```ts
export type TagMasterFullResult = {
  available: AdminTagRef[];
  total: number;
  truncated: boolean; // total > 取得済み件数（cap 到達で打ち切った）
};

export async function fetchAllTagMaster(cap = 500): Promise<TagMasterFullResult> {
  const pageSize = TAG_PAGE_SIZE_MAX;
  const acc: AdminTagRef[] = [];
  let page = 1;
  let total = 0;
  for (;;) {
    const res = await fetchTagMaster({ page, pageSize });
    total = res.total;
    acc.push(...res.available);
    if (res.available.length < pageSize) break; // 最終ページ
    if (acc.length >= cap) break;                // cap 到達
    page += 1;
  }
  return { available: acc, total, truncated: acc.length < total };
}
```

> 設計判断: 既定では `fetchAllTagMaster()` を使い、`total > cap` のときだけ component 側で
> server-side search（`fetchTagMaster({ q })`）モードへ切り替える。これにより小規模では
> client 完結の高速な検索/折りたたみ、大規模では server 検索という二段構えになる（AC-3）。

## 2.3 task-B: BulkActionBar large catalog UX（apps/web）

`apps/web/src/features/admin/components/_members/BulkActionBar.tsx` を修正。

### 追加 state（component が所有）

```ts
const [available, setAvailable] = useState<AdminTagRef[]>([]);       // 取得済み tag（現モード）
const [tagTotal, setTagTotal] = useState(0);                         // server 総件数
const [serverSearchMode, setServerSearchMode] = useState(false);     // total > cap で true
const [query, setQuery] = useState("");                              // 検索語
const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set()); // 折りたたみ category
const knownTagsRef = useRef<Map<string, AdminTagRef>>(new Map());    // tagId -> ref（label 解決用・AC-4）
```

### ロード（useEffect）

- 初回: `fetchAllTagMaster()` を呼ぶ。`truncated` が true（= `total > cap`）なら `serverSearchMode=true`。
- `serverSearchMode` 時、`query` 変更を debounce（既定 250ms）して `fetchTagMaster({ q: query })` を再取得。
- 取得した tag は毎回 `knownTagsRef` に upsert（label 解決のため累積保持）。
- 失敗時は `setAvailable([])`（既存挙動を維持）。

### 表示フィルタ（useMemo）

```ts
// serverSearchMode=false のときだけ client 側で query 絞り込み（大規模は server 側で絞る）
const visible = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (serverSearchMode || q === "") return available;
  return available.filter(
    (t) => t.label.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
  );
}, [available, query, serverSearchMode]);

const groupedTags = useMemo(() => {/* visible を category ごとに Map 化（既存ロジック流用） */}, [visible]);
```

### 選択中固定行（AC-4）

```ts
// selectedTagIds の各 id を knownTagsRef から label 解決して chip 描画。
// 解決できない id（未取得）は code/id フォールバック表示。
const selectedChips = [...selectedTagIds].map(
  (id) => knownTagsRef.current.get(id) ?? { tagId: id, code: id, label: id, category: "" },
);
```

選択中行は picker リストの **外**（折りたたみ・検索の影響を受けない固定領域）に描画する。
これにより検索/ページで結果外になった選択 tag も常に解除可能（AC-4）。

### 高さ制御（AC-1 / AC-5）

- picker リスト（category 群を内包する `div`）に `max-h-[40vh] overflow-y-auto` を付与（token 化された
  spacing を使用）。閾値（`available.length` or `tagTotal` が `COLLAPSE_THRESHOLD`=既定 24 超）で
  検索入力と「すべて展開/折りたたむ」操作を表示する。閾値以下は現行の全件表示を維持（小規模回帰なし）。
- category ヘッダを `<button aria-expanded>` 化して折りたたみトグル。`collapsed` set に category 名を出し入れ。

### 検索入力

```tsx
<input
  type="search"
  aria-label="タグを検索"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="タグ名・コードで絞り込み"
  className="… token-based …"
/>
{serverSearchMode && (
  <span className="text-xs text-[var(--ubm-color-text-secondary)]">
    全 {tagTotal} 件中 {available.length} 件を表示（検索で絞り込み）
  </span>
)}
```

### 既存挙動の不変

- `selectedTagIds: Set<string>` の toggle / bulk trigger / 部分失敗集計表示は**現行のまま**（regression）。
- `TagPill` の props（`selected` / `onClick` / `disabled` / `title`）は変更しない。

## 2.4 task-C: テスト + visual 設計

- `BulkActionBar.spec.tsx`: fetch mock を実 API 形 `{ total, items }` へ是正（**AC-0 の回帰防止の要**）。
  新規ケース: contract（items 読み取り）/ 検索フィルタ / category 折りたたみ / 選択中固定行の persistence /
  pageSize=100 送信 / keyboard（aria-pressed）regression。
- 新規 `apps/web/src/features/admin/api/__tests__/members.spec.ts`: `fetchTagMaster` の query 組み立て・
  `{total,items}`→`{available,total}` 変換・`fetchAllTagMaster` のページ周回 + cap/truncated を検証。
- Playwright: large fixture（例: 60 tag）で sticky bar が table を塞がない・検索で件数が絞れることを
  desktop/mobile で確認する計画（実取得は user-gated）。

## 2.5 SubAgent lane（並列 ≤3）

| Lane | 担当 Phase | 直列/並列 |
|------|-----------|-----------|
| Lane A | phase-4, phase-5, phase-6, tasks/task-A,B,C | 並列（design 確定後） |
| Lane B | phase-7, phase-8, phase-9, phase-10 | 並列 |
| Lane C | phase-11, phase-12, phase-13 | 並列 |
| validation | verify-all-specs / gate-metadata / phase12-compliance | 直列で締め |

## 2.6 既存コンポーネント再利用可否（FB-SDK-07-1）

- `TagPill`（`_shared/TagPill.tsx`）を再利用。新規 primitive は生やさない。
- 検索 `<input>` は admin 標準 token を使う（新規 FormField 不要 — picker は admin/components 配下だが
  `FormField` 強制対象の「form input」ではなく picker filter のため inline input を許容。不変条件 #9 は
  member/admin の編集フォーム入力が対象であり filter は別。Phase 3 レビューで再確認）。

## 完了条件

- [x] contract 修正の関数シグネチャ確定（`fetchTagMaster` / `fetchAllTagMaster` / 型）
- [x] component state ownership と AC-4 の label 解決機構を確定
- [x] 高さ制御 / 検索 / 折りたたみの閾値ゲートを確定
- [x] apps/api 非変更を明記


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`



## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。
