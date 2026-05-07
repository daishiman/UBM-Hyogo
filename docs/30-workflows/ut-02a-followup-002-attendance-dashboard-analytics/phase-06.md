# Phase 6: 異常系検証

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 6.1 failure cases

| # | ケース | 入力 | 期待挙動 | 検証方法 / test |
| --- | --- | --- | --- | --- |
| F1 | 空テーブル（attendance / sessions / members が 0 件） | empty D1 | overview = `{ totalSessions: 0, totalMembers: 0, overallRate: 0 }`、by-session / ranking は空配列 | T2（zero-division は `NULLIF` で防御） |
| F2 | 全削除済み session（`meeting_sessions.deleted_at IS NOT NULL`） | seed: deleted-only sessions | 集計対象から除外、totalSessions に含まない、by-session 配列に出現しない | T3, T6 |
| F3 | 全削除済み member（`member_status.is_deleted = 1`） | seed: deleted-only members | totalMembers / ranking から除外 | T3, T8 |
| F4 | admin gate 未認証アクセス | no `Authorization` header | 401 | T16 |
| F5 | admin role 不足アクセス（一般会員 token） | non-admin token | 403 | T17 |
| F6 | 大量データ（1000 sessions × 1000 members、約 100k attendance 行） | seeded large fixture | aggregate 3 本いずれも単発クエリで p95 < 500ms（参考値）、index utilisation 維持 | T22 |
| F7 | index 未利用検出（migration が apply されていない / 名前 typo） | EXPLAIN QUERY PLAN 実行 | `SCAN member_attendance` / `SCAN meeting_sessions` 検出時点で test fail | T9, T10, T11 |
| F8 | SQL injection 試行（`limit=1; DROP TABLE`） | query string injection | bind parameter で防御、500 にもならず query string は数値 parse で 400 | route 層で zod validation。T13〜T15 派生で 400 を確認 |
| F9 | D1 timeout / connection error | mock で reject | 500 + 構造化ログ（`{ error: "internal_error", route, ... }`）、UI 側はエラーカード表示 | mock test（dashboard.test.ts） |
| F10 | aggregate query 結果型不整合（`null` 混入） | partial seed | `COALESCE` / `NULLIF` で 0 にフォールバック、`NaN` を返さない | T2 派生 |
| F11 | chunk pattern を誤って流用 | 実装ミス | T12（grep + 構造的）が fail | T12 |
| F12 | `apps/web` から D1 直接 import | 実装ミス | grep test が fail | T21 |

## 6.2 セキュリティ異常系

| # | 攻撃シナリオ | 防御 |
| --- | --- | --- |
| S1 | 一般会員が `/admin/dashboard/attendance/*` を直接叩く | 05a admin gate が 403 |
| S2 | actor 偽装（ヘッダ書き換え） | gate の session 検証で防御。route 層は `c.get("adminContext")` のみを信頼 |
| S3 | SQL injection（`limit` query 経由） | zod で `z.coerce.number().int().min(1).max(1000)`、それ以外は 400 |
| S4 | 集計 API の DoS（無制限 `limit`） | `limit` 上限 1000 で zod キャップ。それ以上は 400 |
| S5 | 集計結果からの個人特定（ranking で member_id 露出） | `MemberAttendanceRanking.memberId` は internal id。display は `displayName` のみ。member 全削除済み（is_deleted=1）は除外（F3） |

## 6.3 chunk pattern 非流用の再確認

- `ATTENDANCE_BIND_CHUNK_SIZE=80` は 02a-followup-001 read path（`findByMemberIds`）専用
- aggregate 3 関数で流用すると以下の問題が発生:
  - chunk ごとに partial result が返り、in-memory での再 GROUP BY が必要 → AC-1 違反
  - chunk 境界での重複カウント / 取りこぼしリスク → AC-3 違反（index 利用不足）
  - p95 latency 悪化（N 回の round-trip）→ F6 失敗
- F11 で grep + 構造的に検出する

## 6.4 race / concurrency

| # | シナリオ | 挙動 |
| --- | --- | --- |
| C1 | 集計クエリ実行中に attendance write 発生 | D1 read isolation により、aggregate は実行開始時点の snapshot を返す。結果が write 反映前後でズレるのは仕様（admin dashboard 用途では許容） |
| C2 | 3 endpoint を並列 fetch | 各 query は独立、相互依存なし。UI 側は Promise.all で取得 |

## 6.5 リカバリ

| 障害 | リカバリ手順 |
| --- | --- |
| migration apply 失敗 | `apps/api/migrations/0015_attendance_analytics_indexes.sql` を rollback（`DROP INDEX IF EXISTS idx_member_attendance_member;`）するスクリプトをローカルで実行。production は次回 deploy で `IF NOT EXISTS` により安全に再 apply 可能 |
| 02b との migration 番号衝突発覚（リリース後） | 番号は immutable のため、衝突分を新番号で migration 追加（古い側はそのまま）。詳細は Phase 5 §5.3 |
| EXPLAIN で対象表の full scan 検出（regression） | 該当 SQL に対応する index を migration 追加、または既存 index 名を確認し SQL 側の column 順を index 順に合わせる |
| aggregate 結果が現実とズレる | `member_status.is_deleted` / `meeting_sessions.deleted_at` の WHERE 句を再確認。F2 / F3 の test を追加 |

## 6.6 migration 失敗時のロールバック手順

```sql
-- apps/api/migrations/rollback/0015_attendance_analytics_indexes_down.sql（手動実行用、versioned ではない）
DROP INDEX IF EXISTS idx_member_attendance_member;
```

production では `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file rollback/...` 経由で実行。data 削除を伴わないため再 apply は安全。

## 6.7 DoD

- F1〜F12, S1〜S5, C1〜C2 が Phase 4 test matrix のいずれかでカバーされている
- カバーされていない場合は test 追加してから Phase 7 に進む
- chunk pattern 非流用が grep + 構造的に保証されている（F11 / T12）
- 02b との migration 番号調整手順が Phase 5 §5.3 と本 Phase §6.5 の両方に明記されている
