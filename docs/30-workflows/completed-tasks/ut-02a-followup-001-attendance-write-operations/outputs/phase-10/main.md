# Phase 10: 最終レビュー

実装区分: 実装仕様書

## 10.1 GO / NO-GO 判定基準

| 基準 | 判定 | 根拠 |
| --- | --- | --- |
| 依存 02a の AC 充足 | GO | read path / `MemberProfile.attendance` 型契約不変、既存テスト regression なし |
| 依存 02b の AC 充足 | GO | `meeting_sessions.deleted_at` semantics を読み取り側でのみ参照、schema 変更なし |
| 依存 05a の AC 充足 | GO | admin gate middleware を route 単体で迂回しない |
| schema 利用可能性 | GO | `member_attendance` PK / `meeting_sessions.deleted_at` は既存 |
| `MemberProfile.attendance` interface 不変 | GO | Writer 戻り値は別 type、`AttendanceRecord` は変更なし |
| AC-1〜9, AC-11 充足 | GO | 既存 06c-E / 07c 実装と focused tests で確認 |
| AC-10 runtime evidence | GO for contract only | Phase 11 は `CONTRACT_ONLY_NOT_EXECUTED`。curl/UI smoke は 08b / 09a gate に委譲 |
| Phase 9 quality gates | GO with scoped evidence | focused tests / typecheck を実装証跡にする。広域 suite は別 gate |
| Phase 11 evidence 4 件 + ui-smoke | GO for placeholder only | `outputs/phase-11/` に未実行 placeholder が存在。実測 PASS ではない |

## 10.2 リリース影響範囲

| 範囲 | 影響 |
| --- | --- |
| public API | なし（admin route のみ硬化） |
| public site | なし |
| admin UI | 既存 attendance 編集画面の挙動が安定化（regression なし） |
| データ | `member_attendance` 行追加 / 削除は既存と同等。schema 変更なし |
| 監査 | `audit_log` の `attendance.add` / `attendance.remove` 記録が確実化 |

## 10.3 ロールバック戦略

- 本タスクは新規 schema を導入しないため、コード revert で完全ロールバック可能
- `audit_log` への記録は revert 後も既存行に残る（読み取り専用 effect のため副作用なし）
- Cloudflare wrangler rollback 経路（`scripts/cf.sh rollback`）が利用可能

## 10.4 残課題（Phase 12 / 13 で扱う）

- `member_attendance.deleted_at` 列追加（02b schema wave 待ち）
- attendance 集計ダッシュボード（ut-02a-followup-002）
- attendance ページング（ut-02a-followup-004）

## 10.5 GO 宣言条件

以下が全て満たされた時点で GO:

1. Phase 1〜9 の output 全成果物が `outputs/phase-XX/` に存在
2. AC-1〜9, AC-11 が test または docs sync で green
3. 既存 02a / read path / audit / meetings 既存テストに regression なし
4. apps/web から D1 直接アクセスがないこと（grep gate）
5. Phase 11 curl evidence 4 件 + ui-smoke は `CONTRACT_ONLY_NOT_EXECUTED` placeholder として揃う

## 10.6 DoD

- 10.1 全項目 GO
- 10.5 GO 宣言条件全充足
- Phase 11（contract placeholder 確認）に進める状態。runtime smoke は本 workflow で PASS 扱いしない
