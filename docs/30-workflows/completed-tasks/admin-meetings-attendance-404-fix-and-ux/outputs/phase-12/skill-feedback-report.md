**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| transport 不整合バグの真因記述 | 「404」という現象から「proxy の transport（service binding / HTTP）が GET/POST で非対称」という構造的真因へ落とすには、両経路（`server-fetch.ts` の binding 経路 vs `route.ts` の HTTP 経路）をコード行で対比した表（index §真因 A）が有効だった | 既存の真因テーブル practice で十分。新規ルール化は no-op |
| 既存 transport の mirror 化 | Task A は `server-fetch.ts` の確定ロジック（`getAdminServiceBinding` / `binding.fetch` / `logAdminTransport` / `isTestOrPlaywright` 隔離）を proxy へ移植する mirror。mirror 元の識別子を implementation-guide に逐語引用し drift を防ぐ運用が有効 | 既存 W1-02b-3（identifier drift 防止）で十分。追加改善なし |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| バグ + UX を 1 サイクルに束ねる判断 | 404（バグ）と出席管理 UX は「404 が直らないと出席 UI に到達できない」因果で連結しており、AskUserQuestion で「一括（1 サイクル）」が承認された。両者を分割すると UX 側が永久に検証不能になるため統合が妥当だった | 既存 CONST_007（1 サイクル完了）判断で十分。新規ルール化は no-op |
| 単一経路の回帰リスク明示 | proxy は全 admin mutation の単一経路のため、transport 切替が tags / member-status / requests を巻き込む。AC-A5 で回帰必須化した（Phase 3 §3.3） | 既存リスク表 practice で十分。追加改善なし |
| implemented_local_runtime_pending の VISUAL 取り扱い | local implementation + focused Vitest を完了し、staging 認証必須 screenshot は pending として placeholder PNG を作らず canonical 名のみ Phase 11 / implementation-guide で一致させた | 既存 FB-VISUAL-CAP-001 + runtime pending 運用で十分。追加改善なし |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| state 由来カウントの stale 回避記述 | 出席人数バッジは `MeetingItem.attendance`（初期値）ではなく `MeetingsClientShell` の `attended` state 由来で算出する設計を、state 引き渡しテーブル（Phase 2 §2.3）で明示した。stale バグの再発防止に有効 | 既存 state 引き渡しテーブル practice で十分。追加改善なし |
| Step 2 N/A の根拠記述 | proxy transport 統一は「内部実装変更で API contract 不変」と判定軸テーブルで明記し、Step 2 N/A の根拠を残した | 既存 Step 2 判定軸テーブルで十分。追加改善なし |

---

## 総括

SKILL.md 本体へ昇格すべき新ルール（gate / policy）は検出されなかった。本タスクは (1) 既存 transport（`server-fetch.ts`）の mirror 化による 404 修正、(2) 既存 state（`attended`）由来の UI 強化、という 2 つの「既存資産流用」パターンで構成され、いずれも現行の task-specification-creator / aiworkflow-requirements の practice（真因テーブル / identifier drift 防止 / state 引き渡しテーブル / 単一経路回帰必須化 / VISUAL runtime pending）で十分に吸収できる。

global skill sync は current fact（404 真因 = proxy transport 非対称 / 修正 = service binding 統一 / focused Vitest PASS）の索引登録に限定する。skill 本体定義の変更・新規 lesson file の追加は不要（no-op）。
