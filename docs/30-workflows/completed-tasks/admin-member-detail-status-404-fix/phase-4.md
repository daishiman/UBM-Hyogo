# Phase 4: テスト作成（RED）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 Phase は失敗するテスト（RED）の設計のみを行い、実装（GREEN）は Phase 5 で行う。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 4（テスト作成 RED） |
| 依存 | Phase 1（AC 固定）/ Phase 2（helper・degraded view・404 境界・migration 契約）/ Phase 3（Gate-A passed） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更） |
| implementation_mode | `new` |
| 主成果物 | RED テストケース集 + 実行コマンド suite + 期待結果 |

## 目的

Phase 1 の AC-1〜AC-7 を、実装前に必ず失敗（RED）する具体的なテストケースへ 1:1 で写像する。テストファイルパス・`describe`/`it` ケース名・期待値（`expect`）・実行コマンド・利用する D1/モック fixture を確定し、Phase 5 実装が GREEN 化すべき対象を曖昧さなく固定する。

## 実行タスク

### 4.0 着手前確定事項（MINOR-3 / private 関数テスト方針）

- **MINOR-3（D1 config 確定）**: 本タスクの対象 spec は既存 4 ファイルに co-locate する。それぞれが `vitest.d1.config.ts` の `D1_INCLUDE` glob のどれにマッチするかを以下に確定する（`vitest.d1.config.ts:22-40`）。
  - `apps/api/src/repository/__tests__/status.repository.spec.ts` → glob `apps/api/src/repository/**/*.repository.spec.ts` にマッチ（**MockStore ベース**。実 D1 を使わない既存方式を踏襲）
  - `apps/api/src/repository/__tests__/builder.repository.spec.ts` → 同上 glob（**MockStore ベース**）
  - `apps/api/src/routes/admin/member-status.contract.spec.ts` → glob `apps/api/src/routes/**/*.contract.spec.ts`（**実 in-memory D1**: `setupD1()` 経由・`_setup.ts` が全 migration を適用）
  - `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` → glob `apps/api/src/jobs/**/*.contract.spec.ts`（**FakeD1** ベース: `__fixtures__/d1-fake.ts`）
  - migration 0024 検証は **新規 contract spec** `apps/api/src/sync/migration-0024-backfill.contract.spec.ts` に置き、glob `apps/api/src/sync/**/*.contract.spec.ts` にマッチさせる（`setupD1()` の実 migration 経路を使う。`migrations/__tests__/` 配下は D1 include 対象外のため採用しない）。
- **private 関数テスト方針**: `extractSummary`（`builder.ts:97`・非 export）と `defaultMemberStatusRow` の挙動は **直接テストしない**。public 関数 `buildAdminMemberDetailView` の出力（degraded view の summary フィールドが空文字、sections が `[]`）越しに観測する（FB: private は公開 API 経由で検証）。`ensureMemberStatusRow` は status.ts から export するため repository spec で直接検証する。

### 4.1 repository/status spec: `ensureMemberStatusRow`（AC の基盤）

ファイル: `apps/api/src/repository/__tests__/status.repository.spec.ts`（編集・`describe("ensureMemberStatusRow", ...)` 追加）。fixture: `MockStore` / `createMockDbCtx`（既存 import）。

| ケース名（`it`） | セットアップ | 期待値 |
|------------------|-------------|--------|
| `行が無い member に既定行を 1 行生成する` | `store.memberStatus = []` | `await ensureMemberStatusRow(ctx, asMemberId("m_new"))` 後、`store.memberStatus` が `toHaveLength(1)`・`member_id==="m_new"`・`public_consent==="unknown"`・`rules_consent==="unknown"`・`publish_state==="member_only"`・`is_deleted===0` |
| `2 回呼んでも行は 1 行（冪等）` | `store.memberStatus = []` | 同 mid で 2 回呼出後 `store.memberStatus` が `toHaveLength(1)` |
| `既存 status を破壊しない（INSERT OR IGNORE）` | `store.memberStatus = [{ ...MEMBER_STATUS_CONSENTED }]`（`member_id==="m_001"`, `publish_state==="public"`, `public_consent==="consented"`） | `await ensureMemberStatusRow(ctx, asMemberId("m_001"))` 後、`m_001` 行の `publish_state` は `"public"` のまま・`public_consent` は `"consented"` のまま（上書きされない）・件数 1 |

