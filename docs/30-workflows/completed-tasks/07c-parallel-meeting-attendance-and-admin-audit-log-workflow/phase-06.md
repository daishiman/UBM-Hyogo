# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |

## 目的

attendance / audit log workflow で起こりうる失敗ケースを 401 / 403 / 404 / 409 / 422 / 5xx / sync 失敗 / 削除済み操作 / 同時 click 等のカテゴリで網羅し、各ケースの返却仕様と audit 記録方針を確定する。

## 実行タスク

- [ ] failure cases を 9 カテゴリで列挙
- [ ] 各ケースの response status / body / audit_log 記録有無を表で確定
- [ ] race condition / 同時 click の対策を確定
- [ ] sync 失敗時の audit 記録方針を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | admin 操作仕様 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 |

## failure cases

| # | カテゴリ | 発生条件 | response | audit_log | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | 401 | 未ログイン | `401 { error: "unauthenticated" }` | 残さない（actor 不在） | adminGate が即返し |
| 2 | 403 | ログイン済みだが admin_users 未登録 | `403 { error: "forbidden" }` | 残さない（adminUserId 取得不可） | adminGate が即返し |
| 3 | 404 (session not found) | 存在しない sessionId | `404 { error: "meeting_session_not_found" }` | 残さない | router で 404 |
| 4 | 404 (member not found) | 存在しない memberId | `404 { error: "member_not_found" }` | 残さない | resolver で 404 |
| 5 | 404 (attendance not found on DELETE) | 削除対象が存在しない | `404 { error: "attendance_not_found" }` | 残さない | DELETE handler |
| 6 | 409 (重複) | 同一 (sessionId, memberId) 二重 INSERT | `409 { error: "attendance_already_recorded", existing }` | **残さない**（INSERT 失敗のため） | hook は 2xx のみ書込 |
| 7 | 422 (invalid memberId 形式) | UUID 形式違反等 | `422 { error: "invalid_request", issues: [...] }` | 残さない | zod parse 段階 |
| 8 | 422 (削除済み memberId 指定) | `member_status.isDeleted=true` の memberId に attendance 付与 | `422 { error: "member_is_deleted" }` | 残さない | service 層 guard |
| 9 | 5xx (D1 無料枠超過 / 一時障害) | D1 unreachable | `503 { error: "database_unavailable" }` | 残さない | retry 推奨 toast |
| 10 | 同時 click race | 同 admin が連打 | 2 件目 409、1 件目 201 | 1 件のみ | UNIQUE 制約で安全 |
| 11 | 同時 click race (異 admin) | A と B が同タイミング | 1 件目 201、2 件目 409 | 1 件のみ（成功 actor） | 制約で安全、追跡は 1 actor |
| 12 | sync 失敗 (Forms API) | `POST /admin/sync/responses` 中に外部失敗 | `502 { error: "forms_api_failed" }` | **残す**（action="sync.responses.run", payload.error 含む） | 失敗 trail も必要 |
| 13 | sync 部分成功 | 一部 response のみ更新 | `200 { ok, partial: true, errors: [...] }` | 残す（partial=true） | run summary を payload に |

## sync 失敗時の特例

- attendance / status / notes は 2xx 以外 audit を残さない（既存 row が変化していないため）
- **sync 系のみ** 例外: 失敗も含めて audit を残す（運用上の証跡）。`payload.error` に簡潔な原因、`payload.partial` に部分成功フラグを格納

## race / 同時操作

- attendance: DB UNIQUE が race を解決
- delete + add の同時操作: ブラウザ側 UI optimistic update を避ける（API 応答後に list 再取得）
- 同 sessionId 同 memberId のクリック連打: button を `aria-busy` でロック、API 応答後解除

## 422 (削除済み memberId 拒否)

- service 層で `member_status.is_deleted=1` をチェックし、422 で `error: "member_is_deleted"` を返す
- 同時に candidates resolver で UI から見えなくしてあるため、通常は到達しないが defense-in-depth

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 verify suite | 上記 13 ケースを test ケース化 |
| Phase 7 AC matrix | 異常系列を AC × failure case に展開 |
| 下流 08a contract | 各ステータスコードの返却を contract test |

## 多角的チェック観点

- 不変条件 **#5** 401 / 403 を確実に返す（理由: admin gate 必須）
- 不変条件 **#7** 削除済み 422（理由: 候補から漏れた場合の保険）
- 不変条件 **#15** 重複 409 + 削除済み 422 + 候補から除外（理由: 三段防御）
- 不変条件 **#11** profile 編集 endpoint への呼び出しは 404（理由: 存在しない route）
- a11y: 409 toast に「すでに参加が記録されています」明文化、aria-live="polite"
- 無料枠: 5xx 多発時はサーキットブレーカで cron 一時停止（09b で扱う）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases 13 件列挙 | 6 | pending | table |
| 2 | sync 失敗時 audit 方針 | 6 | pending | partial / error 記録 |
| 3 | race 対策 | 6 | pending | UNIQUE + UI lock |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 一覧 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] failure cases ≥ 9 カテゴリ
- [ ] 各ケースの response / audit / 備考 を表で記述
- [ ] race / sync 失敗 / 削除済み の特例を確定

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: 13 failure cases を AC matrix の異常系列へ
- ブロック条件: failure cases 9 未満なら Phase 7 不可
