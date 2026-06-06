# Phase 4 — テスト作成（TDD RED）

> 実装区分: **実装仕様書 / NON_VISUAL / new** / issue #1105 CLOSED 維持
> D1 contract test（`apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`）を TDD の RED として設計する。migration SQL は Phase 5 で実装するため、本 Phase 時点では test は失敗（RED）する。

## 4.1 テスト方針

| 項目 | 内容 |
|------|------|
| テスト種別 | D1 contract test（in-memory miniflare D1） |
| 実行環境 | `// @vitest-environment node`（`0025_backfill_member_status.spec.ts` と同一） |
| 基盤 | `setupD1()`（`apps/api/src/repository/__tests__/_setup.ts`）が `migrations/*.sql` を昇順全件自動適用。0026 を追加すれば自動で適用される |
| SQL 読込 | `readFileSync` で `0026_member_status_fk_constraint.sql` を読み、`.replace(/^--.*$/gm,"").replace(/\s+/g," ").trim()` で正規化（テンプレ準拠） |
| FK 実効化 | miniflare D1 はデフォルト FK OFF のため、各 FK 検証ケースで `PRAGMA foreign_keys = ON` を明示してから INSERT を試行する（AC-2/AC-6） |
| 命名規約 | `0026_member_status_fk_constraint.spec.ts`（不変条件 #8: `*.spec.ts` のみ。`*.test.ts` 禁止） |

> **重要**: `setupD1()` は全 migration を適用するため、`member_status` は test 開始時点で **既に 0026 適用後（FK 付き）** の状態になる。したがって「migration を手動 exec して再構築を再現する」のではなく、`0026_member_status_fk_constraint.sql` を `readFileSync` で別途読み込み、`env.db.exec(migrationSql)` を**追加適用**して冪等性（再適用安全）を検証する。これは `0025` テンプレが `env.db.exec(migrationSql)` を 2 回流すのと同じ流儀。

## 4.2 テストケース一覧（TC-1 .. TC-9）

| TC | 紐づく AC | 名称 | 検証内容 |
|----|-----------|------|----------|
| TC-1 | AC-1 | FK メタが存在する | `PRAGMA foreign_key_list(member_status)` が `member_identities` への FK を 1 件返す（`table='member_identities'` / `from='member_id'` / `to='member_id'`） |
| TC-2 | AC-2 | FK 違反 INSERT が拒否される | `PRAGMA foreign_keys = ON` のもと、存在しない `member_identities` を指す `member_status` INSERT が reject される |
| TC-3 | AC-2/AC-7 | 正常会員の INSERT が許容される | 有効な `member_identities` 行を先に作成 → 同 `member_id` の `member_status` INSERT が成功する |
| TC-4 | AC-3 | 既存データが移行後も不変 | 移行前に投入した全カラム値が、0026 適用後の `member_status` 行に欠落・改変なく保持される（行数一致 + 全カラム一致） |
| TC-5 | AC-4 | 冪等（再適用で破壊なし） | `env.db.exec(migrationSql)` を 2 回適用しても行数・カラム値が不変 |
| TC-6 | AC-5 | orphan ゼロ前提で migration 成功 | 0025 適用済み（orphan ゼロ）の状態で 0026 が FK 違反なく完了する |
| TC-7 | AC-9 | INDEX 再作成 | 再構築後も `idx_member_status_public` が同一定義で存在する（`PRAGMA index_list(member_status)` または `sqlite_master` で確認） |
| TC-8 | AC-6 | PRAGMA 実効性の文書化証跡 | `PRAGMA foreign_keys = ON` 後に違反 INSERT が reject される挙動を test で実証（in-memory での実効性証跡。本番 D1 binding は runbook 記録で補完） |

> AC-7（既存挙動の非回帰: 詳細/status/一覧）と AC-8（apps/web diff 0）は test ではなく Phase 6（回帰 guard）/ Phase 7（カバレッジ表）で扱う。TC-3 は INSERT 許容を通じて status 経路の最低限の非回帰を担保する。

## 4.3 各ケースの Arrange / Act / Assert

### TC-1: FK メタが存在する（AC-1）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()`（0026 まで適用済み） |
| Act | `env.db.prepare("PRAGMA foreign_key_list('member_status')").all()` |
| Assert | `results.length === 1` / `results[0].table === "member_identities"` / `results[0].from === "member_id"` / `results[0].to === "member_id"` |

