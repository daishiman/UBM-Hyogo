# Phase 4: テスト作成（RED） — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

本 Phase は RED テスト設計を固定した。現在は本 wave でローカル実装と focused D1 tests が GREEN 済みであり、本ファイルの RED 表記は実装前に期待した失敗条件の履歴として扱う。

---

## 1. 既存テストファイルの実在確認結果（`ls` 由来・推測なし）

`ls apps/api/src/repository/__tests__/ apps/api/src/jobs/__tests__/ apps/api/src/routes/admin/__tests__/` で確認した実ファイル（本タスクに関係するもの）:

| 領域 | 実ファイル名（確認済み） | 実行 config | 使用 DB |
|------|------------------------|------------|--------|
| repository: members | `apps/api/src/repository/__tests__/members.repository.spec.ts`（実在） | `vitest.d1.config.ts`（glob `repository/**/*.repository.spec.ts`） | **MockStore**（`__fixtures__/d1mock`） |
| repository: status | `apps/api/src/repository/__tests__/status.repository.spec.ts`（実在） | 同上 | **MockStore** |
| repository: identities（mock） | `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts`（実在） | 同上 | **MockStore** |
| repository: identities（auto-link 実 D1） | `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts`（実在） | **base `vitest.config.ts`**（`.autolink.spec.ts` は d1Include の `.repository.spec.ts` glob に非該当） | **real D1**（`setupD1` / `_setup.ts` / Miniflare） |
| jobs: ingest | **`apps/api/src/jobs/__tests__/` ディレクトリは未存在**（`ls` で no such directory）。sync-forms-responses の既存 spec は別所在 | — | — |
| routes/admin | `apps/api/src/routes/admin/__tests__/`（実在・`contract-stage-2.spec.ts` 等）。`member-status` 専用 spec は未存在 | `vitest.d1.config.ts`（glob `routes/**/*.contract.spec.ts` / 明示列挙） | real D1 |

> **重要な構造発見（Phase 4 の核心制約）**:
> - `*.repository.spec.ts`（`members` / `status` / `identities`）は **MockStore** を使う。MockStore は `INSERT OR IGNORE` の冪等性や `member_status` の DEFAULT 列適用を実 SQLite と同一には保証しない。よって **F-3（auto-link → `member_status` 既定行生成）の検証は MockStore では不十分**。
> - `identities.autolink.repository.spec.ts` は **real D1（`setupD1`）** を使い、`@vitest-environment node` + base config で走る。実 SQLite で migration を流すため `INSERT OR IGNORE` / DEFAULT 列が忠実に評価される。
> - したがって、**RED の核心 TC（F-3）は `identities.autolink.repository.spec.ts` の real D1 パターンに追加**する。helper 単体（F-1）の冪等性も real D1 で確認するため、新規 real D1 spec を起点とする。

### 1.1 RED テストの所在方針（FB-UI-02-2 targeted・実ファイル確定）

| TC 群 | 追加先 spec ファイル | 種別 | DB |
|-------|---------------------|------|----|
| `createMemberWithStatus` 単体（F-1） | **新規** `apps/api/src/repository/__tests__/members.repository.spec.ts` | 新規（real D1） | real D1（`setupD1`） |
| auto-link → `member_status`（F-3・RED 核心） | 既存 `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts` を拡張 | 編集 | real D1（既存パターン踏襲） |
| ingest 経路の回帰（F-2） | sync-forms-responses の既存 contract spec（Phase 5 で実所在を `grep` 確定）/ 無ければ既存 `members.repository.spec.ts` 内で helper 経由の write 結果を確認 | 編集 or 新規 | real D1 |
| route mutation 防御の非回帰（F-4） | 既存 admin status 検証経路（既存 spec 維持・新規 RED 不要） | 維持 | real D1 |

> **新規 spec を `.repository.spec.ts` サフィックスにしない理由**: `.repository.spec.ts` glob は MockStore 系で占有されており、helper の real D1 冪等性検証には real D1 が要る。`identities.autolink.repository.spec.ts` と同様、base config で real D1 を使う命名（`*.spec.ts`・`@vitest-environment node`）にする。不変条件 #8（`*.spec.{ts,tsx}` のみ）は遵守。

---

## 2. D1 contract test の前提（FB-MSO-002）

| 前提 | 内容 |
|------|------|
| config | real D1 系は base `vitest.config.ts`（`@vitest-environment node` 宣言で node 環境）。`setupD1()`（`apps/api/src/repository/__tests__/_setup.ts`）が Miniflare の in-memory D1 に `apps/api/migrations/*.sql` を idempotent 適用する |
| esbuild 整合 | 実行前に `mise exec -- pnpm install`（ワークツリー独立 `node_modules`）。esbuild runtime 不整合時は `pnpm verify:vitest-runtime`（FB-MSO-002・arch / worktree isolation / esbuild version の 3 verify） |
| fixture | `setupD1()` は `{ ctx, db, loadFixtures, reset, dispose }` を返す。`beforeEach(async () => { env = await setupD1(); }, 30000)`（既存 `identities.autolink.repository.spec.ts` 準拠・timeout 30s） |
| seed | `member_responses` / `tag_assignment_queue` を `env.db.prepare(...).run()` で直接 INSERT（既存 `insertResponse` helper 準拠） |
| 検証 | `env.db.prepare("SELECT ... FROM member_status WHERE member_id = ?1").first()` で実テーブルを直接 assert |

