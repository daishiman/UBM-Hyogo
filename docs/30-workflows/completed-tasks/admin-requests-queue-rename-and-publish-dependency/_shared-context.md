# SSOT 共有コンテキスト — admin-requests-queue-rename-and-publish-dependency

> 並列 SubAgent（Phase 4-13 仕様作成）の唯一の正本。Phase 4-13 を書くエージェントは本ファイルの決定・ファイル・シグネチャ・AC を一字一句尊重し、独自の設計判断で逸脱しないこと。実コードを Read して行番号を裏取りしてよいが、**決定済みの命名・スコープ・データ契約を変えてはいけない**。

`[実装区分: 実装仕様書]`（taskType=implementation / visualEvidence=VISUAL / workflow_state=implemented_local_evidence_captured）

本プロンプトのサイクルで Lane A/B/C のローカルコード実装・自動検証・system spec / skill discovery surface 同期を完了した。コミット/PR/push/staging seed 投入/authenticated runtime screenshot 取得はすべて user-gated（Phase 13）。

---

## 0. 背景と真因（RCA）

ステージング `/admin/requests`（依頼キュー）を見たユーザーが「この画面が何のためにあるか分からない」「会員管理で公開/非公開を切り替えられるなら依頼キューは何のため？依存関係がない状態では？不要なら消して」と疑問を呈した。

**調査結論（真因）**:

- 依頼キュー（`/admin/requests`）= **会員本人**が `/me/visibility-request`・`/me/delete-request`（マイページ）から出した「公開停止/再公開」「退会」の**申請を、管理者が承認/却下する**承認フロー。承認すると `member_status.publish_state` / `is_deleted` が更新され、通知 outbox に enqueue される。レコードは `admin_member_notes`（`note_type ∈ {visibility_request, delete_request}` / `request_status='pending'`）として永続化され audit trail になる。
- 会員管理（`/admin/members`）の公開/非公開トグル = 管理者が `PATCH /admin/members/:memberId/status` で**即時・直接**変更する管理者起点の操作（承認フロー不要）。
- **両者は冗長ではない**。起点が違う（会員本人発の申請承認 vs 管理者起点の即時操作）。冗長に見えるのは **UI がその違いと相互関係を一切説明していないため**（真因は apps/web の情報設計欠如 + 命名の不親切さ。API/D1/Form は機能として正しく無罪）。
- 加えて「依頼キュー」という語がエンジニア外に伝わらない。

→ よって機能は**削除せず存続**させ、(1) 命名を平易化、(2) 役割・依存関係を画面上で明示、(3) staging で挙動確認できるテスト依頼 seed を整備する。これが本タスク。

## 1. ユーザー決定（AskUserQuestion 2026-06-09）

| # | 決定 |
| --- | --- |
| Q1 機能の扱い | **存続+役割明確化**（削除しない） |
| Q2 新名称 | 「依頼キュー」→ **「会員からの申請」**（画面タイトル・サイドバー項目） |
| Q3 テスト依頼 seed | **既存 TEST-MEM 会員に依頼を紐付け**（catalog.ts に依頼定義を足し build-seed-sql.ts で生成） |
| Q4 依存関係の可視化 | **会員管理に「申請中」バッジ** ＋ **相互リンク＋説明文**（複数選択） |

**スコープ外（今回サイクルで実装しない）**: `GET /api/admin/members/TEST-MEM-01 500` エラーの調査/修正、承認 before→after 公開状態の差分強調表示。これらは Q4 で選択されなかった。Phase 12 未タスク検出で baseline 候補として記録のみ。

## 2. 確定スコープ（3 レーン・1 サイクル完結）

CONST_007 に従い、全レーンを本実装サイクルの **1 サイクルで完了**できる範囲に収める。先送り・別 PR 化はしない。

### Lane A — テスト依頼 seed（apps/api / testing）
既存 TEST-MEM 会員に pending 申請（visibility_request / delete_request）を seed で紐付け、staging で依頼キューに行が出る状態を作る。

### Lane B — 命名平易化 + 依頼キュー画面の役割明確化（apps/web）
「依頼キュー」→「会員からの申請」へ表示ラベルを変更し、画面に「これは会員本人が出した申請を承認/却下する場所。管理者起点の即時変更は会員管理から」という説明と会員管理への相互リンクを置く。**ルート `/admin/requests` 自体は変更しない**（URL はエンジニア向け内部識別子。表示ラベルのみ平易化し、リンク切れ・リダイレクト追加コストを避け 1 サイクルに収める）。

