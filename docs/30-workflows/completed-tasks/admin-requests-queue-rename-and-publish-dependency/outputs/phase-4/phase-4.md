# Phase 4 — テスト作成（TDD-Red）

`[実装区分: 実装仕様書]`（taskType=implementation / visualEvidence=VISUAL / workflow_state=implemented_local_evidence_captured）

> 本フェーズは **失敗するテストを先に書く（Red）** 工程の仕様書。コード実装は Phase 5（Green）で行う。
> 唯一の正本は `../../_shared-context.md`（以下 SSOT）。命名・データ契約・AC は SSOT を一字一句尊重する。
> spec ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8）。`*.test.*` は禁止。

---

## 0. Red の前提（共通）

- Lane A: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（既存）に追加するケースは、`buildSeedSql()` / `buildCleanupSql()` がまだ `admin_member_notes` INSERT / DELETE を生成しないため **fail**（`expect(...).toContain` が空 hit）。
- Lane C(API): `apps/api/src/routes/admin/members.contract.spec.ts`（既存）に追加するケースは、list projection に `pendingRequestTypes` がまだ無いため `undefined` で **fail**。
- Lane B/C(web): `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx`（既存）と新規 `MembersTable` 行 spec は、表示ラベルが旧文言（「依頼一覧」等）のまま / バッジ未実装のため **fail**。

> 既存テストの中で **新ラベル・新フィールドにより構造的に壊れる箇所**（後述 §5）は、本 wave（Phase 4）で同時に更新する。Red の対象は「新仕様を表明する追加 assertion」と「旧文言を新文言へ置換する既存 assertion」の両方。

---

## 1. Lane A — seed 生成テスト（`build-seed-sql.spec.ts` 拡充）

対象ファイル: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（編集）

裏取り済み既存構造:
- `buildSeedSql()` 出力は `INSERT OR REPLACE INTO schema_versions ...` で始まり、`member_status` / `admin_users` 等を連結（`build-seed-sql.ts` L75-223）。
- 既存 assertion 例: `expect(sql).toContain("INSERT OR IGNORE INTO member_tags")` / `expect(sql).toContain("[TEST] 山田''太郎😀")`。
- cleanup は `DELETE FROM ... WHERE member_id IN (...)`（`build-seed-sql.ts` L231-244）。

### 追加テストケース

| # | テストケース名 | 期待値（assert） | Red で失敗する理由 |
| --- | --- | --- | --- |
| A-T1 | `seed SQL に admin_member_notes の 3 pending 申請 INSERT が含まれる` | `buildSeedSql()` が `INSERT OR REPLACE INTO admin_member_notes` を含み、`TEST-NOTE-V01` / `TEST-NOTE-V02` / `TEST-NOTE-D01` の 3 note_id を含む | 生成器が admin_member_notes ブロックを未出力 |
| A-T2 | `各 note の note_type / request_status / member_id が正しい` | SQL に `'visibility_request'` が 2 回・`'delete_request'` が 1 回・全行 `'pending'`、`TEST-NOTE-V01` 行に `'TEST-MEM-01'`、`TEST-NOTE-V02` 行に `'TEST-MEM-02'`、`TEST-NOTE-D01` 行に `'TEST-MEM-07'` が並ぶ | 同上 |
| A-T3 | `body は json_object(reason, payload) 形式で desiredState を含む` | SQL に `json_object('reason'` を含み、`json_object('desiredState', 'hidden')`（V01）/ `'public'`（V02）/ delete は `json_object()`（空 payload）を含む | 同上 |
| A-T4 | `created_by / updated_by は seed:test-accounts で cleanup 対象と整合` | note 行に `'seed:test-accounts'`（`TEST_ACCOUNT_ACTOR`）を含む | 同上 |
| A-T5 | `created_at / updated_at は固定 ISO（submittedAt）で非決定値を含まない` | note 行に `'2026-06-03T10:30:00.000Z'` を含み、`datetime('now')` を含まない | 同上 |
| A-T6 | `cleanup SQL に note_id LIKE 'TEST-NOTE-%' の DELETE が含まれる` | `buildCleanupSql()` が `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';` を含む | cleanup が admin_member_notes 行を未出力 |
| A-T7 | `生成 SQL は明示トランザクションを含まない（退行ガード継続）` | 既存 assert（`not.toMatch(/BEGIN TRANSACTION/)` 等）が note 追加後も PASS のままであることを再確認 | （Green 後に GREEN を維持する回帰ガード。Red 時点では他ケースが先に fail） |
| A-T8（drift guard / byte 一致） | `committed test-accounts-seed.sql は buildSeedSql() の出力と byte 一致する` | `readFileSync("apps/api/migrations/seed/test-accounts-seed.sql","utf8") === buildSeedSql()` が `true`。cleanup も同様に `=== buildCleanupSql()` | Phase 5 で生成器を変えると committed ファイル（未再生成）と不一致になるため、Phase 5 では「生成器変更 → 再生成コミット」をセットで行う前提の drift ガード。Red では generator/committed どちらも未更新だが、A-T1..A-T6 が先に fail する |

