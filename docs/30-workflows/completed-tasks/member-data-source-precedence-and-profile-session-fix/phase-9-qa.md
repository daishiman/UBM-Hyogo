---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 9
name: 品質保証（QA）
status: completed
updated: 2026-06-09
---

# Phase 9 — 品質保証（member-data-source-precedence-and-profile-session-fix）

> 目的: line budget / link / mirror parity / 不変条件 gate / typecheck / lint / vitest を一括判定する観点を確定する。
> 各観点に **PASS 基準**を明示し、実装フェーズ（Phase 5）GREEN 後に機械的に判定できる形にする。
> 本ワークフローは実装仕様書（docs + code）であり、QA は spec 段階で「何を / どのコマンドで / 何を PASS とするか」を固定する。

---

## 1. ドキュメント品質（spec ドキュメント自体）

| 観点 | 判定方法 | PASS 基準 |
|------|----------|-----------|
| line budget | `wc -l docs/30-workflows/completed-tasks/member-data-source-precedence-and-profile-session-fix/phase-*.md` | 各 phase が肥大化していない（1 ファイル概ね ≤ 600 行・索引超過なし）|
| link 健全性 | 各 phase の相互参照（SSOT §, Phase n §）が実在 section を指す | dead link 0 |
| mirror parity | `pnpm verify:phase12-compliance`（canonical 9 見出し）/ `gate-metadata:validate`（artifacts.json zod）/ `indexes:rebuild` drift | phase12-compliance `ok:true` / gate ERROR 0 / indexes drift 0（`scripts/verify-pr-ready.sh` の 3 点が正本）|

> mirror parity の正本は `scripts/verify-pr-ready.sh`（CLAUDE.md PR フロー）。実行は PR 直前（user-gated 領域は除く）。

---

## 2. 削除 / stub 化ファイルの扱い（FB-UI-02-1）

本タスクで**削除されるコードブロック**は `sync-sheets-to-d1.ts` の `UPSERT_COLUMNS` / `ROW_FIELD_ORDER`（存在しない列定義・Phase 8 §2.2）、
および `sheets-to-members.ts` の旧 `MemberRow` 出力型（`SheetSeedRow` へ置換）。

| 対象 | 削除方式 | PASS 基準 |
|------|----------|-----------|
| `UPSERT_COLUMNS` / `ROW_FIELD_ORDER`（存在しない列）| **git delete**（行ごと除去）| 実装後 `grep -rn "UPSERT_COLUMNS\|ROW_FIELD_ORDER" apps/api/src` が **0 件** |
| 旧 `MemberRow` 型（個別フィールド出力）| git delete or 移行（`SheetSeedRow` へ）| 旧型への **live import 0**（`grep -rn "MemberRow" apps/api/src packages` が残存 0 / または使用箇所が `SheetSeedRow` に全置換）|

> 「export {} stub + live import 0」方式は本タスクでは不要（ファイル丸ごと削除はなく、ブロック/型の置換のため git delete で足りる）。
> ただし型を export している場合に下流参照が残るなら、参照を `SheetSeedRow` へ移行し旧型 export を物理削除する（dangling 0）。

---

## 3. 不変条件 gate（CLAUDE.md / SSOT §5）

| gate | 観点 | コマンド / 判定 | PASS 基準 |
|------|------|-----------------|-----------|
| **HEX 直書き 0**（Lane D・不変条件 #5 / AC-9）| `apps/web` の色は OKLch トークンのみ | `mise exec -- pnpm verify:tokens`（`scripts/verify-design-tokens.ts`）| 新規 `MemberFieldEditor.tsx` 等で HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件 |
| **`*.test.*` 不在**（CLAUDE.md #8）| 新規 test は `*.spec.{ts,tsx}` のみ | `git diff --name-only dev...HEAD \| grep -E '\.test\.(ts\|tsx)$'` | ヒット 0 件（lefthook `block-test-suffix` / CI `verify-test-suffix` 相当）|
| **web → D1 直接アクセス 0**（不変条件 #5 / AC-8）| `apps/web` から D1 binding 禁止 | `mise exec -- pnpm lint`（`scripts/lint-boundaries.mjs` が境界を検査）/ 補助 `grep -rn "DB\.\|D1Database\|\.prepare(" apps/web/src apps/web/app` | lint-boundaries PASS / web に D1 直アクセス 0（新規 read は `fetchAuthed`/`safeServerFetch` 経由）|
| **admin form input = FormField**（不変条件 #9）| `apps/web/src/components/admin/` で `<input>` 直書き禁止 | `grep -rn "<input" apps/web/src/components/admin/MemberFieldEditor.tsx` | 0 件（`FormField` 経由）|
| **admin mutation = useAdminMutation**（不変条件 #10）| legacy `@/lib/useAdminMutation` 新規参照禁止 | `grep -rn "@/lib/useAdminMutation" apps/web` の新規追加 | 新規 0（`@/features/admin/hooks/useAdminMutation` 使用）|
| **consent キー統一**（不変条件 #2/#3）| `publicConsent` / `rulesConsent`・`responseEmail` は system field | spec / 実装の stableKey 使用箇所目視 + stablekey lint | `lint:stablekey:strict` PASS |
| **migration 採番衝突 0**（CORR-6）| `0028_member_field_overrides.sql` が一意 | `mise exec -- pnpm verify:d1-migrations`（`scripts/verify-d1-migration-sequence.mjs`）| 0028 衝突なし |
| **stableKey リテラル直書き禁止**（lint）| stableKey は `STABLE_KEY.*` 経由 | `mise exec -- pnpm lint:stablekey:strict` | PASS |

