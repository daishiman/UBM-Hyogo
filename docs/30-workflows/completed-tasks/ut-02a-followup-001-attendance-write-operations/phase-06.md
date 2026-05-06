# Phase 6: 異常系検証

実装区分: 実装仕様書

## 6.1 failure cases

| # | ケース | 期待挙動 | テスト |
| --- | --- | --- | --- |
| F1 | UNIQUE 違反（同一 (member, session) 二重 add） | `{ ok: false, reason: "duplicate", existing }`、HTTP 409、audit log 発火しない | T2 |
| F2 | 削除済み meeting (`deleted_at IS NOT NULL`) への upsert | `{ ok: false, reason: "session_not_found" }`、HTTP 404 | T3, T11 |
| F3 | 存在しない `sessionId` への upsert | 同上 | T11 |
| F4 | 存在しない `memberId` への upsert | `{ ok: false, reason: "member_not_found" }`、HTTP 404 | T4, T12 |
| F5 | 削除済み member (`member_status.is_deleted = 1`) への add | `{ ok: false, reason: "deleted_member" }`、HTTP 422 | T5 |
| F6 | remove 対象不在 | `null`、HTTP 404 | T7 |
| F7 | null / 空文字 `memberId` 入力 | route 層で zod validation エラー → 400 / 422 | T18 |
| F8 | null / 空文字 `sessionId` 入力 | route param 不足として 400 / 404 | T18 |
| F9 | admin gate 未通過（未認証） | middleware が 401 | T13 |
| F10 | admin gate 未通過（権限不足） | middleware が 403 | T13 |
| F11 | D1 timeout / connection error | exception を route で 500 にマップ、audit log 発火しない | T19 |
| F12 | `member_attendance.assigned_by` が NULL（schema 変更等で） | 既存 schema は NOT NULL のため発生しない。発生時は 500 | n/a |
| F13 | branded type 不整合（`MemberId` を `MeetingSessionId` 引数に渡す） | TypeScript コンパイルエラー（実行時には到達しない） | T8 |

## 6.2 セキュリティ異常系

| # | 攻撃シナリオ | 防御 |
| --- | --- | --- |
| S1 | 一般会員が `/admin/meetings/:id/attendances` を直接叩く | 05a admin gate が 403 |
| S2 | actor_email を偽装（ヘッダ書き換え） | gate の session 検証で防御。route 層では `c.get("adminContext").email` のみを信頼 |
| S3 | SQL injection（`memberId` 経由） | 全 SQL は `prepare().bind()` でパラメタライズ済み |
| S4 | 監査ログ抑止（audit_log INSERT 失敗を握り潰す） | route 層で audit_log INSERT が失敗した場合は 500 を返し、attendance 変更を rollback できないため transaction 化を Phase 8 で検討 |

## 6.3 race / concurrency

| # | シナリオ | 挙動 |
| --- | --- | --- |
| C1 | 同 (m, s) を 2 つの request が同時 upsert | D1 single-isolate write のため一方が成功、他方が duplicate（F1 と同一） |
| C2 | upsert と softRemove が同時実行 | D1 が serialize、後着が冪等経路（F6） |

## 6.4 リカバリ

| 障害 | リカバリ手順 |
| --- | --- |
| audit_log 漏れ | `attendance.add` / `attendance.remove` が記録されていないか定期 audit。漏れ発見時は手動 INSERT |
| 誤った attendance 登録 | softRemove で取消 → audit log で双方記録される |

## 6.5 DoD

- F1〜F11, S1〜S3, C1〜C2 が Phase 4 test matrix のいずれかでカバーされている
- カバーされていない場合は test 追加してから Phase 7 に進む
