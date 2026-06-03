# Phase 6: テスト拡充

## メタ情報

| 項目 | 内容 |
|------|------|
| Issue | #1042（FU-AIDC-006） |
| 主題 | dismiss optimistic の merge 非回帰 / クロス検証 / fail path / Playwright E2E 拡充 |
| Phase | 6 / 13（テスト拡充） |
| 対象 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集） |
| 対象 playwright | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（編集） |

## 目的

Phase 5 実装後に、(a) merge 既存 optimistic ケースの**非回帰確認**（AC-5）、(b) dismiss / merge の rollback が
相互に影響しない**クロス検証**（AC-4 補強）、(c) dismiss の **fail path（network error / 409）追加**、
(d) **Playwright E2E に dismiss optimistic + rollback シナリオ追加**、を行う。

---

## 6.1 merge 既存 optimistic ケースの非回帰確認（AC-5）

merge 側 optimistic は本 Issue 対象外。既存 spec の merge ケース群を**変更せず PASS することを確認**する。

| 既存ケース（spec 行） | 観点 | Phase 6 での扱い |
|------------------------|------|------------------|
| `merge 実行直後に server 応答前でも row を optimistic に非表示にする`（L99-118） | merge 即時非表示（merge 版 TC-OPT-1） | **変更しない**・PASS 確認 |
| `merge 成功後も row は非表示を維持する`（L120-144） | merge success 維持（merge 版 TC-OPT-3） | **変更しない**・PASS 確認 |
| `merge 失敗 (409) で optimistic 非表示を rollback し、reason / error が残る`（L155-182） | merge rollback（merge 版 TC-OPT-2） | **変更しない**・PASS 確認 |
| `merge 失敗 (400) でも modal は閉じず inline error 表示`（L184-205） | merge inline error | **変更しない**・PASS 確認 |

> render guard を `optimisticMerged || optimisticDismissed` に統合しても merge 側の挙動は不変（OR の左項が従来どおり効く）。
> dismiss state は初期 false のため merge 経路の判定に影響しない。これら merge ケースが green であることが AC-5 の証跡。

### 既存 dismiss success ケースの整理（payload 検証は温存）

| 区分 | 内容 |
|------|------|
| 対象 | `dismiss で /dismiss endpoint に { reason } を送る`（spec L207-225） |
| 保持する assertion | `expect(trigger).toHaveBeenCalledWith(dismissEndpoint, { reason: "別組織で確認済" })`（payload 検証は不変） |
| 役割分担 | row 消失検証は Phase 4 の **TC-DOPT-3** に集約。本既存ケースは payload 契約のみを担保（重複回避） |

---

## 6.2 クロス検証 / fail path の追加（vitest）

### TC-DOPT-CROSS: dismiss state が merge row 可視性に影響しない（AC-4 回帰 guard）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss の optimistic rollback 後も merge 経路が正常に動作する (state 分離)` |
| 方針 | dismiss を reject させて `optimisticDismissed=false` に rollback（row 復元）→ 同 row で `merge` → `次へ` → 理由入力 → `merge 実行`（pending Promise）→ merge optimistic で row が消えることを確認 |
| mock | dismiss: `vi.fn().mockRejectedValue(new Error("rollback 用"))` + `setMutationState(dismissEndpoint, { trigger: dismissTrigger, error: ... })`。merge: `vi.fn(() => new Promise(() => {}))` + `setMutationState(mergeEndpoint, { trigger: mergeTrigger })` |
| 期待値 | dismiss reject 後 `screen.getByText("conflict: c_1")` が再表示（dismiss rollback）。続けて merge 実行後 `await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())`（merge optimistic で消失）。`optimisticDismissed` の rollback が `optimisticMerged` の挙動を阻害しないこと |
| 検証趣旨 | 2 state が分離されており、片方の state がもう片方の row 可視性ロジックに干渉しない（guard は OR だが各項は独立） |

> 逆方向（merge reject → dismiss success）も同型で 1 ケース追加してよいが、最小は本 CROSS 1 ケースで AC-4 を担保できる。
> 既存 merge / dismiss happy・409 ケースを温存していること自体が分離の追加証跡になる。

### RG-D1: rollback 後に再度 dismiss できる（回帰 guard / AC-2 補強）

| 項目 | 内容 |
|------|------|
| テスト名 | `dismiss rollback 後に再度「別人として確定」でき、2 回目の trigger が呼ばれる` |
| mock | `const trigger = vi.fn().mockRejectedValueOnce(new Error("一時障害")).mockResolvedValueOnce({ dismissedAt: "..." });` + `setMutationState(dismissEndpoint, { trigger })`（reject 時は `error` を併せて設定し alert を観測） |
| 操作 | `別人マーク` → 理由入力 → `別人として確定`（1 回目 reject → row 復元）→ 再度 `別人として確定`（2 回目 resolve） |
| 期待値 | `await waitFor(() => expect(trigger).toHaveBeenCalledTimes(2))`。2 回目 click 後に `await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())`（success で消失維持）。stage が `"dismiss"` のまま再実行できること・理由が保持されていること |

### fail path（既存 + 補強）

