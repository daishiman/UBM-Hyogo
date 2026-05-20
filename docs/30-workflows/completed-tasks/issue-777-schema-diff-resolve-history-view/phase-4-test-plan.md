# Phase 4: テスト計画

## 0. 前提と方針

| 項目 | 内容 |
|---|---|
| Issue | #777 SchemaDiffPanel 過去 resolve 履歴閲覧 UI |
| 採用案 | 案 A（既存 `/admin/audit?action=schema_diff.alias_assigned` 再利用） / 案 α（独立 route `/(admin)/admin/schema/history`） |
| フレームワーク | Vitest + `@testing-library/react`（`apps/web` の既存 setup） |
| fetch モック | `globalThis.fetch = vi.fn()` 差し替え方式（既存 `apps/web/src/lib/admin/__tests__/api.spec.ts` の慣習を踏襲。MSW は採用しない） |
| 命名 | 新規 spec は `*.spec.tsx` のみ（不変条件 #8 / lefthook `block-test-suffix` 強制） |
| 観点 | (i) filter 入力 / (ii) pagination 操作 / (iii) 空状態 / (iv) fetch error 時の fail-soft feedback |

> 既存 audit endpoint の payload 構造（`maskedBefore` / `maskedAfter` 内に schema resolve 固有 column が含まれるか）は Phase 5 §0 の grep 手順で確認する。本 Phase の TC は「案 A で必要 5 カラムが取得できる」前提で記述し、grep 結果が不適合だった場合は Phase 5 §0 で案 B 昇格判断を行う。

---

## 1. テスト対象ファイル

