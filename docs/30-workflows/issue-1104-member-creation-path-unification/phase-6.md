# Phase 6: テスト拡充 — issue-1104-member-creation-path-unification

> [実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

Phase 4 の主経路 RED/GREEN に加え、fail path・冪等性・既存行非破壊の回帰 guard を追加する。すべて real D1（`setupD1`）で実 SQLite の `INSERT OR IGNORE` / DEFAULT 列セマンティクスを忠実に検証する。

---

## 1. 追加テストケース表（fail path / 回帰 guard）

| TC | 名称 | 対象 spec ファイル | ケース（seed → 操作） | 期待値 |
|----|------|-------------------|----------------------|--------|
| **TC-7** | auto-link で既存 identity（`INSERT OR IGNORE` が no-op）でも `member_status` が冪等に保証される | `identities.autolink.repository.spec.ts`（既存拡張・real D1） | `member_responses` を seed し `member_identities` に同 email の identity を先行 INSERT（status 無し）→ `tryAutoLinkIdentityByEmail` を呼ぶ | `member_status` に 1 行生成される（identity INSERT は no-op でも F-3 連結が status を補完）。`member_identities` は重複せず 1 行のまま |
| **TC-8** | ingest 再実行（同一 response 再同期）で `member_status` を重複生成しない | sync-forms-responses 既存 contract spec（Phase 5 で実所在確定）/ または `members.repository.spec.ts` で helper 二重呼び代理検証 | 同一 response を 2 回 ingest（または同一 `memberId` で `createMemberWithStatus` を 2 回） | `member_identities` 1 行・`member_status` 1 行（重複 0）・throw なし・2 回目の identity 解決は既存 identity 経由（新規生成しない） |
| **TC-9** | `member_status` が既に存在する member への `createMemberWithStatus` が既存行を壊さない（`INSERT OR IGNORE`） | `members.repository.spec.ts`（既存拡張・real D1） | 先に `member_status` を非既定値（例 `public_consent='consented'` / `publish_state='public'`）で INSERT → 同 `memberId` で `createMemberWithStatus` を呼ぶ | 既存 `member_status` 行の値が保持される（`public_consent='consented'` / `publish_state='public'` のまま・`INSERT OR IGNORE` で上書きされない） |

> TC-9 は「`createMemberWithStatus` が既存 status を DEFAULT で踏み潰さない」ことの保証。`ensureMemberStatusRow` は `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` のため既存行があれば no-op であり、admin が設定済みの publish_state/consent を破壊しない。これは AC-5（既存挙動の非回帰）の中核 guard。

---

## 2. 各 TC の具体構造（実装者向け疑似コード）

### 2.1 TC-7（auto-link・既存 identity でも status 補完）— `identities.autolink.repository.spec.ts`

```ts
it("既存 identity（INSERT OR IGNORE が no-op）でも member_status を冪等に補完する（issue #1104 TC-7）", async () => {
  await insertResponse(env, "r-1", "preexist@example.com", "2026-05-01T00:00:00Z");
  // status 無しの legacy orphan identity を先行作成
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_legacy', 'preexist@example.com', 'r-1', 'r-1', '2026-05-01T00:00:00Z')`,
    )
    .run();

  const identity = await tryAutoLinkIdentityByEmail(
    env.ctx,
    asResponseEmail("preexist@example.com"),
  );
  expect(identity?.member_id).toBe("m_legacy"); // 既存を返す（重複生成しない）

  const idCount = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_identities WHERE response_email='preexist@example.com'")
    .first<{ n: number }>();
  const status = await env.db
    .prepare("SELECT * FROM member_status WHERE member_id='m_legacy'")
    .first<{ public_consent: string }>();

  expect(idCount?.n).toBe(1);        // identity は重複しない
  expect(status).not.toBeNull();     // F-3 連結で status が補完される
  expect(status?.public_consent).toBe("unknown");
});
```

> 実装判断: `tryAutoLinkIdentityByEmail` の早期 return path でも `ensureMemberStatusRow` を実行する。これにより既存 identity が status を欠く legacy orphan でも、auto-link 解決を通った時点で冪等に補完される。`backfillIdentityFromCandidate` 側の連結は新規 identity 生成 path の保証として維持する。

### 2.2 TC-8（ingest 再同期で重複なし）

sync-forms-responses 既存 contract spec が real D1 なら同一 response を 2 回 `runResponseSync`/`processResponse` に通し、`member_status` / `member_identities` の COUNT がそれぞれ 1 のままであることを assert。spec が MockStore 系の場合は `members.repository.spec.ts` で `createMemberWithStatus` を同一 row で 2 回呼び、COUNT 不変で代理検証する（TC-2 の上位互換的回帰）。

```ts
it("同一 member への createMemberWithStatus 二重呼びで identity/status とも重複しない（issue #1104 TC-8）", async () => {
  await createMemberWithStatus(env.ctx, row);
  await createMemberWithStatus(env.ctx, row);
  const idc = await env.db.prepare("SELECT COUNT(*) AS n FROM member_identities WHERE member_id=?1").bind(row.memberId).first<{ n: number }>();
  const stc = await env.db.prepare("SELECT COUNT(*) AS n FROM member_status WHERE member_id=?1").bind(row.memberId).first<{ n: number }>();
  expect(idc?.n).toBe(1);
  expect(stc?.n).toBe(1);
});
```

### 2.3 TC-9（既存 status 非破壊）— `members.repository.spec.ts`

```ts
it("既存 member_status を createMemberWithStatus が踏み潰さない（INSERT OR IGNORE・issue #1104 TC-9）", async () => {
  // 先に identity と非既定 status を作る
  await env.db.prepare(
    `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
     VALUES (?1,?2,?3,?3,?4)`,
  ).bind(row.memberId, row.responseEmail, row.currentResponseId, row.lastSubmittedAt).run();
  await env.db.prepare(
    `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
     VALUES (?1, 'consented', 'consented', 'public', 0)`,
  ).bind(row.memberId).run();

  await createMemberWithStatus(env.ctx, row);

  const st = await env.db.prepare("SELECT * FROM member_status WHERE member_id=?1").bind(row.memberId)
    .first<{ public_consent: string; publish_state: string }>();
  // INSERT OR IGNORE のため既存値が保持される（DEFAULT で上書きされない）
  expect(st?.public_consent).toBe("consented");
  expect(st?.publish_state).toBe("public");
});
```

> `upsertMember` は identity を `ON CONFLICT DO UPDATE` するため、TC-9 では identity の `response_email` 等が row の値で更新されうる点に留意（既存挙動・問題なし）。本 TC が守るのは **`member_status` の非破壊**であり、`ensureMemberStatusRow` の `INSERT OR IGNORE` セマンティクスを実 SQLite で検証する。

---

## 3. カバレッジ観点（Phase 7 への接続）

| カバー対象 | 担保 TC |
|-----------|---------|
| `createMemberWithStatus` の identity+status 両 write・冪等・DEFAULT・既存非破壊 | TC-1 / TC-2 / TC-5 / TC-8 / TC-9 |
| `backfillIdentityFromCandidate` の F-3 連結（新規生成 path）+ `tryAutoLinkIdentityByEmail` 早期 return 補完 | TC-3 / TC-7 |
| ingest 経路の生成維持・再同期非重複 | TC-4 / TC-8 |
| 既存 repository 挙動の非回帰 | TC-6 |

> auto-link 早期 return path は TC-7 で明示的に検証する。branch 空白を残さず、既存 identity / 新規 identity の両経路で `member_status` 補完を保証する。

---

## 4. 完了条件チェックリスト

- [x] fail path / 回帰 guard（TC-7 / TC-8 / TC-9）を対象 spec・ケース・期待値で固定した
- [x] TC-7（既存 identity no-op でも status 補完）を `backfillIdentityFromCandidate` 直接検証含めて具体化した
- [x] TC-8（ingest 再同期 / helper 二重呼びで重複なし）を具体化した
- [x] TC-9（既存 `member_status` を `INSERT OR IGNORE` で踏み潰さない）を非既定値 seed で具体化した
- [x] auto-link 早期 return path を TC-7 で検証対象に含めた
- [x] 全 TC を real D1（`setupD1`）で実 SQLite セマンティクス検証する方針を固定した
