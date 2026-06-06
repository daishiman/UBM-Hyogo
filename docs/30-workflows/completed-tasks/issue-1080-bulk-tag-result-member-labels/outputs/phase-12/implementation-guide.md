# Phase 12 / Task 12-1: 実装ガイド（bulk tag 部分失敗結果の member/tag 表示名表示）

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ガイドは Phase 1-3 で確定した設計の識別子・挙動と、今回サイクルで反映した実コード差分を記録する。`membersById` / `tagLabelById` / fallback の identifier drift がないことを Phase 12 compliance check で確認する。

---

## Part 1 — 概念説明（中学生レベル・専門用語なし）

### なぜ必要か（身近な例え）

クラス全員に「明日の持ち物カード」を一気に配る係をやったと想像してください。配り終わったあとで「3人だけ配れませんでした」と報告が来ます。でもその報告が「出席番号 7番、12番、25番に配れませんでした」だけだったら、あなたは名簿を引っぱり出して「7番は誰だっけ…」と一人ずつ照らし合わせないといけません。とても面倒です。

最初から「田中さん、佐藤さん、鈴木さんに配れませんでした」と**名前で**報告してくれたら、誰に配り直せばいいか一瞬で分かりますよね。番号より名前のほうが、人にはずっと分かりやすいのです。

### 何をするか

会員サイトの管理画面に、たくさんの会員へ一度にタグ（「役員」などの目印シール）をまとめて貼ったり、はがしたりする機能があります。このとき、退会した会員だったりタグが消えていたりして、**一部だけ失敗する**ことがあります。

今は失敗の報告がこうなっています。

- 「退会済みのためスキップ: `abc-123-def`」（← これは会員の内部番号で、誰のことか分からない）
- 「未登録タグのためスキップ: `tag-987`」（← これはタグの内部番号で、何のタグか分からない）

これを次のように直します。

1. 退会済みでスキップされた会員は、内部番号ではなく**名前（フルネーム）**で出す。例: 「退会済みのためスキップ: 山田 太郎」
2. 見つからなかったタグは、内部番号ではなく**タグの表示名（ラベル）**で出す。例: 「未登録タグのためスキップ: 役員」
3. もし名前やラベルが手元に分からないときは、今までどおり内部番号を出す（情報が消えてしまわないように）。タグの場合は「`tag-987`（未登録）」のように出す。

裏側のコンピューターとのやりとり（どんな形でデータを受け取るか）は**いっさい変えません**。画面の見せ方だけを直します。

### 今回作るもの（できるようになること）

- 一括でタグをつけて一部失敗したとき、「誰が」「どのタグが」失敗したのかが**名前で**分かるので、番号を名簿と突き合わせる手間がなくなる。
- 名前やラベルが分からないときも内部番号で表示されるので、情報が消えて画面が壊れることはない。
- 裏側のデータのやりとりは変えないので、ほかの機能に影響しない。

---

## Part 2 — 技術詳細（開発者向け）

### 全体方針

- 変更は **`apps/web` のみ**。`apps/api` は非接触（AC-3: API response shape `{ memberId, tagId, status }` を維持）。
- 表示名解決は **UI 側**で行う。member は親 `MembersClientShell` が保持する `initial.members`、tag は `BulkActionBar` が既にロード済みの `available`（`AdminTagRef[]`）を再利用する。
- 親→子の表示名注入は、既存の `BulkRepublishDrawer` への `republishCandidates`（`displayName`）注入と同パターン（`MembersClientShell` の `useMemo` 構築）。
- member 表示は `fullName` を主表示（email は出さない）。`MembersTable` の表示ポリシーに整合し PII 表示拡大を回避する。

### props interface（`membersById` 追加後の完全形）

```tsx
export interface BulkActionBarProps {
  readonly selectedIds: ReadonlyArray<string>;
  readonly onComplete: () => void;
  readonly membersById?: Readonly<Record<string, { readonly fullName: string }>>;
}
```

> `membersById` は optional。`MembersClientShell` のみが注入し、`membersById` を渡さない既存呼び出し側は破壊しない（Step 2 = N/A の根拠）。

### 親（`MembersClientShell.tsx`）での `membersById` 構築

```tsx
// issue-1080: BulkActionBar の部分失敗 summary で fullName 解決に使う map。
// 既存 republishCandidates と同じ useMemo パターン。
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

// ...
<BulkActionBar
  selectedIds={Array.from(selected)}
  membersById={membersById}
  onComplete={onComplete}
/>
```

> `AdminMemberListItem` は `memberId` / `fullName` を持つため追加 fetch は不要。email は PII 表示拡大を避けるため prop に含めない。

### `tagLabelById` 解決ロジック（`BulkActionBar.tsx`）

```tsx
// issue-1080: notFound 行で tagId → label を解決するための map。
// available（AdminTagRef[]）は既存 useEffect で fetchTagMaster().available からロード済み。
const tagLabelById = useMemo(() => {
  const m = new Map<string, string>();
  for (const t of available) m.set(t.tagId, t.label);
  return m;
}, [available]);
```

### fallback resolver（`BulkActionBar.tsx` component スコープ）

表示名解決は行 map 内の inline const ではなく、component スコープの 2 つの純粋な resolver 関数へ抽出してある（skipped / notFound の両 map から再利用するため）。

```tsx
// fullName 主表示、空/無ければ memberId（AC-1 / AC-4）
const resolveMemberLabel = (memberId: string) => {
  const fullName = membersById?.[memberId]?.fullName.trim();
  return fullName || memberId;
};

// label 主表示、空/未解決なら {tagId}（未登録）（AC-2）
const resolveTagLabel = (tagId: string) => tagLabelById.get(tagId)?.trim() || `${tagId}（未登録）`;
```

