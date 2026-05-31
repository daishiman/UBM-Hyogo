# Phase 4: テスト作成（TDD Red）

## 0. このフェーズの目的

dismiss 操作を `audit_log` へ記録する実装（Phase 5）に先立ち、**期待される振る舞いを失敗するテスト（Red）として固定**する。
本タスクは API レイヤのみの変更（NON_VISUAL）であり、検証はすべて `*.contract.spec.ts` の追加テストケースで行う。

> 正本: 共通設計 BRIEF。merge（`identity-merge.ts`）が既に `audit_log` へ `action='identity.merge'` を D1 batch で記録している構造を、dismiss（`identity-conflict.ts` の `dismissIdentityConflict()`）に対称適用する。

---

## 1. TDD Red の前提確認（着手前チェック）

| 確認項目 | 内容 | 根拠 |
|----------|------|------|
| 命名規則整合 | テストファイルは `*.contract.spec.ts` / `*.spec.ts` のみ。`*.test.ts` は禁止 | CLAUDE.md 不変条件 #8（lefthook `block-test-suffix` / GHA `verify-test-suffix`） |
| テスト操作対象 | 本タスクは UI を持たず、操作対象は **repository 関数のシグネチャ** と **route の HTTP I/O**。React props / internal state の区別は不要（NON_VISUAL） | 共通設計 BRIEF 3「UI 変更なし」 |
| 既存テスト形の踏襲 | `// @vitest-environment node` + `setupD1`（`../../repository/__tests__/_setup`）+ `adminAuthHeader`（`./_test-auth`）+ `seedDuplicateIdentities` + `app.request(path, init, makeEnv(env))` | `identity-conflicts.contract.spec.ts` / `audit.contract.spec.ts` の現行形 |
| 認可ユーザの固定値 | `adminAuthHeader()` は `memberId="m_admin"` / `email="admin@example.com"` / `isAdmin=true` を署名する。route 側は `claims.sub ?? user.memberId` を actor_id に、`user.email` を actor_email に渡す | `_test-auth.ts`、route 91-110 行（Phase 5 で email 引数追加） |
| conflictId 形式 | `seedDuplicateIdentities` のシードでは source=`m_source`（新しい側）/ target=`m_target`（古い側）。conflictId = `m_source__m_target` | `identity-conflict.ts` の source/target 正規化（新しい側を source） |

### private / 内部関数のテスト方針

- `dismissIdentityConflict()` は `identity-conflict.ts` の **export 済み public 関数**であり、private キャストは不要。
- ただし本タスクの正本検証は **route 経由（HTTP I/O）の contract test** を主とする。理由: email 引数の配線（route → repository）と audit_log 記録を end-to-end で同時検証できるため。
- repository 単体での補助テスト（`identity-conflict.repository.spec.ts` の更新）は Phase 6 で扱う（既存テストが旧シグネチャで呼んでいるため回帰 guard が必要）。
- redact ロジック（`redactIdentityReason`）は `identity-merge.ts` の既存 export を再利用するため、redact 自体の単体テストは追加不要。dismiss 経路で after_json に反映されることのみを検証する。

---

## 2. 追加テストケース一覧

### 2-1. `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` に追加

`describe("admin identity-conflicts route", ...)` の末尾に以下を追加する。
共通のヘッダ生成は既存の `adminAuthHeader()` を流用し、dismiss 実行後に `makeEnv(env).DB` 相当の `env.db` を直接 SELECT して audit_log を検証する。

#### TC-D01: dismiss 成功時に audit_log へ `identity.dismiss` が 1 件記録される

| 項目 | 内容 |
|------|------|
| 操作 | `POST /identity-conflicts/m_source__m_target/dismiss`（admin 認可ヘッダ + `content-type: application/json` + body `{ "reason": "別人と確認" }`） |
| 期待 status | `200` |
| 検証1 | レスポンス body に `dismissedAt`（ISO 文字列）が含まれる |
| 検証2 | `SELECT * FROM audit_log WHERE action = 'identity.dismiss'` が **1 行**返る |
| 検証3 | その行の `target_id` が `'m_target'` |
| 検証4 | その行の `actor_email` が認可ユーザ email（`'admin@example.com'`）と一致 |
| 検証5 | その行の `actor_id` が `'m_admin'`（`claims.sub` or `user.memberId`）と一致 |
| 検証6 | `JSON.parse(before_json)` が `sourceMemberId='m_source'`, `targetMemberId='m_target'` を含む |
| 検証7 | `JSON.parse(after_json)` が `dismissalId`（string）, `dismissedAt` を含み、`reason` を含まない |
| Red 理由 | 現行 `dismissIdentityConflict()` は `identity_conflict_dismissals` のみ INSERT し audit_log に書かないため、検証2 で 0 行となり FAIL する |