> RED 根拠: `ensureMemberStatusRow` は Phase 5 まで未実装のため import で型エラー or 実行時 undefined となり RED。MockStore は `into member_status` 分岐（`d1mock.ts:264-321`）で `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` を既存・非既存ともに正しく扱える（consent/publish/deleted いずれの条件にも合致しない＝既存時 no-op／非既存時 default push）。MockStore 改修は不要。

### 4.2 builder.repository.spec: degraded view（AC-1 / AC-2 / AC-4）

ファイル: `apps/api/src/repository/__tests__/builder.repository.spec.ts`（編集・`describe("buildAdminMemberDetailView degraded", ...)` 追加）。fixture: 既存 `MEMBER_IDENTITY_1` / `MEMBER_STATUS_CONSENTED` / `MEMBER_RESPONSE_1` ほか。

| ケース名（`it`） | セットアップ | 期待値（AC） |
|------------------|-------------|-------------|
| `status 欠落でも 200 view を既定 status で返す` | `store.memberIdentities=[MEMBER_IDENTITY_1]`・`store.memberStatus=[]`・response/sections/fields は `MEMBER_IDENTITY_1` の `current_response_id` 分を投入 | 戻り値 `not.toBeNull()`・`result.status.publishState === "member_only"`・`result.status.publicConsent === "unknown"`・`result.profile.sections` は通常どおり構築（response あり）（AC-1） |
| `response 欠落でも劣化 view で 200 を返す` | `store.memberIdentities=[MEMBER_IDENTITY_1]`・`store.memberStatus=[MEMBER_STATUS_CONSENTED]`・`store.memberResponses=[]`（current_response 無し） | 戻り値 `not.toBeNull()`・`result.profile.sections` が `toEqual([])`・`result.profile.responseId` が空でない（`current_response_id ?? member_id` フォールバック・`.length` > 0）・`result.profile.summary.fullName === ""`（空 summary）（AC-2） |
| `identity 欠落は null を返す（真の不存在）` | `store.memberIdentities=[]`・`store.memberStatus=[]` | `buildAdminMemberDetailView(c, asMemberId("nope"), [])` が `toBeNull()`（AC-4） |
| `status と response 両方欠落でも 200 劣化 view` | `store.memberIdentities=[MEMBER_IDENTITY_1]`・`store.memberStatus=[]`・`store.memberResponses=[]` | `not.toBeNull()`・`result.status.publishState === "member_only"`・`result.profile.sections` が `toEqual([])`・`responseId.length > 0`（AC-1 + AC-2 複合） |

> RED 根拠: 現行 `builder.ts:388` `if (!identity || !status) return null` と `:391` `if (!response) return null` のため、status 欠落・response 欠落ケースは現状 `null` を返し、上記 `not.toBeNull()` 期待で RED。`identity 欠落 → null` ケースは現行でも GREEN（回帰 guard としてここで固定）。

### 4.3 member-status route spec: 404 境界変更（AC-3 / AC-4 / AC-7）

ファイル: `apps/api/src/routes/admin/member-status.contract.spec.ts`（編集）。fixture: 実 in-memory D1（`setupD1()`）。`beforeEach` で `member_identities` と `member_status` を明示投入できるよう拡張する。

| ケース名（`it`） | セットアップ | 期待値（AC） |
|------------------|-------------|-------------|
| `status 行欠落でも PATCH 成功し member_status 行を生成する` | `member_identities` に `m_no_status`（identity あり）を INSERT・`member_status` には `m_no_status` 行を入れない | `PATCH /members/m_no_status/status` body `{ publishState: "public" }` → `res.status === 200`・直後に `SELECT * FROM member_status WHERE member_id='m_no_status'` が 1 行・`publish_state === "public"`（AC-3） |
| `hiddenReason のみ更新でも status 行欠落から生成し反映する` | 同上（identity あり / status 無し） | body `{ hiddenReason: "理由X" }` → `200`・after 行の `hidden_reason === "理由X"`（AC-3 境界） |
| `identity 不存在の memberId は 404 を維持する` | `member_identities` にも `member_status` にも `m_ghost` を入れない | `PATCH /members/m_ghost/status` body `{ publishState: "hidden" }` → `res.status === 404`（AC-4） |
| `正常会員（identity+status あり）は従来どおり 200` | `member_identities` と `member_status` 両方に `m1` を投入 | `PATCH /members/m1/status` body `{ publishState: "public" }` → `200`・after 行 `publish_state === "public"`（AC-7 非回帰） |

