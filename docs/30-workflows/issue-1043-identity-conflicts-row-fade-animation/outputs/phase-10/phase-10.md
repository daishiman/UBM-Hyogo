# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 10（最終レビュー） |
| 編集対象 | `IdentityConflictRow.tsx` / `IdentityConflictRow.spec.tsx` / `admin-identity-conflicts.spec.ts` の 3 file |
| GATE 条件 | AC-1〜AC-11 全充足 + partial fix（consumer 断絶）不在 + BLOCKER 0 件 |

## 目的

AC-1〜AC-11 を 1 件ずつ充足判定の観点で表にし（実装後に埋める前提の判定基準を提示）、BLOCKER / MINOR の判定基準を定め、partial fix（consumer wiring の断絶）が起きないことを確認する。MINOR は Phase 12 で未タスク化を検討する（MINOR → 未タスク化ルール）。

## 実行タスク

### 10.1 受け入れ基準（AC）充足判定の観点

> 各行の「判定方法 / 判定基準」は実装後に green / 充足を埋める前提のチェックリスト。BLOCKER 列が Yes の AC は 1 件でも未達なら Phase 11（VISUAL capture）に進まない。

| # | 受け入れ基準 | 判定方法 | 判定基準（充足条件） | BLOCKER |
| --- | --- | --- | --- | --- |
| AC-1 | merge 二段階 confirm 完了直後、該当 row が fade out / collapse を開始（exiting 相） | vitest（exiting 開始）/ playwright | click 直後 row が DOM 残存のまま `opacity-0` 等の exiting class が付与される | **Yes（中核）** |
| AC-2 | fade 完了後、row が DOM から除去（removed 相 = `return null`） | vitest（removed 遷移・transitionEnd / fake timer）/ playwright | transitionEnd or timeout fallback 後に `queryByText(conflictId)` が null / `toHaveCount(0)` | **Yes（中核）** |
| AC-3 | server error（4xx/5xx/network）で exiting 解除 → row 復元 + inline error（`role="alert"`）、exit timer は clear | vitest（rollback）/ playwright | reject 後 `isExiting=false` で row 再表示 + `role="alert"` surface + timer clear（leak なし） | **Yes（中核）** |
| AC-4 | server 成功時、row は exiting → removed のまま再表示されない。`router.refresh()` が後追い整合 | vitest（success-stays-removed）/ 既存 hook onSuccess 経路 | resolve 後 row が消えたまま。`optimisticMerged` true 維持 | Yes |
| AC-5 | reduced-motion 環境で animation 抑制（transition≈0）→ ほぼ即時 row 消失。removed は timeout fallback で保証 | vitest（reduced-motion 即時）/ 3 重保証（globals.css + `motion-reduce` variant + fallback） | transition≈0 で transitionEnd 即発火 → 即 removed。fallback でも removed 到達 | Yes |
| AC-6 | dismiss 側の挙動は不変（exiting / fade 非適用） | vitest（dismiss 既存）/ diff 確認 | dismiss 経路に `isExiting` / fade class が一切入らない | Yes |
| AC-7 | focused Vitest 全 green（exiting / removed / rollback / reduced-motion / success-stays-removed） | Phase 9 ゲート 3 | 5 ケース + 既存ケース all-green | Yes |
| AC-8 | Playwright e2e 全 green（fade 後安定状態で row 消失 / rollback で復元）。安定 locator state を待つ | Phase 9 ゲート 4 | 中間状態でなく `toHaveCount(0)` / `toBeVisible()` の終状態で PASS | Yes |
| AC-9 | `pnpm typecheck` / `pnpm --filter web lint` green | Phase 9 ゲート 1・2 | 型エラー / lint 違反 0 | Yes |
| AC-10 | legacy `@/lib/useAdminMutation` 未参照（0 件）。HEX 直書き / inline style 追加なし（`verify-design-tokens` green） | Phase 9 ゲート 5・6 | grep 0 件 + token gate PASS | Yes |
| AC-11 | Phase 11 で exiting-fade / removed-stable / rollback-restored の状態遷移 screenshot 取得（staging auth 必須で user-gated。取得不能時 two-tier: local jsdom render + 自動テスト） | Phase 11 capture metadata | canonical 3 screenshot path 記録 or two-tier evidence で代替記録 | No（VISUAL・user-gated） |

> AC-11 は staging 認証必須で user-gated のため BLOCKER 外（two-tier evidence で代替可）。AC-1〜AC-10 の BLOCKER=Yes が全充足のときのみ Phase 11 へ進行する。

### 10.2 BLOCKER / MINOR 判定基準

| 区分 | 判定基準 |
| --- | --- |
| **BLOCKER** | AC-1〜AC-10 のうち BLOCKER=Yes が未達 / partial fix（consumer 断絶）検出 / 不変条件 #1・#2・#9・#10 違反 / timer leak（rollback で row が戻らない）/ token gate fail のいずれか。1 件でも該当すれば Phase 11 進行不可 |
| **MINOR** | AC を阻害しない改善余地（scale 補助の有無・dismiss 側 fade 適用・animation duration tuning 等）。Phase 11 進行は阻害せず、Phase 12 の unassigned-task-detection で未タスク化を検討（MINOR → 未タスク化ルール） |

### 10.3 partial fix 検出（consumer wiring 断絶の不在確認）

