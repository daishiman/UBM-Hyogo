# 未タスク検出

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> workflow_state: `implemented_local_runtime_pending` / issue: #1126（CLOSED 維持）

本タスクのスコープ確定（Phase 1 §5）に基づき、新規 unassigned-task の発行有無を検出する。検出 0 件でも本ファイルを出力する。

---

## 検出結果

**新規 unassigned-task = 0 件。**

本タスクは CONST_007 に従い 1 サイクル内（spec 1 本 + fixture 1 本の編集 + baseline 6 枚生成）で完結する。
スコープ外として明示した項目（Phase 1 §5「含まない」N-1〜N-5）に、後続タスクへの暗黙的依存（先送り）はない。

---

## 検出対象と判定

| # | 候補 | 判定 | 根拠 |
|---|------|------|------|
| 1 | result mutation（タグ apply 後）状態の viewport baseline | 新規発行しない | issue-1125（bulk tag result mutation baseline）が **別スコープで既に担当**。本タスクは read-only な assign/unassign 2 状態に限定し、result 状態は carry しない（Phase 1 §5 N-4） |
| 2 | A案（viewport 別 project 複製）への config 改修 | 新規発行しない | B案を採用済み（Phase 3 比較）。config 肥大を避ける恒久的スコープ外（N-2） |
| 3 | CI ワークフロー（yml）の改修 | 新規発行しない | glob 経由で新 baseline が自動参加するため不要（N-3 / Phase 2 §7） |
| 4 | `BulkActionBar.tsx` のレスポンシブ実装変更 | 新規発行しない | 本タスクは baseline 取得のみ。実装変更は目的外で恒久スコープ外（N-5）。万一 baseline 取得で picker レイアウト崩れが顕在化した場合は、その時点で別 issue として起票判断する（現時点で崩れの事実なし=投機的発行しない） |

---

## 判定根拠

- viewport 拡張のスコープは **assign / unassign の 2 状態に限定**しており、result 状態（タグ apply 後の結果 UI）は
  read-only 不変条件（Phase 1 §5 S-6 / Phase 2 §6）に反するため本タスクでは扱わない。
  result 状態 baseline は issue-1125 が carry しており、重複起票しない。
- スコープ外項目は全て「先送り依存なし」を Phase 1 §5 で宣言済み。新規タスク化が必要な未解決の派生要件は存在しない。

> 結論: 本ワークフローから新規発行すべき unassigned-task は無い（0 件）。
