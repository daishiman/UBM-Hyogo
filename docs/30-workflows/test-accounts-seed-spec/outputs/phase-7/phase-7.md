# Phase 7 — カバレッジ確認

カバレッジ確認の対象を**新規 `apps/api/src/testing/test-accounts/` 配下と `apps/api/migrations/seed/test-accounts-*` 生成物に限定**する（リポジトリ全体の一律閾値ではない）。本タスクの本質は「SSOT から決定論的に派生する純粋ロジック（catalog 定数・build ジェネレータ）の完全網羅」であり、shell / node スクリプトは別カウントとして扱う。

## 1. カバレッジ対象範囲

| 対象 | 種別 | 期待カバレッジ |
|------|------|---------------|
| `apps/api/src/testing/test-accounts/catalog.ts` | pure 定数 + 型 | Statements / Lines 100%（定数定義のため到達容易）。実行コードがあれば Branches 100% |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | pure 関数 | Statements / Lines / Branches **100%**（escape 分岐 `'` 有無、`sqlNullable` の undefined 分岐、`isLoginable` / `isPublic` の各 boolean 分岐、photo 有無、deleted 有無、tags/attendance 空・非空の両側を catalog の 10 member が網羅） |
| `apps/api/src/testing/test-accounts/index.ts` | re-export | Statements 100%（import 経由で到達） |

### branch 100% を満たす根拠（catalog による網羅）

- `sqlNullable` の `undefined` 分岐: photo なし member（MEM-02,04,05,06,07,08）が NULL 側、photo あり member（MEM-01,03,09,10）が非 NULL 側を踏む。
- `isLoginable` の両側: loginable 7 / 非 loginable 3。
- `isPublic` の両側: 公開 5 / 非公開 5（declined / hidden / deleted / member_only を含む）。
- escape `'` 二重化: MEM-10 の `fullName` がクォート有り、他 9 件がクォート無し。
- tags / attendance 展開ループの 0 件・複数件: MEM-06（0 件）と MEM-07（6 tags / 3 attendance）。
- deleted_members 出力分岐: MEM-05（出力）と他（非出力）。

## 2. 確認コマンド

```bash
# pure ロジック（catalog / build / index）— unit config
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage \
  --coverage.include="apps/api/src/testing/test-accounts/**/*.ts" \
  src/testing/test-accounts/__tests__/catalog.spec.ts \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts

# D1 投入・drift guard — d1 config
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=../../vitest.d1.config.ts
```

`--coverage.include` で対象を `test-accounts/` 配下に絞り、対象 2 ソース（catalog.ts / build-seed-sql.ts）が 100% であることを出力で目視確認する。

## 3. カバレッジ対象外（別カウント）

| 対象 | 理由 |
|------|------|
| `scripts/seed-test-accounts.sh` | shell スクリプト。vitest の line coverage 対象外。production 拒否 / local / staging の分岐は Phase 6 TC-EXT-06（`child_process` 起動 or 判定関数の切り出し unit）で別途検証 |
| `scripts/gen-test-accounts-seed.mjs` | node スクリプト（書き出し I/O）。実行系は drift guard（TC-SEED-08 byte 一致 / `--check` exit code）で機能保証し、行カバレッジは計上しない |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | playwright 補助。apps/web 側 e2e/unit の別カウント。本タスクの apps/api カバレッジには含めない。`mintTestAccountStorageState` の env 欠落 / unknown account / non-loginable 拒否分岐は apps/web 側 spec で担保 |
| `apps/api/migrations/seed/test-accounts-seed.sql` 等 生成物 | SQL データファイル。コードではないため line coverage 対象外。投入後の行数 / ゲーティング / 冪等は D1 spec（TC-SEED-01..10）で機能保証 |

## 4. 変更行の保護確認方針

- 本タスクは新規ファイル追加が中心で、既存ソースの編集は `apps/api/package.json` / root `package.json` の scripts 追加のみ（実行不能なメタ変更）。
- 新規 pure ロジック（catalog.ts / build-seed-sql.ts）は上記コマンドで 100% を確認。100% に満たない行が出た場合の対応:
  - 到達不能な防御分岐（理論上起き得ない `default`/`throw`）→ Phase 8 リファクタで削減、または `/* v8 ignore */` を最小範囲で付与し理由をコメント。
  - mock / ケース不足 → Phase 6 に戻りケース追加（catalog の網羅性で branch を踏ませる）。

## 5. ゲート（DoD 連動）

- [ ] `build-seed-sql.ts` の Statements / Lines / Branches = 100%
- [ ] `catalog.ts` の Statements / Lines = 100%
- [ ] D1 spec（TC-SEED-01..10）全 pass、drift guard（TC-SEED-08）byte 一致
- [ ] `node --import tsx scripts/gen-test-accounts-seed.mjs --check` が exit 0
- [ ] リポジトリ全体のカバレッジ閾値（既定値）を本タスク追加分が下げない（新規は高カバレッジのため低下リスクなし）
