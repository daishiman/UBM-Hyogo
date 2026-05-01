# 出席履歴の write 系オペレーション実装 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | ut-02a-followup-001-attendance-write-operations |
| タスク名 | `member_attendance` への出席登録 / 編集 / 削除（write path）実装 |
| 分類 | 実装 / API / repository |
| 対象機能 | `apps/api/src/repository/attendance.ts` の write 関数群と admin / member 系ルート |
| 優先度 | priority:medium |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |
| 発見日 | 2026-05-01 |
| 委譲先 wave | 02b 後続 / または独立 wave |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

ut-02a-attendance-profile-integration では read path（`AttendanceProvider.findByMemberIds`）のみを実装した。
write 系（出席登録 / 編集 / 取消）は明示的にスコープ外として除外されており、現状 admin / member ともに UI からは attendance を更新できない。

### 1.2 問題点・課題

- 会議出席の事実登録手段が存在せず、read path に常に空 / 過去 seed のみが返る
- admin が手動で attendance を補正する経路がない
- meeting session の作成 / 削除と attendance write の整合（`is_deleted` 連鎖）が未設計

### 1.3 放置した場合の影響

- 出席履歴 UI が形だけ動く（実データが流入しない）
- 02b の meeting domain と attendance write の境界が暗黙のままドリフトする
- 会員側で「自分の出席が反映されない」というクレーム経路を生む

---

## 2. 何を達成するか（What）

### 2.1 目的

`member_attendance` の write 関数（create / update / soft delete）と、admin / member 用 API ルートを実装し、UI から attendance を更新可能にする。

### 2.2 最終ゴール

- `AttendanceWriter.upsert(memberId, sessionId, attended)` / `softDelete(recordId)` が実装され単体テスト PASS
- admin 経由の attendance 補正 API（`POST /admin/members/:memberId/attendance` 等）が動作
- N+1 / bind 上限 / read path との一貫性（held_on DESC、dedupe）が保たれる

### 2.3 スコープ

#### 含むもの

- `attendance.ts` への write 関数追加
- admin 補正用 API ルート（権限ゲートは 05a の admin gate 流用）
- 単体 / 統合テスト（楽観排他、重複登録の dedupe、削除済み meeting への write 拒否）

#### 含まないもの

- meeting session 自体の CRUD（02b スコープ）
- attendance ダッシュボード / 統計（[ut-02a-followup-002](ut-02a-followup-002-attendance-dashboard-analytics.md)）
- ページング（[ut-02a-followup-004](ut-02a-followup-004-attendance-pagination.md)）

### 2.4 成果物

- `apps/api/src/repository/attendance.ts` の writer 関数群
- `apps/api/src/routes/admin/members.ts` 等の write 系 endpoint
- 単体 / 統合テスト
- API smoke evidence（curl）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- ut-02a-attendance-profile-integration の read path がマージ済み
- 02b で `meeting_sessions.is_deleted` semantics が確定していること

### 3.2 実装手順

1. `AttendanceWriter` interface 設計（`upsert` / `softDelete` / 楽観排他キー）
2. write SQL（`INSERT ... ON CONFLICT` + `is_deleted` 制約）
3. admin route 実装 + 05a admin gate 連携
4. 単体テスト → 統合テスト → curl evidence

---

## 4. 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/attendance.ts`
- 症状: read path 実装時、既存ファイルへ追記する形式に統合した（別 directory 案は `attendance.ts` と衝突）。write 系も同ファイル内で責務肥大化しないよう module 分割の判断が必要。
- 対象: `apps/api/src/repository/_shared/branded-types/meeting.ts`
- 症状: `MeetingSessionId` / `AttendanceRecordId` を branded type として独立 module 化した経緯あり。write 側でも同じ branded type を使い、ID 取り違え防止を徹底すること。
- 参照: `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`

---

## 5. リスクと対策

| リスク | 対策 |
| --- | --- |
| meeting `is_deleted` と attendance の整合崩れ | write 時に `INNER JOIN meeting_sessions WHERE is_deleted=0` で防御 |
| 楽観排他なしで二重登録 | UNIQUE (member_id, session_id) 制約 + `ON CONFLICT DO UPDATE` |
| admin gate 未連携でセキュリティホール | 05a admin gate を必須中継。route 単体での権限チェック禁止 |

---

## 6. 検証方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
mise exec -- pnpm --filter @ubm-hyogo/api test builder
```

期待結果: 既存 read path テスト regression なし、write 系単体テスト全 PASS。

---

## 7. 参考リンク

- `docs/30-workflows/ut-02a-attendance-profile-integration/index.md`
- `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/phase-12/implementation-guide.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
