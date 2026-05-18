# Phase 1 — 要件定義

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 名前 | 要件定義 |
| 状態 | spec_created |
| 依存 | なし（親 UT-07C 完了済を前提） |
| 入力 | GitHub Issue #312, 親 UT-07C 既実装コード |
| 出力 | outputs/phase-01/requirements.md |

## 目的

meeting attendance CSV 一括 import の要件を、ゴール / スコープ / 非機能要件 / 命名規則の
4 観点で確定させ、Phase 2 設計の入力にする。

## タスク

- [ ] ゴールを 1 文で確定する
- [ ] スコープ（含む / 含まない）を表形式で明示する
- [ ] 既存 endpoint surface inventory を `apps/api/src/routes/admin/attendance.ts` から抽出して列挙する
- [ ] 命名規則（TypeScript camelCase / ファイル kebab-case）を明記する
- [ ] `implementation_mode = "new"` の判定根拠を記載する
- [ ] タスク分類 = UI task（VISUAL）の根拠を記載する
- [ ] NON-FUNCTIONAL: import 上限 500 行 / dry-run latency p95 < 2s を確定する

## 成果物

- `outputs/phase-01/requirements.md`
  - ゴール
  - スコープ表（含む 13 項目 / 含まない 6 項目）
  - 既存 endpoint surface inventory（4 endpoint 列挙）
  - 命名規則表
  - implementation_mode / task classification 判定
  - 非機能要件表（上限・latency・可観測性）

## 完了条件

- ゴール文が 1 文で確定し、`apps/api` / `apps/web` 双方の変更スコープが整合する
- 既存 endpoint surface inventory が漏れなく列挙されている
- 非機能要件が定量値で記述されている（500 行 / p95 < 2s）

## 注意点 / リスク

- 親 UT-07C の単一 add/remove API surface を破壊しないことを Phase 1 で宣言する
- CLAUDE.md 不変条件 5（apps/web から D1 直接アクセス禁止）を再確認する
- 本 followup は **新 endpoint 追加** を伴うため、UI prototype alignment workflow の
  「新 endpoint 追加禁止」制約が適用される workflow とは別系統である点を明示する