> A-T8 の参照規約: drift 正本は `scripts/gen-test-accounts-seed.mjs --check`（committed と現生成物を比較し差分で exit 1）。spec 側では node 環境（`@vitest-environment node` は build-seed-sql.spec.ts はデフォルト node）で `node:fs` の `readFileSync` を使い、リポジトリルートからの相対で committed を読む。パス解決は `new URL("../../../../migrations/seed/test-accounts-seed.sql", import.meta.url)` を推奨（spec の位置 `apps/api/src/testing/test-accounts/__tests__/` から `apps/api/migrations/seed/` へ 4 階層上り）。

### A-T1..A-T3 の assert 文面（実装者向け逐語ヒント）

```ts
it("seed SQL に admin_member_notes の 3 pending 申請 INSERT が含まれる", () => {
  const sql = buildSeedSql();
  expect(sql).toContain("INSERT OR REPLACE INTO admin_member_notes");
  expect(sql).toContain("'TEST-NOTE-V01'");
  expect(sql).toContain("'TEST-NOTE-V02'");
  expect(sql).toContain("'TEST-NOTE-D01'");
});

it("body は json_object(reason, payload) で desiredState を含む", () => {
  const sql = buildSeedSql();
  expect(sql).toContain("json_object('desiredState', 'hidden')");
  expect(sql).toContain("json_object('desiredState', 'public')");
});
```

---

## 2. Lane C(API) — 会員一覧 pendingRequestTypes（`members.contract.spec.ts` 拡充）

対象ファイル: `apps/api/src/routes/admin/members.contract.spec.ts`（編集）

裏取り済み既存構造:
- `setupD1()` / `createAdminMembersRoute()` / `adminAuthHeader()` を使う node-env spec。
- `seed(env)` が `m1`（public）を 1 件用意。`seedMember(env, id, resp, answers, submittedAt)` で追加 member を入れる。
- `admin_member_notes` テーブルは spec 内で既に `INSERT INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at) VALUES (...)` の形で挿入実績あり（L165-169 付近）。note_type / request_status カラムも schema に存在（migration 0006/0007）。

### 追加テストヘルパ（spec 内に定義）

```ts
const seedPendingRequest = async (
  env: InMemoryD1,
  noteId: string,
  memberId: string,
  noteType: "visibility_request" | "delete_request",
) => {
  await env.db
    .prepare(
      `INSERT INTO admin_member_notes
        (note_id, member_id, body, created_by, updated_by, created_at, updated_at, note_type, request_status)
       VALUES (?1, ?2, '{"reason":null,"payload":{}}', 'admin', 'admin', '2026-04-01T00:00:00Z', '2026-04-01T00:00:00Z', ?3, 'pending')`,
    )
    .bind(noteId, memberId, noteType)
    .run();
};
```

### 追加テストケース