```ts
it("dismiss は audit_log に identity.dismiss を 1 件記録する", async () => {
  const app = createAdminIdentityConflictsRoute();
  const res = await app.request(
    "/identity-conflicts/m_source__m_target/dismiss",
    {
      method: "POST",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ reason: "別人と確認" }),
    },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const out = (await res.json()) as { dismissedAt: string };
  expect(typeof out.dismissedAt).toBe("string");

  const { results } = await env.db
    .prepare("SELECT * FROM audit_log WHERE action = 'identity.dismiss'")
    .all<Record<string, unknown>>();
  expect(results).toHaveLength(1);
  const row = results[0]!;
  expect(row.target_id).toBe("m_target");
  expect(row.actor_email).toBe("admin@example.com");
  expect(row.actor_id).toBe("m_admin");
  const before = JSON.parse(String(row.before_json));
  expect(before).toMatchObject({
    sourceMemberId: "m_source",
    targetMemberId: "m_target",
  });
  const after = JSON.parse(String(row.after_json));
  expect(typeof after.dismissalId).toBe("string");
  expect(after.dismissedAt).toBe(out.dismissedAt);
  expect(after).not.toHaveProperty("reason");
});
```

> 注: `actor_id` カラムの突合は、route が `claims.sub ?? user.memberId` を渡す前提。`adminAuthHeader()` は `sub` を含まないため値は `user.memberId="m_admin"` になる。実測でズレた場合は Phase 5 の actor 解決ロジックを正本として期待値を合わせる。

#### TC-D02: dismiss は admin 認可必須（未認可は 401）

| 項目 | 内容 |
|------|------|
| 操作 | 認可ヘッダ無しで `POST /identity-conflicts/m_source__m_target/dismiss` |
| 期待 status | `401` |
| 検証 | audit_log に `identity.dismiss` 行が **0 件**（未認可で副作用が起きない） |
| Red 理由 | 現行も `requireAdmin` で 401 を返すため status は通るが、本ケースは **回帰 guard**。Phase 5 の batch 化で認可前に副作用が漏れないことを保証する |

```ts
it("dismiss は未認可で 401 かつ audit_log 副作用なし", async () => {
  const app = createAdminIdentityConflictsRoute();
  const res = await app.request(
    "/identity-conflicts/m_source__m_target/dismiss",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "x" }) },
    makeEnv(env),
  );
  expect(res.status).toBe(401);
  const { results } = await env.db
    .prepare("SELECT * FROM audit_log WHERE action = 'identity.dismiss'")
    .all<Record<string, unknown>>();
  expect(results).toHaveLength(0);
});
```

#### TC-D03: reason に PII を含む場合 audit payload に reason 生値を含めない

| 項目 | 内容 |
|------|------|
| 操作 | dismiss body `{ "reason": "別人 user@example.com 090-1234-5678 で確認済み" }` |
| 期待 status | `200` |
| 検証1 | `audit_log.after_json` が `user@example.com` を **含まない** |
| 検証2 | `audit_log.after_json` が `reason` key を含まない |
| 検証3 | 同時に `identity_conflict_dismissals.reason` も `[redacted]` 化されている（既存挙動の維持） |
| Red 理由 | 現行は audit_log 行が存在しないため検証1/2 が FAIL する。Phase 5 で after_json を dismissal metadata のみにすることで Green になる |

```ts
it("dismiss の reason 内 PII は audit_log after_json に出さない", async () => {
  const app = createAdminIdentityConflictsRoute();
  const res = await app.request(
    "/identity-conflicts/m_source__m_target/dismiss",
    {
      method: "POST",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ reason: "別人 user@example.com 090-1234-5678 で確認済み" }),
    },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const log = await env.db
    .prepare("SELECT after_json FROM audit_log WHERE action = 'identity.dismiss'")
    .first<{ after_json: string }>();
  expect(String(log?.after_json)).not.toContain("user@example.com");
  expect(JSON.parse(String(log?.after_json))).not.toHaveProperty("reason");

  const dismissal = await env.db
    .prepare("SELECT reason FROM identity_conflict_dismissals WHERE source_member_id = 'm_source'")
    .first<{ reason: string }>();
  expect(dismissal?.reason).toContain("[redacted]");
});
```

#### TC-D04: 同一 conflict の二重 dismiss でも audit_log に追記され、エラーにならない

