`[実装区分: 実装仕様書]`

# Implementation Guide — admin-requests-queue-rename-and-publish-dependency

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本ガイドは Phase 13 PR 本文の基になる。決定済みの命名・スコープ・データ契約を逸脱しないこと。

---

## Part 1 — 中学生レベルの説明

「依頼キュー」は、会員本人が「公開を止めたい」「また公開したい」「退会したい」とお願いした内容を、管理者が確認して承認・却下する画面だった。しかし画面名と説明が分かりにくく、会員管理の公開切り替えと同じ機能に見えていた。

今回の改善では、画面名を「会員からの申請」に変え、会員管理とは役割が違うことを画面上で説明した。さらに、会員管理の一覧にも「申請中」の表示を出し、どの会員に未処理の申請があるか分かるようにした。テスト用の会員にも申請データを追加したので、ステージングで実際に確認できる。

## Part 2 — 技術者向け実装詳細

Lane A/B/C はローカル実装済み。API は既存 `admin_member_notes` を相関サブクエリで参照して `pendingRequestTypes` を projection するだけに留め、新 endpoint / D1 schema 変更は追加しない。shared/contracts/web の型と zod schema を同期し、web は表示テキスト・aria-label・説明文・相互リンク・会員行バッジを最小差分で更新した。テスト、typecheck、lint、seed drift guard、HEX token grep は Phase 11 に記録したとおり PASS。

## 0. 着手前の前提

- ブランチ: `feat/admin-requests-queue-rename-and-publish-dependency`（base=dev）。
- 真因: apps/web の情報設計欠如 + 命名不親切（API/D1/Form は無罪・機能は正しい）。**機能は削除せず存続**。
- 3 レーン（A=seed / B=命名+役割明確化 / C=申請中バッジ+API）を **1 サイクルで完了**（先送り・別 PR 化なし）。
- spec ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。

---

## 1. 変更ファイル一覧（パス + 種別）

### Lane A — テスト依頼 seed（apps/api / testing）

| ファイル | 種別 |
| --- | --- |
| `apps/api/src/testing/test-accounts/catalog.ts` | edit（`requests: TestRequest[]` 追加・`TestRequest` 型定義） |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | edit（`admin_member_notes` INSERT 生成 + cleanup DELETE 生成） |
| `apps/api/migrations/seed/test-accounts-seed.sql` | regenerate（committed・drift guard byte 一致） |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | regenerate（committed） |
| `apps/api/migrations/seed/test-accounts.manifest.json` | regenerate（member メタ不変なら no-diff・drift guard 出力で確認） |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | edit/new（3 INSERT + cleanup DELETE + byte 一致 assert） |

### Lane B — 命名平易化 + 役割明確化（apps/web）

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/components/shell/shell-config.ts` | edit（nav ラベル `依頼キュー`→`会員からの申請`） |
| `apps/web/app/(admin)/admin/requests/page.tsx` | edit（title / description / 日本語パンくず / 相互リンク） |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | edit（h1 / 一覧見出し / 空表示 / aria-label / 説明補助文） |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | edit（詳細見出し / aria-label） |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | edit（新ラベル assert） |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | edit（新ラベル assert・regression） |

### Lane C — 会員管理「申請中」バッジ + 相互リンク + API（apps/api + apps/web）

| ファイル | 種別 |
| --- | --- |
| `apps/api/src/routes/admin/members.ts` | edit（相関サブクエリ / `MemberListRow.pending_request_types_json` / `parsePendingRequestTypes` / projection） |
| `AdminMemberListViewZ` 所在ファイル（shared or apps/api、rg で特定） | edit（member item に `pendingRequestTypes` 追加） |
| apps/web 会員一覧型/adapter（web 再宣言 zod があれば、rg で特定） | edit（`pendingRequestTypes` を通す） |
| apps/web 会員一覧行コンポーネント（`rg "MemberRow\|区画 / ステータス" apps/web/src/components/admin` で特定） | edit（「申請中」バッジ + `Link(?type=...)`） |
| `apps/web/app/(admin)/admin/members/page.tsx` | edit（説明文 + 相互リンク） |
| `apps/api/src/routes/admin/members.contract.spec.ts` | edit/new（`pendingRequestTypes` 有/空配列 assert） |
| `apps/api/src/routes/admin/requests.contract.spec.ts` | edit（regression・新フィールド非破壊確認） |

---

## 2. 関数 / 型シグネチャ

### 2.1 Lane A — `TestRequest` 型 + catalog エントリ（`catalog.ts`）

```ts
export type TestRequest = {
  noteId: string;        // "TEST-NOTE-V01" 等
  memberId: string;      // 紐付け先 TEST-MEM-xx
  noteType: "visibility_request" | "delete_request";
  payload: Record<string, unknown>; // {"desiredState":"hidden"} 等・delete は {}
  reason: string;
};