### Lane C — 会員管理「申請中」バッジ + 相互リンク + API（apps/api + apps/web）
会員一覧の各行に、その会員が pending 申請を持つとき「申請中」バッジを表示し、クリックで該当タイプの会員からの申請画面へ遷移。会員管理画面に「会員本人からの申請は『会員からの申請』で承認します」という説明と相互リンクを置く。会員一覧 API に pending 申請種別を相関サブクエリで載せる。

## 3. 命名マップ（Lane B 正本・逐語）

「依頼」「キュー」「requests」表示文言の変更。**ルートパス・API パス・コンポーネントファイル名・内部 import 名・data 属性・テスト ID は変更しない**（内部識別子は不変、表示テキストのみ変更）。

| 箇所 | ファイル | Before（表示文言） | After（表示文言） |
| --- | --- | --- | --- |
| サイドバー nav ラベル | `apps/web/src/components/shell/shell-config.ts` | `依頼キュー` | `会員からの申請` |
| ページタイトル | `apps/web/app/(admin)/admin/requests/page.tsx`（`AdminPageHeader title`） | `依頼キュー` | `会員からの申請` |
| ページ説明 | 同上（`AdminPageHeader description`） | `公開状態の変更依頼・退会依頼を確認・承認します。` | `会員本人がマイページから出した「公開の停止/再開」「退会」の申請を、ここで承認・却下します。管理者が自分で公開/非公開をすぐ切り替えたいときは「会員管理」から操作してください。` |
| パンくず | 同上 | `管理 / 依頼キュー`（`ADMIN / REQUESTS`） | `管理 / 会員からの申請`（`ADMIN / REQUESTS` 英字パンくずは内部表記のため不変でよい。日本語パンくずのみ「会員からの申請」へ） |
| パネル見出し h1 | `apps/web/src/components/admin/RequestQueuePanel.tsx`（`#admin-requests-h`） | `依頼キュー` | `会員からの申請` |
| 一覧見出し | `RequestQueuePanel.tsx` | `依頼一覧` / `aria-label="依頼一覧"` | `申請一覧` / `aria-label="申請一覧"` |
| 空表示 | `RequestQueuePanel.tsx` | `未処理の依頼はありません` | `未処理の申請はありません` |
| 詳細見出し | `apps/web/src/components/admin/RequestQueueDetail.tsx` | `依頼詳細` / `aria-label="依頼詳細"` | `申請詳細` / `aria-label="申請詳細"` |
| タブラベル（NOTE_TYPE_LABEL） | `RequestQueuePanel.tsx` L50 | `公開停止/再公開` / `退会` | **不変**（既に平易） |
| 説明補助文（新規） | `RequestQueuePanel.tsx` 上部 or page.tsx | （なし） | 「公開停止/再公開」=会員が自分のプロフィール掲載を止めたい/再開したい申請、「退会」=会員がアカウント削除を希望する申請、の 1 行説明（任意・Lane B 実装者が UI 整合で配置） |

**`id`・`className`・`data-*`・テストセレクタは `admin-requests-*` のまま不変**（CSS/テスト/ Playwright 参照を壊さない）。命名変更は人間可読テキストノードと `aria-label` のみ。

## 4. Lane A データ契約（seed）

### 既存構造（裏取り済み）
- SSOT: `apps/api/src/testing/test-accounts/catalog.ts`（members: TEST-MEM-01..10, admins: TEST-ADM-01..03, meetings: TEST-MTG-01..03）
- 生成器: `apps/api/src/testing/test-accounts/build-seed-sql.ts`（catalog から決定論的に SQL 生成）
- 生成物（committed・drift guard で byte 一致検証）: `apps/api/migrations/seed/test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json`
- 投入: `scripts/seed-test-accounts.sh --env {local|staging} --action {apply|cleanup}`（staging は `scripts/cf.sh d1 execute ... --remote`、production は拒否）
- 依頼テーブル: `admin_member_notes(note_id PK, member_id, body TEXT(JSON {reason,payload}), created_by, updated_by, created_at, updated_at, note_type DEFAULT 'general', request_status, resolved_at, resolved_by_admin_id)`。pending 申請は `note_type ∈ {visibility_request, delete_request}` / `request_status='pending'`。
- 参考実装: `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` に依頼 INSERT の前例あり（body の json_object 構造を踏襲）。