| 項目 | 内容 |
|------|------|
| 操作 | 同一 `m_source__m_target` に対し dismiss を 2 回連続実行（reason は別文字列） |
| 期待 status | 1 回目・2 回目とも `200` |
| 検証1 | `identity_conflict_dismissals` は ON CONFLICT 更新で **1 行**（既存挙動の維持） |
| 検証2 | `audit_log WHERE action='identity.dismiss'` は **2 行**（dismiss 操作ごとに追記される＝merge と異なり upsert ではない） |
| 検証3 | 2 行の `after_json.dismissedAt` がそれぞれの操作時刻を反映し、reason 生値を含まない |
| 検証4 | 2 回目の `audit_log.after_json.dismissalId` が `identity_conflict_dismissals.dismissal_id` と一致する |
| Red 理由 | 現行は audit_log 行 0 件のため検証2 が FAIL。Phase 5 で dismiss ごとに新 audit_id で INSERT する設計を固定する |

```ts
it("二重 dismiss は dismissal 1 行 / audit_log 2 行（追記）", async () => {
  const app = createAdminIdentityConflictsRoute();
  const headers = { ...(await adminAuthHeader()), "content-type": "application/json" };
  for (const reason of ["一回目", "二回目"]) {
    const res = await app.request(
      "/identity-conflicts/m_source__m_target/dismiss",
      { method: "POST", headers, body: JSON.stringify({ reason }) },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  }
  const dismissals = await env.db
    .prepare("SELECT * FROM identity_conflict_dismissals WHERE source_member_id = 'm_source'")
    .all<Record<string, unknown>>();
  expect(dismissals.results).toHaveLength(1);

  const logs = await env.db
    .prepare("SELECT after_json FROM audit_log WHERE action = 'identity.dismiss' ORDER BY created_at ASC")
    .all<{ after_json: string }>();
  expect(logs.results).toHaveLength(2);
  for (const row of logs.results) {
    expect(JSON.parse(String(row.after_json))).not.toHaveProperty("reason");
  }
});
```

> 注: `created_at` が同一 ms に揃うと ORDER BY が不安定になり得る。順序依存の検証は避け、append 件数と payload の PII 非混入を確認する。

#### TC-D05: 存在しない source/target は 404 で audit_log を書かない

| 項目 | 内容 |
|------|------|
| 操作 | `POST /identity-conflicts/m_source__missing/dismiss` |
| 期待 status | `404` |
| 検証1 | response が `{ error: "MEMBER_NOT_FOUND", memberId: "missing" }` |
| 検証2 | `identity_conflict_dismissals` と `audit_log(action='identity.dismiss')` が増えない |

> merge endpoint の member 存在確認と対称にする。audit_log に存在しない target_id の正規操作を残さないための guard。

#### TC-D06: audit_log INSERT 失敗時は dismissal も rollback される

| 項目 | 内容 |
|------|------|
| 操作 | 既存 `audit_id` と衝突する UUID を `audit_log` INSERT に使わせ、D1 batch の 2 statement 目を失敗させる |
| 期待 | `dismissIdentityConflict()` が reject し、`identity_conflict_dismissals` には source/target 行が残らない |
| 目的 | `db.batch` がある環境で「1 statement 目だけ成功する」部分書き込みが起きないことを実 D1 で固定する |

---

### 2-2. `apps/api/src/routes/admin/audit.contract.spec.ts` に追加

audit route は GET フィルタの検証が責務。dismiss を直接呼ばず、**audit_log へ `identity.dismiss` / `identity.merge` 行を直接シードして** フィルタ挙動を検証する（audit route の責務境界に合わせる）。

#### TC-A01: `/admin/audit?action=identity.dismiss` で dismiss イベントが時系列降順で返る

| 項目 | 内容 |
|------|------|
| 前提シード | `audit_log` に `action='identity.dismiss'` 2 行（created_at 異なる）+ 無関係な既存 seed |
| 操作 | `GET /audit?action=identity.dismiss`（admin 認可） |
| 期待 status | `200` |
| 検証1 | `items` が `identity.dismiss` 行のみ（無関係 action を含まない） |
| 検証2 | `items` が `created_at` 降順（新しい順）で返る |
| 検証3 | raw `after_json` が露出しない（既存 audit の masking 契約を維持） |
| Red 理由 | audit route 自体は既存実装で `action` フィルタ可能。本ケースは **新 action 値 `identity.dismiss` が現行フィルタを素通りすることの確認**。実装変更不要で Green になる想定だが、`identity.dismiss` を許容 action として扱う回帰 guard として残す |