---

## 4. typecheck / lint / vitest 総合 PASS 条件

| 検証 | コマンド | PASS 基準 |
|------|----------|-----------|
| 型 | `mise exec -- pnpm typecheck` | exit 0（全 workspace）|
| lint | `mise exec -- pnpm lint` | exit 0（boundaries / deps / stablekey / no-inline-style / `-r lint` すべて）|
| API vitest | Phase 7 §3.1 + §3.2 のコマンド | 対象 spec 全 PASS・`field-precedence` branch 100% |
| packages vitest | Phase 7 §3.3 | `mapper.spec.ts` PASS（2 ラベル解決）|
| web vitest | Phase 7 §3.4（`--root ../..` 必須）| 対象 spec 全 PASS |
| token gate | `mise exec -- pnpm verify:tokens` | HEX 0 |
| migration 採番 | `mise exec -- pnpm verify:d1-migrations` | 0028 一意 |

### 4.1 一括 DoD コマンド列（SSOT §10 を本タスク対象に具体化）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# API（unit）
cd apps/api && mise exec -- pnpm vitest run --config=../../vitest.config.ts --root=../.. \
  src/use-cases/_shared/field-precedence.spec.ts \
  src/repository/memberFieldOverrides.spec.ts \
  src/jobs/mappers/sheets-to-members.spec.ts \
  src/use-cases/public/list-public-members.spec.ts \
  src/use-cases/public/get-public-member-profile.spec.ts \
  src/repository/_shared/builder.spec.ts \
  src/routes/admin/member-fields.contract.spec.ts \
  src/routes/me/index.contract.spec.ts \
  src/middleware/session-guard.spec.ts
# API（D1 contract）
cd apps/api && mise exec -- pnpm vitest run --config=../../vitest.d1.config.ts --root=../.. \
  src/jobs/sync-sheets-to-d1.spec.ts \
  src/jobs/sync-forms-responses.spec.ts \
  src/repository/identities.spec.ts
# packages
cd packages/integrations/google && mise exec -- pnpm vitest run --config=../../../vitest.config.ts --root=../../.. \
  src/forms/mapper.spec.ts
# web（--root ../.. 必須）
cd apps/web && mise exec -- pnpm vitest run --config=../../vitest.config.ts --root=../.. \
  'app/(member)/profile' \
  src/components/admin/MemberFieldEditor.spec.tsx
# gate
mise exec -- pnpm verify:tokens
mise exec -- pnpm verify:d1-migrations
mise exec -- pnpm lint:stablekey:strict
```

> glob disjoint 制約（`vitest.config.ts` ↔ `vitest.d1.config.ts` の include は重複禁止・root config 実測 L57）に従い、
> D1 fixture を使う spec のみ d1 config 側へ配置する。配置先は実装時に spec の依存（in-memory か D1）で決める。

---

## 5. データ整合 QA（実機・user-gated / migration apply 後）

migration apply / staging 実機は user-gated（SSOT §10/§11）。spec では SELECT による検証クエリを固定する。

| 検証 | SQL / 観点 | PASS 基準 |
|------|-----------|-----------|
| テーブル新設 | `SELECT name FROM sqlite_master WHERE type='table' AND name='member_field_overrides';` | 1 行 |
| provenance 列 | `PRAGMA table_info(member_identities);` | `seed_source` / `seed_imported_at` 存在 |
| AC-1（Sheets seed が response_fields に書かれる）| seed 後 `SELECT stable_key FROM response_fields WHERE response_id = ?;` | 既知 stableKey が並ぶ（unmapped 0）|
| AC-2（consent 正規化）| seed 後 `SELECT public_consent FROM member_status WHERE member_id = ?;` | `consented` |
| AC-3（import-once）| 既存 member の email を含む Sheet 再 seed → skip ログ | 既存行が変化しない / `seed_imported_at` 不変 |
| AC-5（override 最優先・再同期耐性）| override PUT 後に Form 再回答 sync → `SELECT value_json FROM member_field_overrides WHERE member_id=? AND stable_key=?;` | override 値が維持される（消えない・DEC-4）|

---

## 6. QA 判定サマリ（実装時に埋める）

| カテゴリ | PASS / FAIL | 備考 |
|----------|-------------|------|
| ドキュメント（line/link/mirror）| _実装/PR 時_ | phase12-compliance ok:true |
| 削除/stub（dangling 0）| _実装時_ | UPSERT_COLUMNS / MemberRow 残存 0 |
| 不変条件 gate（HEX/test-suffix/D1境界/FormField/mutation/採番）| _実装時_ | 全 gate 0/PASS |
| typecheck / lint | _実装時_ | exit 0 |
| vitest（api/packages/web）| _実装時_ | 全 PASS・field-precedence branch 100% |
| データ整合（実機）| _user-gated_ | migration apply 後に SELECT 検証 |
