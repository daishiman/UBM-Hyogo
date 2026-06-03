# Phase 6: テスト拡充

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1043「optimistic row 消失に fade animation を追加（FU-AIDC-007）」の Phase 5 GREEN を前提に、
fail path / 回帰 guard / e2e 安定化を追加し、AC-3 / AC-6 / AC-8 / AC-10 を堅牢化する仕様。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 6（テスト拡充） |
| 対象 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集） |
| 対象 e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（編集） |
| 前提 | Phase 5 実装で Phase 4 RED が GREEN 化済み |

## 目的

Phase 4 の基本ケースに加えて、(1) network error rollback、(2) 連打防止（exiting 中の再 merge 不可）、
(3) success 後の `router.refresh()` 整合、(4) design token / legacy hook の静的回帰 guard、
(5) Playwright e2e の「animation 中ではなく安定状態待ち」整合を追加し、fade 導入による回帰を防ぐ。

## 実行タスク

### 6.1 fail path / 回帰 guard（focused Vitest 追加）

`IdentityConflictRow.spec.tsx` に以下を追加する。検証はすべて public 挙動（DOM 有無 / `role="alert"` /
root 要素の className に `opacity-0` を含むか）経由で行い、internal state を直接読まない。

| テストID | 内容 | mock | 期待値 | jsdom 対応系統 | 対応 AC |
| --- | --- | --- | --- | --- | --- |
| TC-NET-ROLLBACK | network error（非 `FetchAuthedError`・素の `Error`）で rollback | `trigger = vi.fn().mockRejectedValue(new Error("ネットワークに接続できません"))` + `setMutationState(mergeEndpoint, { trigger, error: new Error("ネットワークに接続できません") })` | `await waitFor(() => expect(trigger).toHaveBeenCalled())` 後、`screen.getByText("conflict: c_1")` 再表示、row root が `opacity-0` を持たない（exiting 解除）、`screen.getByRole("alert").textContent` が `"ネットワークに接続できません"` を含む。fake timer で `vi.advanceTimersByTime(250)` 進めても row が消えない（timer clear 確認） | (b) fake timer | AC-3 |
| TC-NO-DOUBLE-MERGE | exiting 中は再 merge できない（連打防止） | pending Promise `trigger = vi.fn(() => new Promise(() => {}))` | merge 実行 click → exiting 相（row 残存・`opacity-0`）。この状態で `screen.queryByRole("button", { name: "merge 実行" })` および `screen.queryByRole("button", { name: "merge" })` が **null**（exiting 中は merge 操作 UI が露出しない）。`trigger` が 1 回のみ呼ばれること（`expect(trigger).toHaveBeenCalledTimes(1)`） | — （同期） | AC-1/AC-4 補強 |
| TC-REFRESH-CONSISTENT | success 後 removed 維持で再表示なし（refresh 整合） | success mock（`mockResolvedValue({ mergedAt, targetMemberId, archivedSourceMemberId, auditId })`） | merge 実行 → `transitionEnd` 発火（系統 a）または fallback（系統 b）で removed → `screen.queryByText("conflict: c_1")` が null。`onSuccess` の `setStage("idle")` が走っても `merge` ボタン非表示（`queryByRole("button", { name: "merge" })` が null）。row は二度と現れない（`await waitFor(...)` 後も null 維持） | (a) または (b) | AC-4 |
| TC-UNMOUNT-SAFE | exiting 中アンマウントで timer leak / 警告なし | pending Promise mock | merge 実行 → exiting 相 → `cleanup()`（unmount）。`vi.useFakeTimers()` 下で `vi.advanceTimersByTime(250)` を進めても unmount 後 setState 警告（`act` warning）が出ない。`useEffect` cleanup で timer clear されること | (b) fake timer | AC-3 補強 |

> TC-NO-DOUBLE-MERGE は「exiting 中に merge dialog（確認 1/2・2/2）と merge ボタンが露出しない」ことで
> 二重 trigger を構造的に防ぐ。row 自体は exiting 相で DOM 残存するが、内部の操作 UI は `stage` が
> `merge-final` のまま exiting で fade 中という設計上、追加 click が `onMerge` を再発火しないことを確認する。
> （実装で exiting 中に dialog を非活性化する必要があれば Phase 8 で簡素化検討する。最低限 `trigger` の
> 呼び出し回数 1 を assert すること。）

### 6.2 design token 回帰 guard（静的検査）

リポジトリルートから実行し、いずれも **0 件**であること。

```bash
# HEX 直書き / inline style の混入が無いこと（0 件期待）
rg -n "#[0-9a-fA-F]{3,8}|style=\{\{" apps/web/src/components/admin/IdentityConflictRow.tsx
```