### TC-2: FK 違反 INSERT が拒否される（AC-2）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → `PRAGMA foreign_keys = ON` を exec |
| Act | 存在しない member（`m-ghost`）の `member_status` を `INSERT INTO member_status (member_id) VALUES ('m-ghost')` |
| Assert | `await expect(...).rejects.toThrow()`（FK constraint failed） |

### TC-3: 正常会員の INSERT が許容される（AC-2 / AC-7）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → `PRAGMA foreign_keys = ON` → 有効な `member_identities('m-ok', ...)` を INSERT |
| Act | `INSERT INTO member_status (member_id) VALUES ('m-ok')` |
| Assert | 例外なく成功し、`SELECT * FROM member_status WHERE member_id='m-ok'` が 1 行・既定値（`public_consent='unknown'` 等）を返す |

### TC-4: 既存データが移行後も不変（AC-3）

> `setupD1()` は既に 0026 適用後の状態を返すため、「移行前後の行数/全カラム一致」は次の手順で検証する: 有効 member を作成し全カラムを明示値で INSERT → 行スナップショットを取得 → `migrationSql`（0026）を追加適用 → 再取得して一致を確認（追加適用が DROP/RENAME を含むため、再適用後もデータが保持されることを示す = AC-3 と AC-4 を同時に満たす）。

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → 有効 `member_identities('m-data', ...)` 作成 → `member_status` に現行全カラム明示値で INSERT（例: `public_consent='consented'`, `rules_consent='consented'`, `publish_state='public'`, `is_deleted=0`, `hidden_reason='manual'`, `last_notified_at='2026-06-02T00:00:00Z'`, `updated_by='admin-1'`, `updated_at='2026-06-02T00:00:00Z'`） |
| Act | スナップショット取得（before）→ `env.db.exec(migrationSql)` 追加適用 → 再取得（after） |
| Assert | `after.length === before.length`（行数一致）/ `after[0]` が `before[0]` と全カラム一致（`toEqual`） |

### TC-5: 冪等（再適用で破壊なし）（AC-4）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → 有効 member + `member_status` を 1 行投入 |
| Act | `env.db.exec(migrationSql)` を **2 回**連続適用 |
| Assert | `member_status` の行数が投入時と一致 / カラム値が不変 / `idx_member_status_public` が依然存在 |

### TC-6: orphan ゼロ前提で migration 成功（AC-5）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()`（0025 backfill 適用済み = orphan ゼロ）→ 有効 member を複数投入し対応する `member_status` も投入 |
| Act | `env.db.exec(migrationSql)`（0026 追加適用） |
| Assert | 例外なく完了（`await expect(env.db.exec(migrationSql)).resolves.toBeDefined()` 相当）。FK 違反が起きないこと |

### TC-7: INDEX 再作成（AC-9）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → `env.db.exec(migrationSql)` 追加適用（DROP/RENAME を経た状態を確実化） |
| Act | `env.db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_member_status_public'").all()` |
| Assert | `results.length === 1`。加えて `sql` 列に `public_consent`, `publish_state`, `is_deleted` を含む（同一定義） |

### TC-8: PRAGMA 実効性証跡（AC-6）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → `PRAGMA foreign_keys = ON` |
| Act | 違反 INSERT（TC-2 と同型）を実行 |
| Assert | reject される（in-memory D1 で FK が実効化される証跡）。テスト内コメントで「本番 D1 binding の接続単位挙動は runbook 記録で補完（AC-6）」を明記 |

## 4.4 テストコード骨子（`0025` 書式に厳密準拠）

> 下記は Phase 5 で実装する spec の骨子。`0025_backfill_member_status.spec.ts` の import 構成・SQL 正規化・`setupD1()` 利用を踏襲する。

```ts
// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { setupD1 } from "../../src/repository/__tests__/_setup";

// cwd 非依存（テストファイル基準で解決）
const migrationSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "0026_member_status_fk_constraint.sql"),
  "utf8",
)
  .replace(/^--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim();

// 有効な member_identities を 1 件作るヘルパ（FK 参照先）
const insertIdentity = async (db: D1Database, memberId: string) =>
  db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES (?, ?, 'r1', 'r1', '2026-06-02T00:00:00Z')`,
    )
    .bind(memberId, `${memberId}@example.com`)
    .run();

