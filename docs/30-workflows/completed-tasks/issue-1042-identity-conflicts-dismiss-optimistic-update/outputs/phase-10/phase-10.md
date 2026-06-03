# Phase 10: 最終レビュー

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION` / `workflow_state: implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #1042（identity-conflicts dismiss optimistic update / FU-AIDC-006） |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 本フェーズの目的 | 受け入れ基準（AC-1..10）の充足見込み判定と blocker / MINOR 指摘の確定 |

## 10.1 受け入れ基準（AC）と充足見込み・blocker 判定

> 本サイクルは implemented_local_evidence_captured。判定は実コード・focused Vitest・Playwright・screenshot による実績である。

| # | 受け入れ基準 | 充足見込みの根拠（spec 手順） | 判定 | blocker か |
| --- | --- | --- | --- | --- |
| AC-1 | dismiss 実行 click 直後、server round-trip を待たず該当 row が即座に消える | `onDismiss` 先頭 `setOptimisticDismissed(true)` + render `if (... \|\| optimisticDismissed) return null;`（Phase 8.2） | 充足見込み | **Yes（本タスク中核）** |
| AC-2 | server error 時のみ row が復元（rollback）し、`dismissReason` 保持 + `role="alert"` で error 表示 | `.catch(() => setOptimisticDismissed(false))`（`dismissReason` 非クリア）+ 既存 dismiss error markup（`role="alert"`）（Phase 8.2） | 充足見込み | **Yes（本タスク中核）** |
| AC-3 | dismiss success 後も row は消えたまま（再表示されない） | `onSuccess` で `optimisticDismissed` を true 維持。`router.refresh()`（既存 hook）が list を後追い整合（Phase 8.2） | 充足見込み | Yes |
| AC-4 | dismiss optimistic state（`optimisticDismissed`）が merge（`optimisticMerged`）と分離 | 独立 boolean を 2 個保持・union 化しない（Phase 8.3） | 充足見込み | Yes |
| AC-5 | merge 経路は不変（非回帰） | `onMerge` / `optimisticMerged` / merge stage markup を一切変更しない（Phase 8.2） | 充足見込み | Yes |
| AC-6 | focused vitest（dismiss optimistic hide / rollback+理由保持 / success-stays-hidden / merge 非回帰）が PASS | Phase 9.3 #3 / Phase 9.5 のケース設計 | 充足見込み | Yes |
| AC-7 | playwright focused（dismiss 即時消失 / server error 復元）が PASS | Phase 9.3 #4 / Phase 11 capture シナリオ | 充足見込み | Yes |
| AC-8 | typecheck + lint green | Phase 9.3 #1・#2 | 充足見込み | Yes |
| AC-9 | legacy `@/lib/useAdminMutation` 未参照（features 経由維持） | Phase 9.3 #6 grep 0 件（不変条件 #10） | 充足見込み | Yes |
| AC-10 | VISUAL screenshot 3 枚（dismiss confirm / optimistic removed / rollback error） | Phase 11 capture 計画（status captured・実装時 capture） | 充足（captured） | Yes |

> blocker（Yes）が 1 件でも未達なら Phase 11（VISUAL capture）に進まない。本サイクルでは spec 手順が全 AC を満たす見込みであり blocker 解消の経路が定義済み。

## 10.2 partial fix 検出（FB-CANCEL-004-1）

dismiss optimistic update も merge 側（#988 Phase 10.2）と同じく「**state 追加だけで render 分岐へ統合し忘れる**」partial fix が起きやすい。`optimisticDismissed` を足しても render guard の OR 統合まで通っていなければ row は消えず、AC-1 が見かけ green でも実効しない。

