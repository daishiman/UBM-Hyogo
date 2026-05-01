# attendance write operations - タスク指示書

## メタ情報

| 項目         | 内容                                              |
| ------------ | ------------------------------------------------- |
| タスクID     | task-ut-02a-attendance-write-operations-001       |
| タスク名     | Attendance write operations（出席登録・更新・削除） |
| 分類         | 機能追加                                          |
| 対象機能     | `apps/api` attendance repository / route          |
| 優先度       | 中                                                |
| 見積もり規模 | 中規模                                            |
| ステータス   | 未実施                                            |
| 発見元       | UT-02A Phase 12 (unassigned-task-detection)       |
| 発見日       | 2026-05-01                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-02A（attendance profile integration）では `MemberProfile.attendance` の **read path** のみを実装した。`AttendanceRepository.findByMemberIds()` による batch read aggregator と builder への optional provider 注入が完了している（L-UT02A-003 / L-UT02A-004）。一方で出席の登録・更新・削除といった write 系オペレーションは UT-02A scope 外として明示的に切り離された（phase-12 detection の Remaining Candidates 候補1）。

### 1.2 問題点・課題

- `member_attendance` テーブルへの INSERT / UPDATE / DELETE 経路が repository / route 両層で未実装
- 出席登録のための admin / 運営 UI からの write API が存在しない
- 複合 PK `(meeting_id, member_id)` 重複時の正規化された例外型が未確立（02b-followup-003 の二層テスト戦略で fake / miniflare 整合が必要）

### 1.3 放置した場合の影響

- UT-02A で整備した read path に流す実データが手動 SQL 投入に依存し続ける
- 運営オペレーションが GAS prototype や手動入力に固定化される
- write 経路の例外正規化が後回しになり、後続の dashboard / analytics タスク（候補2）の前提が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`member_attendance` への write オペレーション（登録・更新・削除）を repository と route 両層で確立し、UT-02A の read path と同一 schema 契約で整合させる。

### 2.2 最終ゴール

- `AttendanceRepository` に `upsert` / `delete` 系 API が追加されている
- `member_attendance` 複合 PK 重複時の例外型が正規化されている
- admin / 運営向けの write route が `apps/api` に実装され、route wiring tests が green
- UT-02A の read path（`findByMemberIds`）が write 結果を即時に反映する

### 2.3 スコープ

#### 含むもの

- `AttendanceRepository.upsert(meetingId, memberId, payload)` 等の write API
- `AttendanceRepository.delete(meetingId, memberId)` 系 API
- 複合 PK 重複時の例外正規化（02b-followup-003 と整合）
- write route（admin or 運営権限）の最小実装と wiring tests

#### 含まないもの

- attendance dashboard / analytics（候補2、本タスク scope 外）
- meeting session 自体の CRUD（02b scope）
- pagination（候補4、本タスク scope 外）
- `MemberProfile` interface の構造変更（UT-02A で確定済み）

### 2.4 成果物

- `apps/api/src/repository/attendance.ts` への write メソッド追加 + 単体テスト
- write route 実装 + route wiring tests
- 例外正規化の runbook 追記（02b-followup-003 と整合）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-02A Phase 1-12 完了（read path / batch aggregator / builder provider が確立済み）
- migration 上の `member_attendance` schema が `held_on` / `session_id` ベースで確定（L-UT02A-002）

### 3.2 依存タスク

- **参照**: UT-02A workflow root（`docs/30-workflows/ut-02a-attendance-profile-integration/`）
- **整合**: 02b-followup-003（miniflare D1 二層テスト戦略で write 例外型を検証）

### 3.3 推奨アプローチ

UT-02A の read aggregator と同 module に write API を追加し、複合 PK 重複は repository 層で正規化例外に変換する。route 層は admin 権限境界のみ通電し、UI は別タスクで扱う。

---

## 4. 完了条件チェックリスト

### 機能要件

- [ ] `AttendanceRepository` に upsert / delete API が追加されている
- [ ] 複合 PK 重複時の正規化例外が定義され、fake / miniflare で挙動一致（02b-followup-003 と整合）
- [ ] write route の wiring tests が green
- [ ] UT-02A read path に write 結果が即時反映される

### 品質要件

- [ ] `mise exec -- pnpm --filter @repo/api test` 緑
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm build` 通過
- [ ] UT-02A 既存テストが回帰しない

### ドキュメント要件

- [ ] UT-02A phase-12 detection の候補1 routing が「解消済み」へ更新
- [ ] 例外正規化の runbook が 02b-followup-003 と整合

---

## 5. 参照情報

- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/unassigned-task-detection.md`（候補1）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-02a-attendance-profile-integration-2026-05.md`（L-UT02A-002 / L-UT02A-003 / L-UT02A-004）
- `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md`（write 系例外型の二層検証）
- `apps/api/src/repository/attendance.ts`
- `apps/api/src/repository/_shared/builder.ts`

---

## 6. 備考

本タスクは UT-02A の read path scope を保護したまま write 機能を別タスクとして分離する設計判断（phase-12 detection 候補1）に基づく。複合 PK 重複時の例外型は 02b-followup-003 の二層テスト戦略と歩調を合わせて確立すること。
