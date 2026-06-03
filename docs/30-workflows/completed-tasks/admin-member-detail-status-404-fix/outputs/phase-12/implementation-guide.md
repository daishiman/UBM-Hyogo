# 実装ガイド: admin 会員詳細・status 404 修正

> **[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]** — 本ガイドは実装仕様と local 実装結果を固定する。remote apply / deploy / commit / PR は user-gated。

---

## Part 1: なぜこの修正が必要か（やさしい説明）

### たとえ話: 名簿カードと状態カード

学校の図書室に「会員名簿」があると想像してください。

- **会員名簿（member_identities）**: 「この人は会員です」という名前のカード。
- **状態カード（member_status）**: 「この人の本を公開してよいか／隠すか」などの取り扱いを書いたカード。

普通は、会員になると名簿カードと状態カードが**両方**作られます。ところが、ある手続きの抜け道のせいで「名簿カードはあるのに、状態カードだけ無い人」が出てしまいました。

### 何が困っているか

- **会員一覧の画面**は「名簿カードがあれば表示」する作りなので、状態カードが無い人も一覧には出ます。
- でも、その人の**詳細画面を開こうとすると**「状態カードが見つからない＝この人はいません（404）」と勘違いして、画面が「読み込み失敗」になってしまいます。
- 公開する／隠すの**切り替えボタン**も、状態カードが無いと「いません（404）」となり操作できません。

つまり「名簿には載っているのに、状態カードが無いせいで、その人の詳細を開けない・操作できない」という食い違いが起きています。

### この修正で何をするか

1. **状態カードが無ければ、その場で既定の状態カードを自動で用意する**（中身は「まだ未確認・会員のみ公開」という安全な初期値）。これで詳細を開けるようになり、切り替えも効くようになります。
2. **これから新しく会員になる人**には、名簿カードを作るのと**同時に**状態カードも必ず作る（再発防止）。
3. **今すでに状態カードが無い人**には、一括で状態カードを後から配る（穴埋め＝backfill）。
4. 「本当に名簿にも載っていない人」を開こうとしたときだけ、これまで通り「いません（404）」と返す（ここは変えない）。

この修正は**見た目（画面のデザイン）を一切変えません**。今まで「読み込み失敗」だった画面が、ちゃんと中身を表示できるようになるだけです。

---

## Part 2: 技術仕様（エンジニア向け）

### 2.1 根本原因（非対称な行存在前提）

| 経路 | ファイル:行 | 行存在前提 | 結果 |
|------|------------|-----------|------|
| 会員一覧 | `apps/api/src/routes/admin/members.ts:329` | LEFT JOIN（status 任意） | orphan も表示される |
| 会員詳細 | `apps/api/src/repository/_shared/builder.ts:388`（`if (!identity \|\| !status) return null`）/ `:391`（`if (!response) return null`） | status・response 行が必須 | orphan で `null` → 404 |
| status 更新 | `apps/api/src/routes/admin/member-status.ts:52-53`（`if (!before) 404`） | status 行が必須 | orphan で 404 |

`member_status`（`apps/api/migrations/0002_admin_managed.sql:5-15`）は全 NOT NULL カラムが DEFAULT を持つため、`member_id` のみで安全に行生成できる。

### 2.2 F-1: `ensureMemberStatusRow` + `defaultMemberStatusRow`（`apps/api/src/repository/status.ts`）

シグネチャ:

```ts
export async function ensureMemberStatusRow(c: DbCtx, id: MemberId): Promise<void>;
export const defaultMemberStatusRow: (id: MemberId) => MemberStatusRow;
```

SQL（冪等・既存破壊なし）:

```sql
INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)
```

- 冪等性は PRIMARY KEY `member_id` 競合時の `INSERT OR IGNORE` no-op が担保。既存行は上書きしない。
- `defaultMemberStatusRow` は builder が status 欠落時に view を組むための純関数。member_status DEFAULT に一致させる 9 カラム（後述 §2.7）。

### 2.3 F-2: builder degraded view（`apps/api/src/repository/_shared/builder.ts`）

`buildAdminMemberDetailView` の 404 境界を **identity 不在のみ**へ縮小する。

```ts
const [identity, status] = await Promise.all([findMemberById(c, mid), getStatus(c, mid)]);
if (!identity) return null;                                // 404 は identity 不在のみ
const effStatus = status ?? defaultMemberStatusRow(mid);  // status 欠落は既定で代替
const response = await findCurrentResponse(c, mid);
// response あり: 従来パスの status 参照を effStatus へ機械置換のみ（出力不変・AC-7）
// response 無し: degraded view
//   - responseId = (identity.current_response_id?.length > 0) ? current_response_id : member_id  ← min(1) 充足
//   - summary    = extractSummary("{}")   ← SummaryZ を満たす空 summary（fullName="" 等）
//   - sections   = []
```

- `extractSummary`（`builder.ts:97`）の引数は `answersJson: string`（null 非許容）。degraded では `extractSummary("{}")` を呼ぶ。`extractSummary(null)` は型不一致で呼ばない。
- `MemberProfileZ.responseId`（`z.string().min(1)`）は `current_response_id ?? member_id` の非空フォールバックで充足。
- status あり時は `effStatus === status` のため出力が 1 byte も変わらない（AC-7 非回帰）。

### 2.4 F-3: route 404 境界変更（`apps/api/src/routes/admin/member-status.ts`）