### 追加する seed 依頼（既存 TEST-MEM へ紐付け）

採番: `note_id = TEST-NOTE-V01 / TEST-NOTE-V02 / TEST-NOTE-D01`（V=visibility, D=delete, 連番）。`created_by`/`updated_by` = `seed:test-accounts`（cleanup 対象明示）。

| note_id | member_id | 会員の現状 | note_type | payload | reason | 確認できる挙動 |
| --- | --- | --- | --- | --- | --- |
| TEST-NOTE-V01 | TEST-MEM-01（[TEST] 公開ログイン 太郎・現 public） | 公開中 | visibility_request | `{"desiredState":"hidden"}` | 「都合により一時的に掲載を止めたいです」 | 公開中の会員が「公開停止」を申請 → 承認で public→hidden |
| TEST-NOTE-V02 | TEST-MEM-02（[TEST] 会員限定 花子・現 member_only/非公開） | 非公開 | visibility_request | `{"desiredState":"public"}` | 「公開できるようになったので掲載をお願いします」 | 非公開の会員が「再公開」を申請 → 承認で member_only→public |
| TEST-NOTE-D01 | TEST-MEM-07（[TEST] 多タグ通知停止 七海 等・現 public・未削除を選ぶ） | 公開中・未削除 | delete_request | `{}`（payload なし） | 「退会を希望します」 | 退会申請 → 承認で is_deleted=1 + retention purge 予約 |

> 実装者注: 紐付け先 member_id は **現状 `is_deleted=0` かつ catalog 上で安定している既存会員**であること。delete_request 先は退会済（TEST-MEM-05）以外の未削除会員を選ぶ。各 member の現公開状態は catalog.ts を Read して確認し、payload の desiredState が「現状と異なる遷移」になる member を選定する（同状態への申請は承認しても無変化で確認価値が低い）。上表は第一候補。catalog 実値と矛盾する場合は同方針（公開中→hidden / 非公開→public / 未削除→delete）で member を差し替えてよいが、3 件・3 パターン（hidden 申請 / public 申請 / 退会申請）は維持する。

### catalog.ts / build-seed-sql.ts の拡張方針
1. `catalog.ts` に依頼定義を追加。形は実装者裁量だが推奨は専用配列 `requests: TestRequest[]`（`{ noteId, memberId, noteType, payload, reason }`）を `testAccountsCatalog` に追加し、member 配列とは独立に持つ（member 単位 0..N 申請）。
2. `build-seed-sql.ts` に `admin_member_notes` INSERT 生成を追加。`body = json_object('reason', ?, 'payload', json(?))`（payload が空のときは `json_object()`）。`INSERT OR REPLACE` で冪等。created_at/updated_at は他 seed と同じ固定 ISO（`2026-06-03T10:30:00.000Z` 系の既存規約に合わせる）。`request_status='pending'`、`resolved_at`/`resolved_by_admin_id` は NULL。
3. cleanup 生成に `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';` を追加。
4. `pnpm` の seed 生成/ drift guard（build-seed-sql を実行して committed SQL と byte 一致を検証するテスト・スクリプト）で committed の `test-accounts-seed.sql` / `test-accounts-cleanup.sql` を再生成しコミット対象にする。manifest は申請が member メタに影響しないなら不変（実装者が drift guard 出力で確認）。

> seed 生成器の drift guard / 実行コマンドの正確な名称は `apps/api/package.json` scripts と `apps/api/src/testing/test-accounts/` のテストを Read して確定すること（例: `pnpm --filter @ubm-hyogo/api test src/testing/test-accounts` 系）。

## 5. Lane C データ契約（申請中バッジ + API）

### API 変更（apps/api）
会員一覧 `GET /members`（`apps/api/src/routes/admin/members.ts` L353-480）の SELECT に、tags_json と同型の相関サブクエリを 1 本追加して pending 申請種別を載せる:

```sql
(
  SELECT json_group_array(DISTINCT amn.note_type)
  FROM admin_member_notes amn
  WHERE amn.member_id = mi.member_id
    AND amn.note_type IN ('visibility_request','delete_request')
    AND amn.request_status = 'pending'
) AS pending_request_types_json
```

projection に `pendingRequestTypes: parsePendingRequestTypes(row.pending_request_types_json)` を追加（`["visibility_request"|"delete_request"]` の配列・空配列許容・順序不問）。`MemberListRow` 型（L112 付近）に `pending_request_types_json: string | null` を追加。

### shared schema
`AdminMemberListViewZ` の member item schema に追加:
```ts
pendingRequestTypes: z.array(z.enum(["visibility_request", "delete_request"])).default([])
```
schema の所在（packages/shared か apps/api か）と、apps/web 側の再宣言 zod を Read で特定し、両側を同期する。web 側の members 一覧型/adapter にも同フィールドを通す。

> 注: `member_only`/`hidden`/`public` の publishState 正規化は既存。バッジは publishState とは独立に「pending 申請の有無」で出す。会員管理で非公開にしていても、その会員が別途「再公開」申請を pending で持つなら申請中バッジが出る（=依存関係が可視化される）。

### apps/web UI
- 会員一覧行（`apps/web/src/components/admin/` の members テーブル行コンポーネント。実ファイルは `rg "区画 / ステータス|MemberRow|members" apps/web/src/components/admin` で特定）に、`pendingRequestTypes.length > 0` のとき「申請中」バッジ（visibility なら「公開申請中」「退会申請中」のように種別が分かる文言が望ましい。最小は「申請中」）を表示。バッジは `<Link href="/admin/requests?type=visibility_request">`（または delete_request）で会員からの申請画面の該当タブへ遷移。両方ある場合は visibility を優先 or 両方チップ表示（実装者が UI 整合で決定、ただし遷移先 type は実在タブに一致させる）。
- 会員管理ページ（`apps/web/app/(admin)/admin/members/page.tsx` または会員管理パネル）の説明エリアに 1 文追加: 「会員本人からの『公開停止/再開』『退会』の申請は［会員からの申請］で承認します。ここでの公開/非公開トグルは管理者がすぐに切り替えるための操作です。」＋「会員からの申請」へのリンク。
- 色は OKLch トークン経由のみ。`bg-[#...]`/`text-[#...]`/HEX 直書き禁止（`verify:tokens` gate）。バッジは既存の status バッジ/チップ primitive を再利用（新規 primitive を生やさない）。

## 6. 受け入れ基準（AC・全レーン横断）

| AC | 内容 | レーン |
| --- | --- | --- |
| AC-1 | サイドバー・ページタイトル・パネル h1・パンくず（日本語）が「会員からの申請」になっている | B |
| AC-2 | 依頼キュー画面に「会員本人発の申請を承認/却下する場所」「管理者起点の即時変更は会員管理から」という説明文がある | B |
| AC-3 | 依頼キュー画面から「会員管理」への相互リンクがある | B |
| AC-4 | ルートパス `/admin/requests`・API パス・コンポーネントファイル名・`id`/`data-*`/テストセレクタは不変（リグレッションなし） | B |
| AC-5 | catalog.ts に 3 件の pending 申請（hidden 申請 / public 申請 / 退会申請）が定義され、build-seed-sql.ts が `admin_member_notes` INSERT を生成する | A |
| AC-6 | 再生成した `test-accounts-seed.sql` に 3 件の依頼 INSERT が含まれ、drift guard（生成 vs committed byte 一致）が PASS | A |
| AC-7 | `test-accounts-cleanup.sql` に `DELETE ... note_id LIKE 'TEST-NOTE-%'` が含まれる | A |
| AC-8 | seed 適用後、依頼キュー（会員からの申請）GET `/admin/requests?type=visibility_request&status=pending` に 2 件、`type=delete_request` に 1 件出る（staging 確認は user-gated） | A |
| AC-9 | 会員一覧 API レスポンス member item に `pendingRequestTypes` 配列が含まれる | C |
| AC-10 | 会員一覧で pending 申請を持つ行に「申請中」バッジが出て、クリックで会員からの申請画面の該当タブへ遷移する | C |
| AC-11 | 会員管理ページに「会員本人からの申請は会員からの申請で承認」という説明と相互リンクがある | C |
| AC-12 | HEX 直書き 0 件（`verify:tokens` / grep gate）・既存 admin tests / contract tests 非破壊 | B/C |
| AC-13 | 依頼キューを介した承認（visibility_request approve → publish_state 更新 / delete_request approve → is_deleted=1）と、会員管理の直接 PATCH の両経路が共に機能し独立であることがテスト/仕様で説明されている（依存関係の整合明示） | B/C |