| ケース | 扱い |
|--------|------|
| 409（既に dismiss 済み） | 既存 `dismiss 失敗 (409) で alert が出て modal は残る`（spec L227-251）を**保持**。optimistic rollback でも理由保持 + alert が成立し続ける（Phase 4 TC-DOPT-2 が rollback 観点を追加担保） |
| network error | TC-DOPT-2 の mock を `vi.fn().mockRejectedValue(new Error("ネットワークエラー"))` に変えた variant を 1 ケース追加（`error` も同 message で設定）。rollback + row 復元 + alert 表示を確認。FetchAuthedError でない plain Error 経路（errorMessage L16: `error.message` 直返し）を covered にする |

---

## 6.3 Playwright シナリオ追加

`apps/web/playwright/tests/admin-identity-conflicts.spec.ts` に dismiss optimistic 用シナリオを追加する。
route mock は既存パターン（`adminPage.route(DISMISS_PATTERN, ...)` + `route.fulfill`、`DISMISS_PATTERN = '**/api/admin/identity-conflicts/*/dismiss'`）を踏襲する。
row 特定は既存 `成功系: dismiss`（spec L84-）と同じく `adminPage.getByText('conflict: m_src_02__m_dst_02').locator('xpath=ancestor::li[1]')` 系を使う。
dismiss dialog のボタン名は `別人マーク` → 理由 fill → `別人として確定`。

### E2E-DOPT-1: dismiss 成功後に row が一覧から消える（AC-1 / AC-3）

| 項目 | 内容 |
|------|------|
| テスト名 | `optimistic: dismiss 成功後に該当 row が一覧から消える` |
| route mock | 既存 `成功系: dismiss` と同じく `DISMISS_PATTERN` を 200 + `dismissResponse`（`{ dismissedAt: '...' }`）で fulfill |
| 操作 | `conflict: m_src_02__m_dst_02` の row で `別人マーク` → `別人マーク理由` fill → `別人として確定` click |
| 期待値 | `await expect(row).toHaveCount(0)`（該当 row 消失）。もう 1 件 `conflict: m_src_01__m_dst_01` は `toBeVisible()` のまま残る（他 row が消えない） |

### E2E-DOPT-2: server error で row 復元 + inline error（AC-2）

| 項目 | 内容 |
|------|------|
| テスト名 | `optimistic: dismiss が server error なら row が復元し inline error を表示する` |
| route mock | `DISMISS_PATTERN` を `status: 409` + `body: JSON.stringify({ message: "すでに別人として確定済みです" })` で fulfill（既存 hook が error message を surface する shape に合わせる） |
| 操作 | E2E-DOPT-1 と同手順で `別人として確定` click |
| 期待値 | 該当 row が再表示（`await expect(row).toHaveCount(1)` / `toBeVisible()`）、`row.getByRole('alert')` に error メッセージ表示、`別人マーク理由` textarea の value 保持、`別人として確定` ボタンが残存し再操作可能 |

> route mock の success/error 出し分けは `DISMISS_PATTERN` の handler 内で `route.fulfill({ status, body })` を切り替える。
> error response の body shape（`{ message }`）は merge 側 E2E と整合させる（`useAdminMutation` の error 解釈に合わせる）。
> 不明な場合は Phase 5 着手時に `useAdminMutation.ts` の error 取り出しを確認し、それに合わせた JSON を fulfill する。

### E2E-DOPT-3: merge が不変（AC-5 回帰 guard）

| 項目 | 内容 |
|------|------|
| 方針 | 既存 `成功系: merge` / `refresh 境界` テストを**変更しない**。merge 経路は本 Issue の対象外であることを既存テストで担保する |

> screenshot 証跡（`identity-conflict-row-dismiss-optimistic-removed.png` 系）は **Phase 11** で staging に対して取得する。
> Phase 6 では route mock ベースの E2E グリーン化までを範囲とする。

---

## 6.4 実行コマンド

```bash
# vitest（targeted / FB-UI-02-2）
pnpm --filter @ubm-hyogo/web exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx --root=../.. --config=vitest.config.ts

# playwright（identity-conflicts spec / dismiss・optimistic・rollback に grep 限定）
AUTH_SECRET=playwright-e2e-auth-secret-32-bytes PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts \
  --project=desktop-chromium --grep "dismiss|optimistic|rollback"
```

---

## 完了条件

| AC | 確認 |
|----|------|
| AC-5（merge 非回帰） | merge 既存 vitest ケース（spec L99-205）+ Playwright `成功系: merge` / `refresh 境界` を変更せず PASS |
| AC-4（state 分離） | TC-DOPT-CROSS が green（dismiss rollback が merge row 可視性に干渉しない） |
| AC-2（rollback） | RG-D1 + network error variant + 既存 409 ケースが green（理由保持 + alert + 再実行可能） |
| AC-6 / AC-7 | targeted vitest green、Playwright（dismiss optimistic + rollback E2E）green |

## 統合テスト連携（Phase 1-11）

本フェーズの vitest（クロス検証 / fail path）と Playwright（E2E-DOPT-1/2）が green になることで、Phase 4 の RED が
完全に GREEN 化し AC-1〜AC-5 を担保する。Phase 7 で `IdentityConflictRow.tsx` の追加分岐 coverage を実測、
Phase 11 で dismiss optimistic 消失 / rollback の staging screenshot 証跡を取得する。