```ts
const identity = await findMemberById(db, mid);     // 404 判定を identity 存在へ
if (!identity) return c.json({ ok: false, error: "not found" }, 404);
await ensureMemberStatusRow(db, mid);               // mutation 前に既定行を保証
const before = await getStatus(db, mid);            // ensure 後は必ず非 null
// publishState / hiddenReason の更新は従来どおり（setPublishState / UPDATE member_status）
```

- 旧 `const before = await getStatus(db, mid); if (!before) return 404;`（`:52-53`）を削除。
- `import { findMemberById } from "../../repository/members"` と `import { ensureMemberStatusRow } from "../../repository/status"` を追加。
- 真の不存在（identity も無い memberId）は 404 を維持（AC-4）。

### 2.5 F-4: ingest 予防（`apps/api/src/jobs/sync-forms-responses.ts`）

新規 identity 作成ブロック（`:303-311`）内、`upsertMember` 直後に挿入:

```ts
memberId = asMemberId(crypto.randomUUID());
await upsertMember(dbCtx, { /* 既存 */ });
await ensureMemberStatusRow(dbCtx, memberId);   // identity と同期で既定 member_status 行を保証
```

- 既存 `setConsentSnapshot`（`:385`・`INSERT ... ON CONFLICT`）は維持。ensure と二重保証。
- FakeD1 fixture（`apps/api/src/jobs/__fixtures__/d1-fake.ts`）に `INSERT OR IGNORE INTO member_status` 分岐を追加する（AC-5 検証用）。

### 2.6 F-5: migration 0024 DDL 全文（`apps/api/migrations/0025_backfill_member_status.sql`・新規）

```sql
-- 0025_backfill_member_status.sql
-- orphan member_identities（member_status 行が無い会員）に既定 member_status 行を補完する。
-- NOT NULL カラムは全て DEFAULT を持つため member_id のみで安全（0002_admin_managed.sql）。
-- INSERT OR IGNORE により再適用・部分適用後でも冪等（重複・上書きなし）。
INSERT OR IGNORE INTO member_status (member_id)
SELECT mi.member_id
FROM member_identities mi
LEFT JOIN member_status ms ON ms.member_id = mi.member_id
WHERE ms.member_id IS NULL;
```

- 4 桁連番 `0024`（直近 `0023_member_photos_source.sql` の次）。`migrations/sequence-exceptions.json` は duplicates のみ記録のため更新不要（MINOR-4）。
- 単一 statement・末尾 `;`。`_setup.ts` の splitStatements / `db.exec` で適用可能。

### 2.7 member_status DEFAULT 値一覧（`defaultMemberStatusRow` の根拠）

`apps/api/migrations/0002_admin_managed.sql:5-15` 由来。`MemberStatusRow`（`status.ts:9-19`）は次の 9 カラム（`notification_opt_out` は型に存在しない・MINOR-1）。

| カラム | 既定値 | `defaultMemberStatusRow` |
|--------|--------|--------------------------|
| `member_id` | （引数） | `id` |
| `public_consent` | `'unknown'` | `"unknown"` |
| `rules_consent` | `'unknown'` | `"unknown"` |
| `publish_state` | `'member_only'` | `"member_only"` |
| `is_deleted` | `0` | `0` |
| `hidden_reason` | `NULL` | `null` |
| `last_notified_at` | `NULL` | `null` |
| `updated_by` | `NULL` | `null` |
| `updated_at` | （builder 出力に未使用） | `""` |

`builder.ts:439-442` は `(status as { notification_opt_out?: number \| null }).notification_opt_out ?? 0` で optional アクセスするため、型に当該カラムが無くても degraded 既定は `notificationOptOut: false` で安全。

### 2.8 エラー / エッジケース

| ケース | 期待挙動 | 対応 AC |
|--------|---------|---------|
| status 欠落 + response あり | 200・既定 status で正常 view | AC-1 |
| status あり + response 欠落 | 200・summary 空・sections []・responseId フォールバック | AC-2 |
| status・response 両欠落 | 200 劣化 view（複合） | AC-1+AC-2 |
| identity 不在 | 詳細 null → 404 / status route 404（維持） | AC-4 |
| hiddenReason のみ更新で status 行欠落 | ensure で行生成後に反映 | AC-3 |
| migration 0024 再適用 | `INSERT OR IGNORE` で重複なし（冪等） | AC-6 |
| 既存 status を持つ会員 | ensure / migration とも no-op（既存値温存） | AC-7 |

---

## 視覚証跡

**UI/UX 変更なし（apps/web 無変更 = AC-8）のため Phase 11 スクリーンショットは不要。** 本修正は HTTP レスポンスのステータス・本文 shape・DB 行存在という非視覚的事実を変えるもので、画面のデザインは一切変わらない（200 受信時に既存コンポーネントがそのまま会員詳細を描画する）。

- **代替証跡**: (1) 自動テスト（builder degraded / member-status route / status repo / ingest / migration 0024 の各 spec）の PASS、(2) staging での authenticated admin による実機確認（これまで 404 だった orphan 会員が 200 で開ける・公開トグル成功）。
- (2) は admin session を要するため **ユーザーゲート**（本 workflow では実行しない）。`outputs/phase-11/screenshots/` ディレクトリ・`.gitkeep` は作らない（Phase 11 §11.2）。
