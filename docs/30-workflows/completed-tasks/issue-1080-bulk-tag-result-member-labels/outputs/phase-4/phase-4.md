# Phase 4: テスト作成（TDD Red）

タスク: `/admin/members` の `BulkActionBar` tag 一括付与/解除「部分失敗結果 summary」を生 ID 表示から表示名表示へ改善する。
対象: `apps/web` のみ。`apps/api` 非接触。VISUAL_ON_EXECUTION。implementation_mode=new。

本 Phase は「失敗するテストを先に書く（Red）」段階の **仕様** を定義する。実コードの編集・テスト実行はここでは行わず、実装サイクル（後続）で本仕様どおりにテストを追加し、Red を確認してから Phase 5 の実装に進む。

---

## 4.1 対象テストファイル

| 種別 | パス |
|------|------|
| 修正（テスト追加） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |

既存テスト（保持・非破壊）: `TC-BAB-01..05`, `TC-BAB-TAG-01..05`, `a11y violations 0`。
特に `TC-BAB-TAG-03`（現状 L119-135）は **後方互換 regression guard** として無変更で green を維持する（`membersById` prop 未指定でも testid 存在のみを検証している）。

---

## 4.2 テスト操作対象の分類（VSCPKR-03）

| 観測対象 | 種別 | テストでの扱い |
|----------|------|----------------|
| `membersById` | **external prop** | テストから `render(<BulkActionBar ... membersById={...} />)` で注入する |
| `tagLabelById` | **internal derived state** | テストから直接渡さない。`available`（`fetchTagMaster` mock 経由）から component 内で `useMemo` 構築される結果を、表示文字列で間接検証する |
| `available` | internal state（`fetchTagMaster` の結果） | 既存の `fetch` stub mock（`{ available: AVAILABLE }`）経由でのみ供給する |
| `bulkResult` | internal state（`bulkMut.trigger` の結果を `summarize`） | 既存の `bulkTrigger` mock の戻り値で供給する |

ポイント: `tagLabelById` は internal な派生値なので、テストは「`available` に label を持つ tag を与える → その tag を `tag_not_found` 結果で返す → 画面に label 文字列が出る」という end-to-end の経路で検証する。internal state を直接 set/spy しない。

---

## 4.3 mock 方針（既存パターン踏襲）

- `fetchTagMaster` は既存どおり `vi.stubGlobal("fetch", ...)` で `{ available: AVAILABLE }` を返す stub を使う（`beforeEach` に既存実装あり）。
- `useAdminMutation` は既存どおり `vi.mock("../../hooks/useAdminMutation", ...)` の `bulkTrigger` mock を使い、`trigger` の戻り値で `results[]` を供給する（endpoint 判別 mock は本 component が単一 endpoint のため不要だが、既存の mock 形を踏襲する）。
- **`vi.stubGlobal("window", ...)` は禁止**（本タスクは window 直参照を持ち込まない。表示名解決は純粋な props/派生値で行う）。
- `next/navigation` / `@/lib/admin/api` / 相対 `../../../../lib/admin/api` の既存 mock はそのまま使う。

テスト用 `membersById` fixture（新規・テストファイル内に定数として置く）:

```ts
const MEMBERS_BY_ID = {
  a: { fullName: "山田 太郎" },
  m_del: { fullName: "退会 花子" },
} as const;
```

`available`（既存 `AVAILABLE` を流用）:

```ts
const AVAILABLE: AdminTagRef[] = [
  { tagId: "tag_eng", code: "engineer", label: "エンジニア", category: "occupation" },
  { tagId: "tag_mgr", code: "manager",  label: "経営者",     category: "occupation" },
];
```

---

## 4.4 追加/変更テストケース表

| ID | 目的 | 入力（mock results + membersById + available） | 期待表示文字列 | AC |
|----|------|-----------------------------------------------|----------------|----|
| TC-BAB-TAG-06 | `membersById` を渡すと skipped 行に fullName を表示 | `results=[{memberId:"m_del",tagId:"tag_eng",status:"skipped_deleted"}]`<br>`membersById=MEMBERS_BY_ID`<br>`available=AVAILABLE` | `bulk-tag-result-skipped` の li に `退会済みのためスキップ: 退会 花子`（生 ID `m_del` を含まない） | AC-1 |
| TC-BAB-TAG-06 | `membersById` と `available` による表示名解決 | `results=[{memberId:"m_del",tagId:"tag_eng",status:"skipped_deleted"},{memberId:"a",tagId:"tag_mgr",status:"tag_not_found"}]`<br>`membersById={m_del:{fullName:"退会済み 太郎"}}`<br>`available=AVAILABLE` | skipped li に `退会済み 太郎`、not-found li に `経営者` | AC-1 / AC-2 |
| TC-BAB-TAG-07 | member / tag が未解決の場合 fallback 表示 | `results=[{memberId:"unknown_x",tagId:"tag_eng",status:"skipped_deleted"},{memberId:"a",tagId:"tag_ghost",status:"tag_not_found"}]`<br>`membersById` 未注入<br>`available=AVAILABLE`（`tag_ghost` は含まれない） | skipped li に `unknown_x`、not-found li に `tag_ghost（未登録）` | AC-2 fallback / AC-4 |
| TC-BAB-TAG-03（既存・回帰） | `membersById` prop 省略でも従来どおり testid 存在で集計表示 | 既存どおり（`membersById` 渡さない） | `bulk-tag-result` / `-skipped` / `-not-found` の各 testid が存在する（文字列内容は assert しない＝後方互換） | AC-3 / 後方互換 |

注:
- TC-BAB-TAG-06/07 は、いずれも tag pill（「エンジニア」）をクリック → 実行ボタン → `waitFor` で `bulk-tag-result` 出現を待つ既存操作フローを踏襲する。pill クリックは `runBulkTags` の発火に必要（`selectedTagIds.size > 0` 条件）。
- 実装では TC-BAB-TAG-06 に member label / tag label、TC-BAB-TAG-07 に member fallback / tag fallback をまとめ、重複を避けた。

---

## 4.5 テストケース疑似コード（実装済み）

```tsx
// 実コードは BulkActionBar.spec.tsx の TC-BAB-TAG-06/07 を参照。
// TC-BAB-TAG-06: member fullName と tag label の解決表示を同一 result で検証。
// TC-BAB-TAG-07: memberId fallback と tagId（未登録）fallback を同一 result で検証。
```

---

## 4.6 RED 期待（現状コードでの失敗）

現状 `BulkActionBar.tsx`（L266-279）は以下のように **生 ID を直接描画** している:

- skipped: `退会済みのためスキップ: {r.memberId}`
- notFound: `未登録タグのためスキップ: {r.tagId}`

そのため:

- TC-BAB-TAG-06 は `退会 花子` が無く `m_del` が出るため **fail**。
- TC-BAB-TAG-07 は `エンジニア` が無く `tag_eng` が出るため **fail**。
- TC-BAB-TAG-07 は memberId fallback と tag fallback を同一 partial failure result で検証する。
- TC-BAB-TAG-03（既存）は `membersById` 未指定・testid のみ検証なので **green を維持**（後方互換）。

この Red 状態を実装サイクルで確認した上で Phase 5 の実装に進む。