| # | 対象 | spec | 役割 |
|---|---|---|---|
| 1 | `apps/web/src/lib/admin/api.ts::fetchSchemaAliasHistory()` | `apps/web/src/lib/admin/__tests__/api.spec.ts`（既存ファイル拡張） | helper unit spec |
| 2 | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx`（新規） | component spec |
| 3 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | （component / helper spec で間接カバー、専用 spec は作成しない） | server wrapper（search params 委譲） |

---

## 2. 受入条件 (AC) とテストケース (TC) の対応

| AC | 内容 | TC ID | spec |
|---|---|---|---|
| AC-1 | `/admin/schema/history` へ到達でき、時系列降順で履歴表示 | TC-C-01 | component |
| AC-2 | 5 カラム表示（操作日時 / 操作者 email / before stableKey / after stableKey / question text） | TC-C-02 | component |
| AC-3 | filter (actorEmail / from / to / questionTextLike) が動作し cursor pagination と組合せ可 | TC-C-03, TC-C-04, TC-H-04 | component + helper |
| AC-4 | cursor pagination が既存 audit cursor と整合、「次の 50 件」ボタンで連続閲覧 | TC-C-05, TC-H-03 | component + helper |
| AC-5 | 0 件時 `EmptyState` で「該当する履歴がありません」 | TC-C-06 | component |
| AC-6 | shared primitive (Pagination / FormField / Breadcrumb / EmptyState) 再利用、新規 primitive なし | TC-C-07 | component |
| AC-7 | OKLch token のみ、HEX 直書きなし | grep gate（Phase 5 §5） | （spec 外） |
| AC-8 | 新 test は `*.spec.tsx` のみ | ファイル名で担保 | （spec 外） |
| AC-9 | 4 観点網羅（filter / pagination / empty / fetch error） | TC-C-03, TC-C-05, TC-C-06, TC-C-08 | component |
| AC-10 | §2.5 / §2.6 判断点を実装着手時に確定 | Phase 5 §0 grep 手順で記録 | （spec 外） |
| AC-11 | 案 B 採用時の spec 追記（案 A 採用なら不要） | 採用案により判定 | （spec 外） |
| AC-12 | unassigned-task-detection §3 を consumed に更新 | Phase 9 で実施 | （spec 外） |

---

## 3. component spec テストケース

### 観点 (i) filter 入力

| TC ID | 観点 | 操作 | 期待値 |
|---|---|---|---|
| TC-C-03a | actorEmail 入力 → URL search params に反映 | `screen.getByLabelText("操作者 email")` に入力、submit | `useRouter().replace` または同等の navigate が `?actorEmail=foo@example.com` を含む URL で呼ばれる |
| TC-C-03b | from / to の date range 入力 | `screen.getByLabelText("期間（開始）")` / `getByLabelText("期間（終了）")` に YYYY-MM-DD を入力、submit | helper が `from` / `to` を含む query で呼ばれる |
| TC-C-03c | questionTextLike 部分一致 | `screen.getByLabelText("question 部分一致")` に入力、submit | helper は `questionTextLike` query を送らず現 page 内で filter する |
| TC-C-03d | actorEmail 小文字正規化 | `Foo@Example.COM` を入力 | API helper には `foo@example.com` で渡る（`actorEmail.toLowerCase()` を UI 側でも適用） |

### 観点 (ii) pagination 操作

| TC ID | 観点 | 操作 | 期待値 |
|---|---|---|---|
| TC-C-04 | 初期表示 50 件 / nextCursor あり | mock helper が `{ items: 50件, nextCursor: "abc" }` を返す | `getByRole("button", { name: /次の 50 件|次のページ/ })` が enabled |
| TC-C-05a | 次ページ遷移 | 「次の 50 件」クリック | helper が `cursor: "abc"` 付きで再 fetch され、items が次ページに置換される（prev stack は内部 state に保持） |
| TC-C-05b | nextCursor null | mock が `nextCursor: null` を返す | 「次の 50 件」ボタンが disabled または非表示 |

### 観点 (iii) 空状態

| TC ID | 観点 | 操作 | 期待値 |
|---|---|---|---|
| TC-C-06 | items 空配列 | mock が `{ items: [], nextCursor: null }` を返す | `EmptyState` 由来の「該当する履歴がありません」が表示され、pagination ボタンは存在しない |

### 観点 (iv) fetch error 時の fail-soft feedback

| TC ID | 観点 | 操作 | 期待値 |
|---|---|---|---|
| TC-C-08a | 初回 fetch が reject | client component mount 時の helper mock を reject | `role="alert"` に「履歴の取得に失敗しました」を表示し、retry 可能な空状態を維持 |
| TC-C-08b | client 側 fetch（pagination 遷移時の追加 fetch）が reject | mock helper が次ページ取得で reject | `role="alert"` を持つ feedback 領域に「履歴の取得に失敗しました」が表示される（UI を fail-soft とし、既存 items を保持） |

### 観点 表示・構造

| TC ID | 観点 | 期待値 |
|---|---|---|
| TC-C-01 | 時系列降順表示 | mock items の `createdAt` 降順で row が描画される（先頭 row が最新） |
| TC-C-02 | 5 カラム表示 | 各 row に `操作日時` / `操作者 email` / `before stableKey` / `after stableKey` / `question text` の 5 セルが存在 |
| TC-C-07 | shared primitive 再利用 | import 文に `Pagination` / `FormField` / `Breadcrumb` / `EmptyState` が存在する（vitest では import を介して描画されることで確認） |

### 観点 アクセシビリティ

| TC ID | 観点 | 期待値 |
|---|---|---|
| TC-C-09a | Breadcrumb landmark | `screen.getByRole("navigation", { name: /breadcrumb|パンくず/i })` が存在し、`admin > schema > history` の階層を含む |
| TC-C-09b | テーブル aria-label | `screen.getByRole("table", { name: /resolve 履歴|schema alias 履歴/ })` が取得可能 |
| TC-C-09c | filter form aria-label | `screen.getByRole("search")` または `getByRole("form", { name: /フィルタ/ })` が存在 |
| TC-C-09d | fetch 中 aria-busy | 次ページ fetch 中、テーブルの container 要素が `aria-busy="true"` を持つ |

---

## 4. helper unit spec (api.spec.ts への追加)

### 追加 describe ブロック: `fetchSchemaAliasHistory()`

| TC ID | 観点 | 期待値 |
|---|---|---|
| TC-H-01 | export 存在 | `expect(typeof adminApi.fetchSchemaAliasHistory).toBe("function")` |
| TC-H-02 | 既定 query | 引数なし呼び出しで `/api/admin/audit?action=schema_diff.alias_assigned&limit=50` が GET される |
| TC-H-03 | cursor を URL query に乗せる | `fetchSchemaAliasHistory({ cursor: "abc" })` で `&cursor=abc` が含まれる |
| TC-H-04 | filter を URL query に乗せる | `actorEmail` / `from` / `to` が含まれ、`questionTextLike` は含まれない |
| TC-H-04b | actorEmail 小文字化 | `Foo@Example.COM` 入力で query は `foo%40example.com` |
| TC-H-05 | 200 OK の zod parse 成功 | mock `{ ok: true, items: [...], nextCursor: "..." }` で `SchemaAliasHistoryItem` 配列を返す |
| TC-H-06 | parse 失敗時 throw | mock body が schema 不整合（必須 column 欠落）で zod parse error を throw |
| TC-H-07 | HTTP 4xx/5xx で throw | mock が 500 を返す場合に `Error` を throw |
| TC-H-08 | encodeURIComponent 適用 | `questionTextLike: "a&b"` は URL に含めず client-side filter にのみ使う |
| TC-H-09 | 既存 export 一覧の不変性 | `fetchSchemaAliasHistory` 追加後も #11 / #13 不変条件テストが pass |

---

## 5. 既存 audit payload 構造確認テスト（grep + spec）

| ID | 種別 | 内容 |
|---|---|---|
| GREP-1 | grep | `grep -nE "schema_diff.alias_assigned\|schema_alias\|action.*alias" apps/api/src/routes/admin/` で resolve イベントの action 識別子を抽出 |
| GREP-2 | grep | `grep -rnE "beforeStableKey\|afterStableKey\|questionText" apps/api/src/` で payload 内 column の存在を確認 |
| GREP-3 | grep | `grep -nE "maskedBefore\|maskedAfter" apps/api/src/routes/admin/audit.ts` で `parseAndMask` 経由の formatting を確認 |
| SPEC-1 | spec | `apps/api/src/routes/admin/__tests__/audit.spec.ts`（存在すれば）に schema_diff.alias_assigned の payload assertion があるかを `grep schema_alias` で確認。なければ Phase 5 §0 で grep 結果を記録するのみ |

> grep 結果が「payload に必要 column 不在」を示した場合のみ、Phase 5 で案 B（新 endpoint）へ昇格。原則案 A 維持。

---

## 6. テスト実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  src/lib/admin/__tests__/api.spec.ts
```

`pnpm --filter @ubm-hyogo/web test` の全体実行で既存 admin 系 spec が壊れていないことを Phase 7 で確認する。

---

## 7. 既存テストへの影響

| 対象 | 影響 | 対応 |
|---|---|---|
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | `fetchSchemaAliasHistory` 追加で export 一覧が増える | 既存 #11 / #13 不変条件テスト（`/profile/` / tag pattern）に影響なし。`/audit\|history/i` pattern の新規 allowlist 確認テストを TC-H-09 として追加 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` の spec | 触らない | 隣接 component は仕様変更なし |
| `apps/web/app/(admin)/admin/schema/page.tsx` | 既存 page、Breadcrumb から history へのリンク 1 行追加のみ | 既存 page spec があれば「history へのリンク存在」assertion を追加。なければ追加 spec は作らない |
