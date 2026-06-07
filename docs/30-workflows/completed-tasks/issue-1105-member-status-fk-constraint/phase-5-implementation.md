# Phase 5 — 実装

> 実装区分: **実装仕様書 / NON_VISUAL / new** / issue #1105 CLOSED 維持
> Phase 4（TDD RED）で定義した TC-1..TC-9 を GREEN にする migration SQL + test を実装する。migration SQL は `phase-2-design.md` §2.2 を正本として再掲する。

## 5.1 新規作成ファイル一覧（必須）

| # | ファイル | 種別 | 役割 |
|---|---------|------|------|
| 1 | `apps/api/migrations/0026_member_status_fk_constraint.sql` | **新規** | FK 付き `member_status` 再構築 migration |
| 2 | `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | **新規** | FK 有効性 / 既存データ不変 / 冪等 / INDEX 再作成の D1 contract test（Phase 4 §4.4 骨子を実装） |
| 3 | `apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts` | **更新** | FK 導入後、opt-out gate の `member_status` fixture が親 `member_identities` を満たすよう seed を補正 |
| 4 | `apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts` | **更新** | notification opt-out repository upsert fixture が親 `member_identities` を満たすよう seed を補正 |
| 5 | `apps/api/src/routes/admin/member-notification-pref.contract.spec.ts` | **更新** | admin notification pref PATCH fixture が親 `member_identities` を満たすよう seed を補正 |
| 6 | `apps/api/src/sync/backfill.contract.spec.ts` | **更新** | backfill 不変条件 fixture の既存 `member_status` 行に親 `member_identities` を追加 |
| 7 | `apps/api/src/routes/admin/tags-queue.contract.spec.ts` | **更新** | tag queue fixture の `member_status` seed に親 `member_identities` を追加 |
| 8 | `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | **更新** | tag queue resolve fixture の `member_status` seed に親 `member_identities` を追加 |
| 9 | `apps/api/src/routes/auth/session-resolve.contract.spec.ts` | **更新** | FK 導入後に成立しない orphan `member_status` auto-link fixture を現行不変条件へ補正 |
| 10 | `apps/api/src/repository/__tests__/_setup.ts` | **更新** | Miniflare D1 migration 適用を worker 内 1 回にし、full D1 regression の socket exhaustion を防止 |

> `apps/api/migrations/sequence-exceptions.json` は 0026 が**新規 unique prefix**のため**編集不要**。`apps/web` 配下は一切変更しない（AC-8）。製品 `src/` コード変更はなく、既存 D1 test fixtures のみ FK 前提へ追従する。

## 5.2 migration SQL 完全内容（`0026_member_status_fk_constraint.sql`）

> `phase-2-design.md` §2.2 を正本として再掲。DEFAULT 値・カラム並びは `0002_admin_managed.sql` L5-16 と完全一致させること（非回帰・AC-7）。

```sql
-- 0026_member_status_fk_constraint.sql
-- 前提: 0025_backfill_member_status.sql 適用済み（orphan 解消済み）
-- 目的: member_status.member_id に member_identities(member_id) への FK を導入し
--       orphan を DB レベルで構造的に禁止する。

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS member_status_new;

-- 1. FK 付き新テーブル（0002 の既定値 + 0020 の notification_opt_out を保持）
CREATE TABLE IF NOT EXISTS member_status_new (
  member_id              TEXT PRIMARY KEY,
  public_consent         TEXT    NOT NULL DEFAULT 'unknown',
  rules_consent          TEXT    NOT NULL DEFAULT 'unknown',
  publish_state          TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted             INTEGER NOT NULL DEFAULT 0,
  hidden_reason          TEXT,
  last_notified_at       TEXT,
  updated_by             TEXT,
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  notification_opt_out   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (member_id) REFERENCES member_identities(member_id)
);

-- 2. 既存データを全カラム明示で移行（orphan があればここで失敗）
INSERT OR IGNORE INTO member_status_new
  (member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
   notification_opt_out)
SELECT
   member_id, public_consent, rules_consent, publish_state,
   is_deleted, hidden_reason, last_notified_at, updated_by, updated_at,
   notification_opt_out
FROM member_status;

PRAGMA foreign_keys = OFF;

-- 3. 旧テーブル削除 → リネーム
DROP TABLE IF EXISTS member_status;
ALTER TABLE member_status_new RENAME TO member_status;

-- 4. INDEX 再作成（DROP で消失した idx_member_status_public を同一定義で回復・AC-9）
CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);

PRAGMA foreign_keys = ON;  -- 検証用（実効化は接続単位の運用に依存・AC-6）
```

