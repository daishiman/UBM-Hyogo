# Phase 4: テスト作成 / TDD RED

## メタ情報

| 項目 | 内容 |
|------|------|
| Issue | #1042（FU-AIDC-006） |
| 主題 | `/admin/identity-conflicts` の **dismiss confirm 後 optimistic update** |
| Phase | 4 / 13（TDD RED） |
| 対象 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集） |
| 実装対象（Phase 5 で着手） | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 参照のみ（変更しない） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| 前提 | merge 側 `optimisticMerged` は **既に実装済**（本 Issue 対象外・回帰しないこと）。dismiss 側 `optimisticDismissed` のみ未実装 |

## 目的

Issue #1042「dismiss confirm 後の optimistic update」の TDD RED フェーズ。**まだ実装は行わず**、
Phase 5 で書く実装（`optimisticDismissed` state 追加 / `onDismiss` 差し替え / render guard 統合）が
満たすべきテストケースを先に追加し「失敗する状態（RED）」を作る。merge 側 optimistic は既存実装を
一切変更しないため、merge 既存テスト（spec L99-205）は触らない。

---

## 4.1 RED の前提（Phase 1-3 確定設計の再掲）

| 項目 | 確定内容 |
|------|----------|
| 状態追加 | `IdentityConflictRow.tsx` に component-local state `optimisticDismissed: boolean`（**camelCase**・初期値 `false`・merge state とは**分離**） |
| true 契機 | `onDismiss` 関数**先頭**で `setOptimisticDismissed(true)` を**即座**に呼ぶ |
| false 契機 | `dismissMutation.trigger({ reason: dismissReason.trim() }).catch(() => setOptimisticDismissed(false))`（**rollback のみ**） |
| render guard 統合 | 既存 `if (optimisticMerged) return null;`（L92）を `if (optimisticMerged \|\| optimisticDismissed) return null;` に統合（state は分離・guard で OR 合流） |
| 理由保持 | `.catch` 内で `dismissReason` を一切操作しない。clear は success 時の `onSuccess`（`setStage("idle")` / `setDismissReason("")`）のみ |
| success | `optimisticDismissed` は true 維持（row は消えたまま）。`onSuccess` が走っても row は復元しない |
| merge 経路 | **不変**（既存 `optimisticMerged` 挙動を一切変えない） |
| テスト driven | `optimisticDismissed` は **internal state**。props ではないため UI 操作（「別人として確定」click）経由でのみ駆動する（VSCPKR-03） |

---

## 4.2 命名規則整合チェック（RED を書く前に必ず実施）

Phase 3 §3.3 で `optimisticDismissed`（camelCase）に確定済み。RED ケースを書く前に下記を確認する。

1. 追加する state 名・setter 名が `optimisticDismissed` / `setOptimisticDismissed`（camelCase）であること。merge 側の `optimisticMerged` と対称・別 state。
2. テストコード内で internal state 名を文字列・props として直接参照しないこと（**UI 操作経由のみ** = VSCPKR-03）。各 RED ケースは「別人マーク」→ 理由入力 →「別人として確定」click まで UI を進めてから検証する。
3. snake_case / PascalCase の混入がないこと。

---

## 4.3 mock 方針（既存ヘルパ踏襲）

既存 spec は `vi.mock("../../../features/admin/hooks")` で `useAdminMutation` を mock し、
`setMutationState(endpoint, { trigger, isLoading, error })` で挙動を差し込む。
**この方針をそのまま使う**（新規 mock 機構を追加しない）。dismiss endpoint 文字列は spec L60 既存定数
`const dismissEndpoint = "/api/admin/identity-conflicts/c_1/dismiss";` を再利用する。

