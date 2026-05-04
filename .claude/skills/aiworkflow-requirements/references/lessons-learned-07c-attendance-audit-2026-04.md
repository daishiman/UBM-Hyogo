# lessons-learned: 07c Attendance Audit API 苦戦箇所（2026-04-30）

> 対象タスク: `docs/30-workflows/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/`
> Wave: 7 / parallel / implementation_non_visual
> 関連 references: `api-endpoints.md`（§管理バックオフィス API）, `database-implementation-core.md`, `task-workflow-active.md`
> 出典: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md`

将来同様の attendance / audit_log 系 API を最短で正しく実装するための知見をまとめる。

## L-07C-001: duplicate attendance は 409 + existing row を一緒に返す

**苦戦箇所**: `POST /admin/meetings/:sessionId/attendance` で UNIQUE 制約違反（`member_id, session_id`）を検出した際に、当初は単に `409 attendance_already_recorded` を返すだけで終わっていた。admin UI（06c）は重複時に既存の attendedAt / createdAt / assignedBy を表示したいが、最初の実装では情報が失われ、UI 側で再度 `GET candidates` を叩く 2 段アクセスになっていた。

**解決方針**: repository 層で UNIQUE 違反を catch した直後に `getAttendance(memberId, sessionId)` で既存 row を取得し、`{ ok: false, reason: 'duplicate', existing: MemberAttendanceRow }` を route に返す。route は `409` ステータスと共に `{ error: "attendance_already_recorded", existing: AttendanceResponse }` を返却する。これで admin UI は 1 リクエストで「重複 + 既存内容」を取得できる。

**適用先**: UNIQUE 制約 / domain conflict 系で 409 を返す API は、必ず「既存 row の projection」をエラーレスポンスに同封する設計を最初から組み込む。

## L-07C-002: audit_log の actor は middleware から service へ明示注入する

**苦戦箇所**: `audit_log.actor_id / actor_email` を当初 `"system"` ハードコードで実装していたが、admin 操作の追跡性として実ユーザーの email が必要だった。`requireAdmin` middleware で attach した `authUser` を handler から audit 呼び出しに渡す配線が散在し、テストでも mock が増えた。

**解決方針**: `requireAdmin` middleware の `c.set("authUser", { id, email })` を Variables 型に固定し、handler では `c.get("authUser")` で 1 行取得 → repository / service へ `actor: { id, email }` として明示引数で渡す。Hono context を service 層に渡さない（テスタビリティと層分離のため）。`auditAppend(db, { action, actor, target, after })` のシグネチャを統一し、bulk import 等の後続タスク（`task-07c-attendance-csv-import.md`）でも同じシグネチャで再利用可能にする。

**適用先**: audit_log を伴う admin handler は、middleware から context.set した actor を「明示引数」で service に注入するパターンに揃える。

## L-07C-003: candidates 列挙は LEFT JOIN + 単一 SELECT で複合除外を構造化する

**苦戦箇所**: `GET /admin/meetings/:sessionId/attendance/candidates` で「削除済み member（is_deleted=1）」と「既に登録済みの attendance」の双方を除外する SQL を、当初 `UNION` / `EXCEPT` / 個別 SELECT の組み合わせで書き、N+1 と可読性低下を招いた。

**解決方針**: `SELECT m.* FROM members m LEFT JOIN member_attendance a ON a.member_id = m.id AND a.session_id = ? WHERE a.member_id IS NULL AND m.is_deleted = 0` の単一 SELECT に集約。テストでは「削除済み member は出ない」「既登録 member は出ない」「未登録の active member のみ出る」の 3 ケースを independence で固定する。

**適用先**: 「複数 boolean 条件の除外候補列挙」は LEFT JOIN + `IS NULL` パターンで単一 SELECT 化し、副問い合わせ/UNION を回避する。

## L-07C-004: 異常系の HTTP status を repository の Result 型 reason enum で分岐する

**苦戦箇所**: POST add のエラーが `409 duplicate` / `422 deleted_member` / `404 session_not_found` / `404 member_not_found` の 4 種に分かれるが、初期実装は repository が throw する Error message を route が文字列マッチして status を決めていた。i18n / refactor 耐性が低い。

**解決方針**: repository が `type AddAttendanceResult = { ok: true; row: MemberAttendanceRow } | { ok: false; reason: 'duplicate' | 'member_deleted' | 'session_not_found' | 'member_not_found'; existing?: MemberAttendanceRow }` の discriminated union を返す。route は `switch (result.reason)` で HTTP status を決める。テストは reason を直接 assert でき、message 文字列に依存しない。

**適用先**: 複数の異常系を扱う repository / service は、`{ ok: boolean; reason?: enum; ... }` の discriminated union を返すパターンを最初から採用する。`throw` で例外を伝播させない。

## L-07C-005: audit projection は API response projection と独立させる

**苦戦箇所**: `audit_log.after_json` に格納する payload を最初 `toAttendanceResponse(row)` の戻り値そのままで保存していたが、API レスポンス形を変えると過去 audit 行と不整合になる懸念があった（after_json は不変記録としての性質を持つ）。

**解決方針**: audit に書き込む projection を `toAuditPayload(row)` として独立関数化し、API レスポンスの `toAttendanceResponse(row)` と分離する。両者の field set は意図的に重複していてよいが、変更の影響範囲を独立させる。`before_json`（DELETE 時）も同じ `toAuditPayload` を使う。

**適用先**: audit_log の payload は、現行 API レスポンスの projection を流用せず、専用の `toAuditPayload` を最初から切り出す。後方互換破壊を避けるため、audit 側は field 削減の自由を持たせない方針で固定する。

## 関連未タスク・後続 wave 連携

- `task-07c-attendance-csv-import.md`: bulk import 化。L-07C-001（duplicate + existing）と L-07C-002（actor 注入）を bulk row レベルで再利用する。dry-run / commit 共通 service と行別 reason 集約が論点。
- `task-07c-attendance-visual-smoke.md`: Phase 11 を NON_VISUAL（Vitest smoke + curl 手順）で締めた分、admin UI 側の visual smoke は 06c → 08b/09a へ委譲済み。
- `task-07c-audit-log-browsing-ui.md`: 07c は `audit_log` への append のみ。閲覧 UI / フィルタ / CSV export は 08a contract test + 09a staging UI に分離。
- `task-07c-audit-log-external-siem.md`: 長期保管・改ざん検知・外部 SIEM 連携は MVP 外。09b cron / monitoring の責務として roadmap 化。

## skill 改善フィードバック（task-specification-creator 反映済み）

- API-only implementation task は Phase 11 を NON_VISUAL evidence（Vitest smoke + curl 手順）で締め、visual screenshot は下流 wave に委譲する運用を明示（`task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` に「API-only route 追加」を例示として追記）。
- audit action 命名（`attendance.add` / `attendance.remove`）は `target_type` / `target_id` と組で固定し、bulk / single の差異を action 名に持ち込まない。

## 参照

- 実装: `apps/api/src/routes/admin/attendance.ts`, `apps/api/src/routes/admin/attendance.test.ts`, `apps/api/src/repository/attendance.ts`, `apps/api/src/repository/attendance.test.ts`
- AC × verify: `docs/30-workflows/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/outputs/phase-07/ac-matrix.md`
- 不変条件: spec 11 / 12 + `outputs/phase-12/implementation-guide.md`
- skill feedback: `outputs/phase-12/skill-feedback-report.md` → `task-specification-creator/SKILL.md` v2026.04.30-07c-attendance-audit-closeout
