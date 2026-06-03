**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| optimistic state の責務分離（mirror 化） | merge の `optimisticMerged` を dismiss へ mirror する際、単一 boolean に統合せず `optimisticDismissed` を別途持ち、render guard だけ `||` で合流させる判断が有効。rollback 責務の取り違えを構造的に防ぐ | #988 の L-OPTMUT 系は単一 boolean 前提のため、dual-mirror（複数 optimistic boolean の OR 合流）は #1042 固有知見。`lessons-learned-issue-1042-dismiss-optimistic-2026-06.md` の **L-I1042-001** に新規記録した |
| rollback 時の入力保持 | `.catch` で `setDismissReason("")` を呼ばないことが理由保持（AC-3）の要点。success（`onSuccess`）でのみ clear する非対称設計を明示した | dismiss 固有（merge には reason 保持要件なし）のため、success/error 非対称 reset を **L-I1042-002** に新規記録した |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| 既実装 mirror の事前調査 | 本タスクは #988 / #1046 の dismiss 側 mirror。実コード（`IdentityConflictRow.tsx`）を grep し `optimisticMerged` 実装済み / `optimisticDismissed` 未実装を確定してから spec 化した。obsolete でないことを実証 | 既存「実コード突合による未解決確認」practice で十分。新規ルール化は no-op |
| open issue の状態確認 | Issue #1042 は OPEN（ユーザー認識「クローズド」と乖離）と記録した。状態変更は user-gated とした | 既存 workflow practice で十分。新規ルール化は no-op |
| VISUAL evidence の同一 wave 取得 | VISUAL_ON_EXECUTION タスクとして canonical 名・撮影状態・3層評価を固定し、同一 wave で screenshot 2 PNG と Playwright log を取得した | 既存 FB-VISUAL-CAP-001 で十分。追加改善なし |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | implementation-guide の確定コード（`setOptimisticDismissed` / `optimisticDismissed` / `onDismiss` / `dismissReason` / `dismissError`）を実コードの既存識別子と一致させ、本 wave で grep 確認する運用は drift 防止に有効 | 現行 W1-02b-3 ルールで十分。追加改善なし |
| screenshot canonical 名の衝突回避 | merge 側 #988 の `-merge-final` / `-optimistic-removed` / `-rollback-error` と衝突しない `-dismiss-optimistic-removed` / `-dismiss-rollback-error` を採用し、同一 component の screenshot 名前空間を分離した | 現行 FB-VISUAL-CAP-001 ルールで十分。追加改善なし |

---

## 総括

SKILL.md 本体へ昇格すべき新ルール（gate / policy）は検出されなかった。本タスクは #988（merge optimistic）の「optimistic row mutation + rollback + API error body surfacing パターン」（L-I988-001..006）の dismiss 側 mirror であり、その大半は継承で吸収できる。

一方、#988 が単一 optimistic boolean 前提だったのに対し、#1042 では **同一 component 上の merge/dismiss 2 つの optimistic boolean を dual-mirror で扱う**ことで以下の固有知見が判明したため、#988 が専用 lesson file を持つ慣例に整合させて aiworkflow-requirements の lessons-learned へ same-wave sync した（`lessons-learned-issue-1042-dismiss-optimistic-2026-06.md` / L-I1042-001..004）:

- L-I1042-001: 複数 optimistic boolean の独立保持 + render guard `||` 合流（dual-mirror）
- L-I1042-002: rollback 時 reason retention の success/error 非対称 reset
- L-I1042-003: cross-mirror 非干渉（dismiss rollback → merge 経路）の focused test 追加
- L-I1042-004: 同一 component の screenshot 名前空間分離（`-dismiss-` prefix）

artifact inventory の `## Lessons Learned` 節・changelog・SKILL-changelog から本 lesson file へ link 済み。task-specification-creator 本体の pattern rule は #988 L-OPTMUT 系で十分なため追加なし（no-op）。
