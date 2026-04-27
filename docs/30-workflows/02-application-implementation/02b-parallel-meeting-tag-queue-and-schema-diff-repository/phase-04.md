# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 3 |
| 下流 | Phase 5 |
| 状態 | pending |

## 目的

AC-1〜AC-9 を verify suite として定義する。**特に attendance 重複制約と tagQueue 状態遷移を実 D1 で検証する**。

## verify suite

### 1. unit test

| ファイル | 対象 | 目的 |
| --- | --- | --- |
| `meetings.test.ts` | meetings.ts | CRUD + listRecentMeetings の n 件制限 |
| `attendance.test.ts` | attendance.ts | 重複防止 / 削除済み除外 / addAttendance reason 返却 |
| `tagDefinitions.test.ts` | tagDefinitions.ts | listAllTagDefinitions / listByCategory / write API 不在 |
| `tagQueue.test.ts` | tagQueue.ts | enqueue / transitionStatus 正常系 + 逆方向 throw |
| `schemaVersions.test.ts` | schemaVersions.ts | upsertManifest / getLatestVersion / supersede |
| `schemaQuestions.test.ts` | schemaQuestions.ts | upsertField / updateStableKey |
| `schemaDiffQueue.test.ts` | schemaDiffQueue.ts | enqueue / list (ASC) / resolve |

### 2. DB 制約 test（最重要）

| ID | シナリオ | 期待 |
| --- | --- | --- |
| DB-1 | `member_attendance` に同じ `(mid, sid)` を 2 回 INSERT | 2 回目が D1 throw（PK 制約違反） |
| DB-2 | `addAttendance` を直列 2 回呼ぶ | 1 回目 ok / 2 回目 `{ ok: false, reason: "duplicate" }` |
| DB-3 | `is_deleted = 1` の member に `addAttendance` | `{ ok: false, reason: "deleted_member" }` |
| DB-4 | 存在しない `sessionId` に `addAttendance` | `{ ok: false, reason: "session_not_found" }` |
| DB-5 | `listAttendableMembers` で deleted member が含まれない | items に `m_deleted` 不在 |
| DB-6 | `listAttendableMembers` で attendance 済み member が含まれない | items に既に attended な member 不在 |

### 3. 状態遷移 test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| ST-1 | `transitionStatus(qid, "reviewing")` を `queued` から | OK |
| ST-2 | `transitionStatus(qid, "resolved")` を `reviewing` から | OK |
| ST-3 | `transitionStatus(qid, "queued")` を `resolved` から | throw `IllegalStateTransition` |
| ST-4 | `transitionStatus(qid, "resolved")` を `queued` から（飛び越え） | throw |
| ST-5 | `resolved` の queue に再度 `transitionStatus` | throw |

### 4. contract test（zod）

| 対象 | 検証 |
| --- | --- |
| `tagQueue.listQueue()` 戻り値 | `TagAssignmentQueueItemSchema.parse()` |
| `schemaDiffQueue.list()` 戻り値 | `SchemaDiffReviewView.items` schema parse |
| `meetings.listMeetings()` 戻り値 | `MeetingSession[]` schema parse |
| `attendance.listAttendanceBySession()` 戻り値 | `MemberAttendance[]` schema parse |

### 5. fixture（in-memory D1）

```ts
// __fixtures__/meetings.fixture.ts
export const fixtureMeetings: NewMeetingSessionRow[] = [
  { sessionId: "ses_001", title: "2026-05 月次会", heldOn: "2026-05-15", note: null, createdBy: "admin@ubm-hyogo.org" },
  { sessionId: "ses_002", title: "2026-04 月次会", heldOn: "2026-04-15", note: null, createdBy: "admin@ubm-hyogo.org" },
];

// __fixtures__/attendance.fixture.ts
export const fixtureAttendance: MemberAttendanceRow[] = [
  { memberId: memberId("m_001"), sessionId: "ses_001", assignedBy: "admin", assignedAt: ... },
  // 既に attended な member（listAttendableMembers から除外確認用）
];

// __fixtures__/tagQueue.fixture.ts
export const fixtureQueue: NewTagAssignmentQueueRow[] = [
  { queueId: "q_001", memberId: memberId("m_001"), responseId: responseId("r_001"), status: "queued", suggestedTagsJson: '["it","entrepreneur"]' },
  { queueId: "q_002", memberId: memberId("m_002"), responseId: responseId("r_002"), status: "reviewing" },
  { queueId: "q_003", memberId: memberId("m_003"), responseId: responseId("r_003"), status: "resolved" },
];

// __fixtures__/schemaDiff.fixture.ts
export const fixtureDiff: NewSchemaDiffQueueRow[] = [
  { diffId: "d_001", type: "unresolved", questionId: "q_x", stableKey: null, label: "新項目" },
  { diffId: "d_002", type: "added", questionId: "q_y", stableKey: stableKey("newField"), label: "追加" },
];
```

## verify suite と AC マッピング

| AC | 内容 | 検証 test |
| --- | --- | --- |
| AC-1 | 7 repo unit pass | unit test 7 |
| AC-2 | attendance PK 重複阻止 | DB-1, DB-2 |
| AC-3 | getLatestVersion = active 1 件 | schemaVersions.test.ts |
| AC-4 | tagQueue unidirectional | ST-1〜ST-5 |
| AC-5 | schemaDiffQueue list ASC | schemaDiffQueue.test.ts |
| AC-6 | tagDefinitions 6 カテゴリ非空 | tagDefinitions.test.ts |
| AC-7 | listAttendableMembers 削除済み除外 | DB-3, DB-5 |
| AC-8 | N+1 防止 | attendance.test.ts query count |
| AC-9 | 02a/02c 相互 import ゼロ | depcruise CI |

## 実行タスク

1. verify suite を `outputs/phase-04/verify-suite.md` に
2. AC マッピングを `outputs/phase-04/main.md` に
3. fixture file 構造を verify-suite.md に貼る
4. DB 制約 test の SQL placeholder を貼る
5. 状態遷移 test の TS snippet を貼る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 3 outputs | 採用案 A |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / index |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 5 | 実装到達目標 |
| Phase 6 | 異常系派生 |
| 08a | repository contract test |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| attendance 重複 | #15 | DB-1〜DB-2 が PK 制約 |
| 削除済み除外 | #15 | DB-3, DB-5 が JOIN filter |
| tag 直接編集禁止 | #13 | tagDefinitions.test.ts で write 不在 |
| schema 集約 | #14 | schemaDiffQueue / schemaVersions test |
| 状態遷移 unidirectional | — | ST-1〜ST-5 |
| 無料枠 | #10 | query count assertion |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test 一覧 | pending |
| 2 | DB 制約 test | pending |
| 3 | 状態遷移 test | pending |
| 4 | contract test | pending |
| 5 | fixture | pending |
| 6 | AC マッピング | pending |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-04/main.md | AC × test |
| outputs/phase-04/verify-suite.md | suite 詳細 |

## 完了条件

- [ ] AC-1〜AC-9 全てに test
- [ ] DB 制約 test 6 件
- [ ] 状態遷移 test 5 件
- [ ] fixture が 4 種

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 completed
- [ ] outputs/phase-04/* 配置済み
- [ ] artifacts.json の Phase 4 を completed

## 次 Phase

- 次: Phase 5
- 引き継ぎ事項: verify suite + fixture
- ブロック条件: AC が test なしの場合 Phase 5 進めない