// testAccountsCatalog に追加（member 配列とは独立・member 単位 0..N 申請）
requests: TestRequest[];
```

### 2.2 Lane A — INSERT 生成（`build-seed-sql.ts`）

`admin_member_notes` への決定論 INSERT を生成する。

```sql
INSERT OR REPLACE INTO admin_member_notes
  (note_id, member_id, body, created_by, updated_by, created_at, updated_at, note_type, request_status, resolved_at, resolved_by_admin_id)
VALUES
  ('TEST-NOTE-V01', 'TEST-MEM-01',
   json_object('reason', '都合により一時的に掲載を止めたいです', 'payload', json('{"desiredState":"hidden"}')),
   'seed:test-accounts', 'seed:test-accounts',
   '2026-06-03T10:30:00.000Z', '2026-06-03T10:30:00.000Z',
   'visibility_request', 'pending', NULL, NULL);
```

- payload 空（delete_request）は `json_object('reason', ?, 'payload', json_object())`。
- created_at/updated_at は既存 seed の固定 ISO 規約に合わせる。
- cleanup 生成: `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';`

### 2.3 Lane C — `parsePendingRequestTypes`（`members.ts`）

```ts
// parseTagsJson の隣に配置（Phase 8 リファクタ方針）
function parsePendingRequestTypes(
  raw: string | null,
): Array<"visibility_request" | "delete_request"> {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (v): v is "visibility_request" | "delete_request" =>
        v === "visibility_request" || v === "delete_request",
    );
  } catch {
    return [];
  }
}
```

`MemberListRow` 型（L112 付近）に追加:

```ts
pending_request_types_json: string | null;
```

projection に追加:

```ts
pendingRequestTypes: parsePendingRequestTypes(row.pending_request_types_json),
```

### 2.4 Lane C — 相関サブクエリ（`GET /members` SELECT・L353-480）

`tags_json` と同型で 1 本追加:

```sql
(
  SELECT json_group_array(DISTINCT amn.note_type)
  FROM admin_member_notes amn
  WHERE amn.member_id = mi.member_id
    AND amn.note_type IN ('visibility_request','delete_request')
    AND amn.request_status = 'pending'
) AS pending_request_types_json
```

### 2.5 Lane C — `AdminMemberListViewZ` member item 拡張

```ts
pendingRequestTypes: z
  .array(z.enum(["visibility_request", "delete_request"]))
  .default([]),
```

- schema 所在（packages/shared か apps/api か）を rg で特定。
- web 側に再宣言 zod があれば同期。**web が shared を直 import している場合は再宣言なしで型が自動伝播** するため、その場合は web 側 zod 編集不要（adapter / 行コンポーネントのみ）。

---

## 3. 命名マップ（SSOT §3 逐語・Lane B 正本）

表示テキストノード + `aria-label` のみ変更。`id`/`className`/`data-*`/テストセレクタ・ルート・API パス・ファイル名・import 名は **不変**。

| 箇所 | ファイル | Before（表示文言） | After（表示文言） |
| --- | --- | --- | --- |
| サイドバー nav ラベル | `shell-config.ts` | `依頼キュー` | `会員からの申請` |
| ページタイトル | `requests/page.tsx`（`AdminPageHeader title`） | `依頼キュー` | `会員からの申請` |
| ページ説明 | 同上（`description`） | `公開状態の変更依頼・退会依頼を確認・承認します。` | `会員本人がマイページから出した「公開の停止/再開」「退会」の申請を、ここで承認・却下します。管理者が自分で公開/非公開をすぐ切り替えたいときは「会員管理」から操作してください。` |
| パンくず（日本語） | 同上 | `管理 / 依頼キュー` | `管理 / 会員からの申請`（英字パンくず `ADMIN / REQUESTS` は内部表記のため不変） |
| パネル h1 | `RequestQueuePanel.tsx`（`#admin-requests-h`） | `依頼キュー` | `会員からの申請` |
| 一覧見出し | `RequestQueuePanel.tsx` | `依頼一覧` / `aria-label="依頼一覧"` | `申請一覧` / `aria-label="申請一覧"` |
| 空表示 | `RequestQueuePanel.tsx` | `未処理の依頼はありません` | `未処理の申請はありません` |
| 詳細見出し | `RequestQueueDetail.tsx` | `依頼詳細` / `aria-label="依頼詳細"` | `申請詳細` / `aria-label="申請詳細"` |
| タブラベル（NOTE_TYPE_LABEL） | `RequestQueuePanel.tsx` L50 | `公開停止/再公開` / `退会` | **不変**（既に平易） |
| 説明補助文（新規・任意） | `RequestQueuePanel.tsx` 上部 or page.tsx | （なし） | 「公開停止/再公開」=会員が掲載を止めたい/再開したい申請、「退会」=会員がアカウント削除を希望する申請、の 1 行説明 |