### result summary の表示差し替え（resolver 適用）

```tsx
// skipped（退会済み）行
{bulkResult.skipped.map((r) => (
  <li key={`skip-${r.memberId}-${r.tagId}`}>
    退会済みのためスキップ: {resolveMemberLabel(r.memberId)}
  </li>
))}

// notFound（未登録タグ）行
{bulkResult.notFound.map((r) => (
  <li key={`nf-${r.memberId}-${r.tagId}`}>
    未登録タグのためスキップ: {resolveTagLabel(r.tagId)}
  </li>
))}
```

> `trim() || fallback` により、未注入だけでなく空白表示名でも「表示名が手元にない場合も memberId 表示で壊れない」（AC-4）を満たす。`{r.memberId}` / `{r.tagId}` は `BulkTagResultItem`（`{memberId,tagId,status}`）由来で API shape を直接消費するため AC-3 を維持する。

### API シグネチャ（既存・不変）

| surface | シグネチャ | 変更 |
| --- | --- | --- |
| endpoint | `POST /api/admin/members/tags/bulk` | 不変 |
| trigger payload | `{ memberIds: string[]; tagIds: string[]; op: "assign" \| "unassign" }` | 不変 |
| result item shape | `BulkTagResultItem = { memberId: string; tagId: string; status: ... }` | 不変（AC-3） |
| tag master | `fetchTagMaster() → { available: AdminTagRef[] }`（`AdminTagRef` は `{ tagId; label; code; category }`） | 不変（read 再利用） |

### エッジケース

| ケース | 仕様 |
| --- | --- |
| `membersById` 未注入（undefined） | `membersById?.[id]?.fullName ?? r.memberId` → memberId 表示（AC-4）。既存呼び出し側は破壊しない |
| `membersById` に該当 memberId なし（ページング外の member 等） | 同上 memberId fallback |
| `fullName` が空文字 / 空白 | `fullName.trim() || r.memberId` で memberId fallback |
| tag master 未ロード / 空（`available = []`） | `tagLabelById.get` が undefined → `{tagId}（未登録）` fallback（AC-2） |
| tag master ロード失敗 | 既存 `.catch(() => setAvailable([]))` で `available=[]` → 上記 fallback |
| skipped / notFound が 0 件 | 既存どおりリスト非表示（条件レンダ維持） |
| 同一 memberId × 複数 tagId の複数行 | `key` は既存 `${r.memberId}-${r.tagId}` のまま一意。表示名解決は行ごとに独立 |

### 不変条件チェック

| 不変条件 | 本タスクでの遵守 |
| --- | --- |
| #1 既存 API のみ | endpoint / payload / result shape 不変。新 endpoint なし |
| #2 OKLch トークン正本 | 既存 `var(--ubm-color-*)` のまま。HEX 直書き / inline style / 新規 token なし。表示テキストのみ変更 |
| #5 D1 直接アクセス禁止 | apps/web は member/tag を props（SSR 由来）と既存 `fetchTagMaster` から取得。D1 binding 不使用 |
| #9 FormField 経由 | result summary は表示のみ。新規 `<input>` を増やさない |
| #10 useAdminMutation | 既存 `@/features/admin/hooks/useAdminMutation` 経由の `bulkMut` を維持。legacy 不使用 |

### テスト構成

| レイヤ | ファイル | 追加 / 更新ケース |
| --- | --- | --- |
| component test（tier 1 主証跡） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | TC-BAB-TAG-06（skipped 行に fullName + notFound 行に label）/ TC-BAB-TAG-07（tag 未解決時 `{tagId}（未登録）` + memberId fallback） |

> 既存 counts 表示（`bulk-tag-result-counts`）と既存 tag bulk TC は回帰させない。

### 検証コマンド（実行済み / close-out で追加実行）

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
```

実行結果:

- focused component test: PASS（`BulkActionBar.spec.tsx` 12 tests）
- typecheck / lint: Phase 12 close-out で実行結果を記録する

### 既知制限

- member 表示は `fullName` のみ（email 補助表示は将来候補・本タスクでは起票しない・`unassigned-task-detection.md` 参照）。
- tag label 解決は `available`（`fetchTagMaster`）に依存。tag master 未ロード時は `{tagId}（未登録）` fallback。
- local Playwright fixture screenshot は保存済み。staging 認証付き visual baseline 取得は optional user-gated（#1077 系基盤を将来流用）。

---

## 視覚証跡

本タスクは VISUAL（`VISUAL_ON_EXECUTION`。部分失敗結果 summary のリスト行が ID 表示から表示名表示へ変わる視覚変化を伴う）。canonical 名は phase-11 spec / `screenshot-plan.json` / 本ガイドで一致させる（identifier drift 防止）。

| # | canonical ファイル名 | 撮影状態 | capture 状態 |
| --- | --- | --- | --- |
| 1 | `bulk-tag-result-member-labels.png` | 部分失敗結果 summary（skipped 行に member `fullName`・notFound 行に tag `label` または `{tagId}（未登録）` が表示された状態） | **present**（local Playwright fixture screenshot, 790x314） |

> local 実装、tier 1 component test、local screenshot は完了。staging 認証付き screenshot は user 承認後に optional reinforcement として取得可能（親 #1036 系 followup-001=#1077 の認証付き staging visual baseline 基盤を流用）。
