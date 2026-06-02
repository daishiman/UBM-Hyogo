# Phase 10: 最終レビュー

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 10.1 受け入れ基準（AC-1..AC-5）達成判定マトリクス

| # | 受け入れ基準 | 判定方法 | blocker か |
| --- | --- | --- | --- |
| AC-1 | optimistic state は merge / dismiss で分離される（`optimisticMerged` と `optimisticDismissed` を別 boolean とし、error surface も `mergeError` / `dismissError` で独立する） | コードレビュー（state 宣言の分離）+ vitest cross-state 非波及ケース | **Yes（Issue 中核・苦戦箇所）** |
| AC-2 | 「別人として確定」click 直後、server round-trip 完了を待たず該当 row が一覧から即座に消える | vitest dismiss optimistic hide / Playwright「dismiss 後即時消失」 | **Yes（本タスク中核）** |
| AC-3 | server error 時のみ該当 row が復元（rollback）し、`dismissReason` が保持され、inline error（`dismissError` / `role="alert"` / `aria-live`）が該当 row に表示される | vitest dismiss rollback / Playwright「server error で復元」 | **Yes（本タスク中核）** |
| AC-4 | merge 経路は完全不変（二段階 confirm・optimistic hide・success-stays-hidden・rollback が回帰なし） | vitest merge 既存 10 ケース全 PASS / Playwright merge シナリオ | Yes（回帰） |
| AC-5 | 不変条件 #1 / #2 / #5 / #9 / #10 を維持（既存 API のみ / OKLch トークン / D1 非接触 / primitive 経由 / features hook 経由） | Phase 9 ゲート 5・6 / grep / コードレビュー | Yes |

> blocker（Yes）が 1 件でも未達なら Phase 11（VISUAL capture）に進まない。

### 補助確認（AC を支える派生観点）

| 観点 | 確認内容 | 紐づく AC |
| --- | --- | --- |
| success-stays-hidden | dismiss success 後も row は消えたまま（`optimisticDismissed` true 維持・`router.refresh()` が list を後追い整合） | AC-2 |
| cancel 非 optimistic | `cancelDismiss` は `onDismiss` 実行前のため optimistic 化しない（解放漏れリスク構造的にゼロ・Phase 2.5） | AC-2 / AC-3 |
| cross-row 非波及 | optimistic state は component-local（Phase 2.1）。dismiss が他 row に波及しない | AC-1 |

## 10.2 partial fix 検出（producer / consumer 整合）

optimistic update は「**state 追加だけで render guard への合流を入れ忘れる**」partial fix が起きやすい。`optimisticDismissed`（producer）を足しても、render guard の OR 合流（consumer）まで通っていなければ row は消えず、AC-2 が見かけ green でも実効しない。

| 検出ポイント | 確認内容 | partial fix の兆候 |
| --- | --- | --- |
| producer | `setOptimisticDismissed(true)` が `onDismiss` 先頭で呼ばれる | 呼び出しはあるが render に届かない |
| consumer | render guard が `if (optimisticMerged \|\| optimisticDismissed) return null;` へ **合流済み** | **`optimisticMerged` のみのまま = partial fix**（dismiss state だけ追加され row が消えない） |
| rollback consumer | `catch` で `setOptimisticDismissed(false)`（`dismissReason` は clear しない） | catch が no-op のまま = rollback 不発 / reason まで clear すると AC-3 違反 |
| 検証 guard | vitest「dismiss optimistic hide」が DOM 消失（`queryByText(...)` が null）を assert | assertion が state 値のみ参照していると consumer 欠落を見逃す → **DOM 消失で assert すること** |

> レビュー時は「state を追加したか」ではなく「**DOM から row が消えたか（guard 合流まで通ったか）**」を必ず確認する。

## 10.3 merge 回帰の確認（最重要・unintended drift 防止）

本タスクは render guard を `optimisticMerged` 単独から `optimisticMerged || optimisticDismissed` へ書き換える。merge 挙動への影響がないことを明示確認する。

| 確認 | 結果 |
| --- | --- |
| `optimisticDismissed` 初期値 `false` のため、dismiss 未操作時は guard の評価結果が merge 単独と同一 | merge optimistic hide / success-stays-hidden / rollback いずれも不変 |
| merge stage markup（`merge-confirm` / `merge-final`）未変更 | 二段階 confirm 遷移 不変 |
| `onMerge` / `cancelMerge` / `mergeMutation` 未変更 | merge rollback / reason 保持 不変 |
| vitest merge 既存 10 ケース | 全 PASS（回帰なし）であることを Phase 9 ゲート 3 で固定 |

## 10.4 不変条件・スコープ最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は 3 file（`IdentityConflictRow.tsx` / `IdentityConflictRow.spec.tsx` / `admin-identity-conflicts.spec.ts`）のみ | 範囲逸脱なし |
| `useAdminMutation` hook 未変更 | 維持 |
| page.tsx（Server Component）未変更 | 維持 |
| API endpoint `/dismiss` / contract / D1 schema 未変更（#1 / #5） | 維持 |
| merge 経路不変（AC-4） | 維持 |

## 10.5 MINOR 指摘と未タスク化（unassigned-task-guidelines 準拠）

blocker ではない MINOR 指摘は Phase 12 の未タスク（unassigned-task）化対象として記録する。本タスクでは以下を未タスク候補として挙げる。

| 候補 | 区分 | 根拠 | 扱い |
| --- | --- | --- | --- |
| optimistic hide の transition / fade アニメーション（merge / dismiss 共通） | MINOR / followup | 即時 `return null` で機能要件は充足。fade は Issue スコープ外（Phase 3.3 で followup-005 へ分離済み） | **未タスク候補**（Phase 12 detection で formalize 判定）。本サイクルでは実装しない |
| merge / dismiss optimistic handler の構造的対称を共通ヘルパー化 | MINOR / refactor | 現状は state 分離原則のため意図的に共通化を見送り（Phase 8.3）。将来 optimistic 操作が 3 種以上に増えた場合のみ再検討余地 | 未タスク候補（優先度低・現時点では over-abstraction） |

> 上記は blocker ではないため Phase 11 進行を阻害しない。Phase 12 の unassigned-task-detection で改めて formalize 要否を判定する。

## 10.6 最終レビュー判定

**GATE: PASS 条件** — AC-1〜AC-5 が全て green、§10.2 の partial fix（guard 合流欠落 / rollback で reason まで clear）が検出されず、§10.3 の merge 回帰なしが確認されること。MINOR（fade アニメーション・handler 共通化）は未タスク候補として Phase 12 へ送る。条件を満たせば VISUAL capture（Phase 11）へ進行可。
