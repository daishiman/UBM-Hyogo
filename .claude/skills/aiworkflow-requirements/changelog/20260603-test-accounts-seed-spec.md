# 2026-06-03 test-accounts-seed-spec implementation sync

## Summary

`docs/30-workflows/test-accounts-seed-spec/` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として aiworkflow-requirements skill へ同期。10 member + 3 admin のテストアカウントを単一カタログ(SSOT)から決定論的に seed 生成する基盤の正本記述。`TEST-` prefix / `@test.ubm-hyogo.invalid` email / `seed:test-accounts` actor の 3 層判別規約により、テスト由来データを本番データと明確に分離する。

## Changed

- 新規 `lessons-learned/lessons-learned-test-accounts-seed-spec-2026-06.md`（L-TAS-001〜008）: 決定論 seed の SSOT は単一 `catalog.ts` に集約し SQL は生成物として committed + `--check` で drift guard / 判別は `TEST-` prefix・`@test.ubm-hyogo.invalid` email・`seed:test-accounts` actor の 3 層冗長化 / `buildInsert` + `sqlString` / `sqlJson` の汎用エスケーパで対象テーブルを `TEST_SEED_TABLES` const 駆動 / 適用 CLI `seed-test-accounts.sh` は production 環境を拒否（fail-closed）/ Playwright mint helper は `manifest.json` + `signSessionJwt` で storage-state を生成し D1 非接触（不変条件 #5 維持）/ tsconfig `allowImportingTsExtensions:true` で .ts 拡張子 import を許可 / `vitest.d1.config.ts` `D1_INCLUDE` への contract spec 追加 / cleanup は 3 層 prefix 削除で副作用を seed 範囲に限定。
- `references/lessons-learned.md` hub に上記 lessons へのエントリ行を追加。
- `references/workflow-test-accounts-seed-spec-artifact-inventory.md`（新規）に canonical / state / implemented targets / tests / verification boundary / `## Lessons Learned` 節を登録。
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` に test-accounts-seed-spec エントリを追加。
- `SKILL-changelog.md` / `SKILL.md` 本体の変更履歴テーブルに同期エントリを追加。`LOGS/_legacy.md` の最新更新ヘッドラインに 1 行 prepend。
- `indexes/topic-map.md` / `indexes/keywords.json` は `pnpm indexes:rebuild` で後段再生成。

## Implemented targets

- `catalog.ts`: テストアカウント SSOT（10 member + 3 admin の決定論カタログ）。
- `build-seed-sql.ts`: 汎用 `buildInsert` + 値エスケープ `sqlString` / `sqlJson` + 対象テーブル const `TEST_SEED_TABLES`。
- `gen-test-accounts-seed.mjs --check`: seed.sql / cleanup.sql / manifest.json 生成 CLI と committed 生成物との drift guard。
- committed 生成物: `seed.sql`（insert）/ `cleanup.sql`（3 層 prefix 削除）/ `manifest.json`（mint 用メタ）。
- `seed-test-accounts.sh`: 適用 CLI（production 環境拒否）。
- `mint-test-account-storage-state.ts`: Playwright mint helper（`manifest.json` + `signSessionJwt` で storage-state 生成・D1 非接触）。

## Invariants

新規 D1 schema / 新規 API endpoint / 新規 secret は無し。apps/web は `manifest.json` + JWT のみで認証状態を mint し D1 へ直接アクセスしない（不変条件 #5）。production への seed apply は CLI が拒否する。設定変更は tsconfig `allowImportingTsExtensions:true` と `vitest.d1.config.ts` `D1_INCLUDE` への contract spec 追加に限定。

## Evidence

- generator drift 0（`gen-test-accounts-seed.mjs --check` が committed 生成物と一致）。
- focused Vitest 3 files / 9 tests PASS。
- API typecheck PASS / Web typecheck PASS。
- API lint PASS / Web lint PASS。

## User-gated boundary

実 local / staging への seed apply、real target に対する storage-state generation、commit、push、PR は user-gated。上記 generator drift check / focused Vitest / typecheck / lint は本 wave で実行済み。