## 7. テスト方針（spec ファイルは `*.spec.{ts,tsx}` のみ・CLAUDE.md 不変条件 #8）

- Lane A: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（既存あれば拡充）で、生成 SQL に 3 依頼 INSERT・cleanup DELETE が含まれること、committed との byte 一致（drift guard）を assert。
- Lane C(API): `apps/api/src/routes/admin/members.contract.spec.ts`（or list 用 spec）で、pending 申請を持つ member の list item に `pendingRequestTypes` が載ること、持たない member は空配列であることを fakeD1/fixture で assert。
- Lane B/C(web): `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx`（命名後ラベル「会員からの申請」「申請一覧」を assert）、members 行コンポーネント spec で `pendingRequestTypes` 有→「申請中」バッジ + 正しい href を assert。
- 既存テスト（RequestQueuePanel / members list / requests.contract）が新ラベル・新フィールドで壊れないよう同 wave で更新。

## 8. 実行・検証コマンド（DoD 用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens   # OKLch トークン gate（存在すれば）
rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin   # HEX 0 件
# seed 再生成 drift guard（実コマンド名は apps/api/package.json で確認）
mise exec -- pnpm --filter @ubm-hyogo/api <seed-generate-or-drift-script>
# staging 投入（user-gated・Phase 13 後）
bash scripts/seed-test-accounts.sh --env staging --action apply
```

DoD: 上記 typecheck/lint/focused test 全 PASS、HEX 0 件、seed drift guard PASS、AC-1..13 充足。staging 実投入・screenshot・commit・PR は user-gated。

## 9. 主要参照ファイル（裏取り済み・行番号は実 Read で再確認すること）

| 役割 | パス |
| --- | --- |
| 依頼キュー page | `apps/web/app/(admin)/admin/requests/page.tsx` |
| 依頼キュー panel | `apps/web/src/components/admin/RequestQueuePanel.tsx`（L50 NOTE_TYPE_LABEL, L154 h1, L171-172 一覧） |
| 依頼詳細 | `apps/web/src/components/admin/RequestQueueDetail.tsx` |
| サイドバー nav | `apps/web/src/components/shell/shell-config.ts` |
| 会員一覧 API | `apps/api/src/routes/admin/members.ts`（L353-480 list, L112 MemberListRow） |
| 会員一覧 shared schema | `AdminMemberListViewZ`（所在を rg で特定） |
| admin requests API | `apps/api/src/routes/admin/requests.ts`（GET L241-299, resolve L301-470） |
| requests contract test | `apps/api/src/routes/admin/requests.contract.spec.ts` |
| seed SSOT | `apps/api/src/testing/test-accounts/catalog.ts` |
| seed 生成器 | `apps/api/src/testing/test-accounts/build-seed-sql.ts` |
| seed 生成物 | `apps/api/migrations/seed/test-accounts-{seed,cleanup}.sql` / `test-accounts.manifest.json` |
| seed 投入 | `scripts/seed-test-accounts.sh` |
| admin_member_notes migration | `apps/api/migrations/0006_admin_member_notes_type.sql` / `0007_admin_member_notes_request_status.sql` |
| 依頼 seed 前例 | `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` |
| 仕様書 | `docs/00-getting-started-manual/specs/11-admin-management.md`（/admin/requests 記述） |

## 10. 不変条件（CLAUDE.md より・厳守）

- 既存 API endpoint surface を尊重。**新 endpoint は追加しない**（list へのフィールド追加は既存 endpoint の projection 拡張で API surface 自体は不変）。D1 schema 変更なし（admin_member_notes は既存テーブル、seed 追加のみ）。
- `apps/web` から D1 直接アクセス禁止（API 経由のみ）。
- admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（既存）。
- 色は OKLch トークン正本。HEX 直書き禁止。
- spec ファイルは `*.spec.{ts,tsx}` のみ。
- コミット/PR/push/staging seed/screenshot は user-gated。
