# Phase 8: リファクタリング

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 8
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 8 (リファクタ) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-8-refactor.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. 本タスクでのリファクタ方針

- **最小差分原則**: 既存 `attendanceMutation` を 2 つに分割するのみ。新 hook / 新 helper / 新型は作らない
- **抽出の不在**: `removeAttendanceMutation` を別 hook（例: `useRemoveAttendance`）に抽出しない。callsite が `MeetingPanel.tsx` の 1 箇所に閉じるため抽出 ROI なし
- **既存命名の保持**: `attendanceMutation` → `addAttendanceMutation` / `removeAttendanceMutation` は意味的に直交（POST 登録 / DELETE 解除）で命名は直交している

## 2. 検討して採用しなかった選択肢

| 選択肢 | 不採用理由 |
|---|---|
| 共通 helper `useIdempotentAdminMutation(endpoint, "DELETE", customOpts)` の抽出 | 現状 caller 1 つ。premature abstraction |
| `endpointOverride` を使わず動的 endpoint を path template + sessionId/memberId props で組む別パターン | hook シグネチャ変更が必要になり scope が膨らむ。`trigger(payload, endpointOverride)` は既存 API（hook L178）で型整合 |
| `payload=null` ではなく専用 `RemoveAttendancePayload` 型を定義 | DELETE は body 不要のため過剰設計 |
| `addAttendance` 側も DELETE 同様に冪等化のため別 endpoint 化 | POST は本質的に非冪等。型 overload で retry を弾く設計の活用が正解 |

## 3. 命名・型整理

- 既存 `attendanceMutation` を grep し全箇所を `addAttendanceMutation` / `removeAttendanceMutation` のいずれかに置換
- 旧名残存があると lint の `no-unused-vars` で検知される（baseline で error 化されているはず）

## 4. dead code 削除

- 本変更で新たな dead code は発生しない
- `removeAttendance` helper の旧 POST 経路は削除（差し替えのため）
