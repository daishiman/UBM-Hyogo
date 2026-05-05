# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

Phase 2 設計と Phase 4 テスト matrix を 1 本の実行手順に編み、再現可能な実装ランブックとして固定する。

## ランブック

### Step 1: D1 schema 確認

1. `apps/api/migrations/` 配下を grep し `meeting_sessions` / `member_attendance` 定義を確認
2. 必要 column（`held_on`, `session_id`, `member_id` 等）と index の有無を確認
3. 不足があれば 02b へ schema diff 起票し、PR merge を待機（独立タスク化判断もここで行う）

### Step 2: branded type module 新設

1. `apps/api/src/repository/_shared/branded-types/meeting.ts` を新設
2. `MeetingSessionId` / `AttendanceRecordId` を `Brand<string, ...>` で定義
3. `to*Id` ファクトリ関数を export
4. 既存 `member.ts` / `response.ts` には触らない

### Step 3: AttendanceRepository 実装

1. `apps/api/src/repository/attendance.ts` に `AttendanceProvider` interface を定義
2. `D1AttendanceRepository` を実装
3. `findByMemberIds(ids)` で：
   - `ids.length === 0` の場合は即 `new Map()` 返却（SQL 発行ゼロ）
   - `chunk(ids, 80)` で分割
   - 各 chunk で `SELECT ... FROM member_attendance ma INNER JOIN meeting_sessions ms ON ms.session_id = ma.session_id WHERE ma.member_id IN (?,...)`
   - `Promise.all` で並列実行 → Map にマージ
4. 単体テスト U-1〜U-9 を実装し全 PASS

### Step 4: builder 統合

1. `apps/api/src/repository/_shared/builder.ts` を編集
2. signature に `attendanceProvider?: AttendanceProvider` を追加（既存呼び出しを破壊しない）
3. profile 構築開始時に対象 `MemberId[]` を集約
4. `attendanceProvider` 注入時のみ 1 回の `findByMemberIds` で解決し各 member に注入
5. 未注入時は `[]` フォールバックを維持し、route 側で provider 注入を必須化する
6. `attendance: []` の stub 行を削除

### Step 5: 呼び出し側の provider 注入

1. profile を返すルートハンドラ / service 層を grep（`buildMemberProfile*` 等）
2. `D1AttendanceRepository` を構築し builder 呼び出しに渡す
3. 統合テスト I-1〜I-4 を実装し全 PASS
4. 02a 既存テストが回帰していないことを確認

### Step 6: 型 / lint / build

1. `mise exec -- pnpm typecheck` → 0 error
2. `mise exec -- pnpm lint` → 0 error
3. `mise exec -- pnpm build` → success
4. `MemberId` / `ResponseId` import path に変更がないことを `git diff` で確認

### Step 7: 通電前検査

1. test-matrix の T-1〜T-4 が全 PASS であることを確認
2. N+1 計測 spy 値が期待 chunk 数と一致

## 完了条件

- [ ] Step 1〜7 が runbook.md に書かれており順序固定
- [ ] 各 Step が再現可能（コマンド / ファイル path / 期待出力を明記）
- [ ] schema 不在時の分岐（02b 待機 / 独立タスク化）が記述済み

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 主成果物 |
| Runbook | outputs/phase-05/runbook.md | Step 1〜7 実行手順 |

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed / 全成果物配置済み / 完了条件すべてチェック
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: runbook 全 Step を異常系シナリオで再走確認するための分岐リスト

## 実行タスク

- [ ] Phase 固有の成果物を作成する
- [ ] 完了条件と次 Phase への引き継ぎを確認する
- [ ] artifacts.json の該当 Phase status を実行時に更新する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/index.md | workflow 全体仕様 |
| 必須 | docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json | Phase status / outputs 契約 |
| 必須 | docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md | legacy source / Canonical Status |

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 4 | AC と test matrix の対応を維持 |
| Phase 9 | typecheck / lint / build / regression gate に接続 |
| Phase 11 | NON_VISUAL runtime evidence に接続 |
| Phase 12 | system spec sync と compliance check に接続 |
