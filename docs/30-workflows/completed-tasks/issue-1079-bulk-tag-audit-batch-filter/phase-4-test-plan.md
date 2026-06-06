# Phase 4: テスト作成（TDD Red 計画）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api: contract / repository spec 拡充） |

> 本ファイルは Task A（apps/api）の TDD Red 計画である。実装前に追加するテストケースと期待結果を
> 列挙する。本タスクではコードを実装しない（runtime 完了語を書かない）。実テスト追加は実装サイクル
> （03.実装.md）で行う。Task B / Task C（apps/web component / page）のテストは Phase 2 §9 に概要が
> あり、Web レーンのテスト詳細はそれぞれの Task 仕様で扱う。本 Phase 4 は apps/api 2 spec に集中する。

---

## 1. TDD Red の前提（既存 spec 様式の踏襲）

| 観点 | 既存実態（踏襲対象） |
| --- | --- |
| contract spec ファイル | `apps/api/src/routes/admin/audit.contract.spec.ts`。`@vitest-environment node`・`createAdminAuditRoute()` を直接叩く・`makeEnv(env)` で `DB` binding を渡す。 |
| **d1 config 必須** | contract spec は `setupD1()`（in-memory D1）を `beforeEach` で初期化し `seedAudit(env)` で seed する。batchId ケースの追加 row も同じ `INSERT INTO audit_log (...) VALUES (...)` パターンで seed する（d1 binding 無しでは動かない）。 |
| repository spec ファイル | `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`。`setupD1()` + `env.loadFixtures([seedAuditLog])`・`auditLog.listFiltered(env.ctx, {...})` を直接呼ぶ。 |
| describe / it 命名 | contract: `describe("admin audit route", ...)` 配下に `it("GET /audit: ...")` 様式。repository: `describe("auditLog (append-only)", ...)` 配下に `it("listFiltered: ...")` 様式。新規 it も同一プレフィックス・日本語説明文で揃える。 |
| 命名規則 | 関数 camelCase / zod schema `*Z` / 型 PascalCase（Phase 1 §既存命名規則と整合）。 |

> batchId を持つ audit row の seed は、`after_json` に `{"tagId":"...","source":"manual","batchId":"<uuid>"}`（assign 由来）、
> `before_json` に `{"tagId":"...","batchId":"<uuid>"}`（unassign 由来）を JSON 文字列で固定する。
> これは `apps/api/src/routes/admin/members.ts` の `POST /members/tags/bulk` が実際に書き込む shape
> （L761 / L770）に一致させる。contract test で両位置を固定することで検索漏れ回帰を検知する。

---

## 2. contract spec 拡充（`audit.contract.spec.ts`）

`seedAudit` に batchId 付き row を追加する（既存 5 row はそのまま）。追加 seed 例（固定 UUID は決定論のためリテラル）:

| auditId | action | targetType | targetId | before_json | after_json | created_at |
| --- | --- | --- | --- | --- | --- | --- |
| `audit_batch_assign` | `admin.member.tag_assigned` | `member` | `m1` | `null` | `{"tagId":"t1","source":"manual","batchId":"BATCH-A"}` | `2026-05-01T10:00:00.000Z` |
| `audit_batch_unassign` | `admin.member.tag_unassigned` | `member` | `m2` | `{"tagId":"t1","batchId":"BATCH-A"}` | `null` | `2026-05-01T10:00:01.000Z` |
| `audit_batch_other` | `admin.member.tag_assigned` | `member` | `m3` | `null` | `{"tagId":"t2","source":"manual","batchId":"BATCH-B"}` | `2026-05-01T10:00:02.000Z` |

> 固定 UUID は実運用では `crypto.randomUUID()` の v4 だが、テストでは決定論のため `BATCH-A` / `BATCH-B`
> のようなリテラルを使い、`z.string().min(1)` を通る非空文字列であれば検索ロジック検証には十分。

| TC | 観点（AC） | 入力 | 期待結果 |
| --- | --- | --- | --- |
| (a) batchId のみ絞り込み | AC-1 | `/audit?batchId=BATCH-A` | `items` の auditId 集合 = `{audit_batch_assign, audit_batch_unassign}` のみ（after 側 / before 側両方が拾われる）。`BATCH-B` 行は含まない。 |
| (b) action + batchId 併用 | AC-3 | `/audit?action=admin.member.tag_assigned&batchId=BATCH-A` | `items` = `audit_batch_assign` のみ（unassign は action 不一致で AND 除外）。 |
| (c) appliedFilters echo | AC-1 | `/audit?batchId=BATCH-A` | `body.appliedFilters.batchId === "BATCH-A"`。他フィルタ未指定なら `action:null` 等は従来どおり。 |
| (d) cursor pagination で batchId 保持 | AC-4（API 側） | `/audit?batchId=BATCH-A&limit=1` → `nextCursor` 取得 → `/audit?batchId=BATCH-A&limit=1&cursor=<next>` | 1 ページ目 = `audit_batch_unassign`（created_at 降順先頭）、2 ページ目 = `audit_batch_assign`。両ページとも batchId filter が効き、`BATCH-B` は出ない。`appliedFilters.batchId` が両レスポンスで `"BATCH-A"`。 |
| (e) batchId 不一致 | §8 入出力 | `/audit?batchId=NO-SUCH-BATCH` | `items: []`・`nextCursor: null`・status 200（エラーではない）。 |
| (f) batchId 空文字 | §8 入出力（設計判断） | `/audit?batchId=`（空文字 query） | **400 にはしない。** route 層が `c.req.query("batchId") || undefined` で undefined 化するため filter 未適用＝全件（既存挙動）になる。`appliedFilters.batchId === null`。`z.string().min(1)` は「query が来たが空文字」を上流で undefined に潰す設計のため zod reject に到達しない。この挙動を assert する（空文字で 400 を期待しない）。 |