- 期待: マッチ 0 件（exit code 1 = no match）。
- 1 件でもヒットした場合は token gate 違反（`verify-design-tokens` CI gate fail 相当）として Phase 5 へ差し戻す。
- 新規 token / keyframes の追加が無いことも併せて確認する（`tokens.css` / Tailwind config に diff が無いこと）。

### 6.3 legacy hook 回帰 guard（静的検査）

```bash
# legacy mutation hook 参照が無いこと（0 件期待・不変条件 #10）
grep -rn "@/lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx
```

- 期待: マッチ 0 件。`useAdminMutation` は `../../features/admin/hooks` 経由のみ（既存維持）。

### 6.4 Playwright e2e の安定化整合（`admin-identity-conflicts.spec.ts`）

fade 導入で「optimistic 直後に即 row 消失」が成立しなくなるため、既存 e2e を **animation 中ではなく
安定状態（locator が消えた最終状態）を待つ**形へ整合する。

| 既存テスト | 整合方針 |
| --- | --- |
| `成功系: merge 実行直後に対象 row を optimistic に非表示にする`（spec line 123-154） | `await expect(row).toHaveCount(0)` は Playwright の auto-retry で fade 完了（exiting → removed）まで待つため**そのまま安定状態待ちとして機能**する。fade 中の中間状態を assert しない（中間 opacity 値を見ない）。screenshot は `merge 実行` click 前（merge-final）と `toHaveCount(0)` 確定後（removed-stable）で取得する |
| `失敗系: merge error 時は optimistic 非表示を rollback する`（spec line 156-181） | 409 後 `await expect(getByText('conflict: ...')).toBeVisible()` は復元（exiting 解除）後に成立する。auto-retry で fade キャンセル → 復元を待つため整合済み。rollback-restored screenshot をこの確定後に取得 |
| その他（list / dismiss / refresh 境界 / authz） | 変更不要（dismiss 不変・refresh 境界不変） |

- 新 fixture は追加しない（`adminPage` / `memberPage` / `anonymousPage` のみ）。
- selector は `getByRole` / `getByText` / `getByTestId` 優先（Tailwind class / 色値依存禁止）を維持。
- 中間 animation フレームを assert しない（flaky 防止）。`toHaveCount(0)` / `toBeVisible()` の auto-retry に委ねる。

実行コマンド（リポジトリルート）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts
```

> e2e は CI / 専用環境で実行する想定。ローカルで browser 未導入時は実行不可のため、結果は CI green で担保する（AC-8）。

### 6.5 拡充後の検証コマンド（リポジトリルートから）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
rg -n "#[0-9a-fA-F]{3,8}|style=\{\{" apps/web/src/components/admin/IdentityConflictRow.tsx   # 0 件
grep -rn "@/lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx        # 0 件
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 4 テスト | `../phase-4/phase-4.md` | 基本ケース / jsdom 系統 (a)/(b) |
| Phase 5 実装 | `../phase-5/phase-5.md` | GREEN 化済み実装方針 |
| Phase 2 設計 | `../phase-2/phase-2.md` | §2.6 timer 解放経路（TC-UNMOUNT-SAFE 根拠） |
| 既存 e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 安定状態待ち整合 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | token gate 根拠 |
| 不変条件 | `CLAUDE.md`（#2 token / #10 legacy hook） | 静的 guard 根拠 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-6/phase-6.md` | 追加 fail-path / 回帰 guard テストケース（network rollback / 連打防止 / refresh 整合 / unmount safe）と静的検査 guard（design token gate grep / legacy hook grep）、Playwright 安定状態待ち整合方針 |

## 統合テスト連携

- 6.1 の fail path / 連打防止 / refresh 整合 / unmount safe が GREEN（AC-3 / AC-4 補強）。
- 6.2 / 6.3 の静的 guard が 0 件（AC-10）。
- 6.4 の Playwright e2e が安定状態待ちで green（AC-8）。
- typecheck / lint green（AC-9）。
- Phase 11 で screenshot（user-gated・AC-11）、Phase 12 で四条件判定・未タスク化判断（Phase 3 MINOR）。

## 完了条件（Phase 6）

- TC-NET-ROLLBACK / TC-NO-DOUBLE-MERGE / TC-REFRESH-CONSISTENT / TC-UNMOUNT-SAFE の fail path・回帰 guard を確定した。
- design token guard（`rg` で `#hex` / `style={{` が 0 件）と legacy hook guard（`grep` で `@/lib/useAdminMutation` が 0 件）を確定した。
- Playwright e2e を「animation 中でなく安定状態（`toHaveCount(0)` / `toBeVisible()` の auto-retry）を待つ」形へ整合する方針を確定した。
- 拡充後の検証コマンド一式を確定した。