describe("0026_member_status_fk_constraint", () => {
  it("TC-1: member_status は member_identities への FK を持つ", async () => {
    const env = await setupD1();
    const meta = await env.db.prepare("PRAGMA foreign_key_list('member_status')").all();
    expect(meta.results).toHaveLength(1);
    expect(meta.results[0]).toMatchObject({
      table: "member_identities",
      from: "member_id",
      to: "member_id",
    });
  });

  it("TC-2: FK 違反 INSERT が拒否される（PRAGMA foreign_keys=ON）", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await expect(
      env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-ghost')").run(),
    ).rejects.toThrow();
  });

  it("TC-3: 正常会員の member_status INSERT は許容される", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await insertIdentity(env.db, "m-ok");
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-ok')").run();
    const rows = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-ok'")
      .all();
    expect(rows.results).toHaveLength(1);
    expect(rows.results[0]).toMatchObject({
      member_id: "m-ok",
      public_consent: "unknown",
      publish_state: "member_only",
      is_deleted: 0,
    });
  });

  it("TC-4: 既存データが再構築後も全カラム不変（再適用で検証）", async () => {
    const env = await setupD1();
    await insertIdentity(env.db, "m-data");
    await env.db
      .prepare(
        `INSERT INTO member_status
          (member_id, public_consent, rules_consent, publish_state,
           is_deleted, hidden_reason, last_notified_at, updated_by, updated_at)
         VALUES ('m-data', 'consented', 'consented', 'public',
           0, 'manual', '2026-06-02T00:00:00Z', 'admin-1', '2026-06-02T00:00:00Z')`,
      )
      .run();
    const before = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-data'")
      .all();

    await env.db.exec(migrationSql); // 0026 を追加適用（DROP/RENAME を経由）

    const after = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-data'")
      .all();
    expect(after.results).toHaveLength(before.results.length);
    expect(after.results[0]).toEqual(before.results[0]);
  });

  it("TC-5: 2 回適用で冪等（破壊なし）", async () => {
    const env = await setupD1();
    await insertIdentity(env.db, "m-idem");
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-idem')").run();
    await env.db.exec(migrationSql);
    await env.db.exec(migrationSql);
    const rows = await env.db.prepare("SELECT * FROM member_status").all();
    expect(rows.results).toHaveLength(1);
    const idx = await env.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_member_status_public'",
      )
      .all();
    expect(idx.results).toHaveLength(1);
  });

  it("TC-6: orphan ゼロ前提で 0026 が FK 違反なく完了する", async () => {
    const env = await setupD1();
    await insertIdentity(env.db, "m-a");
    await insertIdentity(env.db, "m-b");
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-a')").run();
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-b')").run();
    await expect(env.db.exec(migrationSql)).resolves.toBeDefined();
  });

  it("TC-7: idx_member_status_public が再構築後も同一定義で存在する", async () => {
    const env = await setupD1();
    await env.db.exec(migrationSql);
    const idx = await env.db
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND name='idx_member_status_public'",
      )
      .all();
    expect(idx.results).toHaveLength(1);
    const sql = String(idx.results[0].sql);
    expect(sql).toContain("public_consent");
    expect(sql).toContain("publish_state");
    expect(sql).toContain("is_deleted");
  });

  it("TC-8: PRAGMA foreign_keys=ON 下で FK が実効化される（in-memory 証跡・AC-6）", async () => {
    // 本番 D1 binding の接続単位挙動は runbook（outputs/phase-11）で補完する。
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await expect(
      env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-ghost-2')").run(),
    ).rejects.toThrow();
  });
});
```

> `D1Database` 型注釈が必要な場合は `import type { D1Database } from "@cloudflare/workers-types"` を追加する（`_setup.ts` と同じ型ソース）。

## 4.5 RED 確認

| 確認 | 期待（Phase 4 時点） |
|------|---------------------|
| 0026 SQL 未実装で test 実行 | `setupD1()` は 0026 を読まない（ファイル無し）→ `member_status` は FK なしのまま。TC-1（FK メタ 0 件）/ TC-2（違反 INSERT が通る）/ TC-7（再適用で migrationSql 読込が ENOENT）が **FAIL = RED** |
| Phase 5 で 0026 SQL 実装後 | 全 TC が GREEN になる |

## 4.6 テスト実行コマンド

```bash
# D1 contract test（リポジトリルートから）
mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts

# migration sequence guard（0026 unique prefix 確認）
mise exec -- pnpm verify:d1-migrations
```
