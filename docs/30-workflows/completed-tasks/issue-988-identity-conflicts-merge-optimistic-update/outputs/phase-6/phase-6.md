# Phase 6: テスト拡充

Phase 5 実装後に、(a) optimistic 化で壊れる**既存 vitest assertion の更新**、
(b) fail path / 回帰 guard の追加、(c) Playwright E2E シナリオ追加、を行う。

- 対象 vitest: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集）
- 対象 playwright: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（編集）

---

## 6.1 既存 vitest assertion の更新（必須・Phase 3 §3.3 識別リスク）

optimistic 化により success 後は row が `return null` で消える。そのため既存の
「success 後に merge ボタンが再表示される」assertion は壊れる。**これを更新する**。

### 対象: 既存ケース `"merge 実行で trigger に { targetMemberId, reason } を送る (happy)"`

| 区分 | 内容 |
|------|------|
| 旧 assertion（spec L121-124） | `await waitFor(() => expect(screen.getByRole("button", { name: "merge" })).toBeTruthy())` ← success 後に merge ボタン再表示を期待 |
| 新 assertion | `await waitFor(() => expect(screen.queryByRole("button", { name: "merge" })).toBeNull())` ＋ `expect(screen.queryByText("conflict: c_1")).toBeNull()` ← **success 後は row 消失** |
| 保持する assertion | `expect(trigger).toHaveBeenCalledWith(mergeEndpoint, { targetMemberId: "m_dst", reason: "本人確認済" })`（payload 検証は不変） |

> コメントも「success path: onSuccess が走り idle に戻る」→「success path: optimistic 維持で row が消えたまま」へ更新する。
> Phase 4 で追加した TC-OPT-3 と意味的に重なる場合は、payload 検証は本既存ケースに残し、
> row 消失検証は TC-OPT-3 に集約してもよい（重複を避ける）。

---

## 6.2 fail path / 回帰 guard の追加（vitest）

### RG-1: rollback 後に再 merge できる（回帰 guard / AC-2 補強）

| 項目 | 内容 |
|------|------|
| テスト名 | `rollback 後に再度 merge 実行でき、2 回目の trigger が呼ばれる` |
| mock | 1 回目 reject → 2 回目 resolve を `vi.fn().mockRejectedValueOnce(...).mockResolvedValueOnce(...)` で表現 |
| 操作 | merge 実行 click（reject → row 復元）→ 再度 `merge 実行` click |
| 期待値 | `trigger` が 2 回呼ばれ、2 回目 click 直後に row が消える。stage が `merge-final` のまま再実行できること |

### RG-2: dismiss 経路が optimistic の影響を受けない（AC-4 回帰 guard）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss は optimistic 化の影響を受けず、success 後も row（または既存挙動）が維持される` |
| 方針 | 既存 dismiss ケース（`"dismiss で /dismiss endpoint に { reason } を送る"` 等）を保持しつつ、dismiss success で `optimisticMerged` が false のまま row が消えないことを 1 assertion 追加 |
| 期待値 | dismiss success 後も `screen.getByText("conflict: c_1")` が存在（dismiss は `return null` 分岐に関与しない） |

> 既存 dismiss ケース（happy / 409 失敗）は**変更しない**。AC-4「dismiss 不変」の証跡として温存する。

---

## 6.3 Playwright シナリオ追加

`apps/web/playwright/tests/admin-identity-conflicts.spec.ts` に optimistic 用シナリオを追加する。
route mock は既存 spec のパターン（`adminPage.route(MERGE_PATTERN, ...)` + `route.fulfill`）を踏襲する。
row 特定は既存どおり `getByText('conflict: ...').locator('xpath=ancestor::li[1]')`。

### E2E-OPT-1: merge 成功後に row が一覧から消える（AC-1 / AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `optimistic: merge 成功後に該当 row が一覧から消える` |
| route mock | 既存 `成功系: merge` と同じく `MERGE_PATTERN` を 200 + `mergeResponse` で fulfill |
| 操作 | `conflict: m_src_01__m_dst_01` の row で `merge` → `次へ` → `merge 理由` fill → `merge 実行` click |
| 期待値 | `await expect(row).toHaveCount(0)`（該当 row 消失）。もう 1 件 `conflict: m_src_02__m_dst_02` は `toBeVisible()` のまま残る（他 row が消えない） |

### E2E-OPT-2: server error で row 復元 + inline error（AC-5 / AC-6）

| 項目 | 内容 |
|------|------|
| テスト名 | `optimistic: merge が server error なら row が復元し inline error を表示する` |
| route mock | `MERGE_PATTERN` を `status: 409` + `{ error / message: "すでに統合済みです" }` 相当で fulfill（既存 hook が error message を surface する shape に合わせる） |
| 操作 | E2E-OPT-1 と同手順で `merge 実行` click |
| 期待値 | 該当 row が再表示（`await expect(row).toHaveCount(1)` / `toBeVisible()`）、`row.getByRole('alert')` に error メッセージが表示、確認 2/2（`merge 実行` ボタン）が残存し再操作可能 |

> error response の body shape は `useAdminMutation` が error message を取り出す形式に合わせる
> （既存 vitest が `new Error("すでに統合済みです")` を error として与えていることと整合させる）。
> 不明な場合は実装の `useAdminMutation.ts` の error 解釈を Phase 5 着手時に確認し、それに合わせた JSON を fulfill する。

### E2E-OPT-3: dismiss が不変（AC-4 回帰 guard）

| 項目 | 内容 |
|------|------|
| 方針 | 既存 `成功系: dismiss` テストを**変更しない**。dismiss 経路は optimistic 化の対象外であることを既存テストで担保する |

> 既存の `refresh 境界` テスト（merge 後 `router.refresh()` のみ・members 詳細 fetch なし）も**変更しない**。
> optimistic 化後も hook 既存挙動（`router.refresh()`）は維持されるため、この回帰 guard はそのまま有効。

---

## 6.4 実行コマンド

```bash
# vitest（targeted）
pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx

# playwright（identity-conflicts spec 限定）
pnpm --filter web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts
```

## 6.5 完了条件

| AC | 確認 |
|----|------|
| AC-5 | vitest green（既存更新 + TC-OPT-1/2/3 + RG-1/2） |
| AC-6 | playwright green（既存 + E2E-OPT-1/2、dismiss / refresh 境界は不変で pass） |
| AC-4 | dismiss / refresh 境界テストを変更せず pass |