実行コマンド（focused・全件 test の SIGKILL 回避）:

```bash
# real D1 系（base config・新規 helper + auto-link 拡張）
mise exec -- pnpm vitest run \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts

# MockStore 系（既存非回帰・d1 config glob 経由）
mise exec -- pnpm vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/members.repository.spec.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts
```

> RED 段階では `members.repository.spec.ts` 内の `createMemberWithStatus` import が存在しなければコンパイル/実行が失敗する（= RED）。auto-link 拡張 TC は実装前に `member_status` 行が生成されず assert 失敗する（= RED の核心）。

---

## 3. テストケース表（AC ごと・TC 番号付き）

| TC | 名称 | 対象 spec ファイル | expected（期待結果） | 現状（実装前） | 紐づく AC / 方針 |
|----|------|-------------------|---------------------|---------------|-----------------|
| **TC-1** | `createMemberWithStatus` で `member_identities` と `member_status` 両行が生成される | `members.repository.spec.ts`（新規・real D1） | `createMemberWithStatus(ctx, row)` 呼出後、`member_identities` に 1 行・`member_status` に 1 行が存在する | **RED**（helper 追加前（RED 設計時）でコンパイル失敗） | AC-2 / F-1 |
| **TC-2** | `createMemberWithStatus` の冪等性（2 回呼んでも重複・例外なし） | `members.repository.spec.ts`（新規・real D1） | 同一 `memberId` で 2 回呼出 → `member_identities` 1 行・`member_status` 1 行（重複 0）・throw なし | **RED**（helper 追加前（RED 設計時）） | AC-2 / Phase3 冪等性 |
| **TC-3** | auto-link（`backfillIdentityFromCandidate` / `tryAutoLinkIdentityByEmail`）から member を作ると `member_status` 既定行が生成される | `identities.autolink.repository.spec.ts`（既存拡張・real D1） | `member_responses` + `tag_assignment_queue` を seed → `tryAutoLinkIdentityByEmail(ctx, email)` で identity 生成後、`member_status` に同 `member_id` 行が存在する | **🔴 RED の核心**（現状 auto-link は `member_status` を生成しない＝行ゼロで assert 失敗） | AC-4 / F-3（最重要） |
| **TC-4** | ingest（sync-forms-responses）で新規 identity 作成時に `member_status` が生成される（helper 経由後も維持） | sync-forms-responses 既存 contract spec（Phase 5 で実所在確定）/ または `members.repository.spec.ts` で helper 結果を代理検証 | 新規 response を ingest → `member_identities` と `member_status` が両方生成され、`writeCount` セマンティクスは `+2` のまま不変 | **GREEN 維持→RED 化注意**（現状も生成される。helper 差し替え後も維持されることを保証する回帰 TC） | AC-4 / AC-5 / F-2 |
| **TC-5** | `member_status` 既定行の値が DEFAULT と一致（`public_consent='unknown'` 等） | `members.repository.spec.ts`（新規・real D1） | 生成された `member_status` 行が `public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` | **RED**（helper 追加前（RED 設計時）） | AC-2 / index §1.3（DEFAULT 安全性） |
| **TC-6** | 既存挙動の非回帰（正常会員の取得・status が従来通り） | `members.repository.spec.ts` / `status.repository.spec.ts`（既存・MockStore・**変更しない**） | 既存 `findMemberById` / `listMembersByIds` / `getStatus` / `ensureMemberStatusRow` の全 it が PASS のまま（helper 追加・auto-link 連結で既存挙動が壊れない） | **GREEN 維持**（非回帰ガード。実装後も全 PASS） | AC-5 |

> TC-4 補足: TC-4 は「ingest が helper 経由後も `member_status` を生成し続ける」ことの保証 TC。現状コードでも `sync-forms-responses.ts:314` の独立 `ensureMemberStatusRow` で生成されるため RED にはならないが、F-2 差し替え（`createMemberWithStatus` 1 呼び出しへ統合）後にも生成が維持されることを担保する回帰 TC として必須。sync-forms-responses 専用 spec の実所在は MockStore か real D1 かを含め Phase 5 冒頭の `grep -rln "runResponseSync\|processResponse" apps/api/src --include="*.spec.ts"` で確定する。

### 3.1 TC-3（RED 核心）の具体構造（実装者向け疑似コード）

