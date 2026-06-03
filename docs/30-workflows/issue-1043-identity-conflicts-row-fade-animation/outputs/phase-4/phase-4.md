# Phase 4: テスト作成（TDD RED 設計）

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1043「optimistic row 消失に fade animation を追加（FU-AIDC-007）」の TDD RED フェーズ。
**まだ実装は行わず**、Phase 5 で書く実装（`isExiting` / `exitTimerRef` による exiting 相）が満たすべき
focused Vitest ケースを先に追加し、「失敗する状態（RED）」を作る。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 4（テスト作成 / TDD RED） |
| 対象 vitest | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（編集） |
| 実装対象（Phase 5 で着手） | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 参照のみ（変更しない） | `apps/web/src/features/admin/hooks/useAdminMutation.ts` / `apps/web/src/styles/globals.css` |
| 親 template | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-4/phase-4.md` |

## 目的

merge 実行直後の「即時 `return null`」を「exiting 相（fade 中・DOM 残存）→ removed 相（`return null`）」へ
置き換える Phase 5 実装に対して、先に失敗するテストを定義する。具体的には次を RED として固定する。

- merge 実行直後に row が即座には消えず exiting 相に入る（DOM 残存・fade class 付与）こと（AC-1）。
- exiting 完了（`transitionend` または timeout fallback）で row が DOM 除去されること（AC-2）。
- server error 時に exiting を解除して row を復元し、exit timer を clear、inline error を表示すること（AC-3）。
- success 時に row が removed のまま維持されること（AC-4）。
- reduced-motion 環境でほぼ即時に消える（fallback 経路）こと（AC-5）。
- dismiss 側挙動が不変であること（AC-6）。

これにより Phase 5 で実装すべき public 挙動を、internal state 名に依存せず DOM / role 経由で観測可能にする。

## 実行タスク

### 4.1 RED の前提（Phase 1-3 確定設計の再掲）

| 項目 | 確定内容 |
| --- | --- |
| state 構成 | `stage`（既存・dialog 制御）/ `optimisticMerged`（既存 boolean・removed 相 = `return null`）/ `isExiting`（新規 boolean・exiting 相 = fade 中 DOM 残存）/ `exitTimerRef`（新規 `useRef` timer） |
| 相遷移 | visible →（onMerge: `isExiting=true` + `trigger` + `exitTimerRef=setTimeout(finalizeRemoval, 250ms)`）→ exiting →（`transitionend` または timeout fallback で `finalizeRemoval`: `clearTimeout` + `optimisticMerged=true`）→ removed。error（`.catch`）では `clearTimeout` + `isExiting=false` で visible へ復元、`mergeError` inline 表示 |
| 定数 | `EXIT_ANIMATION_MS = 200`（Tailwind `duration-200` 一致）/ `EXIT_FALLBACK_BUFFER_MS = 50` → fallback は `200 + 50 = 250ms` |
| CSS | root div に `transition-[opacity,transform] duration-200 motion-reduce:transition-none`、exiting 時 `opacity-0 scale-[0.99]`。HEX 直書き / inline `style={{}}` 禁止。新規 token / keyframes 禁止 |
| reduced-motion 3 重保証 | globals.css グローバル（line 1998-2007 既存）+ Tailwind `motion-reduce:transition-none` + timeout fallback |
| dismiss | 不変（exiting / fade を一切適用しない） |

### 4.2 命名規則整合チェック（RED を書く前に必ず実施）

1. 追加 state 名・setter 名が `isExiting` / `setIsExiting`、ref が `exitTimerRef`（いずれも camelCase 慣例）であること。
2. テストコード内で internal state 名（`isExiting` / `optimisticMerged` / `exitTimerRef`）を文字列・props として
   **直接参照しない**こと。検証はすべて public 挙動（DOM の有無 = `queryByText("conflict: c_1")`、
   `role="alert"` の有無、fade class を持つ root 要素の有無）経由で行う（private state 非直接観測の原則）。
3. snake_case / PascalCase の混入がないこと。

### 4.3 mock 方針（既存ヘルパ踏襲）

既存 spec の `vi.mock("../../../features/admin/hooks")` + `setMutationState(endpoint, { trigger, isLoading, error })`
をそのまま使う（新規 mock 機構を追加しない）。

| 分岐 | mock 設定 |
| --- | --- |
| pending（exiting 観測用） | `const trigger = vi.fn(() => new Promise(() => {})); setMutationState(mergeEndpoint, { trigger });` |
| success | `const trigger = vi.fn().mockResolvedValue({...}); setMutationState(mergeEndpoint, { trigger });` |
| failure（rollback） | `const trigger = vi.fn().mockRejectedValue(apiError); setMutationState(mergeEndpoint, { trigger, error: apiError });` |

> mock wrapper 挙動: 既存 mock は `await state.trigger(...)` → `await options.onSuccess?.()` の順でラップする。
> success 時は `onSuccess`（`setStage("idle")` / `setMergeReason("")`）も走る。reject 時は `onSuccess` に到達せず
> 実装側 `.catch`（`clearTimeout` + `setIsExiting(false)`）が走る。

#### jsdom transitionend 制約への 2 系統対応

jsdom は CSS transition を実行せず `transitionend` を自動発火しない。exiting → removed を再現するため
次の 2 系統を使い分ける（各 TC の「jsdom 対応系統」列に明記）。

- **系統 (a) 明示発火**: row root 要素を取得し `fireEvent.transitionEnd(rowEl)` を呼ぶ。
  実 transition 完了相当のイベントを直接駆動する。
- **系統 (b) fake timer fallback**: `vi.useFakeTimers()` を `beforeEach`（または当該テスト先頭）で有効化し、
  `vi.advanceTimersByTime(250)`（= `EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS`）で timeout fallback を進めて
  `finalizeRemoval` を発火させる。テスト末尾で `vi.useRealTimers()` に戻す。fake timer と
  `waitFor` / Promise 解決を混在させる場合は `await vi.runOnlyPendingTimersAsync()` 併用を検討する。

> row root 要素の取得は `screen.getByText("conflict: c_1").closest("div[class*='rounded']")` のように
> 既存 class 由来でなく、可能なら `data-testid` を付けず **既存 DOM 構造**から辿る。
> 系統 (a) では `transitionEnd` を発火させる要素が transition class を持つ root div である必要がある点に注意する。

### 4.4 追加 / 更新する focused Vitest ケース一覧

`describe("IdentityConflictRow", ...)` 末尾へ以下を追加（既存 2 ケースは §4.5 で更新）。

| テストID | 内容 | 期待値 | jsdom 対応系統 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-EXIT-1 | merge 実行 click 直後、exiting 相に入るが row はまだ DOM に存在 | `screen.getByText("conflict: c_1")` が truthy（残存）。row root 要素が `opacity-0`（fade class）を持つこと（`className` に `opacity-0` を含む）。`trigger` が呼ばれていること | — （同期 / transitionend を発火させない） | AC-1 |
| TC-EXIT-2 | exiting 中に `transitionend` 発火で removed（DOM 除去） | `fireEvent.transitionEnd(rowEl)` 後、`waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())` | (a) 明示発火 | AC-2 |
| TC-EXIT-3 | `transitionend` が来なくても timeout fallback で removed | `vi.useFakeTimers()` → merge 実行 → `vi.advanceTimersByTime(250)` → `screen.queryByText("conflict: c_1")` が null | (b) fake timer | AC-2/AC-5(fallback) |
| TC-ROLLBACK | merge 409 で exiting 解除・row 復元・`mergeError` 表示・timer clear | `await waitFor(() => expect(trigger).toHaveBeenCalled())` 後、`screen.getByText("conflict: c_1")` 再表示。row root が `opacity-0` を**持たない**（exiting 解除）。`screen.getByText(/確認 2\/2/)` 維持。`screen.getByRole("alert").textContent` が `"すでに統合済みです"` を含む。さらに fake timer 系統で `vi.advanceTimersByTime(250)` を進めても row が消えない（timer clear 確認） | (b) fake timer（timer clear 検証）+ 通常 | AC-3 |
| TC-SUCCESS | success 後も row が removed のまま | success mock で merge 実行 → `transitionEnd` 発火（または fallback）で removed → `await waitFor(() => expect(screen.queryByText("conflict: c_1")).toBeNull())`。`onSuccess` の `setStage("idle")` が走っても `merge` ボタンは再表示されない（`screen.queryByRole("button", { name: "merge" })` が null） | (a) または (b) | AC-4 |
| TC-REDUCED | reduced-motion でほぼ即時に消える / motion-reduce class 存在 | (1) row root の `className` に `motion-reduce:transition-none` を含むこと（静的検証）。(2) fake timer fallback（系統 b）で `vi.advanceTimersByTime(250)` 後 row が null（reduced-motion 環境の即時消失を fallback でモデル化） | (b) fake timer | AC-5 |
| TC-DISMISS-UNCHANGED | dismiss は exiting/fade 非適用で挙動不変（回帰） | 別人マーク → 理由入力 → 別人として確定（成功 mock）。dismiss は exiting 相を経ず、`trigger` が `{ reason }` で呼ばれること。row root に exiting fade class（`opacity-0`）が**付かない**こと | — | AC-6 |

> private state は public 挙動経由で検証する。fade class の有無は「root 要素の `className` 文字列に
> `opacity-0` を含むか」で判定し、`isExiting` boolean を直接読まない（VSCPKR-03 相当）。

### 4.5 既存テストの更新方針（line 99 / line 155）

| 既存テスト | 現状 | 更新方針 |
| --- | --- | --- |
| `merge 実行直後に server 応答前でも row を optimistic に非表示にする`（spec line 99-118, `queryByText(...).toBeNull()`） | pending Promise で「即 `toBeNull`」を期待 | **exiting 導入で「即 null」は不成立**になる。更新後は「merge 実行直後は row が残るが exiting fade class が付く（= TC-EXIT-1 と同趣旨）」へ意味を変える。または `fireEvent.transitionEnd(rowEl)` / fake timer で `finalizeRemoval` を進めてから `toBeNull` を assert する。**TC-EXIT-1 / TC-EXIT-2 に役割を再配分し、本ケースは TC-EXIT-2（transitionEnd 後 null）相当へ書き換える** |
| `merge 失敗 (409) で optimistic 非表示を rollback し、reason / error が残る`（spec line 155-182） | `optimisticMerged=false` 復元 + error 残存を検証 | rollback の意味は不変だが、機構が `isExiting=false` + `clearTimeout` へ変わる。更新後は「409 で row 復元（exiting fade class なし）+ `確認 2\/2` 維持 + alert に `すでに統合済みです` + reason 残存」を検証し、**さらに timer clear 確認（fake timer 進行後も消えない）を追加**する。TC-ROLLBACK と統合してもよい |

> 既存 line 120-144「merge 成功後も row は非表示を維持する」は TC-SUCCESS と趣旨が重なる。
> 既存ケースは `transitionEnd` / fallback を進める形へ更新し、TC-SUCCESS と矛盾しないよう統合する。

### 4.6 RED 実行コマンド（targeted run / メモリ制約対策）

リポジトリルートから実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

> 全 vitest を回さず、対象ファイル 1 本に限定する。`@ubm-hyogo/web` は `apps/web/package.json` の `name`。

### 4.7 期待される失敗（RED 確認）

| ケース | Phase 5 実装前の挙動 | RED の意味 |
| --- | --- | --- |
| TC-EXIT-1 | `isExiting` 未実装 → 既存即時 `return null` で row が消える / fade class なし | FAIL（期待通り） |
| TC-EXIT-2 | `transitionend` ハンドラ未実装 → 既に row は消えており検証文脈が成立しない | FAIL（期待通り） |
| TC-EXIT-3 | timeout fallback 未実装 | FAIL（期待通り） |
| TC-ROLLBACK | `clearTimeout` / `isExiting=false` 未実装 → timer clear 検証が成立しない | FAIL（期待通り） |
| TC-SUCCESS | exiting 経由でないため transitionEnd 文脈が不成立 | FAIL（期待通り） |
| TC-REDUCED | `motion-reduce:transition-none` class 未付与 | FAIL（期待通り） |
| TC-DISMISS-UNCHANGED | dismiss は元から不変 → 概ね PASS（回帰 guard） | PASS（回帰維持） |

RED が想定どおり FAIL することを確認してから Phase 5 へ進む。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | exiting 相を追加する対象 |
| 既存テスト | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | mock ヘルパ踏襲 / line 99・155 更新 |
| 既存 e2e | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | Phase 6 で安定状態待ちへ更新（参照） |
| Phase 2 設計 | `../phase-2/phase-2.md` | state machine / jsdom 制約 §2.4 |
| 親 template | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-4/phase-4.md` | RED テスト記法 |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 不変条件 #10（参照のみ） |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-4/phase-4.md` | 追加/更新する focused Vitest ケース一覧（TC-EXIT-1〜3 / TC-ROLLBACK / TC-SUCCESS / TC-REDUCED / TC-DISMISS-UNCHANGED）と既存 line99/155 テストの更新方針、jsdom transitionend 対応 2 系統（明示発火 / fake timer fallback） |

## 統合テスト連携

- 本 Phase の focused Vitest は Phase 5 実装の受け入れ門（AC-7）。RED → GREEN を Phase 5 / Phase 6 で確認する。
- Phase 6 で fail path / 連打防止 / network error rollback / design token guard / legacy hook guard を拡充する。
- Playwright e2e（`admin-identity-conflicts.spec.ts`）は Phase 6 で「animation 中ではなく stable locator state を待つ」
  方針へ更新し、AC-8 を担保する。本 Phase の vitest 系統 (a)/(b) は jsdom 専用であり e2e とは独立。

## 完了条件（Phase 4）

- TC-EXIT-1 / TC-EXIT-2 / TC-EXIT-3 / TC-ROLLBACK / TC-SUCCESS / TC-REDUCED / TC-DISMISS-UNCHANGED を
  テストID・内容・期待値・jsdom 対応系統（a/b）・対応 AC とともに表で確定した。
- 既存 line 99 / line 155 テストの更新方針を明記した。
- private state を public 挙動（DOM 有無 / `role="alert"` / className）経由で検証する方針と命名規則整合確認を明記した。
- RED 実行コマンド（リポジトリルートから `--filter @ubm-hyogo/web`）と期待される失敗を確定した。
