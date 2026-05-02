# Phase 7 outputs: AC マトリクスサマリ

Phase 7 で確定した AC × evidence × 不変条件 × Phase の 5 軸マトリクス。詳細は `phase-07.md` を参照。

## AC マトリクス（要約）

| AC | 検証手段 | evidence | 不変条件 | Phase |
| --- | --- | --- | --- | --- |
| AC-1 | env.ts 存在 + typecheck | file-existence.log / typecheck.log | #5 | 5 (T1) / 8 / 11 |
| AC-2 | wrangler.toml ↔ Env コメント照合 | binding-mapping-check.log | #5 | 5 (T1) / 11 |
| AC-3 | typecheck + 02c unit test 全 pass | typecheck.log / test.log | #5 | 5 (T2) / 6 / 8 / 11 |
| AC-4 | implementation-guide.md 追記 確認 | guide-diff.txt | #5 / #1 | 5 (T3) / 12 / 11 |
| AC-5 | apps/web boundary lint exit non-zero | boundary-lint-negative.log | #5 | 5 (T4) / 6 / 9 / 11 |
| AC-6 | gate-final 3 コマンド全 pass | typecheck.log / lint.log / test.log | #5 | 5 / 8 / 11 |
| AC-7 | secret hygiene grep ゼロ hit | secret-hygiene.log | #5 | 5 / 9 / 11 |

## 不変条件カバレッジ

| 不変条件 | evidence 数 | 充足 |
| --- | --- | --- |
| #5 D1 直接アクセスは apps/api に閉じる | 7 | OK |
| #1 schema 構造を型に持ち込まない | 1 | OK |

## evidence ファイル 8 件

1. `file-existence.log`
2. `typecheck.log`
3. `lint.log`
4. `test.log`
5. `boundary-lint-negative.log`
6. `binding-mapping-check.log`
7. `guide-diff.txt`
8. `secret-hygiene.log`

すべて `outputs/phase-11/evidence/` 配下に配置予定。

## Phase 8 への引き継ぎ

- gate-final の 3 コマンド（typecheck / lint / test）を CI 通過条件として固定
- boundary lint negative test を Phase 9 で実行
- evidence 8 件を Phase 11 で取得
