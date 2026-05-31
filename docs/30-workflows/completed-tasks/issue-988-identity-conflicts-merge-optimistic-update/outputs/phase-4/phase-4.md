# Phase 4: テスト作成 / TDD RED

Issue #988「`/admin/identity-conflicts` の merge 二段階 confirm 後 optimistic update」の
TDD RED フェーズ。**まだ実装は行わず**、Phase 5 で書く実装が満たすべきテストケースを
先に追加して「失敗する状態（RED）」を作る。

- 対象 vitest: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集）
- 実装対象（Phase 5 で着手）: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 参照のみ（変更しない）: `apps/web/src/features/admin/hooks/useAdminMutation.ts`

---

## 4.1 RED の前提（Phase 1-3 確定設計の再掲）

| 項目 | 確定内容 |
|------|----------|
| 状態追加 | `IdentityConflictRow.tsx` に component-local state `optimisticMerged: boolean`（**camelCase**）を `useState` で追加 |
| render 分岐 | component ルートで `if (optimisticMerged) { return null; }` → row が DOM から消える |
| optimistic 発火 | merge 実行 click 時に `setOptimisticMerged(true)` を**即座**に呼ぶ |
| rollback | `trigger(...).catch(() => setOptimisticMerged(false))` で復元。`mergeError` は hook が surface |
| success | `optimisticMerged` は true 維持（row は消えたまま）。`router.refresh()` が server list を後追い整合 |
| dismiss | **不変**（既存挙動を一切変えない） |
| テスト driven | `optimisticMerged` は **internal state**。props ではないため UI 操作（「merge 実行」click）経由でのみ駆動する（VSCPKR-03） |

---

## 4.2 命名規則整合チェック（RED を書く前に必ず実施）

Phase 1.3 で `optimisticMerged`（camelCase）に確定済み。RED ケースを書く前に下記を確認する。

1. 追加する state 名・setter 名が `optimisticMerged` / `setOptimisticMerged`（camelCase）であること。
2. テストコード内で internal state 名を文字列・props として直接参照しないこと（UI 操作経由のみ）。
3. snake_case / PascalCase の混入がないこと。

---

## 4.3 mock 方針（既存ヘルパ踏襲）

既存 spec は `vi.mock("../../../features/admin/hooks")` で `useAdminMutation` を mock し、
`setMutationState(endpoint, { trigger, isLoading, error })` で挙動を差し込む。
**この方針をそのまま使う**（新規 mock 機構を追加しない）。

| 分岐 | mock 設定 |
|------|-----------|
| success | `const trigger = vi.fn().mockResolvedValue({...}); setMutationState(mergeEndpoint, { trigger });` |
| failure（rollback） | `const trigger = vi.fn().mockRejectedValue(new Error("...")); setMutationState(mergeEndpoint, { trigger, error: new Error("...") });` |

> 注意（mock wrapper の挙動）: 既存 mock は `trigger` を `await state.trigger(...)` → `await options.onSuccess()` の順で
> ラップしている。success 時は `onSuccess`（`setStage("idle")` / `setMergeReason("")`）も走る。
> reject 時は `onSuccess` に到達せず、実装側 `.catch` が `setOptimisticMerged(false)` を実行する。

> **`vi.stubGlobal("window", ...)` は使わない**。`window` 依存の差し替えが必要な場合は
> `Object.defineProperty(window, ...)` 方針（VSCPKR-02）に従う。本タスクの RED ケースは
> hook mock のみで成立するため window 操作は不要。

---

## 4.4 追加する RED テストケース

`describe("IdentityConflictRow", ...)` 末尾に以下 3 ケースを追加する。
いずれも「merge 実行」ボタン click まで UI を進めてから検証する（internal state を直接触らない）。

### TC-OPT-1: merge 実行 click 直後に row が DOM から消える（AC-1）