| 分岐 | mock 設定 |
|------|-----------|
| pending（中間状態観測） | `const trigger = vi.fn(() => new Promise(() => {})); setMutationState(dismissEndpoint, { trigger });` |
| success | `const trigger = vi.fn().mockResolvedValue({ dismissedAt: "..." }); setMutationState(dismissEndpoint, { trigger });` |
| failure（rollback） | `const trigger = vi.fn().mockRejectedValue(new Error("...")); setMutationState(dismissEndpoint, { trigger, error: new Error("...") });` |

> mock wrapper の挙動（既存 spec L33-42）: mock は `trigger` を `await state.trigger(endpoint, payload)` → `await options.onSuccess?.()` の順でラップしている。
> success 時は `onSuccess`（実装側 `setStage("idle")` / `setDismissReason("")`）も走る。reject 時は `onSuccess` に到達せず、実装側 `.catch` が `setOptimisticDismissed(false)` を実行する。

> **`vi.stubGlobal("window", ...)` は使わない（VSCPKR-02）**。`window` 依存の差し替えが必要な場合は `Object.defineProperty(window, ...)` 方針に従う。本タスクの RED ケースは hook mock のみで成立するため window 操作は不要。

---

## 4.4 追加する RED テストケース

`describe("IdentityConflictRow", ...)` 内の既存 dismiss ケース（spec L207-251）の後ろに、以下 3 ケースを追加する。
いずれも「別人マーク」click → 理由 textarea 入力 →「別人として確定」click まで UI を進めてから検証する（internal state を直接触らない）。
dismiss dialog の理由 textarea ラベルは `"別人マーク理由"`、実行ボタン名は `"別人として確定"`（実コード L214 / L249）。

### TC-DOPT-1: 「別人として確定」click 直後に row が DOM から消える（AC-1）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss 実行直後に server 応答前でも row を optimistic に非表示にする` |
| mock | `const trigger = vi.fn(() => new Promise(() => {}));`（resolve も reject もしない pending Promise）+ `setMutationState(dismissEndpoint, { trigger });`。これで server 完了前の中間状態を観測できる |
| 操作 | `別人マーク` click → `別人マーク理由` に `"別組織で確認済"` 入力 → `別人として確定` click |
| 期待値 | click 後（再 render 待ち）に `screen.queryByText("conflict: c_1")` が `null`、`screen.queryByRole("button", { name: "別人マーク" })` が `null`、`screen.queryByLabelText("別人マーク理由")` が `null`（row 全体が `return null`）。`await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())` で確実に捕捉する |
| 検証趣旨 | optimistic は server round-trip を待たず即座に row を消すこと |

> ポイント: pending Promise を使うことで「success 前の optimistic 状態」を確実に捕捉する。
> `setOptimisticDismissed(true)` は `onDismiss` 先頭で同期的に呼ばれるが、React の再 render を待つため `waitFor` を用いる。

