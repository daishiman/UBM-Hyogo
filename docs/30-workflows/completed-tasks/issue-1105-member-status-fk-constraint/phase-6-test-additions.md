# Phase 6 — テスト拡充（fail path / 回帰 guard）

> 実装区分: **実装仕様書 / NON_VISUAL / new** / issue #1105 CLOSED 維持
> Phase 4 の正常系 / 主要 fail path に加え、再構築 migration が**既存挙動を壊さない**ことを保証する回帰 guard と境界ケースを定義する。

## 6.1 拡充の狙い

| 観点 | 内容 |
|------|------|
| fail path | FK 違反（TC-2/TC-8）に加え、NULL 許容カラムの NULL 保持・無効 member 経由 status 経路の境界 |
| 回帰 guard | 再構築（DROP/RENAME）後も既存の `status.repository.spec.ts` が非回帰で GREEN を保つ |
| 多層防御整合 | `ensureMemberStatusRow` 経路が FK 下でも従来通り動作する（有効 member 前提なら成功） |

## 6.2 既存テストの非回帰 guard

### 6.2.1 `status.repository.spec.ts` への影響評価

| 項目 | 評価 |
|------|------|
| 実行基盤 | `MockStore` / `createMockDbCtx`（in-memory mock・実 D1 / 実 migration 非経由） |
| 0026 の影響 | **なし**。本 test は migration SQL を適用せず mock store 上で repository ロジックを検証するため、テーブル再構築・FK 追加の影響を受けない |
| 必要対応 | 既存 test をそのまま再実行し GREEN を確認（テストコード変更不要） |

> repository test は D1 contract test とは別レイヤー（mock）であるため、0026 による FK 追加は repository 層のユニットテストに影響しない。これは「migration の構造変更」と「repository ロジック」の責務が分離されている証跡。

### 6.2.2 D1 contract レイヤーの非回帰

| 対象 | 確認 |
|------|------|
| `0025_backfill_member_status.spec.ts` | 0026 適用後も backfill の orphan 解消挙動が成立する（`setupD1()` が 0025→0026 順で適用）。再実行 GREEN を確認 |
| `apps/api` 全 D1 contract test | `pnpm vitest run --config=vitest.d1.config.ts apps/api` を実行し、0026 追加による退行ゼロを確認 |

## 6.3 追加テストケース（TC-9 .. TC-11）

| TC | 紐づく AC | 名称 | 検証内容 |
|----|-----------|------|----------|
| TC-9 | AC-3 | NULL 許容カラムの NULL 保持 | `hidden_reason` / `last_notified_at` / `updated_by` を NULL で投入した行が、再構築後も NULL を保持する |
| TC-10 | AC-7 | ensureMemberStatusRow 相当経路が FK 下で成功 | 有効 `member_identities` 前提で、既定行 INSERT（`ensureMemberStatusRow` が発行する INSERT 形）が FK 違反にならず成功する |
| TC-11 | AC-5/AC-2 | FK OFF/ON 切替の境界 | `PRAGMA foreign_keys = OFF` のときは違反 INSERT が通り、`ON` に切り替えると以降の違反 INSERT が reject される（接続単位 pragma 挙動の境界証跡・AC-6 補強） |

### TC-9: NULL 許容カラムの NULL 保持（AC-3）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → 有効 `member_identities('m-null', ...)` 作成 → `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted) VALUES ('m-null','unknown','unknown','member_only',0)`（NULL 許容 3 カラムは未指定 = NULL） |
| Act | `env.db.exec(migrationSql)` 追加適用 → 再取得 |
| Assert | `hidden_reason === null` / `last_notified_at === null` / `updated_by === null`（再構築後も NULL 保持） |

### TC-10: ensureMemberStatusRow 相当経路が FK 下で成功（AC-7）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` → `PRAGMA foreign_keys = ON` → 有効 `member_identities('m-ensure', ...)` 作成 |
| Act | `INSERT OR IGNORE INTO member_status (member_id) VALUES ('m-ensure')`（`ensureMemberStatusRow` が発行する既定行 INSERT 形） |
| Assert | 成功し、行が既定値（`public_consent='unknown'` 等）で存在する。`ensureMemberStatusRow` 経路が FK 導入後も非回帰 |

### TC-11: FK OFF/ON 切替の境界（AC-5 / AC-2 / AC-6 補強）

| 段階 | 内容 |
|------|------|
| Arrange | `setupD1()` |
| Act 1 | `PRAGMA foreign_keys = OFF` → `INSERT INTO member_status (member_id) VALUES ('m-off')`（存在しない member） |
| Assert 1 | 成功する（FK OFF のため違反が通る = 再構築中 OFF の正当性証跡） |
| Act 2 | `PRAGMA foreign_keys = ON` → `INSERT INTO member_status (member_id) VALUES ('m-on-ghost')`（存在しない member） |
| Assert 2 | reject される |

> TC-11 は `0026` SQL 末尾の `PRAGMA foreign_keys = ON` が「migration 文の中で実効化される保証ではなく、接続単位の pragma に依存する」という設計事実（AC-6）を test レベルで可視化する。本番 D1 binding の接続単位挙動は Phase 11 runbook に記録する。

## 6.4 テストコード骨子（追加分）

```ts
  it("TC-9: NULL 許容カラムが再構築後も NULL を保持する", async () => {
    const env = await setupD1();
    await insertIdentity(env.db, "m-null");
    await env.db
      .prepare(
        `INSERT INTO member_status
          (member_id, public_consent, rules_consent, publish_state, is_deleted)
         VALUES ('m-null', 'unknown', 'unknown', 'member_only', 0)`,
      )
      .run();
    await env.db.exec(migrationSql);
    const rows = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-null'")
      .all();
    expect(rows.results[0]).toMatchObject({
      hidden_reason: null,
      last_notified_at: null,
      updated_by: null,
    });
  });

  it("TC-10: ensureMemberStatusRow 相当の既定行 INSERT が FK 下で成功する", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await insertIdentity(env.db, "m-ensure");
    await env.db
      .prepare("INSERT OR IGNORE INTO member_status (member_id) VALUES ('m-ensure')")
      .run();
    const rows = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-ensure'")
      .all();
    expect(rows.results).toHaveLength(1);
    expect(rows.results[0]).toMatchObject({ public_consent: "unknown" });
  });

  it("TC-11: FK は OFF で通り ON で違反 INSERT を拒否する（接続単位 pragma）", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = OFF");
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-off')").run();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await expect(
      env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-on-ghost')").run(),
    ).rejects.toThrow();
  });
```

## 6.5 回帰確認コマンド

```bash
# repository 層（mock・非回帰）
mise exec -- pnpm vitest run apps/api/src/repository/__tests__/status.repository.spec.ts

# D1 contract 層（0025 + 0026 + 全 migration test 非回帰）
mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api

# apps/web 非接触確認（AC-8）
git diff --name-only | grep '^apps/web/' && echo "NG: apps/web changed" || echo "OK: apps/web untouched"
```

## 6.6 完了条件（Phase 6 DoD）

1. TC-9..TC-11 が GREEN（NULL 保持 / ensureMemberStatusRow 経路 / FK OFF-ON 境界）。
2. `status.repository.spec.ts` がコード変更なしで非回帰 GREEN。
3. `apps/api` 全 D1 contract test が非回帰 GREEN。
4. `apps/web` diff 0（AC-8）。