### 5.2.1 SQL 上の注意点（実装者向け）

| 注意 | 内容 |
|------|------|
| `setupD1()` splitStatements 互換 | 上記は文字列リテラル内に `;` を含まず、各文が独立。`datetime('now')` の `'now'` も `;` を含まないため `;` 分割で壊れない |
| DEFAULT 値の完全一致 | `0002_admin_managed.sql` と `0020_notification_channel_and_opt_out.sql` の現行 schema と一致させる（`notification_opt_out` を保持） |
| INDEX 名・列順 | `idx_member_status_public (public_consent, publish_state, is_deleted)`（`0002` L81-82 と同一） |
| orphan fail-fast | コピー時は `PRAGMA foreign_keys = ON` のまま実行し、0025 前提が壊れていれば migration を失敗させる |

## 5.3 実装手順（ステップ列挙）

1. **migration SQL 作成**: `apps/api/migrations/0026_member_status_fk_constraint.sql` を §5.2 の内容で新規作成する。
2. **test SQL 読込パス整合**: test が `readFileSync(join(dirname(...), "..", "0026_member_status_fk_constraint.sql"), ...)` でファイル名を正しく参照することを確認（ファイル名のタイポ防止）。
3. **test 作成**: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` を Phase 4 §4.4 の骨子で新規作成する（TC-1..TC-9）。`*.spec.ts` 命名（不変条件 #8）を厳守。
4. **sequence guard 確認**: `mise exec -- pnpm verify:d1-migrations` を実行し、0026 が unique prefix として通ることを確認（`sequence-exceptions.json` 編集不要）。
5. **D1 contract test 実行（GREEN 化）**: `mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` で TC-1..TC-9 を GREEN にする。
6. **全 D1 contract test 非回帰確認**: `mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api` を実行し、0026 追加による既存 migration test / repository test の退行がないことを確認（特に `0025_backfill_member_status.spec.ts` と `status.repository.spec.ts`）。
7. **既存 fixture 追従**: 全体 D1 regression で FK 違反が出た既存 D1 fixtures は、`member_status` INSERT / upsert 前に親 `member_identities` を作るよう補正する（notificationOutbox / memberNotificationPreference / admin member-notification-pref route / sync backfill / tags queue / tagQueueResolve / session-resolve）。
8. **D1 setup harness 改善**: `_setup.ts` は同一 Miniflare worker 内で migration を 1 回だけ適用し、以後は truncate のみにする。full D1 regression の `EADDRNOTAVAIL` / socket exhaustion を防ぐ。
8. **typecheck / lint**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` を実行。
9. **apps/web diff 0 確認**: `git diff --name-only` に `apps/web/` が含まれないことを確認（AC-8）。

## 5.4 ローカル検証コマンド

```bash
# 1. migration sequence guard（0026 unique prefix）
mise exec -- pnpm verify:d1-migrations

# 2. 本 migration の D1 contract test（GREEN 化）
mise exec -- pnpm vitest run --config=vitest.d1.config.ts \
  apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts

# 3. apps/api 全 D1 contract test（非回帰）
mise exec -- pnpm vitest run --config=vitest.d1.config.ts apps/api

# 4. 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 5.5 D1 実 apply（user-gated・本 wave では実施しない）

```bash
# staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging
# production（最終リリース時のみ・user 承認後）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

> 実 apply / commit / push / PR はすべて **user-gated**。本仕様書作成 wave では実行しない。`PRAGMA foreign_keys` の本番 D1 接続単位挙動は Phase 11（manual-test-result）の runbook に記録する（AC-6）。

## 5.6 完了条件（Phase 5 DoD）

1. `0026_member_status_fk_constraint.sql` が §5.2 の内容で追加されている。
2. `0026_member_status_fk_constraint.spec.ts` の TC-1..TC-9 が全 GREEN。
3. `pnpm verify:d1-migrations` が pass。
4. `apps/api` 全 D1 contract test が非回帰で GREEN。
5. 既存 D1 test fixtures と setup harness が FK 前提で GREEN。
6. `apps/web` diff 0 / 製品 `src/` コード変更なし。