| # | テストケース名 | 期待値（assert） | Red で失敗する理由 |
| --- | --- | --- | --- |
| C-T1 | `pending visibility_request を持つ member の list item に pendingRequestTypes が載る` | `m1` に visibility_request を seed → `GET /members` → `body.members[0].pendingRequestTypes` が `["visibility_request"]` | projection に当該フィールドが無く `undefined` |
| C-T2 | `pending 申請を持たない member は pendingRequestTypes が空配列` | `m1` に申請を入れない → `body.members[0].pendingRequestTypes` が `[]` | 同上（フィールド自体が無い） |
| C-T3 | `delete_request を持つ member は ["delete_request"]` | `m1` に delete_request を seed → `["delete_request"]` | 同上 |
| C-T4 | `両種別 pending を持つと配列に両方含む（順不問・重複なし）` | `m1` に visibility+delete を seed → `expect(new Set(body.members[0].pendingRequestTypes)).toEqual(new Set(["visibility_request","delete_request"]))` | 同上 |
| C-T5 | `resolved/rejected な申請はバッジ対象外（pending のみ）` | `m1` に `request_status='resolved'` の visibility note を入れる → `pendingRequestTypes` は `[]` | 相関サブクエリの `request_status='pending'` フィルタが未実装 |
| C-T6 | `pendingRequestTypes は view zod を通過する（200 でフィールドが残る）` | レスポンス 200 かつ `Array.isArray(body.members[0].pendingRequestTypes) === true` | `AdminMemberListViewZ` に当該フィールドが無く `.strict()` で削ぎ落とされる／または parse fail |

> 注: 既存 `enum normalization` describe ブロックの「draft → member_only 縮退」「member_status 欠落 → unknown」等のケースは `pendingRequestTypes` 追加で壊れない（バッジは publishState と独立）。C-T 群は新規 `describe("pendingRequestTypes (申請中バッジ用 projection)")` に隔離する。

---

## 3. Lane B/C(web) — RequestQueuePanel 命名 + MembersTable バッジ

### 3-1. RequestQueuePanel 命名（`RequestQueuePanel.component.spec.tsx` 編集）

対象ファイル: `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx`（編集）

裏取り済み既存 assertion:
- TC-21 が `screen.getByRole("heading", { name: "依頼一覧" })` を assert（L66）。
- コメント L61-62 に「page.tsx 側に h1 "依頼キュー"」と記載（panel 自身は h1 を `showHeading` 経由で持つ）。

| # | テストケース名 | 期待値（assert） | Red で失敗する理由 |
| --- | --- | --- | --- |
| B-T1 | `一覧見出しは「申請一覧」` | `screen.getByRole("heading", { name: "申請一覧" })` が存在し className に `h-card` を含む（既存 TC-21 の「依頼一覧」を「申請一覧」へ更新） | 実装が「依頼一覧」のまま |
| B-T2 | `一覧 ul の aria-label が「申請一覧」` | `screen.getByRole("list", { name: "申請一覧" })` が存在 | `aria-label="依頼一覧"` のまま |
| B-T3 | `空状態は「未処理の申請はありません」` | items=[] で render → `screen.getByText("未処理の申請はありません")` | EmptyState title が「未処理の依頼はありません」のまま |
| B-T4 | `showHeading 時の h1 は「会員からの申請」` | `<RequestQueuePanel showHeading initial=... />` → `screen.getByRole("heading", { level: 1, name: "会員からの申請" })` | `<h1 id="admin-requests-h">依頼キュー</h1>`（L154）のまま |
| B-T5 | `id / data セレクタは不変（リグレッションガード）` | h1 要素の `id` が `admin-requests-h`、フィルタ group の `aria-label="依頼種別"` が不変であること（内部識別子・group ラベルは SSOT §3 で不変指定） | （Green を保証する回帰ガード。実装で id を変えてしまうと fail） |

> 注: フィルタ group の `aria-label="依頼種別"`、`#admin-requests-filter-h` の visually-hidden 見出し「依頼種別」は SSOT §3 の表に **無い**＝表示テキストだが今回の命名マップ対象外（「依頼種別」はタブの種別ラベルで「依頼/申請」語の置換指定なし）。**変更しない**。命名置換対象は §3 表の行（依頼キュー→会員からの申請、依頼一覧→申請一覧、未処理の依頼→未処理の申請、依頼詳細→申請詳細）に限定する。

#### RequestQueueDetail spec（`RequestQueueDetail.spec.tsx` 編集）

対象ファイル: `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx`（編集・存在を確認済み）

| # | テストケース名 | 期待値 | Red 理由 |
| --- | --- | --- | --- |
| B-T6 | `詳細 aside の aria-label / 見出しが「申請詳細」` | `screen.getByRole("complementary", { name: "申請詳細" })` または `getByLabelText("申請詳細")` が存在し、見出し「申請詳細」がある | `aria-label="依頼詳細"` / `<h3>依頼詳細</h3>`（Detail L39/L45/L49）のまま |

