# Phase 3 — 設計レビュー

> Phase 1(要件)・Phase 2(設計)を、責務境界 / D1 境界 / 冪等性 / テスト判別 / 網羅性 / secret の 6 観点でレビューし、Phase 4 進行可否を判定する。

## 1. レビュー観点

| 観点 | 問い |
|------|------|
| **責務境界** | catalog(定義) / build(生成) / 適用 CLI(投入) / mint(E2E ログイン) が分離され、結合点が公開シグネチャと manifest JSON 形に限定されているか |
| **D1 境界** | D1 直接アクセスが apps/api・scripts に閉じ、apps/web/playwright が manifest JSON のみ参照するか(不変条件 #5) |
| **冪等性** | seed の N 回適用で件数不変・cleanup → seed → cleanup で決定論的に推移し、生成物が byte 単位で再現可能か |
| **テスト判別** | `TEST-` prefix / `.invalid` ドメイン / `seed:test-accounts` actor の 3 層で seed 行を一意判別でき、cleanup が実データを誤削除しないか |
| **網羅性** | ログイン可 7 / 不可 3、公開掲載 5 のマトリクスが gateReason 4値・publish 全状態・付帯データ有無を網羅するか |
| **secret** | カタログ・生成物・manifest に secret 実値が混入せず、mint 出力が log/git に漏れないか |

## 2. 判定

| # | 観点 | 判定 | 根拠 |
|---|------|------|------|
| 1 | 責務境界 | **PASS** | Phase 2 §1/§2 で catalog/build/CLI/mint を 4 責務に分離。Lane 間結合点は `buildSeedSql` シグネチャと manifest JSON 形の 2 点のみで、両者を Phase 2 §3 で固定済み |
| 2 | D1 境界 | **PASS** | seed/カタログ/ジェネレータ/drift spec/適用 CLI が apps/api・scripts に閉じる。`mint-test-account-storage-state.ts` は manifest JSON(memberId/email/role/loginable)のみ読み D1 binding 非接触(不変条件 #5 遵守) |
| 3 | 冪等性 | **PASS** | `INSERT OR REPLACE` / `INSERT OR IGNORE` のみ・`BEGIN..COMMIT` で原子的・timestamp は固定値(`datetime('now')` 不使用)・manifest は `JSON.stringify(,,2)`+末尾改行で決定論化。AC-5/AC-7 が件数不変と byte 一致を検証 |
| 4 | テスト判別 | **PASS** | 3 層規約(prefix/`.invalid`/actor)で判別。cleanup は最も限定的な WHERE + 末尾残件0 SELECT(AC-6)。実会員データは prefix を持たないため対象外 |
| 5 | 網羅性 | **PASS** | ログイン不可 3 件が gateReason `rules_declined`(04)/`deleted`(05)/`unknown`(08) を各1網羅、publish が public/member_only/hidden を網羅、付帯データが photo(admin/self)/tags(0〜全カテゴリ)/attendance(0〜3)/長文エッジ(10) を網羅(AC-2/AC-3) |
| 6 | secret | **PASS** | カタログ/生成物/manifest は public な id/email/状態のみ。secret は env(`STAGING_AUTH_SECRET` 等)から mint 時のみ読み、cookie/token を stdout/log 非出力・出力を `.auth/`(gitignore)へ |

> 全 6 観点 PASS。要修正項目なし。下記 R-1〜R-4 を Phase 4 以降の必須検証として引き継ぐ。

## 3. リスクと対策

| ID | リスク | 対策 |
|----|--------|------|
| **R-1** | cleanup が実会員データを誤削除する | 対象限定 **3 層規約**(`member_id/response_id/session_id LIKE 'TEST-%'` ∨ `email LIKE '%@test.ubm-hyogo.invalid'` ∨ `actor='seed:test-accounts'`)を全 DELETE の WHERE に強制。`build-seed-sql.spec.ts` で「無条件 DELETE(WHERE 句なし)が生成されない」ことを assert し、`test-accounts-seed.contract.spec.ts` で seed → cleanup 後の `TEST-%` 残件0 を検証(AC-6) |
| **R-2** | カタログと committed 生成物がドリフトする | `build-seed-sql.ts` を純粋関数化し、`scripts/gen-test-accounts-seed.mjs` を唯一の再生成経路とする。**drift guard spec**(`test-accounts-seed.contract.spec.ts`)が `buildSeedSql(catalog)` を再実行して committed 3 ファイルと byte 一致(`===`)を assert(AC-7)。`verify-pr-ready.sh` の indexes drift gate と同じ思想 |
| **R-3** | 公開 member detail が `response_fields` を参照し、未投入だと空 detail になる | 公開掲載 5 件(`TEST-MEM-01,06,07,09,10`)の各 `response_id` に `response_fields(response_id, stable_key, value_json)` を投入(最低 `fullName`)。`test-accounts-seed.contract.spec.ts` で 5 件の response_fields 行存在を assert(AC-9) |
| **R-4** | production へ誤って seed を適用する | `scripts/seed-test-accounts.sh` が `--env production` / `--env prod` を受理した時点で exit code 非0 で即時拒否し、`wrangler` / `scripts/cf.sh` を呼ばずに終了。`--env local` / `--env staging` のみ通す(AC-10)。DoD #6 に手順記載・実行は user-gated |

### 補足リスク(低・対策済)

| リスク | 対策 |
|--------|------|
| mint が secret を log に出す | 先例 `mint-staging-storage-state.ts` の「env 名のみ参照・cookie/token 非ログ・出力非コミット」を踏襲 |
| `members` VIEW を壊す INSERT | `members` は VIEW のため INSERT 対象外。`current_response_id` を `TEST-RES-NN` に設定し VIEW 経由参照を保証(Phase 2 §4) |
| `*.test.ts` 命名混入 | 全 spec を `*.spec.ts` に固定(不変条件 #2)。lefthook `block-test-suffix` / CI `verify-test-suffix` が二重検出 |

## 4. Phase 4 へ進む判定

- レビュー結果: **GO**
- 全 6 観点 PASS・要修正項目 0・R-1〜R-4 は対策確定済みで Phase 4 のテスト設計に引き継ぐ。
- 次フェーズ: Phase 4(テスト作成) — `catalog.spec.ts`(不変条件)/`build-seed-sql.spec.ts`(生成構造・無条件 DELETE 不在・manifest)/`test-accounts-seed.contract.spec.ts`(drift byte 一致・in-memory D1 ゲーティング 7/3/5・冪等性・response_fields・残件0)を AC-1〜AC-10 に対応付けて設計する。