| 項目 | 内容 |
|------|------|
| テスト名 | `merge 実行 click 直後に optimistic で row が消える (conflict メタ / merge ボタンが不在)` |
| mock | `trigger` を `vi.fn()` で「resolve も reject もしない pending Promise」にする（`() => new Promise(() => {})`）。これで server 完了前の中間状態を観測できる |
| 操作 | `merge` click → `次へ` click → `merge 理由` に `"本人確認済"` 入力 → `merge 実行` click |
| 期待値 | click 直後（同期的）に `screen.queryByText("conflict: c_1")` が `null`、`screen.queryByRole("button", { name: "merge" })` が `null`、`screen.queryByText(/確認 2\/2/)` が `null`（row 全体が `return null`） |
| 検証趣旨 | optimistic は server round-trip を待たず即座に row を消すこと |

> ポイント: pending Promise を使うことで「success 前の optimistic 状態」を確実に捕捉する。
> `setOptimisticMerged(true)` は同期的に呼ばれるため `waitFor` 不要だが、React の再 render を
> 待つ必要がある場合は `await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())` を用いる。

### TC-OPT-2: trigger が reject すると row が復元する（rollback / AC-2）

| 項目 | 内容 |
|------|------|
| テスト名 | `merge trigger が reject すると row が復元し inline error を表示する (rollback)` |
| mock | `trigger = vi.fn().mockRejectedValue(new Error("すでに統合済みです"))` + `setMutationState(mergeEndpoint, { trigger, error: new Error("すでに統合済みです") })` |
| 操作 | `merge` click → `次へ` click → `merge 理由` 入力 → `merge 実行` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalled())` の後、`screen.getByText("conflict: c_1")` が再表示され、`screen.getByText(/確認 2\/2/)`（stage は `merge-final` 維持）と `screen.getByRole("alert").textContent` が `"すでに統合済みです"` を含む |
| 検証趣旨 | reject 時に `optimisticMerged=false` で row 復元、stage は `merge-final` のまま、`mergeError` が inline 表示され再操作可能 |

### TC-OPT-3: success 時に row が消えたまま（AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `merge success 時は row が消えたまま (merge ボタンが再表示されない)` |
| mock | `trigger = vi.fn().mockResolvedValue({ mergedAt: "...", targetMemberId: "m_dst", archivedSourceMemberId: "m_src", auditId: "a_1" })` + `setMutationState(mergeEndpoint, { trigger })` |
| 操作 | `merge` click → `次へ` click → `merge 理由` 入力 → `merge 実行` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalled())` 後、`screen.queryByText("conflict: c_1")` が `null`、`screen.queryByRole("button", { name: "merge" })` が `null`（success 後も `optimisticMerged` は true 維持で row は消えたまま） |
| 検証趣旨 | success 経路で `onSuccess`（`setStage("idle")`）が走っても `optimisticMerged` は true のため row は復元しない |

> **既存テストとの矛盾に関する注記**: 既存ケース
> `"merge 実行で trigger に { targetMemberId, reason } を送る (happy)"` は
> success 後に `merge` ボタンが再表示されることを assert している（spec L122-124）。
> optimistic 化でこれは壊れるが、**Phase 4 では既存ケースを修正しない**（RED として失敗を確認する）。
> 既存 assertion の更新は **Phase 6** で正式に行う（本ファイル §4.5 と Phase 6 §6.1 参照）。

---

## 4.5 RED 実行と期待される失敗

### 実行コマンド（targeted run / メモリ制約対策 FB-UI-02-2）

```bash
pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> 全 vitest を回さず、対象ファイル 1 本に限定する。

### 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
|--------|----------------------|------------|
| TC-OPT-1 | `optimisticMerged` 未実装 → row は消えず `conflict: c_1` が残る | FAIL（期待通り） |
| TC-OPT-2 | rollback ロジック未実装 → 復元検証が成立しない | FAIL（期待通り） |
| TC-OPT-3 | success 後に `setStage("idle")` で `merge` ボタンが再表示される | FAIL（期待通り） |
| 既存 happy ケース | 現状は PASS のまま（Phase 5 で row 消失化すると FAIL に転じる） | Phase 6 で更新予定 |

RED が想定どおり FAIL することを確認したら Phase 5 へ進む。
