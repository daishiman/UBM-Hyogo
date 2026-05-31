# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 10.1 受け入れ基準（AC）と blocker 判定

| # | 受け入れ基準 | 判定方法 | blocker か |
| --- | --- | --- | --- |
| AC-1 | merge 二段階 confirm（確認1/2 → 2/2）の遷移は従来通り動作する | vitest stage 遷移ケース / playwright | Yes（回帰） |
| AC-2 | 「merge 実行」click 直後、server round-trip 完了を待たず該当 row が一覧から即座に消える | vitest optimistic hide / playwright「merge 後即時消失」 | **Yes（本タスク中核）** |
| AC-3 | merge success 後も該当 row は消えたまま（再表示されない） | vitest success-stays-hidden / playwright | Yes |
| AC-4 | merge success 後 `router.refresh()` により list が server truth に後追い整合する | 既存 hook の onSuccess 経路（実装維持） | Yes |
| AC-5 | server error 時のみ該当 row が復元（rollback）する | vitest rollback / playwright「server error で復元」 | **Yes（本タスク中核）** |
| AC-6 | rollback 後、inline error（`role="alert"` / `aria-live`）が該当 row に表示される | vitest rollback / playwright | Yes |
| AC-7 | optimistic state が他 row に波及しない（cross-row race なし） | component-local state（Phase 2.1 構造保証）+ 複数 row playwright | Yes |
| AC-8 | dismiss 経路は不変（optimistic 化しない） | vitest dismiss ケース（既存維持） | Yes |
| AC-9 | 不変条件 #1/#2/#9/#10 を維持（API/トークン/primitive/legacy hook） | Phase 9 ゲート 5・6 / grep | Yes |

> blocker（Yes）が 1 件でも未達なら Phase 11（VISUAL capture）に進まない。

## 10.2 partial fix 検出（FB-CANCEL-004-1）

optimistic update は「**state 追加だけで render 分岐を入れ忘れる**」partial fix が起きやすい。state（producer）を足しても consumer（render 分岐 `return null`）まで通っていなければ row は消えず、AC-2 が見かけ green でも実効しない。

| 検出ポイント | 確認内容 | partial fix の兆候 |
| --- | --- | --- |
| producer | `setOptimisticMerged(true)` が `onMerge` 先頭で呼ばれる | 呼び出しはあるが render に届かない |
| consumer | `if (optimisticMerged) return null;` が render 冒頭に存在 | **分岐欠落 = partial fix**（state だけ追加され row が消えない） |
| rollback consumer | `catch` で `setOptimisticMerged(false)` | catch が no-op のまま = rollback 不発 |
| 検証 guard | vitest「optimistic hide」が DOM 消失（`queryByText(...)` が null）を assert | assertion が state 値のみ参照していると consumer 欠落を見逃す → **DOM 消失で assert すること** |

> レビュー時は「state を追加したか」ではなく「**DOM から row が消えたか（consumer まで通ったか）**」を必ず確認する。

## 10.3 不変条件・スコープ最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は 3 file（`IdentityConflictRow.tsx` / `IdentityConflictRow.spec.tsx` / `admin-identity-conflicts.spec.ts`）のみ | 範囲逸脱なし |
| `useAdminMutation` hook 未変更 | 維持 |
| page.tsx（Server Component）未変更 | 維持 |
| API endpoint / contract / D1 schema 未変更（#1） | 維持 |
| dismiss 経路不変（AC-8） | 維持 |

## 10.4 MINOR 指摘と未タスク化（unassigned-task-guidelines 準拠）

blocker ではない MINOR 指摘は Phase 12 の未タスク（unassigned-task）化対象として記録する。本タスクでは以下を未タスク候補として挙げる。

| 候補 | 区分 | 根拠 | 扱い |
| --- | --- | --- | --- |
| dismiss 側の optimistic 化 | MINOR / followup | Issue #988 が明示的にスコープ外宣言（dismiss 不変が受け入れ基準）。merge と挙動を揃える UX 改善余地はある | **未タスク候補**（Phase 12 detection で formalize 判定）。本サイクルでは実装しない |
| optimistic hide の transition / fade アニメーション | MINOR / followup | Issue スコープ外（Phase 2.2 で要件外と確定）。即時 `return null` で機能要件は充足 | 未タスク候補（優先度低） |

> 上記は blocker ではないため Phase 11 進行を阻害しない。Phase 12 の unassigned-task-detection で改めて formalize 要否を判定する。

## 10.5 最終レビュー判定

**GATE: PASS 条件** — AC-1〜AC-9 が全て green、かつ §10.2 の partial fix（consumer 分岐欠落）が検出されないこと。MINOR（dismiss optimistic 化・アニメーション）は未タスク候補として Phase 12 へ送る。条件を満たせば VISUAL capture（Phase 11）へ進行可。
