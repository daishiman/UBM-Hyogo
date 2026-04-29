# lessons-learned: 04c Admin Backoffice API 苦戦箇所（2026-04-29）

> 対象タスク: `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/`
> Wave: 4 / parallel / implementation_non_visual
> 関連 references: `api-endpoints.md`（§管理バックオフィス API 04c）, `database-schema.md`, `architecture-implementation-patterns.md`
> 出典: `outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md`

将来同様の admin backoffice API を最短で正しく実装するための知見をまとめる。

## L-04C-001: tag queue resolve は queue 状態と member_tags への二段書き込みが境界

**苦戦箇所**: `POST /admin/tags/queue/:queueId/resolve` を当初 queue status の `queued -> reviewing -> resolved` 遷移だけで完了させていたが、候補 tag が実際の `member_tags` に反映されず spec 11 の AC が満たせなかった。途中失敗時の冪等性（同一 queueId で再実行可能か）も未定義だった。

**解決方針**: resolver を「queue 行 transition」と「`assignTagsToMember(memberId, tagIds)`（`apps/api/src/repository/memberTags.ts` 新規）」の 2 段で構成し、後段の member_tags 反映は `INSERT OR IGNORE` で冪等化。前段は `transitionStatus` 純粋関数で `queued -> reviewing -> resolved` の必須経由を強制する（中間 status を skip した resolve は 409）。両段を 1 batch（D1 batch）で投入し、片側だけ commit される事故を排除する。

**適用先**: queue / outbox / approval-flow 系で「ledger 状態遷移 + 実 effect 反映」を扱う resolver は、status transition の純粋関数化と batch 化を最初に設計する。

## L-04C-002: 子リソース（notes / attendance）は path memberId と所有権の両方で 404 / 409 を分離

**苦戦箇所**: `PATCH /admin/members/:memberId/notes/:noteId` で他 member の note を更新できる線形バグを Phase 7 で検出した。同じく `POST /admin/meetings/:sessionId/attendance` でも sessionId と member の組合せ妥当性が曖昧だった。

**解決方針**: 子リソースは「リソース存在しない=404」と「リソース存在するが path の親と所有関係が一致しない=409 Conflict」を明確に分離する。note / attendance handler では (a) note row 取得 → (b) `note.member_id !== params.memberId` のとき 409、(c) row 不在は 404 の順で判定する。member_delete / restore も削除済み member への mutation を 409 に揃える。

**適用先**: nested resource ルーティングは「親 path を URL の真と扱い、子の owner mismatch は必ず 409」のチェックリストを REST 実装テンプレに含める。

## L-04C-003: schema alias の状態整合は「diff 未存在」「diff と question mismatch」で別エラーに分ける

**苦戦箇所**: `POST /admin/schema/aliases` を当初「stable_key を上書きする」単純実装にしていたが、(a) そもそも該当 diff が無い、(b) diff はあるが question_id が path / body と食い違うケースを区別せず、いずれも 200 を返してしまっていた。schema 不変条件 #14 違反。

**解決方針**: alias resolve handler では「diff row 取得 → 不在は 404 → questionId mismatch は 409 → 正常時のみ alias upsert」の順序を強制する。`updateStableKey` 呼び出しは `routes/admin/schema.ts` だけに閉じ、他から `schema_questions.stable_key` を直書きしない（grep ガード可）。

**適用先**: schema/設定アップサート系は「対象が存在するか / 期待状態と一致するか」の 2 段検証を必ず分け、HTTP status を 404 / 409 で分けて記述する。

## L-04C-004: Hono ルートは admin gate を route 単位 mount で構造保証する（9 router 分割）

**苦戦箇所**: 当初 admin 系 endpoint を 1 ファイルに集約し handler ごとに `c.req.header('Authorization')` を読んでいたため、新規追加時に gate 適用漏れが発生しやすかった。さらに `PATCH /admin/members/:memberId/profile` や `PATCH /admin/members/:memberId/tags` の不在を「実装しない」と口頭で守るしかなかった。

**解決方針**: 9 ルーター（dashboard / members / member-status / member-notes / member-delete / tags-queue / schema / meetings / attendance）に分割し、各 router factory が `app.use("*", adminGate)` を mount 時に 1 度だけ install する。不在 endpoint は「ファイルが存在しない」ことで構造的に保証する。`apps/api/src/index.ts` で `app.route("/admin", router)` 単位に install することで、gate 漏れと不在 endpoint 違反を grep / typecheck で検出可能にする。

**適用先**: 認可境界が多い admin 系 API は「handler 単位 gate」ではなく「mount 単位 gate」を採用し、責務 1 ファイル 1 router のルールで分割する。

## L-04C-005: zod による入力厳格化は query / date / pagination で必ず分岐する

**苦戦箇所**: `GET /admin/meetings` の `limit` / `offset` を `Number(c.req.query('limit'))` で扱った結果、`limit=abc` が `NaN` で D1 に渡って 500 を起こした。`heldOn` も `Date(c.req.query('heldOn'))` だと `2026-99-99` 等の不正値が silently `Invalid Date` として通った。

**解決方針**: query は `z.object({ limit: z.coerce.number().int().min(1).max(100).optional(), offset: z.coerce.number().int().min(0).optional(), heldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })` で `*ViewZ.parse` する。失敗時は zod error から 400 を返す（500 にしない）。同様に body は `z.object(...)` で `safeParse` し、戻り値で 400 / 422 を分ける。

**適用先**: admin/management 系 API は zod を「query / params / body / response」の 4 面で必ず適用し、`coerce` 系を使うときも min/max/regex で範囲を狭める。

## 関連未タスク・後続 wave 連携

- 05a: adminGate を Auth.js + `admin_users` active 判定に差し替え、audit_log に実 actor email を注入する。04c 時点では `SYNC_ADMIN_TOKEN` Bearer + `actor_email='admin@local'` のスタブ。
- 06c: admin UI が `apps/api` の本 9 router を消費する。詳細ビュー（`profile.attendance`）の build は本 wave 担当。
- attendance 専用 audit `targetType` の追加は audit_log schema 拡張時に分離（現状は `meeting` 流用）。

## 参照

- 実装: `apps/api/src/routes/admin/*.ts`（9 router）, `apps/api/src/repository/dashboard.ts`, `apps/api/src/repository/memberTags.ts`
- AC × verify: `outputs/phase-07/main.md`
- 不変条件: spec 11 / 12 / 07 + `outputs/phase-12/implementation-guide.md` の構造的保証表
