# Phase 9 — 品質保証

> 本フェーズは実装プロンプトが実コードを書いた後に実行すべき検証コマンドと合格基準を確定する。
> 本タスクは NON_VISUAL であり、品質ゲートは型・lint・生成物 drift・seed spec（in-memory D1 投入後のゲーティング期待値）で構成する。

---

## 1. 検証コマンド

```bash
# 型チェック（全 workspace）
mise exec -- pnpm typecheck

# lint（全 workspace）
mise exec -- pnpm lint

# 生成物 drift チェック（再生成して committed と byte 一致か検証。--check は書き出さず差分のみ判定）
node --import tsx scripts/gen-test-accounts-seed.mjs --check

# seed 関連 vitest（catalog 不変条件 / build 出力 / drift guard / in-memory D1 ゲーティング）
pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/testing/test-accounts \
  apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts \
  --config=vitest.d1.config.ts

# PR pre-flight（phase12-compliance / gate-metadata / indexes drift の一括検証）
bash scripts/verify-pr-ready.sh
```

> `--config=vitest.d1.config.ts` は in-memory D1（`setupD1`）を使う seed 適用テストに必須。これを付けないと D1 binding が無く AC-5 / AC-6 のゲーティング検証が走らない。
> `node --import tsx scripts/gen-test-accounts-seed.mjs`（`--check` なし）は実際に 3 生成物を書き出す。CI / pre-flight では `--check` で **書き出さずに drift だけ判定**し、committed 版を権威とする。

---

## 2. 品質ゲート

| 項目 | 合格基準 | 対応 AC |
|------|----------|---------|
| typecheck | error 0（catalog / build-seed-sql / index / spec / mint 補助すべて型解決） | AC-1 |
| lint | violation 0（`pnpm lint` 経由。新規ファイルに lint error / warning なし） | — |
| 生成物 drift | `gen-test-accounts-seed.mjs --check` が exit 0。再生成した `test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json` が committed 版と **byte 一致** | AC-7 |
| catalog 不変条件 spec | `catalog.spec.ts` 全 PASS。members 10 / admins 3 / meetings 3、ID 重複なし、loginable 7 件 / publicListed 5 件 / admin active 2 件 | AC-1, AC-2, AC-3, AC-8 |
| build 出力 spec | `build-seed-sql.spec.ts` 全 PASS。seedSql が `BEGIN TRANSACTION;` 開始 `COMMIT;` 終了、素の `INSERT INTO` を含まず `INSERT OR REPLACE` / `INSERT OR IGNORE` のみ、manifest が規定 shape | AC-4, AC-8 |
| seed 適用 / 冪等 / cleanup spec | `test-accounts-seed.contract.spec.ts` 全 PASS。in-memory D1 へ seedSql 2 回適用で `TEST-%` 行件数不変（identities 10 / responses 10 / status 10 / admin 3 / meeting 3）、cleanup 後に全対象テーブル 0 件、公開掲載 5 件の `response_fields` に `fullName` 存在 | AC-5, AC-6, AC-9 |
| production 防御 | `seed-test-accounts.sh --env production`（`--env prod`）が exit 非 0・D1 無変更（手順記載。実行は user-gated） | AC-10 |
| HEX 直書き | **該当なし**（NON_VISUAL・色トークン非接触。`verify-design-tokens` は apps/web の UI ファイルを対象とし、本タスクの追加ファイル（apps/api / scripts / playwright scripts）は色を持たない） | — |
| シークレット非混入 | mint 補助の出力（storage-state / token）が stdout / log に出ず `.gitignore` 配下へ書き出される。`STAGING_AUTH_SECRET` 等は env 経由のみで生成器・カタログにハードコードされていない | 不変条件 #5 |

---

## 3. mirror parity

**該当なし。**

理由: mirror parity（`.agents/skills` ↔ `.claude/skills` の symlink ミラー一致検証）は skill 同期ワークフローの検証項目である。本タスクは skill mirror を一切編集せず、追加対象は apps/api / scripts / apps/web/playwright / migrations/seed の実装ファイルと本 workflow spec のみで、skill ディレクトリ配下を変更しない。よって mirror parity 検証は対象外。生成物の同期性は §2 の「生成物 drift」（再生成 byte 一致）で担保しており、これが本タスクにおける parity の実体である。

---

## 4. ゲート判定（実装プロンプト確認用）

- [ ] §1 の 5 コマンドがすべて green（typecheck 0 / lint 0 / drift 0 / seed spec 全 PASS / verify-pr-ready 通過）
- [ ] §2 の各ゲートが対応 AC とともに満たされている
- [ ] HEX 直書き・mirror parity が該当なしであること（NON_VISUAL・非 skill）の確認