### TC-DOPT-2: trigger が reject すると row が復元する（rollback / AC-2）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss trigger が reject すると optimistic 非表示を rollback し、reason / error が残る` |
| mock | `const apiError = new FetchAuthedError(409, JSON.stringify({ message: "すでに別人として確定済みです" }));` + `const trigger = vi.fn().mockRejectedValue(apiError);` + `setMutationState(dismissEndpoint, { trigger, error: apiError });` |
| 操作 | `別人マーク` click → `別人マーク理由` に `"別組織で確認済"` 入力 → `別人として確定` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalled())` の後、`await waitFor(() => expect(screen.getByText("conflict: c_1")).toBeTruthy())` で row 再表示。続けて `(screen.getByLabelText("別人マーク理由") as HTMLTextAreaElement).value` が `"別組織で確認済"`（**理由保持**）、`screen.getByRole("alert").textContent` が `"すでに別人として確定済みです"` を含む |
| 検証趣旨 | reject 時に `optimisticDismissed=false` で row 復元、stage は `"dismiss"` のまま維持、dismissReason は `.catch` で操作されず保持、`dismissError` が inline 表示され再操作可能 |

### TC-DOPT-3: success 時に row が消えたまま（AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss success 時は row が消えたまま (別人マークボタンが再表示されない)` |
| mock | `const trigger = vi.fn().mockResolvedValue({ dismissedAt: "2026-05-16T00:00:00.000Z" });` + `setMutationState(dismissEndpoint, { trigger });` |
| 操作 | `別人マーク` click → `別人マーク理由` 入力 → `別人として確定` click |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalled())` 後、`await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())`、`expect(screen.queryByRole("button", { name: "別人マーク" })).toBeNull()`（success 後も `optimisticDismissed` は true 維持で row は消えたまま） |
| 検証趣旨 | success 経路で `onSuccess`（`setStage("idle")` / `setDismissReason("")`）が走っても `optimisticDismissed` は true のため row は復元しない |

> **既存テストとの矛盾に関する注記**: 既存 dismiss success ケース `"dismiss で /dismiss endpoint に { reason } を送る"`（spec L207-225）は
> trigger payload のみ assert しており row 可視性は検証していない。よって本ケース追加で既存ケースは壊れない。
> ただし optimistic 化で「dismiss success 後に row が消える」挙動が正となるため、payload 検証は既存ケースに残し、
> row 消失検証は TC-DOPT-3 に集約する（Phase 6 §6.1 で整理）。既存「dismiss 失敗 (409)」ケース（spec L227-251）は
> 理由保持 + alert を assert しており、optimistic rollback でも成立し続ける（Phase 6 で rollback 観点を補強）。

---

## 4.5 RED 実行と期待される失敗

### 実行コマンド（targeted run / メモリ制約対策 FB-UI-02-2）

```bash
pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx --root=../.. --config=vitest.config.ts
```

> 全 vitest を回さず、対象ファイル 1 本に限定する。

### 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
|--------|----------------------|------------|
| TC-DOPT-1 | `optimisticDismissed` 未実装 → click 後も row は消えず `conflict: c_1` が残る | FAIL（期待通り） |
| TC-DOPT-2 | rollback ロジック未実装（そもそも optimistic 非表示が起きない）→ 「復元」検証の前提が成立しない。alert / 理由保持は既存挙動で部分 pass しうるが、optimistic を介した rollback 流れとしては不成立 | FAIL（期待通り） |
| TC-DOPT-3 | success 後に `onSuccess` の `setStage("idle")` で idle dialog に戻り `別人マーク` ボタンが再表示される（row は消えない）→ row 不在 assert が FAIL | FAIL（期待通り） |
| merge 既存ケース（spec L99-205） | merge optimistic は既実装 → PASS のまま（本 Issue で触らない） | 非回帰確認（PASS 維持） |

RED が想定どおり FAIL することを確認したら Phase 5 へ進む。

---

## 完了条件

| 項目 | 基準 |
|------|------|
| RED ケース追加 | TC-DOPT-1 / TC-DOPT-2 / TC-DOPT-3 を既存 dismiss ケース後に追加済み |
| 命名整合 | state を直接参照せず UI 操作経由（VSCPKR-03）で駆動、`optimisticDismissed` camelCase 前提を明文化 |
| mock 方針 | 既存 `vi.mock` + `setMutationState` 踏襲、pending Promise で中間観測、`vi.stubGlobal("window")` 不使用（VSCPKR-02） |
| RED 確認 | targeted vitest 実行で TC-DOPT-1/2/3 が FAIL、merge 既存ケースは PASS のまま |

## 統合テスト連携（Phase 1-11）

本フェーズで作成する vitest RED ケース（TC-DOPT-1/2/3）は Phase 5 実装で GREEN 化し、Phase 6 で
merge 非回帰 / クロス検証 / Playwright E2E を拡充、Phase 7 で `IdentityConflictRow.tsx` 限定 coverage を
実測、Phase 11 で `identity-conflict-row-dismiss-optimistic-removed.png` 系 screenshot 証跡を取得する。