exiting fade は「**state（`isExiting`）を足したが render の class 付与 / transitionEnd / removed 遷移を繋ぎ忘れる**」partial fix が起きやすい。producer だけ動いても consumer まで通らなければ fade は見かけ上動かない。本タスクは **単一 component に閉じる**ため cross-file の consumer wiring 断絶は構造的に発生しないが、component 内の producer→consumer の連結を以下で確認する。

| 連結ポイント | producer | consumer | partial fix の兆候 |
| --- | --- | --- | --- |
| exiting 視覚 | `onMerge` で `setIsExiting(true)` | JSX root に `isExiting ? "opacity-0 ..." : ""` の class 付与 + `transition-*` | state は立つが class 未付与 → fade しない |
| removed 遷移 | `onTransitionEnd` / timeout fallback | `finalizeRemoval()` → `setOptimisticMerged(true)` → `if (optimisticMerged) return null;` | transitionEnd / timer が `finalizeRemoval` を呼ばない → 消えない |
| rollback 復元 | `.catch` で `clearExitTimer()` + `setIsExiting(false)` | render が visible 相へ戻る + `mergeError` inline 表示 | `.catch` が no-op → row が消えたまま戻らない（最悪事故） |
| timer 解放 | `clearExitTimer()`（3 経路） | `exitTimerRef.current = null` | clear 忘れ → leak / 二重 removed |

> **consumer wiring 確認**: row は単一 component に閉じる（page.tsx / hook へ producer/consumer が跨らない）ため、cross-component 断絶は不在。確認は component 内の上記 4 連結に限定し、「DOM から row が消えた / 戻った（consumer まで通った）」を vitest で assert する（state 値のみの assertion にしない）。

### 10.4 不変条件・スコープ最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は 3 file（`IdentityConflictRow.tsx` / `*.spec.tsx` / playwright spec）のみ | 範囲逸脱なし |
| `useAdminMutation` hook 未変更 | 維持 |
| page.tsx（Server Component）未変更 | 維持 |
| globals.css / tokens.css 未変更（既存 reduced-motion 基盤流用） | 維持 |
| API endpoint / contract / D1 schema 未変更（#1） | 維持 |
| dismiss 経路不変（AC-6） | 維持 |

### 10.5 MINOR 指摘と未タスク化候補（Phase 12 へ送る）

| 候補 | 区分 | 根拠 | 扱い |
| --- | --- | --- | --- |
| `scale-[0.99]` collapse 補助の採否 | MINOR | opacity 単独で AC 充足（Phase 3.4 MINOR-1）。collapse 感の UX 微調整余地 | Phase 12 で未タスク化検討（本サイクル実装は opacity 主・scale 任意で確定） |
| dismiss 側への fade 適用（merge と挙動統一） | MINOR / followup | #1043 スコープ外（AC-6: dismiss 不変）。別タスク #1042 と関連 | Phase 12 で未タスク化検討。本サイクル実装しない |
| #988 screenshot（`identity-conflict-row-optimistic-removed.png`）の意味 drift | MINOR-2（Phase 3.4） | #988 は「即時削除」時点の証跡。本タスクで「fade 後安定 removed」へ意味変化 | #988 成果物は越境編集せず、#1043 側 Phase 11 metadata に注記（スコープ内・未タスク化不要） |

> 上記 MINOR は BLOCKER ではなく Phase 11 進行を阻害しない。Phase 12 の unassigned-task-detection で改めて formalize 要否を判定する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF Phase 1 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-1/phase-1.md` | AC-1〜AC-11 原文（§1.8）/ artifact canonical（§1.9） |
| 本WF Phase 3 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-3/phase-3.md` | MINOR-1 / MINOR-2（§3.4） |
| 本WF Phase 9 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-9/phase-9.md` | 品質ゲート一括判定セット |
| 兄弟テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-10/phase-10.md` | AC 表 / partial fix 検出 / MINOR 未タスク化書式 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | consumer wiring 連結点 |

## 成果物

- AC-1〜AC-11 の充足判定観点表（§10.1）。
- BLOCKER / MINOR 判定基準（§10.2）。
- partial fix（consumer wiring 断絶）不在確認 — row は単一 component に閉じる（§10.3）。
- 不変条件・スコープ最終確認（§10.4）/ MINOR 未タスク化候補（§10.5）。

## 統合テスト連携

- §10.1 の AC 判定は Phase 7 coverage・Phase 9 ゲート結果を集約して埋める。
- §10.3 の partial fix 確認は Phase 9 ゲート 3（vitest が DOM 消失 / 復元を assert）と連動。
- AC-11 充足は Phase 11 capture metadata（canonical 3 screenshot or two-tier evidence）へ接続する。

## 完了条件（Phase 10）

| 項目 | 基準 |
| --- | --- |
| AC 充足表 | AC-1〜AC-11 が 1 件ずつ判定方法 / 判定基準 / BLOCKER 区分とともに表化されている |
| GATE 条件 | AC-1〜AC-10 の BLOCKER=Yes が全充足 + partial fix 不在 + BLOCKER 0 件 のとき Phase 11 進行可 |
| partial fix | consumer wiring（component 内 4 連結）が断絶しないこと、row が単一 component に閉じ cross-file 断絶が不在であることを明記 |
| MINOR | MINOR 指摘を Phase 12 未タスク化候補として記録 |