### 3-2. MembersTable 申請中バッジ（新規 spec）

対象ファイル: `apps/web/src/features/admin/components/_members/__tests__/MembersTable.pendingRequest.spec.tsx`（**新規**）

> 既存 `MembersTable.spec.tsx`（`apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`）があるため、バッジ専用の追加 spec として独立ファイルを切る（既存 spec の意図を汚さない）。命名は `*.spec.tsx`（不変条件 #8 準拠）。

`MembersTable` は `AdminMemberListView["members"][number]` を items に取る（`MembersTable.tsx` L3/L12）。Phase 5 で shared schema に `pendingRequestTypes` が入ると型に載る。

| # | テストケース名 | 期待値（assert） | Red 理由 |
| --- | --- | --- | --- |
| C-T7 | `pendingRequestTypes に visibility_request を含む行に「申請中」バッジが出る` | item に `pendingRequestTypes: ["visibility_request"]` を持たせ render → `within(row).getByText(/申請中/)` が存在 | バッジ未実装 |
| C-T8 | `バッジは /admin/requests?type=visibility_request へのリンク` | バッジ要素が `<a href="/admin/requests?type=visibility_request">`（visibility 種別） | リンク未実装 |
| C-T9 | `delete_request のバッジは type=delete_request へ` | `pendingRequestTypes: ["delete_request"]` → href が `/admin/requests?type=delete_request` | 同上 |
| C-T10 | `pendingRequestTypes が空の行にはバッジが出ない` | `pendingRequestTypes: []` → `within(row).queryByText(/申請中/)` が `null` | （Green ガード。実装が常時表示だと fail） |
| C-T11 | `バッジは aria-label で種別が分かる` | visibility バッジに `aria-label` 例「公開申請中（会員からの申請へ）」相当（Phase 5 で確定する文言と一致）/ 最小は accessible name に「申請中」を含む | aria-label 未実装 |

> 行の特定は既存 `data-testid={`admin-members-row-${m.memberId}`}`（`MembersTable.tsx` L107）で `screen.getByTestId('admin-members-row-...')` → `within(...)`。この data-testid は不変（SSOT §3）。

### 3-3. 会員管理ページ説明文 + 相互リンク（spec 方針）

- 説明文と相互リンクは `AdminPageHeader` の `description` ／ page 直下に置く（SSOT §5）。page.tsx は Server Component かつ `safeServerFetch` に依存するため component spec が重い。
- **Red 対象は最小限**: 文言の有無は Phase 11 の visual evidence と E2E で担保し、unit では `RequestQueuePanel` 側の「会員管理への相互リンク」を assert する（下記 B-T7）。会員管理→会員からの申請のリンクは page.tsx の静的 JSX なので、リンクテキストの存在は Phase 6 の追加 spec（軽量な抽出コンポーネント化を伴わない範囲）または Playwright smoke で確認する方針を Phase 6 に委譲。

| # | テストケース名 | 期待値 | Red 理由 |
| --- | --- | --- | --- |
| B-T7 | `依頼キュー画面に「会員管理」への相互リンクがある` | `RequestQueuePanel`（または page.tsx が描く説明ブロック）に `<a href="/admin/members">会員管理</a>` 相当が存在。Panel 側に置く場合は Panel spec で `screen.getByRole("link", { name: /会員管理/ })` を assert | 相互リンク未実装（AC-3） |

> 実装配置注: SSOT §2 Lane B は「説明と相互リンクを page.tsx か Panel 上部に配置」。spec を安定させるため、**相互リンクと説明文は `RequestQueuePanel` の `showHeading` 分岐内（h1 直下）に置くことを推奨**（page.tsx の Server fetch に依存せず component spec で検証できる）。Phase 5 はこの配置を採る。

---

## 4. 実行コマンド（Red 確認）

```bash
# Lane A
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/testing/test-accounts
# Lane C(API)
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/admin/members.contract.spec.ts
# Lane B/C(web)
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin src/features/admin/components/_members
```

