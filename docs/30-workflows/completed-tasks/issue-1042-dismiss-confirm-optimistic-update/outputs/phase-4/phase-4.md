**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 4: テスト作成 / TDD RED

Issue #1042「`/admin/identity-conflicts` の dismiss 二段階 confirm 後 optimistic update」の
TDD RED フェーズ。**まだ実装は行わず**、Phase 5 で書く実装が満たすべきテストケースを
先に追加して「失敗する状態（RED）」を作る。

merge 側（`optimisticMerged`）は #1046 で実装済み。本タスクはその **dismiss mirror** であり、
merge で確立した optimistic / rollback パターンを `optimisticDismissed` として対称に再現する。

- 対象 vitest: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集）
- 実装対象（Phase 5 で着手）: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 参照のみ（変更しない）: `apps/web/src/features/admin/hooks/useAdminMutation.ts`

---

## 4.1 RED の前提（Phase 1-3 確定設計の再掲）

| 項目 | 確定内容 |
|------|----------|
| 状態追加 | `IdentityConflictRow.tsx` に component-local state `optimisticDismissed: boolean`（**camelCase**）を `useState` で追加 |
| render 分岐 | 既存 `if (optimisticMerged) return null;` を `if (optimisticMerged || optimisticDismissed) return null;` に統合 → dismiss 実行で row が DOM から消える |
| optimistic 発火 | dismiss 実行 click（`onDismiss`）時に `setOptimisticDismissed(true)` を**即座**に呼ぶ |
| rollback | `trigger(...).catch(() => setOptimisticDismissed(false))` で復元。`dismissError` は hook が surface。`dismissReason` は **clear しない**（保持して再実行可能にする） |
| success | `optimisticDismissed` は true 維持（row は消えたまま）。`router.refresh()`（hook 既存挙動）が server list を後追い整合 |
| merge | **不変**（既存 `optimisticMerged` 挙動・既存 merge テストを一切変えない / AC-4） |
| テスト driven | `optimisticDismissed` は **internal state**。props ではないため UI 操作（「別人として確定」click）経由でのみ駆動する（VSCPKR-03） |

> merge 側との対称性: `optimisticMerged` は reject の `.catch` で `setOptimisticMerged(false)` のみ実行し
> `mergeReason` を clear しない（実コード L71-74）。dismiss 側も同じ方針で `dismissReason` を保持する。

---

## 4.2 命名規則整合チェック（RED を書く前に必ず実施）

Phase 1.3 で `optimisticDismissed`（camelCase）に確定済み。RED ケースを書く前に下記を確認する。

1. 追加する state 名・setter 名が `optimisticDismissed` / `setOptimisticDismissed`（camelCase）であること。
2. テストコード内で internal state 名を文字列・props として直接参照しないこと（UI 操作経由のみ / VSCPKR-03）。
3. snake_case / PascalCase の混入がないこと。既存 `optimisticMerged` と命名対称であること。

---

## 4.3 mock 方針（既存ヘルパ踏襲）

既存 spec は `vi.mock("../../../features/admin/hooks")` で `useAdminMutation` を mock し、
`setMutationState(endpoint, { trigger, isLoading, error })` で挙動を差し込む。
`dismissEndpoint = "/api/admin/identity-conflicts/c_1/dismiss"` は既に定義済み（spec L60）。
**この方針をそのまま使う**（新規 mock 機構を追加しない）。

| 分岐 | mock 設定 |
|------|-----------|
| pending（optimistic 観測） | `const trigger = vi.fn(() => new Promise(() => {})); setMutationState(dismissEndpoint, { trigger });` |
| success | `const trigger = vi.fn().mockResolvedValue({ dismissedAt: "..." }); setMutationState(dismissEndpoint, { trigger });` |
| failure（rollback） | `const trigger = vi.fn().mockRejectedValue(apiError); setMutationState(dismissEndpoint, { trigger, error: apiError });` |

> mock wrapper の挙動（spec L33-42）: mock は `trigger` を `await state.trigger(endpoint, payload)` → `await options.onSuccess()` の順で
> ラップする。success 時は dismiss の `onSuccess`（`setStage("idle")` / `setDismissReason("")`）も走る。
> reject 時は `onSuccess` に到達せず、実装側 `.catch` が `setOptimisticDismissed(false)` を実行する。

> `error` を inline 表示で検証する場合は merge 既存ケース（spec L155-164）と同じく `FetchAuthedError`
> を使う。`errorMessage`（実コード L14-24）が `FetchAuthedError.bodyText` の JSON `message` を取り出す。
> 例: `new FetchAuthedError(409, JSON.stringify({ message: "すでに別人として確定済みです" }))`。

> **`vi.stubGlobal("window", ...)` は使わない**。本タスクの RED ケースは hook mock のみで成立するため
> window 操作は不要（VSCPKR-02）。

---

## 4.4 追加する RED テストケース

