# Phase 8: DRY 化

実装区分: 実装仕様書

## 8.1 共通化候補

| # | 共通化対象 | 配置 | 効果 |
| --- | --- | --- | --- |
| D1 | `member_attendance` write 結果 → audit_log 結線 helper | `apps/api/src/routes/admin/_shared.ts` 等 | route 間で `attendance.add` / `attendance.remove` 結線コードを重複させない |
| D2 | `active_meeting_sessions` の SQL fragment（`deleted_at IS NULL` 条件） | `apps/api/src/repository/_shared/sql.ts` 等 | upsert 事前チェックで使い、将来 `meeting_sessions` 削除条件が拡張された場合に 1 箇所で吸収 |
| D3 | `member 存在 + is_deleted` チェック helper | `apps/api/src/repository/_shared/member-state.ts`（仮） | upsert / 他 admin write でも再利用可能 |
| D4 | error reason → HTTP status マップ | `apps/api/src/routes/admin/_error-map.ts` | route 間で 404/409/200 の振り分けを統一 |

## 8.2 採用判断

| # | 採用 | 理由 |
| --- | --- | --- |
| D1 | △ Phase 12 で評価 | 結線コードが 2 経路（meetings.ts / attendance.ts）に留まる場合は inline を維持。3 経路以上に増えたら helper 化 |
| D2 | ✕ 不採用 | 現状 1 箇所の利用のみ。将来 meeting CRUD が増えた段階で 02b と協調 |
| D3 | ✕ 不採用 | upsert 内部の事前チェックが 2 ステップで済むため、helper 化のメリット小 |
| D4 | ◯ 採用 | error mapping が route 間で再利用される。Phase 5 Step 3 と並行で導入 |

## 8.3 既存 DRY 違反チェック

- `apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance` 内 SQL は read path (`createAttendanceProvider`) と物理的に重複しないため許容
- `audit_log` INSERT は既存 audit 経路を踏襲し、新 helper は導入しない（過剰抽象化を避ける）

## 8.4 過剰抽象化リスク

| 反パターン | 回避策 |
| --- | --- |
| 「将来増えるかも」で先取り抽象化 | 02b / 03a が実際に同パターンを必要とする時点で初めて helper 化 |
| Writer interface の generics 化 | 不要。MemberId / MeetingSessionId 固定で十分 |

## 8.5 DoD

- 8.2 の D4 のみ Phase 5 で導入
- D1〜D3 は Phase 12 振り返りで再評価
- 既存重複の中で新規追加されるものはないことを Phase 9 grep gate で検査
