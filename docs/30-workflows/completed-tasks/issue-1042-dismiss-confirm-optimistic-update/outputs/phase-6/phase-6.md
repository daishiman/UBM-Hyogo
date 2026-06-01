**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 6: テスト拡充

Phase 5 実装後に、(a) optimistic 化で意味が重なる**既存 dismiss vitest assertion の整理**、
(b) fail path / 回帰 guard の追加（merge と dismiss の rollback 混線防止 / `dismissReason` 保持境界）、
(c) Playwright E2E シナリオ追加、を行う。

- 対象 vitest: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集）
- 対象 playwright: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（編集）

---

## 6.1 既存 vitest assertion の整理（dismiss 系）

optimistic 化により dismiss 実行後は row が `return null` で消える。既存 dismiss ケースの扱いを確定する。

### 対象 1: 既存ケース `"dismiss で /dismiss endpoint に { reason } を送る"`（spec L207-225）

| 区分 | 内容 |
|------|------|
| 旧 assertion | `await waitFor(() => expect(trigger).toHaveBeenCalledWith(dismissEndpoint, { reason: "別組織で確認済" }))`（payload 検証のみ） |
| 方針 | **payload 検証は不変で保持**（success mock のため optimistic 化後も成立）。row 消失検証は TC-DIS-3 に集約し、本ケースには追加しない（重複回避） |

### 対象 2: 既存ケース `"dismiss 失敗 (409) で alert が出て modal は残る"`（spec L227-251）

| 区分 | 内容 |
|------|------|
| 旧 assertion | `alert` 表示 + `別人マーク理由` value 保持（`error` を `new Error(...)` で与える） |
| 方針 | TC-DIS-2 と意味が重なる。**いずれか一方に集約**する。TC-DIS-2 が rollback（row 復元）+ reason 保持 + alert を包含的に検証するため、本既存ケースは TC-DIS-2 にマージして削除するか、`error` を `FetchAuthedError` 化して TC-DIS-2 に統一する。重複した 2 ケースを残さない |
| 注意 | 既存ケースは `error: new Error("...")` を直接渡しており、`errorMessage`（実コード L14-16）はそのまま `error.message` を返す。TC-DIS-2 で `FetchAuthedError` を使う場合は `errorMessage` の JSON 解釈経路（実コード L17-23）も covered になる |

> 整理後、dismiss 系 vitest は「payload 検証（success）」「optimistic 非表示（pending）」「rollback + reason 保持（reject）」
> 「success 後 row 消失維持」の 4 観点を重複なく持つ状態にする。

---

## 6.2 fail path / 回帰 guard の追加（vitest）

### RG-1: rollback 後に再 dismiss できる（回帰 guard / AC-3 補強）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss rollback 後に再度確定でき、2 回目の trigger が呼ばれる` |
| mock | 1 回目 reject → 2 回目 resolve を `vi.fn().mockRejectedValueOnce(apiError).mockResolvedValueOnce({ dismissedAt: "..." })` で表現 |
| 操作 | `別人マーク` click → 理由入力 → `別人として確定` click（reject → row 復元・reason 保持）→ 再度 `別人として確定` click |
| 期待値 | `trigger` が 2 回呼ばれ、2 回目 click 後に row（`conflict: c_1`）が消える。stage が `dismiss` のまま再実行でき、保持された `dismissReason` で再送できること |

### RG-2: merge と dismiss の rollback が混線しない（AC-1 / AC-4 回帰 guard）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss rollback は optimisticMerged を変化させず、merge 経路に影響しない` |
| 方針 | state 分離（AC-1）の固定。dismiss を reject させて `optimisticDismissed` が false に戻った後、merge フロー（`merge` → `次へ` → `merge 理由` → `merge 実行`）が通常どおり起動でき、merge 側 optimistic が独立して動くことを確認 |
| mock | dismiss `trigger` を reject、merge `trigger` を pending（`() => new Promise(() => {})`）で別々に `setMutationState` |
| 期待値 | dismiss reject 後に row が復元 → merge 実行 click で row が再び消える。片方の rollback が他方の optimistic state を巻き込まないこと（`optimisticMerged` true 化が `optimisticDismissed` に依存しない） |

> 逆方向（merge rollback が dismiss に影響しない）は既存 merge rollback ケース（spec L155-182）が `optimisticDismissed`
> 未導入の状態と同等に dismiss を触らないことで担保される。新規追加で 1 方向（dismiss→merge 非干渉）を明示固定する。

