# Phase 7 — カバレッジ確認

> 実装区分: **実装仕様書 / NON_VISUAL / new** / issue #1105 CLOSED 維持
> 本タスクの変更は **migration SQL 1 本 + migration contract test + 既存 D1 test fixtures 追従 + setup harness 安定化**であることを前提に、line coverage ではなく **AC × TC のカバレッジマトリクス**で完全性を示す。

## 7.1 カバレッジ対象範囲（限定）

| 対象 | 区分 | coverage の意味 |
|------|------|----------------|
| `apps/api/migrations/0026_member_status_fk_constraint.sql` | 変更 | **SQL（宣言的 schema）であり line coverage の計測対象外**。代わりに D1 contract test で全 AC を実行的に検証する |
| `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | 変更 | test 本体 |
| `apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts` | 変更 | FK 導入後の既存 repository test fixture が親 `member_identities` を満たすことを確認する非回帰対象 |
| `apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts` / `apps/api/src/routes/admin/member-notification-pref.contract.spec.ts` / `apps/api/src/sync/backfill.contract.spec.ts` / `apps/api/src/routes/admin/tags-queue.contract.spec.ts` / `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` / `apps/api/src/routes/auth/session-resolve.contract.spec.ts` | 変更 | full D1 regression で露出した既存 `member_status` seed / upsert fixture を FK 前提へ補正する非回帰対象 |
| `apps/api/src/repository/__tests__/_setup.ts` | 変更 | full D1 regression を安定完走させるため、shared Miniflare worker 内の migration 再適用を 1 回に限定 |
| `apps/api/src/**` | **製品コード非変更** | 既存 coverage を一切変動させない（`status.ts` 等は import/ロジック未変更） |
| `apps/web/**` | **非変更** | diff 0（AC-8） |

> **広域 coverage 指定はしない**。本 migration は SQL のため、`pnpm coverage` のような src 全体の line coverage 計測ではなく、`vitest.d1.config.ts` での 0026 contract test 完走を完全性の根拠とする。

## 7.2 なぜ line coverage 対象外か

| 理由 | 説明 |
|------|------|
| migration は SQLite DDL/DML | `CREATE TABLE` / `INSERT ... SELECT` / `DROP` / `ALTER` / `CREATE INDEX` / `PRAGMA` は TypeScript の実行行ではないため、c8/istanbul の line coverage に乗らない |
| 検証は「適用結果の状態」 | 行を踏んだか（line）ではなく、適用後の DB 状態（FK メタ・データ不変・INDEX 存在・違反拒否）が正しいかが本質 |
| 代替指標 | **AC × TC マトリクス**で「全受け入れ基準が実行的にテストされている」ことを示す |

## 7.3 AC × TC カバレッジマトリクス

| AC | 内容 | カバーする TC | Phase |
|----|------|--------------|-------|
| AC-1 | FK を持つ（`PRAGMA foreign_key_list`） | TC-1 | 4 |
| AC-2 | 違反 INSERT が拒否される（`foreign_keys=ON`） | TC-2 / TC-8 / TC-11 | 4 / 6 |
| AC-3 | 既存データ（全カラム）が移行後も不変 | TC-4 / TC-9（NULL 保持） | 4 / 6 |
| AC-4 | 冪等（再適用で破壊なし） | TC-5 | 4 |
| AC-5 | backfill 0025 前提で FK 違反失敗しない | TC-6 / TC-11 | 4 / 6 |
| AC-6 | D1 上の PRAGMA 有効性検証・文書化 | TC-8（in-memory 実証）/ TC-11（OFF-ON 境界）+ Phase 11 runbook（本番 binding） | 4 / 6 / 11 |
| AC-7 | 既存挙動非回帰（詳細/status/一覧） | TC-3（正常 INSERT）/ TC-10（ensureMemberStatusRow 経路）/ `status.repository.spec.ts` 非回帰 | 4 / 6 |
| AC-8 | `apps/web` diff 0 | `git diff --name-only` guard（Phase 5 §5.3-8 / Phase 6 §6.5） | 5 / 6 |
| AC-9 | `idx_member_status_public` 再作成 | TC-7 | 4 |

> **全 9 AC がいずれかの TC または明示的 guard でカバーされている**（未カバー AC ゼロ）。

## 7.4 TC → AC 逆引き（テストの存在意義確認）

| TC | 主 AC | 補強 AC |
|----|-------|---------|
| TC-1 | AC-1 | — |
| TC-2 | AC-2 | — |
| TC-3 | AC-7 | AC-2 |
| TC-4 | AC-3 | AC-4 |
| TC-5 | AC-4 | AC-9 |
| TC-6 | AC-5 | — |
| TC-7 | AC-9 | — |
| TC-8 | AC-6 | AC-2 |
| TC-9 | AC-3 | — |
| TC-10 | AC-7 | — |
| TC-11 | AC-5 | AC-2 / AC-6 |

> 不要な（どの AC にも紐づかない）TC は存在しない。

## 7.5 カバレッジ確認コマンド

```bash
# 本 migration の全 TC（TC-1..TC-11）完走で AC 網羅を確認
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts

# 既存 fixtures の FK 前提非回帰
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts \
  apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts \
  apps/api/src/routes/admin/member-notification-pref.contract.spec.ts \
  apps/api/src/sync/backfill.contract.spec.ts \
  apps/api/src/routes/admin/tags-queue.contract.spec.ts \
  apps/api/src/workflows/tagQueueResolve.contract.spec.ts \
  apps/api/src/routes/auth/session-resolve.contract.spec.ts \
  apps/api/src/repository/__tests__/_setup.repository.spec.ts

# apps/api D1 suite 全体（port exhaustion 回避のため file parallelism off）
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  --no-file-parallelism --maxWorkers=1 apps/api
```

## 7.6 完了条件（Phase 7 DoD）

1. AC-1..AC-9 がすべて TC または guard でカバーされている（§7.3 マトリクスに未カバー行なし）。
2. TC-1..TC-11 が全 GREEN。
3. 製品 `src/` 非変更により既存 coverage が変動しない。
4. 広域 coverage 指定を行わず、本 migration の contract test 完走を完全性の根拠としている。