Red 期待: A-T1..A-T6 / C-T1..C-T6 / B-T1..B-T7 / C-T7..C-T11 が **fail**。A-T7・B-T5・C-T10 は Green を守る回帰ガードで、対応コードが無い間は周辺ケースの fail に巻き込まれる（独立で評価する場合は skip 可）。

---

## 5. 既存テストが新ラベル/新フィールドで壊れる箇所（同 wave 更新方針）

| 既存テスト | 壊れる理由 | 同 wave 更新方針 |
| --- | --- | --- |
| `RequestQueuePanel.component.spec.tsx` TC-21（`{ name: "依頼一覧" }`） | 見出しを「申請一覧」へ改名 | B-T1 として assertion の name を更新（旧→新） |
| `RequestQueuePanel.component.spec.tsx` のコメント L61-62「h1 "依頼キュー"」 | h1 文言変更 | コメントを「会員からの申請」へ追従。TC-21 は h1 を直接 assert していないが、文言コメントを更新 |
| `RequestQueueDetail.spec.tsx`（「依頼詳細」を assert していれば） | 見出し/aria-label 改名 | B-T6 として「申請詳細」へ更新 |
| `build-seed-sql.spec.ts` の既存 3 ケース | note 追加で `buildSeedSql()` 出力が伸びるが、既存の `toContain` / `not.toMatch` は文字列包含なので **壊れない**（manifest の member 数 10 / loginable 7 等も不変＝申請は member メタに非影響） | 変更不要。A-T7 で回帰を明示 assert |
| `members.contract.spec.ts` の既存ケース | projection に `pendingRequestTypes` を additive 追加するのみ。`toMatchObject` は部分一致なので既存 assert は壊れない | 変更不要。C-T 群を新規 describe で追加 |
| `packages/shared/src/zod/viewmodel.spec.ts`（L260 `AdminMemberListViewZ.safeParse({ total:0, members:[] })`） | item を持たないため `pendingRequestTypes.default([])` 追加でも壊れない（`.default` は item レベル、members 空配列は影響なし） | 変更不要。Phase 6 で `pendingRequestTypes` の default/enum 境界ケースを追加 |
| `members-view-model.spec.ts`（adapter） | `toMemberListRow` は item を spread して返す。`pendingRequestTypes` は additive で baseItem に含まれ素通り | 変更不要。Phase 6 で「pendingRequestTypes が素通りする」回帰ケースを追加可 |

> drift guard（A-T8）の都合上、Phase 5 では **generator 変更とコミット対象 `.sql` 再生成を必ずセット**で行う（§4 の `pnpm seed:test-accounts:gen` 実行）。再生成を忘れると A-T8 が fail し、CI（`gen-test-accounts-seed.mjs --check`）も fail する。

---

## 完了条件

- [ ] Lane A: `build-seed-sql.spec.ts` に A-T1..A-T8（admin_member_notes INSERT 3 件・note_type/request_status/member_id・json_object body・固定 ISO・seed:test-accounts・cleanup DELETE LIKE・byte 一致 drift guard）を追記する仕様が、テストケース名＋assert＋Red 失敗理由付きで記述されている。
- [ ] Lane C(API): `members.contract.spec.ts` に C-T1..C-T6（pending 有→配列／無→空／delete→単一／両種別→重複なし／resolved 除外／zod 通過）を、`seedPendingRequest` ヘルパ込みで記述している。
- [ ] Lane B/C(web): `RequestQueuePanel.component.spec.tsx`（B-T1..B-T5,B-T7）・`RequestQueueDetail.spec.tsx`（B-T6）・新規 `MembersTable.pendingRequest.spec.tsx`（C-T7..C-T11）が、新ラベル「会員からの申請」「申請一覧」「申請詳細」「未処理の申請」、申請中バッジ＋href、相互リンクを assert する仕様で記述されている。
- [ ] 全 spec ファイルが `*.spec.{ts,tsx}` のみ（`*.test.*` を新設しない）。
- [ ] 既存テストの破壊箇所（§5）が列挙され、同 wave 更新方針（旧→新文言置換 / additive で非破壊）が明記されている。
- [ ] §3 の不変識別子（`#admin-requests-h` / `aria-label="依頼種別"` / `data-testid="admin-members-row-*"`）を変更しない方針が明記されている。
- [ ] Red 実行コマンド（§4）が記載され、どのケースが fail するか説明されている。