### RG-3: `dismissReason` 保持の境界（AC-3 補強）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss reject 後に dismissReason が clear されず保持される（success との対比）` |
| 方針 | reject 経路では `dismissReason` 保持、success 経路（`onSuccess` の `setDismissReason("")`）では clear、という分岐を 1 ケースで対比固定する。reject 後の `別人マーク理由` value が入力値のまま、対して success 後は row 消失で参照不能（row が無いこと自体が clear+消失の証跡） |

---

## 6.3 Playwright シナリオ追加

`apps/web/playwright/tests/admin-identity-conflicts.spec.ts` に dismiss optimistic 用シナリオを追加する。
route mock は既存 spec のパターン（`adminPage.route(DISMISS_PATTERN, ...)` + `route.fulfill`）を踏襲する。
row 特定は既存どおり `getByText('conflict: ...').locator('xpath=ancestor::li[1]')`。
既存 dismiss 成功系（spec L183-213）は `conflict: m_src_02__m_dst_02` を使うため、衝突しない row を選ぶ。

### E2E-DIS-1: dismiss 実行直後に row が一覧から消える（AC-2）

| 項目 | 内容 |
|------|------|
| テスト名 | `成功系: dismiss 実行直後に対象 row を optimistic に非表示にする` |
| route mock | merge optimistic E2E（spec L123-154）と同じく `DISMISS_PATTERN` を `setTimeout(resolve, 500)` 後に 200 + `dismissResponse` で fulfill |
| 操作 | `conflict: m_src_02__m_dst_02` の row で `別人マーク` → `別人マーク理由` fill → `別人として確定` click |
| 期待値 | `await expect(row).toHaveCount(0)`（該当 row 消失）。もう 1 件 `conflict: m_src_01__m_dst_01` は `toBeVisible()` のまま残る（他 row が消えない）。`captureIssue1042Screenshot(adminPage, 'identity-conflict-row-dismiss-optimistic-removed.png')` を併用 |

### E2E-DIS-2: server error で row 復元 + inline error + reason 保持（AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `失敗系: dismiss error 時は optimistic 非表示を rollback する` |
| route mock | merge rollback E2E（spec L156-181）と同じく `DISMISS_PATTERN` を `status: 409` + `{ message: "すでに別人として確定済みです" }` で fulfill |
| 操作 | E2E-DIS-1 と同手順で `別人として確定` click |
| 期待値 | 該当 row 再表示（`await expect(adminPage.getByText('conflict: m_src_02__m_dst_02')).toBeVisible()`）、`row.getByRole('textbox', { name: /別人マーク理由/ })` が `toHaveValue('...')`（reason 保持）、`row.getByRole('alert')` に error メッセージ表示、`別人として確定` ボタン残存で再操作可能。`captureIssue1042Screenshot(adminPage, 'identity-conflict-row-dismiss-rollback-error.png')` を併用 |

### E2E-DIS-3: merge が不変（AC-4 回帰 guard）

| 項目 | 内容 |
|------|------|
| 方針 | 既存 merge optimistic / rollback / refresh 境界テスト（spec L83-253）を**変更しない**。merge 経路は本タスクの対象外であり、既存テストで不変を担保する |

> 既存 `成功系: dismiss`（payload 検証 / spec L183-213）は row 消失検証を持たない。optimistic 化後も
> POST body 検証（`DismissIdentityConflictRequestZ.parse` + `Object.keys(...).toEqual(['reason'])`）は成立するため
> **変更しない**。row 消失検証は E2E-DIS-1 が担う。

---

## 6.4 実行コマンド

```bash
# vitest（targeted）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx

# playwright（identity-conflicts spec 限定）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts
```

## 6.5 完了条件

| AC | 確認 |
|----|------|
| AC-2 | vitest green（TC-DIS-1/3 + E2E-DIS-1） |
| AC-3 | vitest green（TC-DIS-2 + RG-1/3 + E2E-DIS-2 / reason 保持 + row 復元） |
| AC-1 | RG-2 green（merge / dismiss state 分離・rollback 非混線） |
| AC-4 | 既存 merge テスト（optimistic / rollback / refresh 境界）を変更せず pass |
| AC-5 | playwright green（E2E-DIS-1/2、merge 系は不変で pass） |
