# Phase 6 — テスト拡充

Phase 4 の基本ケースに加え、回帰検出力を高めるための fail path / edge / セキュリティ系ケースを追補する。「外部入力（不正な値・特殊文字・production 環境）」を与え「内部状態（拒否・正しい格納・0 件維持）」を assert する。

## 1. 追加ケース（fail path / 回帰 guard）

| ID | 対象 spec | 入力（外部） | 期待（内部状態） |
|----|-----------|-------------|-----------------|
| TC-EXT-01 | test-accounts-seed.contract.spec.ts | cleanup を 2 回連続 `execAll` | 1 回目で全テスト行 0、2 回目適用後も 0 を維持（cleanup 冪等） |
| TC-EXT-02 | test-accounts-seed.contract.spec.ts | seed→cleanup→seed→cleanup を 1 サイクルとして 2 サイクル実行 | 各 seed 後に identity 10 件、各 cleanup 後に 0 件（往復冪等。中間状態の取りこぼしなし） |
| TC-EXT-03 | catalog.spec.ts | 全 member の `tags[]` の各 code | すべて既知 `tag_definitions.code` 集合に含まれる（未知 tagId 参照 0。tag master 汚染防止）。集合は spec 内に 41 code をハードコードして突合 |
| TC-EXT-04 | build-seed-sql.spec.ts | `seedSql` から全 `answers_json` リテラルを抽出し `'` 復元 | 全 10 件が `JSON.parse` 成功（valid JSON）。MEM-10 の絵文字・シングルクォート含む値も parse 後に元の `fullName` と一致 |
| TC-EXT-05 | build-seed-sql.spec.ts | `manifest.accounts` の各要素 | `loginable===true` の account は member の場合 `rulesConsent==="consented" && isDeleted===0`、admin の場合 `active===1` と整合。`public===true` は member かつ掲載 3 条件成立とのみ一致（admin は常に false） |
| TC-EXT-06 | build-seed-sql.spec.ts（CLI 単体テスト or shell 検証） | `seed-test-accounts.sh --env production` 相当の env 分岐ロジック | exit code 2（production 拒否）。`--env local` / `--env staging` は 0、未知 env / 引数なしは 2。※shell は bats 不採用のため、env 判定部分を spec から `child_process` で起動するか、判定関数を `.mjs` に切り出して unit 検証 |
| TC-EXT-07 | build-seed-sql.spec.ts | MEM-10 の `fullName`（`山田'太郎😀…`、シングルクォート含む）を seed→in-memory D1 投入後に `member_responses` から SELECT | `answers_json` を JSON.parse した `fullName` が元の値と完全一致（escape が SQL injection にならず、`''` 二重化で正しく格納）。投入後に追加行が増えていない（injection で別 INSERT が発火しない） |
| TC-EXT-08 | test-accounts-seed.contract.spec.ts | seed 適用後、`member_photos WHERE member_id LIKE 'TEST-MEM-%'` | photo 持ち 4 件（MEM-01,03,09,10）。MEM-09 のみ `source='self'` ∧ `processing_status='completed'` ∧ `thumb_object_key` 非 NULL。他 3 件は `source='admin'` |
| TC-EXT-09 | test-accounts-seed.contract.spec.ts | seed 適用後、`member_status WHERE member_id='TEST-MEM-07'` | `public_consent='consented'` ∧ `member_tags` 6 件（6 カテゴリ）。`notification_opt_out` 相当（answers 由来 or 専用列）が opt-out を表す（タグ多数・通知オプトアウトの回帰固定） |
| TC-EXT-10 | test-accounts-seed.contract.spec.ts | seed 適用後、drift guard を `member_identities.response_email` の UNIQUE 制約付きで再 seed | 2 回目 seed が `INSERT OR REPLACE` のため UNIQUE 違反で throw せず、件数 10 を維持（email UNIQUE と冪等性の両立） |
| TC-EXT-11 | catalog.spec.ts | 全 member の `email` から id 部分（`test-mem-NN`）と `memberId`（`TEST-MEM-NN`）の NN | 各 member で email の連番と memberId の連番が一致（01..10。命名ずれの回帰検出） |

> 追加ケース数: 11（タスク要求の最低 8 を満たす）。

## 2. fail-closed / セキュリティ観点

- **production 拒否（TC-EXT-06）**: CLI の env 判定は副作用前（D1 接続前）に行い、`production` で必ず exit 2。回帰時に本番投入事故を防ぐ最重要 guard。
- **SQL injection 不発（TC-EXT-07）**: `sqlStr` の `'` 二重化が唯一の escape 経路。MEM-10 を「攻撃的入力」の代理として使い、投入後の総行数が期待どおり（余分な INSERT が発火しない）ことを assert する。
- **mint の loginable 制限**: `mint-test-account-storage-state.ts` は `loginable===false`（MEM-04/05/08）で throw する。この分岐は mint spec（任意・apps/web 側）か、本 Phase では manifest の `loginable` フラグ整合（TC-EXT-05）で間接的に固定する。

## 3. snapshot 不採用

生成 SQL 全体の HTML/文字列 snapshot は、カタログの軽微な並び替えで巨大 diff になりノイズが大きいため不採用。代わりに「行数・prefix・冪等構文・JSON 妥当性・byte 一致 drift」の構造 assertion で固定する。byte 一致（TC-SEED-08）は生成物全体の完全固定として機能し、snapshot の役割を兼ねる。

## 4. 実行確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/testing/test-accounts/__tests__/catalog.spec.ts \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=../../vitest.d1.config.ts
```

3 spec の Phase 4 + Phase 6 全ケースが pass すること。