相互リンク（AC-3）: `/admin/requests` 画面に `<Link href="/admin/members">会員管理</Link>` を説明文脈に配置。

---

## 4. seed 3 件表（SSOT §4）

採番 `TEST-NOTE-V01/V02/D01`、`created_by`/`updated_by`=`seed:test-accounts`、`request_status='pending'`、`resolved_at`/`resolved_by_admin_id`=NULL。

| note_id | member_id | 会員の現状 | note_type | payload | reason | 確認できる挙動 |
| --- | --- | --- | --- | --- | --- |
| TEST-NOTE-V01 | TEST-MEM-01（現 public） | 公開中 | visibility_request | `{"desiredState":"hidden"}` | 都合により一時的に掲載を止めたいです | 公開停止申請 → 承認で public→hidden |
| TEST-NOTE-V02 | TEST-MEM-02（現 member_only/非公開） | 非公開 | visibility_request | `{"desiredState":"public"}` | 公開できるようになったので掲載をお願いします | 再公開申請 → 承認で member_only→public |
| TEST-NOTE-D01 | TEST-MEM-07（現 public・未削除） | 公開中・未削除 | delete_request | `{}`（payload なし） | 退会を希望します | 退会申請 → 承認で is_deleted=1 + retention purge 予約 |

> 紐付け先 member_id は **`is_deleted=0` かつ catalog 上で安定している既存会員**。catalog.ts を Read し、payload の desiredState が「現状と異なる遷移」になる member を選定（同状態への申請は確認価値が低い）。上表は第一候補。実値と矛盾する場合は同方針（公開中→hidden / 非公開→public / 未削除→delete）で差し替え可だが **3 件・3 パターンは維持**。delete_request 先は退会済（TEST-MEM-05）以外を選ぶ。

---

## 5. 実行コマンド（SSOT §8）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin src/testing/test-accounts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens   # OKLch トークン gate（存在すれば）
rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin   # HEX 0 件
# seed 再生成 drift guard（実コマンド名は apps/api/package.json scripts で確認）
mise exec -- pnpm --filter @ubm-hyogo/api <seed-generate-or-drift-script>
# staging 投入（user-gated・Phase 13 後）
bash scripts/seed-test-accounts.sh --env staging --action apply
```

---

## 6. Definition of Done（AC-1..13）

| AC | 内容 | レーン |
| --- | --- | --- |
| AC-1 | サイドバー・ページタイトル・パネル h1・パンくず（日本語）が「会員からの申請」 | B |
| AC-2 | 申請承認の場所 / 即時変更は会員管理から、の説明文がある | B |
| AC-3 | 申請画面から「会員管理」への相互リンクがある | B |
| AC-4 | ルート / API パス / ファイル名 / id / data-* / セレクタ不変（リグレッションなし） | B |
| AC-5 | catalog.ts に 3 件 pending 申請定義 + build-seed-sql が INSERT 生成 | A |
| AC-6 | 再生成 seed.sql に 3 INSERT + drift guard byte 一致 PASS | A |
| AC-7 | cleanup.sql に `DELETE ... note_id LIKE 'TEST-NOTE-%'` | A |
| AC-8 | seed 適用後 `?type=visibility_request` に 2 件 / `delete_request` に 1 件（staging 確認は user-gated） | A |
| AC-9 | list item に `pendingRequestTypes` 配列（空配列許容） | C |
| AC-10 | pending 行に「申請中」バッジ + クリックで該当タブ遷移 | C |
| AC-11 | 会員管理ページに説明 + 相互リンク | C |
| AC-12 | HEX 0 件 + 既存 admin/contract tests 非破壊 | B/C |
| AC-13 | 承認経路（resolve）と直接 PATCH 経路が共に機能し独立（依存整合明示） | B/C |

DoD: 上記 typecheck/lint/focused test 全 PASS、HEX 0 件、seed drift guard PASS、AC-1..13 充足。staging seed apply / screenshot / commit / PR は user-gated（Phase 13）。
