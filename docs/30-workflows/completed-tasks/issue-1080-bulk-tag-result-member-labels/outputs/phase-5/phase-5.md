# Phase 5: 実装 — task-A-bulk-tag-result-member-tag-labels

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1080-bulk-tag-result-member-labels` |
| task_id | `task-A-bulk-tag-result-member-tag-labels` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| scope | `apps/web` のみ（`apps/api` 非接触） |
| status | `completed` |

## 目的

`/admin/members` の `BulkActionBar` tag 一括付与/解除 result summary で、部分失敗行の `memberId` / `tagId` 生表示を member `fullName` / tag `label` へ置き換える。API response shape は変えず、UI 側の lookup のみで AC-1〜5 を満たす。

---

## 実行タスク

### 5.1 変更ファイル一覧（RT-03）

| 種別 | パス | 役割 |
|------|------|------|
| 修正 | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | `membersById` prop 追加・`tagLabelById` 派生・skipped/notFound 行を表示名解決 |
| 修正 | `apps/web/src/features/admin/components/_members/MembersClientShell.tsx` | `membersById` を `initial.members` から構築して `BulkActionBar` へ注入 |
| 修正 | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | Phase 4 の TC-BAB-TAG-06..09 追加（テスト仕様は Phase 4/6） |

**新規作成: 0 ファイル。** apps/api 差分: 0。型定義（`AdminTagRef` / `BulkTagResultItem` / `AdminMemberListItem`）の変更: なし（既存を参照のみ）。

---

## 5.2 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `membersById?: Readonly<Record<string, { fullName: string }>>`（親から注入・optional）、`available: AdminTagRef[]`（既存・`fetchTagMaster` 由来）、`bulkResult.skipped/notFound`（既存・`BulkTagResultItem[]`） |
| 出力 | 部分失敗 summary の li テキスト（fullName / tag label に解決済み） |
| 副作用 | **なし**。表示名・label の解決は純粋な lookup（Record / Map 参照）。fetch / mutation / cookie / window 参照を新たに追加しない |

---

## 5.3 `BulkActionBar.tsx` Before/After 差分方針

### (1) props interface 拡張（完全形）

```ts
export interface BulkActionBarProps {
  readonly selectedIds: ReadonlyArray<string>;
  readonly onComplete: () => void;
  readonly membersById?: Readonly<Record<string, { readonly fullName: string }>>;
}
```

- `membersById` は **optional**。未指定時は従来どおり memberId をそのまま表示する（後方互換・TC-BAB-TAG-03 維持）。
- email は PII 表示拡大を避けるため shape に含めない。本タスクの表示は **fullName 主** とする。

### (2) 関数シグネチャ

```ts
// Before
export function BulkActionBar({ selectedIds, onComplete }: BulkActionBarProps) {
// After
export function BulkActionBar({ selectedIds, onComplete, membersById }: BulkActionBarProps) {
```

### (3) `tagLabelById` を `available` から派生（internal derived・useMemo）

`available` state（`AdminTagRef[]`）から `tagId -> label` の lookup を構築する。`groupedTags` の `useMemo` の近傍に追加する。

```ts
// issue-1080: tagId -> label 解決テーブル（available から派生・再計算回避のため useMemo）
const tagLabelById = useMemo(() => {
  const m = new Map<string, string>();
  for (const t of available) {
    m.set(t.tagId, t.label);
  }
  return m;
}, [available]);
```

### (4) skipped 行（`bulk-tag-result-skipped` の li）

```tsx
// Before
<li key={`skip-${r.memberId}-${r.tagId}`}>
  退会済みのためスキップ: {r.memberId}
</li>

// After
{bulkResult.skipped.map((r) => {
  const name = membersById?.[r.memberId]?.fullName ?? r.memberId;
  return (
    <li key={`skip-${r.memberId}-${r.tagId}`}>
      退会済みのためスキップ: {name}
    </li>
  );
})}
```

- li key は既存 `skip-${memberId}-${tagId}` を維持。
- `membersById` 未指定 or memberId 不在のとき `?? r.memberId` で fallback（AC-4）。

### (5) notFound 行（`bulk-tag-result-not-found` の li）

```tsx
// Before
<li key={`nf-${r.memberId}-${r.tagId}`}>
  未登録タグのためスキップ: {r.tagId}
</li>

// After
{bulkResult.notFound.map((r) => {
  const label = tagLabelById.get(r.tagId);
  return (
    <li key={`nf-${r.memberId}-${r.tagId}`}>
      未登録タグのためスキップ: {label ?? `${r.tagId}（未登録）`}
    </li>
  );
})}
```

- li key は既存 `nf-${memberId}-${tagId}` を維持。
- label 解決時は label のみ表示（AC-2）。未解決時は `{tagId}（未登録）`（AC-2 fallback / TC-BAB-TAG-07）。

`data-testid` は `bulk-tag-result` / `bulk-tag-result-counts` / `bulk-tag-result-skipped` / `bulk-tag-result-not-found` をいずれも **不変** とする。

---

## 5.4 `MembersClientShell.tsx` Before/After 差分方針

### (1) `membersById` 構築（useMemo）

`republishCandidates` の `useMemo` 近傍に追加する。`initial.members`（`AdminMemberListItem[]`）から `memberId -> {fullName}` の Record を作る。

```ts
// issue-1080: BulkActionBar の部分失敗 summary 表示名解決用 lookup
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

- `memberId` は shared の branded 型だが、`Object.fromEntries` のキーとして `string` 互換で扱える。email は供給しない。

### (2) `BulkActionBar` 呼び出し

```tsx
// Before
<BulkActionBar selectedIds={Array.from(selected)} onComplete={onComplete} />
// After
<BulkActionBar
  selectedIds={Array.from(selected)}
  membersById={membersById}
  onComplete={onComplete}
/>
```

---

## 5.5 エラー / エッジケース全列挙

| ケース | 期待挙動 | 担保 |
|--------|----------|------|
| `membersById` が undefined（prop 省略） | skipped 行は memberId をそのまま表示（従来挙動） | `membersById?.[id]?.fullName ?? r.memberId` / TC-BAB-TAG-03 |
| `membersById` が空 Record `{}` | 全 memberId が fallback 表示 | 同上 optional chaining + `??` |
| skipped の memberId が `membersById` に不在 | その行のみ memberId fallback | `?? r.memberId` / TC-BAB-TAG-07 |
| `membersById[id].fullName` が空文字 | 空文字をそのまま表示（`??` は null/undefined のみ捕捉）。fullName は member 登録必須項目のため空は実運用で発生しない想定。仕様上は空文字を許容（fallback しない） | `?? ` は nullish のみ |
| `tagLabelById` に tagId が不在（`available` に無い / fetch 失敗で `available=[]`） | `{tagId}（未登録）` 表示 | `tagLabelById.get(tagId) ?? `${tagId}（未登録）`` / TC-BAB-TAG-07 |
| `available` 取得前（初回ロード中）に notFound 行を描画 | `tagLabelById` 空 → 全 notFound が `{tagId}（未登録）`。ただし bulkResult は実行後にしか出ないため、available ロード完了後に表示されるのが通常 | useMemo deps `[available]` |
| `bulkResult` が null | summary ブロック自体を描画しない（既存 `bulkResult &&` ガード維持） | 既存ガード不変 |

---

## 参照資料

| 種別 | パス |
| --- | --- |
| 実装 | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| 親 container | `apps/web/src/features/admin/components/_members/MembersClientShell.tsx` |
| focused test | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md` |

## 成果物 / 実行手順

| 成果物 | 状態 |
| --- | --- |
| `BulkActionBar.tsx` | `membersById?`, `tagLabelById`, `resolveMemberLabel`, `resolveTagLabel` 実装済み |
| `MembersClientShell.tsx` | `initial.members` 由来の `membersById` 注入済み |
| `BulkActionBar.spec.tsx` | TC-BAB-TAG-06/07 追加済み |

実行コマンド:

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

## 完了条件

以下を全て満たすこと:

- [x] focused component test green（`BulkActionBar.spec.tsx` 12 tests）
- [x] `apps/api` 配下の差分 0
- [x] 既存 `data-testid`（`bulk-tag-result` / `-counts` / `-skipped` / `-not-found`）維持
- [x] 既存 li key（`skip-${memberId}-${tagId}` / `nf-${memberId}-${tagId}`）維持
- [x] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 追加なし
- [x] D1 直接アクセス追加なし / 新規 fetch・mutation 追加なし（純粋表示解決）
- [x] `membersById` は optional のまま（後方互換破壊なし）
- [ ] typecheck / lint は Phase 12 close-out で実行結果を記録

## 統合テスト連携

- tier 1 主証跡は `BulkActionBar.spec.tsx` の focused component test。
- staging authenticated screenshot は `outputs/phase-11/screenshots/bulk-tag-result-member-labels.png` に取得予定だが user-gated。local PASS と runtime visual pending を混同しない。