> 既存テスト `未存在 member は 404`（現行 spec:62-74）は `member_status` にも `member_identities` にも `m_x` が無いため、F-3 適用後も 404 で GREEN を維持する（identity 不在＝真の 404）。ただし現行 `beforeEach`（spec:17-21）は `member_status` のみに `m1` を入れ `member_identities` に入れていない。F-3 後は「identity 存在」で 404 判定するため、`正常系: publishState 更新 200`（spec:34-46）を GREEN に保つには `beforeEach` で `member_identities` にも `m1` を INSERT する必要がある。**この beforeEach 拡張は Phase 5 の実装に伴う必須修正**として本 spec に明記する（拡張しないと既存正常系が 404 化して回帰する）。
>
> RED 根拠: `status 行欠落でも PATCH 成功` ケースは現行 `member-status.ts:52-53`（`getStatus` が null → 404）により 404 を返すため、`200` 期待で RED。

### 4.4 sync-forms-responses spec: ingest 予防（AC-5）

ファイル: `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（編集・`describe`内に `it` 追加）。fixture: `FakeD1`（`__fixtures__/d1-fake.ts`）+ `makeClient` / `makeResp`（既存ヘルパ）。

| ケース名（`it`） | セットアップ | 期待値（AC） |
|------------------|-------------|-------------|
| `新規 identity 作成時に member_status 既定行が生成される` | 新規 email（`existingIdentity` 無し）の 1 レスポンスで `runResponseSync` を実行 | 実行後 `db.status`（FakeD1 内 member_status ストア）に当該 `member_id` の行が **1 行以上存在**し、`publish_state === "member_only"`・`is_deleted === 0`（AC-5） |

> RED 根拠 + FakeD1 改修必須: `ensureMemberStatusRow` は `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` を発行する。現行 FakeD1 の member_status 分岐（`d1-fake.ts:335`）は正規表現 `/INSERT INTO member_status/i` でしか反応せず、`INSERT OR IGNORE INTO member_status` にマッチしない。**Phase 5 で FakeD1 に `INSERT OR IGNORE INTO member_status` 分岐（member_id のみで既定行 push、既存なら no-op）を追加する**。追加前は本ケースは「行が生成されない」ため RED。なお現行でも `setConsentSnapshot`（`INSERT INTO member_status ... ON CONFLICT`）経由で行が立つ可能性があるため、本ケースは **ensure 経路の存在を保証する目的**で、`setConsentSnapshot` 呼出前に行が立つこと（順序）を `runResponseSync` 全体の事後状態で検証する（順序の直接観測が困難な場合は AC-5 を「実行後に member_status 行が必ず存在」で固定し、ingest 例外時の保証は Phase 6 の fail path で補強する）。

### 4.5 migration 0024 spec: backfill（AC-6）

ファイル（新規）: `apps/api/src/sync/migration-0024-backfill.contract.spec.ts`。fixture: 実 in-memory D1（`setupD1()`。`_setup.ts:100-134` が `apps/api/migrations/*.sql` を全適用するため、0024 を含む）。

| ケース名（`it`） | セットアップ | 期待値（AC） |
|------------------|-------------|-------------|
| `orphan な member_identities 全件に member_status 行が生成される` | `setupD1()` 後、`member_identities` に 3 件（`a`,`b`,`c`）を INSERT、`member_status` には `a` のみ INSERT。その後 0024 の backfill SQL 全文を `db.exec` で再実行 | `SELECT COUNT(*) FROM member_status` が 3、`b`/`c` 行が存在し `publish_state === "member_only"`・`a` 行は元の値のまま（AC-6） |
| `再適用しても重複しない（冪等）` | 上記の後、同じ backfill SQL を再度実行 | `SELECT COUNT(*) FROM member_status` が 3 のまま（INSERT OR IGNORE で重複なし）（AC-6 冪等） |

> 検証手法: backfill SQL 本文は migration ファイル `apps/api/migrations/0025_backfill_member_status.sql` から読み込むか、spec 内に同一 SQL 文字列定数として保持して `db.exec` で実行する（`_setup.ts` の migration loader が同 SQL を適用する経路と等価）。`setupD1()` は instance 再利用 + truncate 方式のため、テスト内で `member_identities`/`member_status` を明示 INSERT してから backfill を再実行して観測する。
>
> RED 根拠: 0024 migration は Phase 5 まで存在しないため、`setupD1()` は 0024 を適用せず、spec 内で backfill SQL 定数を実行しても **0024 ファイルが無いと spec の SQL 定数も未定義**となり、`a` のみで `b`/`c` が埋まらず COUNT が 1 のまま → 期待 3 で RED。

### 4.6 RED 実行コマンド suite（ルートから実行・MINOR-3 反映）

すべてリポジトリルート（`mise exec --` 経由・Node 24）から実行する。`--root=.` を付け worktree 隔離を保証する。

```bash
# repository spec（status / builder）— D1 config（MockStore ベースだが glob 上 D1 group）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts \
  apps/api/src/repository/__tests__/builder.repository.spec.ts

# route spec（member-status）— 実 in-memory D1
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/member-status.contract.spec.ts

# job spec（sync-forms-responses）— FakeD1
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts

# migration 0024 spec（新規）— 実 in-memory D1
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/sync/migration-0024-backfill.contract.spec.ts
```

期待結果（Phase 4 完了時点）: 上記 4.1〜4.5 の新規/変更ケースが **FAIL（RED）**。既存ケース（`未存在 member は 404` 等）と `identity 欠落 → null` は GREEN を維持する。

## 参照資料

- Phase 1 §1.3 AC / §1.5 inventory
- Phase 2 §2.2 `ensureMemberStatusRow` 契約 / §2.4 degraded view 契約 / §2.5 404 境界 / §2.7 migration
- `apps/api/src/repository/status.ts:31-139`（`getStatus` / `setConsentSnapshot` / `setPublishState`）
- `apps/api/src/repository/_shared/builder.ts:372-447`（`buildAdminMemberDetailView`）/ `:97-112`（`extractSummary`）
- `apps/api/src/routes/admin/member-status.ts:37-79`（PATCH handler / 404 判定 :52-53）
- `apps/api/src/jobs/sync-forms-responses.ts:293-391`（ingest: `upsertMember`:303 / `setConsentSnapshot`:385）
- `apps/api/src/repository/__fixtures__/d1mock.ts:264-321`（MockStore の member_status 分岐）
- `apps/api/src/jobs/__fixtures__/d1-fake.ts:334-360`（FakeD1 の member_status 分岐）
- `apps/api/src/repository/__tests__/_setup.ts:100-134`（実 in-memory D1 + migration loader）
- `vitest.d1.config.ts:22-40`（`D1_INCLUDE` glob）

## 成果物

- 本ファイル（Phase 4: RED テストケース集 + 実行コマンド suite）
- 4.1〜4.5 のケース表（ファイル / `it` 名 / セットアップ / 期待値 / AC 対応）
- 4.0 の D1 config 確定（MINOR-3 消化）と private 関数テスト方針

## 統合テスト連携

- 4.1〜4.5 の各ケースは AC-1〜AC-7 と 1:1 で対応し、Phase 5 実装で GREEN 化する。
- FakeD1（4.4）/ member-status `beforeEach`（4.3）の改修必須事項は Phase 5 の実装タスクへ引き継ぐ。
- 本 Phase の RED 実行ログは Phase 9（品質保証）で「RED→GREEN 遷移」の証跡として参照する。

## 完了条件

- [x] MINOR-3（各 spec の `vitest.d1.config.ts` glob マッピング）を確定した
- [x] private 関数（`extractSummary`）を公開 API 経由で検証する方針を明記した
- [x] `ensureMemberStatusRow` の冪等・既定値・非破壊ケースを RED で設計した（4.1）
- [x] builder の status 欠落 / response 欠落 / identity 不在ケースを RED で設計した（4.2）
- [x] member-status route の status 欠落成功 / identity 不在 404 / 非回帰ケースを RED で設計した（4.3）
- [x] sync-forms-responses の AC-5 ケースと FakeD1 改修必須事項を記録した（4.4）
- [x] migration 0024 の backfill / 冪等ケースを RED で設計した（4.5）
- [x] ルートから実行する RED コマンド suite を 4 spec 分具体化した（4.6）
