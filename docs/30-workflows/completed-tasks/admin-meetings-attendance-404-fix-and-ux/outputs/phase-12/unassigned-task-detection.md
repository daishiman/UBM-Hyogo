**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending`

> 0 件でも出力必須。検出ソースを網羅し、候補は理由付きで記録する。current（本サイクル新規）と baseline（既存スコープ外）を分離する。

---

## 検出ソース一覧

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」 | Phase 1 / index で明示的にスコープ外宣言した項目 | 候補 2 件（INTERNAL_API_BASE_URL 実値修正 / 出席 CSV import UI 化） |
| Phase 10 §10.6 MINOR 候補 | 優先度低の discretionary enhancement | 候補 2 件（transport util 共通化 / バッジ色強調）。いずれも YAGNI / 装飾レベルで起票不要 |
| Phase 3 リスク | リスク表の MINOR / 監視項目 | 新規 HIGH なし |
| Phase 10 レビュー MINOR | MINOR 判定の指摘事項 | 構造的別件なし（先送りでなく既存スコープで吸収） |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | HIGH なし（implemented_local_runtime_pending・実機操作は後続） |
| コードコメント（TODO / FIXME / HACK / XXX） | 対象 4 ファイルの新規残存コメント | spec 段階のため新規コードなし → 0 |
| `describe.skip` ブロック | 削除 testid / 要素名の旧参照残存 | spec 段階のため新規なし → 0 |

---

## current（本サイクル新規検出）

本サイクルで新規に formalize（起票）すべき未割当タスク候補は **0 件**。

404 修正（proxy transport 統一）と出席管理 UI/UX 改善（人数バッジ / 氏名表示 / 導線）の達成に必要な作業（route.ts transport 3 分岐 / `MeetingTimeline` バッジ・導線 / `MeetingAttendanceDrawer` 氏名解決 / `MeetingsClientShell` attendedCounts 配線・導線テキスト / focused vitest）はすべて本ワークフローの本 wave（03.実装.md・1 サイクル）に内包され、外部に切り出す未割当タスクは生じない（CONST_007）。

---

## baseline（既存スコープ外・構造的別件）

### 候補 1: `INTERNAL_API_BASE_URL` の staging 実値修正（インフラ設定）

| 項目 | 内容 |
| --- | --- |
| 検出ソース | 元タスク index「含まない（先送りではなく構造的別件）」 |
| 内容 | binding 不在環境向けの HTTP fallback base（`INTERNAL_API_BASE_URL`）の staging 実値を是正する |
| スコープ外の理由 | Task A の service binding 統一により root（transport 非対称）を解消するため、staging では HTTP fallback 自体に到達しない。実値修正は本タスクの 404/UX 課題の解消に**不要**。万一 binding 不在環境が残る場合のみ別途インフラ確認（DoD で staging 実測） |
| 起票要否 | **不要**。先送りではなく、service binding 統一で課題自体が消える構造的別件。staging 実測で binding 経路が確認できれば永久に不要 |

### 候補 2: 出席 CSV import の UI 化

| 項目 | 内容 |
| --- | --- |
| 検出ソース | 元タスク index「含まない」 |
| 内容 | 既存 `POST /admin/meetings/:id/attendance/import` を admin 画面から操作できる UI を追加する |
| スコープ外の理由 | 本タスクの 404 / 出席管理 UX 課題（人数・氏名・導線）に不要。CSV import は別の運用要件であり、開催年 12 回程度の規模では優先度が低い |
| 起票要否 | **不要**（本サイクルでは formalize しない）。将来 CSV 一括登録が運用要件化したときに別 workflow として検討 |

### 候補 3: route transport 選択ロジックの `server-fetch.ts` 共通 util 化

| 項目 | 内容 |
| --- | --- |
| 検出ソース | Phase 10 §10.6 MINOR 候補 |
| 内容 | `route.ts` の `adminServiceBinding(env)` / `apiBase(env)` / `isTestOrPlaywright(env)` を `server-fetch.ts` と共有する transport util へ抽出する |
| スコープ外の理由 | 利用箇所が 2 経路（server-fetch / route proxy）に留まり、3 箇所目が現れるまでは YAGNI。共通化は over-abstraction を招く。route.ts 専用 helper に閉じる現状が最小 |
| 起票要否 | **不要**（優先度低・discretionary）。3 つ目の consumer が現れたら共通化を検討 |

### 候補 4: 出席人数バッジの色強調（視覚演出）

| 項目 | 内容 |
| --- | --- |
| 検出ソース | Phase 10 §10.6 MINOR 候補 |
| 内容 | `出席 未登録` / `N 名出席` バッジに状態別の色強調を加える |
| スコープ外の理由 | 機能要件（人数の可視化）は `ui-badge` + テキストで充足済み。色強調は token 追加を伴う別関心（design token / 不変条件 #2 の範囲）であり装飾レベル |
| 起票要否 | **不要**（優先度低・discretionary）。将来の design polish wave で扱う |

---

## 関連タスク差分確認（FB-CANCEL-004-2）

既存 meetings / attendance 系 workflow との重複チェック。

| 既存タスク / workflow | 重複の有無 | 判定 |
| --- | --- | --- |
| `step-06-meetings-attendance-implementation` | 重複なし（drawer / api.ts の提供元。本タスクは改善側） | 新規起票不要 |
| `admin-attendance-analytics-redesign` | 重複なし（出席分析 read-only。IA 分離維持） | 新規起票不要 |
| `07c-parallel-meeting-attendance-and-admin-audit-log-workflow` | 重複なし（attendance endpoints。api 側完成済み） | 新規起票不要 |

---

## 結論

- **本サイクルで formalize する未タスク: 0 件**（current 0 件 / baseline 4 件はいずれも構造的別件 or discretionary enhancement で起票不要）。
- baseline 候補 1（INTERNAL_API_BASE_URL 実値修正）は service binding 統一で root が消えるため不要。候補 2（CSV import UI 化）は別運用要件で本タスクに不要。候補 3（transport util 共通化）は YAGNI、候補 4（バッジ色強調）は token を伴う装飾でいずれも優先度低・discretionary。
- 404 修正 + UI/UX 改善の実装作業はすべて本ワークフロー本 wave に内包され、外部切り出しは不要。
