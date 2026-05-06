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
| ステータス   | 解消済み（06c-E / 07c 既存実装へ吸収、2026-05-06） |
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
  - ※ close-out 時に「miniflare 二層検証で write 例外型を検証」する scope は撤回。詳細は §4 機能要件の代替充足注記を参照。

### 3.3 推奨アプローチ

UT-02A の read aggregator と同 module に write API を追加し、複合 PK 重複は repository 層で正規化例外に変換する。route 層は admin 権限境界のみ通電し、UI は別タスクで扱う。

---

## 4. 完了条件チェックリスト

### 機能要件

- [x] 代替充足: `AttendanceRepository` の upsert / delete API は追加せず、既存 `addAttendance` / `removeAttendance` を write 正本として採用。
- [x] 代替充足: 複合 PK 重複は repository `duplicate` reason と route `attendance_already_recorded` 409 で正規化。fake / miniflare 二層検証は本 close-out の scope から撤回し、既存 D1 setup tests と focused route tests を根拠にする。
- [x] write route の wiring tests が green。
- [x] UT-02A read path への即時反映は `AttendanceProvider` focused tests と repository/route tests の組み合わせで確認。

### 品質要件

- [x] review rerun: `pnpm --filter @ubm-hyogo/api test -- apps/api/src/repository/attendance.test.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/repository/__tests__/attendance-provider.test.ts` PASS（実際には suite 107 files / 693 tests まで展開され全 PASS）。
- [x] `pnpm --filter @ubm-hyogo/api typecheck` PASS。
- [x] UT-02A 既存 attendance provider tests が regression なし。

### ドキュメント要件

- [x] UT-02A phase-12 detection の候補1 routing が「解消済み」へ更新。
- [x] 例外正規化は 02b-followup-003 と独立し、duplicate / deleted / not_found の HTTP contract として本 close-out に固定。

---

## 5. 参照情報

- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/unassigned-task-detection.md`（候補1）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-02a-attendance-profile-integration-2026-05.md`（L-UT02A-002 / L-UT02A-003 / L-UT02A-004）
- `docs/30-workflows/unassigned-task/02b-followup-003-miniflare-d1-integration-test.md`（write 系例外型の二層検証）
- `apps/api/src/repository/attendance.ts`
- `apps/api/src/repository/_shared/builder.ts`

---

## 5.1 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/attendance.ts`
- 症状: read path 実装時に `attendance.ts` 単一ファイルへ統合した経緯があり、write 系も同ファイルへ追記する判断が必要だった。`AttendanceWriter` / `AttendanceRecordId` を新設すると複合 PK `(member_id, session_id)` 実 schema との二重定義になるため、write contract は `MemberId + sessionId` に固定。
- 対象: タスク仕様書状態語彙
- 症状: 当初 `spec_drafted` で起票したが task-specification-creator 標準語彙に存在せず、close-out 時に `implemented-local` (resolved-by-existing 06c-E / 07c) へ統一する判断が必要になった（skill-feedback-report.md 参照）。
- 対象: Phase 11 evidence の取り扱い
- 症状: 既存実装吸収のため runtime curl / UI smoke を本 close-out 内では取得せず `CONTRACT_ONLY_NOT_EXECUTED` として 08b / 09a evidence gate に委譲する境界を明示する必要があった。
- 参照: `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/outputs/phase-12/implementation-guide.md`、`.../skill-feedback-report.md`

---

## 5.2 リスクと対策

| リスク | 対策 |
| --- | --- |
| 既存 06c-E / 07c との実装重複 | close-out workflow で repository / canonical route / legacy route の解消先表を §7 に固定し、新規 Writer 抽象を追加しない |
| `meeting_sessions.deleted_at` と attendance write の整合崩れ | repository 側で `session_not_found` 404、`member_is_deleted` 422 を正規化（02b semantics 流用） |
| 複合 PK 二重登録 | UNIQUE `(member_id, session_id)` + repository `duplicate` reason を route で `attendance_already_recorded` 409 にマップ |
| admin gate 未連携でセキュリティホール | 05a admin gate を必須中継。route 単体での権限チェック禁止。成功時のみ audit log に `attendance.add` / `attendance.remove` を記録 |
| 回帰テスト範囲の肥大化 | repository / canonical route / legacy route / attendance-provider focused tests に限定し、UT-02A read path との一貫性は `findByMemberIds` 観測で確認 |
| close-out 透明性の欠落 | historical stub（`ut-02a-followup-001-attendance-write-operations.md`）と current close-out root（`docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/`）を並存させ §7 で誘導 |

---

## 5.3 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  apps/api/src/repository/attendance.test.ts \
  apps/api/src/routes/admin/attendance.test.ts \
  apps/api/src/routes/admin/meetings.test.ts \
  apps/api/src/repository/__tests__/attendance-provider.test.ts
```

期待結果: typecheck PASS、上記 4 suite 全 PASS（実展開で suite 107 files / 693 tests まで拡張され全 PASS）。UT-02A read path に regression なし。audit log assertion（`attendance.add` / `attendance.remove`）が canonical / legacy route tests で観測される。

### 統合検証 / Phase 11 evidence

- 本 close-out の Phase 11 は `CONTRACT_ONLY_NOT_EXECUTED`。runtime curl / UI smoke は既存 08b / 09a evidence gate に委譲済み。
- 例外正規化の HTTP contract（duplicate=409 / deleted_member=422 / member_not_found=404 / session_not_found=404）は repository unit と route wiring tests で固定。

---

## 6. 備考

本タスクは UT-02A の read path scope を保護したまま write 機能を別タスクとして分離する設計判断（phase-12 detection 候補1）に基づく。複合 PK 重複時の例外型は 02b-followup-003 の二層テスト戦略と歩調を合わせて確立すること。

## 7. 解消記録（2026-05-06）

本タスクは新規実装ではなく、既存 06c-E / 07c 実装へ吸収して解消済みとする。

| 観点 | 解消先 |
| --- | --- |
| repository write | `apps/api/src/repository/attendance.ts` (`addAttendance` / `removeAttendance`) |
| canonical route | `apps/api/src/routes/admin/meetings.ts` (`POST /admin/meetings/:sessionId/attendances`) |
| legacy route | `apps/api/src/routes/admin/attendance.ts` (`POST /admin/meetings/:sessionId/attendance`, `DELETE /admin/meetings/:sessionId/attendance/:memberId`) |
| close-out workflow | `docs/30-workflows/ut-02a-followup-001-attendance-write-operations/` |

追加未タスクは作成しない。runtime visual smoke は既存 08b / 09a evidence gate に委譲済み。

### 7.1 フォーマット補完ログ（2026-05-06）

`task-specification-creator` skill の `unassigned-task-required-sections` に基づき、必須 4 セクション（スコープ / 苦戦箇所 / リスクと対策 / 検証方法）を完備した。
- §2.3「スコープ」は既存どおり完備
- §5.1「苦戦箇所【記入必須】」を追記
- §5.2「リスクと対策」を追記
- §5.3「検証方法」を追記
- §3.2 に miniflare 二層検証 scope 撤回の注記を追加（§4 機能要件と整合）