```ts
it("GET /audit?action=identity.dismiss: dismiss イベントを降順で返す", async () => {
  await env.db.prepare(
    "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
  ).bind(
    "audit_dis_1", "owner@example.com", "identity.dismiss", "member", "m_target",
    JSON.stringify({ sourceMemberId: "m_source", targetMemberId: "m_target" }),
    JSON.stringify({ dismissalId: "d1", dismissedAt: "2026-04-30T10:00:00.000Z" }),
    "2026-04-30T10:00:00.000Z",
  ).run();
  await env.db.prepare(
    "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
  ).bind(
    "audit_dis_2", "owner@example.com", "identity.dismiss", "member", "m_target2",
    JSON.stringify({ sourceMemberId: "m_s2", targetMemberId: "m_target2" }),
    JSON.stringify({ dismissalId: "d2", dismissedAt: "2026-04-30T11:00:00.000Z" }),
    "2026-04-30T11:00:00.000Z",
  ).run();

  const app = createAdminAuditRoute();
  const res = await app.request(
    "/audit?action=identity.dismiss",
    { headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { items: Array<{ auditId: string; action: string }> };
  expect(body.items.map((i) => i.action)).toEqual(["identity.dismiss", "identity.dismiss"]);
  expect(body.items.map((i) => i.auditId)).toEqual(["audit_dis_2", "audit_dis_1"]);
  expect(body.items[0]).not.toHaveProperty("afterJson");
});
```

#### TC-A02: `targetId=m_target` フィルタで dismiss / merge 両方が target 単位で絞り込める

| 項目 | 内容 |
|------|------|
| 前提シード | `audit_log` に target_id=`m_target` の `identity.dismiss` 1 行 + `identity.merge` 1 行、別 target の行 1 行 |
| 操作 | `GET /audit?targetId=m_target`（admin 認可） |
| 期待 status | `200` |
| 検証1 | `items` が target_id=`m_target` の 2 行のみ（dismiss + merge） |
| 検証2 | action 集合が `{ identity.dismiss, identity.merge }` を含む |
| 検証3 | 別 target の行は含まれない |
| Red 理由 | audit route は既存で `targetId` フィルタ可能。dismiss が merge と同じ `target_type='member'` / `target_id=target` で記録される設計の整合性を保証する回帰 guard |

```ts
it("GET /audit?targetId=m_target: dismiss と merge を target 単位で返す", async () => {
  const seed = (id: string, action: string, targetId: string, at: string) =>
    env.db.prepare(
      "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1,?2,?3,'member',?4,NULL,?5,?6)",
    ).bind(id, "owner@example.com", action, targetId, JSON.stringify({ x: 1 }), at).run();
  await seed("a_dis", "identity.dismiss", "m_target", "2026-04-30T10:00:00.000Z");
  await seed("a_mer", "identity.merge", "m_target", "2026-04-30T11:00:00.000Z");
  await seed("a_other", "identity.dismiss", "m_other", "2026-04-30T12:00:00.000Z");

  const app = createAdminAuditRoute();
  const res = await app.request(
    "/audit?targetId=m_target",
    { headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { items: Array<{ auditId: string; action: string; targetId: string }> };
  const ids = body.items.map((i) => i.auditId).sort();
  expect(ids).toEqual(["a_dis", "a_mer"]);
  expect(body.items.every((i) => i.targetId === "m_target")).toBe(true);
});
```

> 注: audit route の query パラメータ名（`targetId`）は `audit.contract.spec.ts` の既存ケース（`targetId=s1`）で実証済み。実装側の Zod schema が許容することを前提とする。

---

## 3. テスト件数サマリー（Phase 4 で追加する Red ケース）

| ファイル | 追加 TC | 主目的 |
|----------|---------|--------|
| `identity-conflicts.contract.spec.ts` | TC-D01〜D04（4 件） | dismiss → audit_log 記録の end-to-end |
| `audit.contract.spec.ts` | TC-A01〜A02（2 件） | audit GET フィルタが新 action / target を絞れる |
| 合計 | **6 件** | |

---

## 4. RED 実行手順（期待: 新規 TC が FAIL）

```bash
# 依存整合（worktree 直後の esbuild mismatch 対策）
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/shared build

# focused 実行（root=../.. 注意。package.json test script は --root=../.. --config=vitest.config.ts apps/api）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run apps/api/src/routes/admin/audit.contract.spec.ts
```

期待: TC-D01 / TC-D03 / TC-D04 が FAIL（audit_log 行 0 件）。TC-D02 / TC-A01 / TC-A02 は現行でも通り得るが、Phase 5 後も Green を維持する回帰 guard として固定する。

---

## 5. 完了条件

- [x] TC-D01〜D06 相当を `identity-conflicts.contract.spec.ts` / repository spec に追記した
- [x] TC-A01〜A02 相当を `audit.contract.spec.ts` に追記した
- [x] focused run で audit_log 記録系が Green になることを確認した（最終 D1 focused spec 3 files / 28 tests PASS）
- [x] 既存 4 ケース（authz / list / merge mismatch / 409）が壊れていないことを確認した
- [x] 全 TC が命名規則（`*.contract.spec.ts` / `*.repository.spec.ts`）と既存シード形（`seedDuplicateIdentities`）に整合している
