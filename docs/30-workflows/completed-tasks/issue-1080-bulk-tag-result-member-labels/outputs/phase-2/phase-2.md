# Phase 2: 設計 — issue-1080 BulkActionBar 部分失敗結果 summary の表示名化

## 設計方針サマリ

部分失敗 summary の **表示値だけ** を生 ID から表示名へ置き換える。データ供給は親 `MembersClientShell` が `membersById`（member 解決テーブル）を派生し optional 注入する。tag label 解決は `BulkActionBar` が既に保持する `available`（tag master）から `useMemo` で `tagLabelById` を構築する。新規 primitive・新規ファイルは作らず、既存の `<ul><li>` 構造と testid / key を維持する。

## props 契約テーブル（`BulkActionBar`）

| prop          | 型                                                                                                   | 追加 / 既存 | optional | 既定挙動                                              | optional 理由                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `selectedIds` | `ReadonlyArray<string>`                                                                              | 既存        | No       | 既存通り                                             | —                                                                                                     |
| `onComplete`  | `() => void`                                                                                         | 既存        | No       | 既存通り                                             | —                                                                                                     |
| `membersById` | `Readonly<Record<string, { readonly fullName: string }>>`           | **追加**    | **Yes**  | 未注入時は全 member 解決が `undefined` → memberId fallback | **後方互換**。既存の `<BulkActionBar selectedIds onComplete />` 呼び出し（テスト含む）を壊さないため optional |

### 型設計の根拠

- 値型は `{ readonly fullName: string }`。`responseEmail` は PII 最小化のため供給しない。
- `Record<string, ...>` のキーは `memberId`（branded `MemberId` も `string` キーとして使用可）。
- `Readonly<Record<...>>` で immutable を明示し、`exactOptionalPropertyTypes` 下でも `membersById?` の省略を許容する。

## state ownership（責務境界 — 混在させない）

| データ          | 所有者                  | 由来                                            | 受け渡し                                       |
| --------------- | ----------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `membersById`   | **親 `MembersClientShell`** | `initial.members`（SSR 由来の list view）       | props で `BulkActionBar` へ down（derived data） |
| `tagLabelById`  | **`BulkActionBar` 内部** | `available`（`fetchTagMaster()` の read result） | 内部 `useMemo`。外へ出さない                    |
| `bulkResult`    | `BulkActionBar` 内部（既存） | `bulkMut.trigger()` の `results` を `summarize()`  | 既存通り内部 state                             |

> **原則**: member 解決テーブルは親が所有する list データから導出するため親に置く。tag label 解決は `BulkActionBar` が既に `available` を持っているため component 内に閉じる。所有権を component / parent で混在させない（同じデータを 2 箇所から派生しない）。

## 表示解決ロジック疑似コード

### tagLabelById の構築（BulkActionBar 内・既存 groupedTags と同流儀）

```ts
// available: AdminTagRef[]（fetchTagMaster() の結果）
const tagLabelById = useMemo<Record<string, string>>(() => {
  const m: Record<string, string> = {};
  for (const t of available) m[t.tagId] = t.label;
  return m;
}, [available]);
```

### skipped_deleted 行の表示解決（AC-1 / AC-4）

```tsx
{bulkResult.skipped.map((r) => {
  const name = membersById?.[r.memberId]?.fullName ?? r.memberId; // 未注入/未登録は memberId fallback
  return (
    <li key={`skip-${r.memberId}-${r.tagId}`}>
      退会済みのためスキップ: {name}
    </li>
  );
})}
```

### tag_not_found 行の表示解決（AC-2 / AC-4）

```tsx
{bulkResult.notFound.map((r) => {
  const label = tagLabelById[r.tagId];
  const text = label
    ? `未登録タグのためスキップ: ${label}`
    : `未登録タグのためスキップ: ${r.tagId}（未登録）`;
  return (
    <li key={`nf-${r.memberId}-${r.tagId}`}>{text}</li>
  );
})}
```

> `tag_not_found` は「tag master に存在しないタグ」を意味するため、`tagLabelById` で解決できないのが通常ケース。よって `{tagId}（未登録）` fallback が AC-2 の主経路。label が偶発的に解決できた場合のみ label を出す。

## 親側の派生（MembersClientShell）

```ts
const membersById = useMemo(
  () =>
    Object.fromEntries(
      initial.members.map((m) => [
        m.memberId,
        { fullName: m.fullName },
      ]),
    ),
  [initial.members],
);
```

注入:

```tsx
<BulkActionBar
  selectedIds={Array.from(selected)}
  membersById={membersById}
  onComplete={onComplete}
/>
```

> 既存の `republishCandidates`（`initial.members` を `useMemo` で map し displayName を注入）と同じ流儀。前例があるため新規パターンを生やさない。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 項目                     | 判定           | 内容                                                                          |
| ------------------------ | -------------- | ----------------------------------------------------------------------------- |
| 新規 primitive           | **生やさない** | result summary の `<ul><li>` 構造をそのまま使う。表示値の式だけ差し替える       |
| 新規ファイル             | **作らない**   | `BulkActionBar.tsx` / `MembersClientShell.tsx` を edit するのみ                |
| testid                   | **維持**       | `bulk-tag-result` / `-counts` / `-skipped` / `-not-found` を変えない           |
| list item key            | **維持**       | `skip-${memberId}-${tagId}` / `nf-${memberId}-${tagId}` を変えない             |
| アクセシビリティ / token | **維持**       | `aria-live="polite"` / OKLch token クラスはそのまま。HEX 直書きを増やさない    |

→ アクセシビリティ・デザイン token 準拠は既存レベルのまま据え置けるため、再利用を最優先する。

## 因果ループ / 責務境界（各 1 本）

- **バランスループ（判読性 ↔ PII 露出）**: 表示名を増やすほど運用判読性は上がるが、無制限に PII（email 等）を出すとリスクが増える。`fullName` のみを渡して表示することで、判読性向上と PII 抑制の均衡を取る。
- **責務境界**: `MembersClientShell`（Container = データ供給）と `BulkActionBar`（Presentational + 自身の tag master read）の境界を保つ。member 解決は Container 由来データから親が導出、tag 解決は `BulkActionBar` が自分の `available` から導出。Container が tag label を解決したり、`BulkActionBar` が member list を再 fetch したりしない。

## 既存テスト後方互換の設計

| 設計判断                                                                                          | 効果                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `membersById?` を optional にする                                                                  | `membersById` を渡さない既存テスト・既存呼び出しは従来通り memberId fallback で動作する |
| fallback を `membersById?.[id]?.fullName ?? r.memberId` の nullish 連鎖にする                       | prop 未注入・キー欠落・値欠落のいずれでも例外なく memberId に落ちる（AC-4）             |
| testid / key を変えない                                                                            | 既存の `getByTestId("bulk-tag-result-*")` 系アサーションが破壊されない                 |
| `summarize()` / `bulkResult` 構造を変えない                                                        | counts 行（`bulk-tag-result-counts`）の既存検証が不変                                  |

> **[VSCPKR-03]**: 本変更で増える表示分岐は **外部 prop（`membersById`）と内部 state（`tagLabelById` / `bulkResult`）の両方** に依存する。Phase 4 では「member 表示名 = 外部 prop 由来」「tag label = 内部 useMemo 由来」を区別してテストを設計する。