| 検出ポイント | 確認内容 | partial fix の兆候 |
| --- | --- | --- |
| producer | `setOptimisticDismissed(true)` が `onDismiss` 先頭で呼ばれる | 呼び出しはあるが render に届かない |
| consumer | render 冒頭 early return が `if (optimisticMerged \|\| optimisticDismissed) return null;` へ統合されている | **OR への統合欠落 = partial fix**（`optimisticDismissed` を見ない guard のまま → dismiss で row が消えない） |
| rollback consumer | `catch` で `setOptimisticDismissed(false)` かつ `dismissReason` を**クリアしない** | catch が no-op / 理由クリア = rollback 不発・理由喪失（AC-2 違反） |
| 検証 guard | vitest「dismiss optimistic hide」が DOM 消失（`queryByText(...)` が null）を assert | assertion が state 値のみ参照していると consumer 欠落を見逃す → **DOM 消失で assert すること** |

> レビュー時は「state を追加したか」ではなく「**DOM から row が消えたか（OR guard まで通ったか）**」「rollback 後に `dismissReason` が残るか」を必ず確認する。partial_fix は本タスクでは想定しない（component-local 完結で producer→consumer が同一ファイル内）。

## 10.3 不変条件・スコープ・consumer wiring 最終確認

| 確認 | 結果 |
| --- | --- |
| 編集対象は 3 file（`IdentityConflictRow.tsx` / `IdentityConflictRow.spec.tsx` / `admin-identity-conflicts.spec.ts`）のみ | 範囲逸脱なし |
| `useAdminMutation` hook 未変更 | 維持 |
| page.tsx（Server Component）未変更 | 維持 |
| dismiss endpoint `/api/admin/identity-conflicts/:id/dismiss` / payload `{ reason }` 不変（#1） | 維持 |
| merge 経路不変（AC-5） | 維持 |
| consumer wiring 断絶なし | **なし** — producer（`setOptimisticDismissed`）も consumer（render OR guard）も同一 component 内で完結（component-local）。page / hook / API への配線追加は不要 |

## 10.4 MINOR 指摘と未タスク化（unassigned-task-guidelines 準拠）

blocker ではない MINOR 指摘は Phase 12 の未タスク（unassigned-task）化対象として記録する。partial_fix は本タスクでは発生しない（全 AC が spec 手順で充足見込み）。

| 候補 | 区分 | 根拠 | 扱い |
| --- | --- | --- | --- |
| dismiss row の fade / transition アニメーション | MINOR / followup | Issue #1042 明示スコープ外（即時 `return null` で機能要件は充足）。merge 側（#988）でも未タスク候補として送出済み | **未タスク候補**（Phase 12 detection で formalize 判定）。優先度低 |
| screen reader live region（`aria-live`）の最適化 | MINOR / followup | rollback error は既存 `role="alert"` で読み上げ可能だが、optimistic 消失自体のアナウンス最適化余地はある（issue スコープ外） | 未タスク候補（優先度低） |

> 上記は blocker ではないため Phase 11 進行を阻害しない。Phase 12 の unassigned-task-detection で改めて formalize 要否を判定する。

## 10.5 最終レビュー判定

**GATE: PASS 条件** — AC-1〜AC-10 が全て充足見込み（実装サイクルで green / VISUAL は pending capture）、かつ §10.2 の partial fix（OR guard 統合欠落・理由喪失）が検出されないこと。consumer wiring 断絶なし（component-local 完結）。MINOR（fade アニメーション・live region 最適化）は未タスク候補として Phase 12 へ送る。条件を満たせば VISUAL capture（Phase 11・実装サイクル）へ進行可。

## 完了条件

- [ ] AC-1..10 の充足見込みを 1 件ずつ table（§10.1）で判定している。
- [ ] blocker 判定を各 AC に付与している。
- [ ] §10.2 で partial fix 検出ポイント（OR guard 統合欠落・理由喪失）を定義し、partial_fix は本タスクでは想定しないと明記している。
- [ ] consumer wiring 断絶なし（component-local 完結）を確認している（§10.3）。
- [ ] MINOR 指摘（fade アニメーション・screen reader live region）を列挙し Phase 12 unassigned 候補へ繋いでいる（§10.4）。
- [ ] 末尾に最終レビュー判定（§10.5 GATE）を置いている。