`identities.autolink.repository.spec.ts` に以下の it を追加（既存 `insertResponse` helper・`setupD1` を再利用）:

```ts
it("auto-link で identity を生成すると member_status 既定行も生成される（issue #1104 F-3）", async () => {
  await insertResponse(env, "r-1", "newlink@example.com", "2026-05-01T00:00:00Z");

  const identity = await tryAutoLinkIdentityByEmail(
    env.ctx,
    asResponseEmail("newlink@example.com"),
  );
  expect(identity).not.toBeNull();

  const status = await env.db
    .prepare("SELECT * FROM member_status WHERE member_id = ?1")
    .bind(identity!.member_id)
    .first<{ public_consent: string; publish_state: string; is_deleted: number }>();

  // RED: 実装前は status が null（auto-link が member_status を生成しないため）
  expect(status).not.toBeNull();
  expect(status?.public_consent).toBe("unknown");
  expect(status?.publish_state).toBe("member_only");
  expect(status?.is_deleted).toBe(0);
});
```

### 3.2 TC-1 / TC-2 / TC-5 の具体構造（新規 real D1 spec）

`members.repository.spec.ts`（新規・`identities.autolink.repository.spec.ts` の `setupD1` パターン踏襲）:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import { createMemberWithStatus } from "../members"; // RED: 実装前は未 export
import { asMemberId, asResponseId, asResponseEmail } from "../_shared/brand";

describe("createMemberWithStatus (issue #1104 F-1)", () => {
  let env: InMemoryD1;
  beforeEach(async () => { env = await setupD1(); }, 30000);

  const row = {
    memberId: asMemberId("m_unify_1"),
    responseEmail: asResponseEmail("unify1@example.com"),
    currentResponseId: asResponseId("r_1"),
    firstResponseId: asResponseId("r_1"),
    lastSubmittedAt: "2026-05-01T00:00:00Z",
  };

  it("TC-1: identity と status の両行を生成する", async () => {
    await createMemberWithStatus(env.ctx, row);
    const idc = await env.db.prepare("SELECT COUNT(*) AS n FROM member_identities WHERE member_id=?1").bind("m_unify_1").first<{ n: number }>();
    const stc = await env.db.prepare("SELECT COUNT(*) AS n FROM member_status WHERE member_id=?1").bind("m_unify_1").first<{ n: number }>();
    expect(idc?.n).toBe(1);
    expect(stc?.n).toBe(1);
  });

  it("TC-2: 2 回呼んでも重複せず throw しない（冪等）", async () => {
    await createMemberWithStatus(env.ctx, row);
    await expect(createMemberWithStatus(env.ctx, row)).resolves.toBeUndefined();
    const stc = await env.db.prepare("SELECT COUNT(*) AS n FROM member_status WHERE member_id=?1").bind("m_unify_1").first<{ n: number }>();
    expect(stc?.n).toBe(1);
  });

  it("TC-5: status 既定行が DEFAULT 値と一致する", async () => {
    await createMemberWithStatus(env.ctx, row);
    const st = await env.db.prepare("SELECT * FROM member_status WHERE member_id=?1").bind("m_unify_1")
      .first<{ public_consent: string; rules_consent: string; publish_state: string; is_deleted: number }>();
    expect(st).toMatchObject({
      public_consent: "unknown", rules_consent: "unknown",
      publish_state: "member_only", is_deleted: 0,
    });
  });
});
```

---

## 4. 命名規則・Phase 1-3 整合の検証

新規 TC は **Phase 1 §3 の命名規則**（camelCase 動詞始まり `createMemberWithStatus`・第 1 引数 `DbCtx`・`Promise<void>`）と **Phase 2 §2.2/§2.3 の契約**（identity upsert + `ensureMemberStatusRow` 連結・冪等）に厳密に対応する。TC-3 は Phase 1 §5 inventory の **P-2（auto-link・issue 見落とし経路）** を直接検証対象とし、Phase 2 §2.3 F-3（最重要差し替え）の RED 化を担う。新規 spec はすべて `*.spec.ts`（不変条件 #8 遵守・`*.test.ts` 不使用）。

---

## 5. 完了条件チェックリスト

- [x] 既存テストファイルの実在を `ls` で確認し、MockStore / real D1 の使い分けを特定した
- [x] D1 contract test 前提（`setupD1` / `vitest.d1.config.ts` / FB-MSO-002 esbuild 整合）を記載した
- [x] TC-1〜TC-6 を AC・F-1〜F-4 へ紐づけ、対象 spec / expected / 現状（RED/GREEN）列で固定した
- [x] RED 核心（TC-3 = auto-link → `member_status`）を real D1 spec として具体構造化した
- [x] 新規 helper 単体（TC-1/2/5）を新規 real D1 spec として具体構造化した
- [x] 命名規則（FB-SDK-07-4）と Phase 1-3 整合を明記した
- [x] focused 実行コマンド（SIGKILL 回避）を提示した