> 設計判断（f）の根拠: 既存 audit route は他の全 string filter も `query || undefined` で正規化しており、
> 空文字 = 未指定として扱う一貫した契約を持つ。batchId のみ空文字で 400 にすると UX が非一貫になる。
> `z.string().min(1)` は「明示的に min(1) 文字列」を要求するが、空文字は route 層で undefined 化され
> safeParse に渡らないため reject されない（= filter 適用なし）。

### contract spec 既存回帰（壊さないこと）

- 既存 11 ケース（authz 401 / masked JSON / UTC range / broken JSON / identity.dismiss / admin_member_note /
  cursor pagination 維持 / limit 400 / routed mount 200 / unknown cursor 空ページ）は seed 追加後も全 green を維持する。
  → 新規 batchId row は action / targetType が既存ケースの filter 条件と重複しないため、既存 `toHaveLength(1)`
  系 assertion を壊さないことを seed 設計時に確認する（例: `attendance.add` / `identity.dismiss` 等とは別 action）。

---

## 3. repository spec 拡充（`auditLog.repository.spec.ts`）

`listFiltered(env.ctx, { batchId, ... })` を直接呼ぶ unit。seed は既存 `seedAuditLog` fixture に加え、
各テスト内で batchId 付き row を `env.db.prepare("INSERT INTO audit_log ...").bind(...).run()` で追加する
（既存 cursor テスト L121-132 と同じ inline INSERT パターン）。

| TC | 観点（AC） | seed | 呼び出し | 期待結果 |
| --- | --- | --- | --- | --- |
| (g) after_json.batchId 一致（assign 由来） | AC-1 | `after_json={"tagId":"t1","source":"manual","batchId":"BX"}` の 1 行 | `listFiltered(ctx, { batchId: "BX", limit: 10 })` | その 1 行の auditId のみ返る。 |
| (h) before_json.batchId 一致（unassign 由来） | AC-1 | `before_json={"tagId":"t1","batchId":"BY"}` の 1 行 | `listFiltered(ctx, { batchId: "BY", limit: 10 })` | その 1 行の auditId のみ返る（before 側も OR で拾える）。 |
| (i) 両方混在 batch | AC-1 | 同一 batchId `BZ` を after に持つ assign 行 1 + before に持つ unassign 行 1 | `listFiltered(ctx, { batchId: "BZ", limit: 10 })` | assign / unassign 両 row が返る（after OR before）。件数 2。 |
| (j) action filter と AND 結合 | AC-3 | (i) と同じ `BZ` の 2 行 | `listFiltered(ctx, { batchId: "BZ", action: "admin.member.tag_assigned", limit: 10 })` | assign 行のみ（unassign は action 不一致で AND 除外）。件数 1。 |
| (k) 無一致 | §8 | batchId を持つ行が無い、または別値 | `listFiltered(ctx, { batchId: "NOPE", limit: 10 })` | 空配列 `[]`。 |

### repository spec 補助観点

- **binding 番号がずれない**: (i) の OR 2 項が同一 `?N` を共有する（`add()` を使わず 1 回 push）ことを、
  検索結果が正しく返ること（=binding 値が両 json_extract に正しく渡る）で間接検証する。SQL 文字列の
  直接 assert は行わず、結果ベースで担保する（既存 spec 様式に整合）。
- **fromUtc / toUtcExclusive との AND 併用**（任意・余裕があれば）: batchId + 日付 range で AND が成立し、
  range 外の同一 batchId 行が除外されることを 1 ケースで担保（AC-3 / AC-5 の併用推奨を裏付け）。

---

## 4. 期待される Red → Green

- Red（実装前）: TC (a)-(f) / (g)-(k) は `ListAuditQueryZ` / `AuditLogListFilters` に batchId が無く、
  `listFiltered` が batchId を無視するため、絞り込みが効かず期待集合と不一致で fail する。
  `appliedFilters.batchId` 参照は型エラー / undefined で fail する。
- Green（実装後）: Phase 5 の audit.ts / auditLog.ts 変更で全ケース pass する。

## 5. テストファイル命名 / 配置

- 既存ファイルへの追記のみ（新規ファイルなし）: `audit.contract.spec.ts` / `auditLog.repository.spec.ts`。
- 新規ファイルを作る場合も `*.spec.ts` のみ（`*.test.ts` 禁止・CLAUDE.md 不変8）。

## 完了条件 (DoD)

- contract spec に TC (a)-(f)、repository spec に TC (g)-(k) の追加計画が、seed・入力・期待結果込みで記述されている。
- 既存ケースの回帰（壊さない範囲）と d1 config 必須・命名規則踏襲が明記されている。
- 空文字 batchId（f）の設計判断（400 にしない）が根拠付きで記録されている。