`describe("IdentityConflictRow", ...)` 末尾に以下 3 ケースを追加する。
いずれも「別人として確定」ボタン click まで UI を進めてから検証する（internal state を直接触らない）。
dismiss UI 操作の起点は `別人マーク` ボタン → `別人マーク理由` 入力 → `別人として確定` click（spec L213-218）。

### TC-DIS-1: dismiss 実行 click 直後に row が DOM から消える（AC-2）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss 実行直後に server 応答前でも row を optimistic に非表示にする` |
| mock | `trigger` を `vi.fn(() => new Promise(() => {}))`（resolve も reject もしない pending Promise）にする。`setMutationState(dismissEndpoint, { trigger })`。これで server 完了前の中間状態を観測できる |
| 操作 | `別人マーク` click → `別人マーク理由` に `"別組織で確認済"` 入力 → `別人として確定` click |
| 期待値 | click 後（再 render 待ち）に `screen.queryByText("conflict: c_1")` が `null`、`screen.queryByRole("button", { name: "別人マーク" })` が `null`、`screen.queryByRole("button", { name: "別人として確定" })` が `null`（row 全体が `return null`）。`await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())` を用いる |
| 検証趣旨 | optimistic は server round-trip を待たず即座に row を消すこと。pending Promise で「success 前の optimistic 状態」を確実に捕捉する |

### TC-DIS-2: trigger が reject すると row が復元する（rollback + reason 保持 / AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss 失敗 (409) で optimistic 非表示を rollback し、reason / error が残る` |
| mock | `const apiError = new FetchAuthedError(409, JSON.stringify({ message: "すでに別人として確定済みです" })); const trigger = vi.fn().mockRejectedValue(apiError); setMutationState(dismissEndpoint, { trigger, error: apiError });` |
| 操作 | `別人マーク` click → `別人マーク理由` に `"別組織で確認済"` 入力 → `別人として確定` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalled())` の後、`screen.getByText("conflict: c_1")` が再表示され、dismiss modal（`別人として確定` ボタン）が残存し、`(screen.getByLabelText("別人マーク理由") as HTMLTextAreaElement).value` が `"別組織で確認済"`（reason 保持）、`screen.getByRole("alert").textContent` が `"すでに別人として確定済みです"` を含む |
| 検証趣旨 | reject 時に `optimisticDismissed=false` で row 復元、stage は `dismiss` のまま、`dismissReason` を clear せず保持し再操作可能。`dismissError` が inline 表示 |

### TC-DIS-3: success 時に row が消えたまま（AC-2 補完）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss 成功後も row は非表示を維持する` |
| mock | `const trigger = vi.fn().mockResolvedValue({ dismissedAt: "2026-05-16T00:00:00.000Z" }); setMutationState(dismissEndpoint, { trigger });` |
| 操作 | `別人マーク` click → `別人マーク理由` に `"別組織で確認済"` 入力 → `別人として確定` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalledWith(dismissEndpoint, { reason: "別組織で確認済" }))` 後、`screen.queryByText("conflict: c_1")` が `null`、`screen.queryByRole("button", { name: "別人マーク" })` が `null`（success 後も `optimisticDismissed` は true 維持で row は消えたまま） |
| 検証趣旨 | success 経路で `onSuccess`（`setStage("idle")` / `setDismissReason("")`）が走っても `optimisticDismissed` は true のため row は復元しない。merge TC（spec L120-144）と対称 |

> **既存 dismiss テストとの矛盾に関する注記**: 既存ケース
> `"dismiss で /dismiss endpoint に { reason } を送る"`（spec L207-225）は payload 検証のみで row 表示は assert せず、
> optimistic 化後も payload 検証は不変のため壊れない。一方 `"dismiss 失敗 (409) で alert が出て modal は残る"`（spec L227-251）は
> rollback 後の挙動と意味的に重なる。**Phase 4 では既存ケースを修正しない**（RED として TC-DIS-1/2/3 の失敗のみを確認する）。
> 既存 assertion の重複整理は **Phase 6** で行う（本ファイル §4.5 と Phase 6 §6.1 参照）。

---

## 4.5 RED 実行と期待される失敗

### 実行コマンド（targeted run / メモリ制約対策）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> 全 vitest を回さず、対象ファイル 1 本に限定する。

### 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
|--------|----------------------|------------|
| TC-DIS-1 | 実装前 baseline では row は消えず `conflict: c_1` が残る | RED 確認済み。実装後は Phase 11 focused Vitest で PASS |
| TC-DIS-2 | 実装前 baseline では rollback 検証が成立しない／reason 保持の意味が確立しない | RED 確認済み。実装後は Phase 11 focused Vitest で PASS |
| TC-DIS-3 | success 後に `setStage("idle")` で dismiss modal は閉じるが row（`conflict: c_1`）は残る | FAIL（期待通り） |
| 既存 merge ケース全件 | 不変で PASS のまま（AC-4） | 変更しない |
| 既存 dismiss ケース | PASS のまま（payload 検証・alert 検証は optimistic と独立） | Phase 6 で重複整理 |

RED が想定どおり FAIL することを確認したら Phase 5 へ進む。
