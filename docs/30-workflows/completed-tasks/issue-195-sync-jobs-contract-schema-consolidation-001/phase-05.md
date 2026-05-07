# Phase 5: 既存 contract test カバレッジ棚卸し（不足ケース抽出）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 既存 contract test カバレッジ棚卸し |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 4 (verify suite 設計) |
| 次 Phase | 6 (ADR 追記 + owner 表行追加 + 参照リンク追記) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は既存テストの棚卸しのみで実体ファイルを変更しない。AC-4「contract test の canonical 値網羅」を満たすために必要な追加テストを抽出する。

## 目的

`apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` の既存テストケースを棚卸し、AC-4 の網羅項目（canonical `SYNC_JOB_TYPES` 値断言 / `SYNC_LOCK_TTL_MS === 600000` 値断言 / PII キー拒否 / email 形式値拒否）について不足分を抽出する。

## 必須網羅項目（AC-4）

| # | 項目 | テスト名（参考） | 必須/推奨 |
| --- | --- | --- | --- |
| 1 | `SYNC_JOB_TYPES` が `["schema_sync", "response_sync"]` と完全一致する | `it("SYNC_JOB_TYPES contains exactly schema_sync and response_sync", ...)` | 必須 |
| 2 | `SYNC_LOCK_TTL_MS === 600000`（10 分） | `it("SYNC_LOCK_TTL_MS equals 600000 (10 minutes)", ...)` | 必須 |
| 3 | `SYNC_LOCK_TTL_MINUTES === 10` | `it("SYNC_LOCK_TTL_MINUTES equals 10", ...)` | 推奨 |
| 4 | `metricsJsonBaseSchema.parse({ cursor: "..." })` 成功 | `it("metricsJsonBaseSchema accepts canonical metrics", ...)` | 推奨 |
| 5 | `assertNoPii({ email: "x@y" })` が throw する | `it("rejects email key in metrics_json", ...)` | 必須 |
| 6 | `assertNoPii({ name: "..." })` が throw する | `it("rejects name key in metrics_json", ...)` | 推奨 |
| 7 | `assertNoPii({ foo: "x@y.z" })` が email-shaped value で throw する | `it("rejects email-shaped string value", ...)` | 必須 |
| 8 | `parseMetricsJson(null, schema) === null` | `it("parseMetricsJson returns null for null input", ...)` | 推奨 |
| 9 | `parseMetricsJson("not json", schema) === null` | `it("parseMetricsJson returns null for invalid JSON", ...)` | 推奨 |
| 10 | `parseMetricsJson('{"cursor":1}', responseSyncMetricsSchema) === null` | `it("parseMetricsJson returns null when schema validation fails", ...)` | 推奨 |

## 棚卸し手順

```bash
# 既存テストの確認
rg -n "it\\(" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | tee outputs/phase-05/existing-it-blocks.log

# 必須網羅項目別の存在確認
rg -n "SYNC_JOB_TYPES" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
rg -n "SYNC_LOCK_TTL_MS\\|600000\\|600_000" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
rg -n "email\\|assertNoPii" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
rg -n "parseMetricsJson" apps/api/src/jobs/_shared/sync-jobs-schema.test.ts
```

棚卸し結果を `outputs/phase-05/main.md` に「項目 / 既存有無 / 該当 it 名 / 不足判定」の 4 列表で記録する。

## 不足ケースの追加方針（Phase 7 で実装）

不足が判定された必須項目（# 1 / # 2 / # 5 / # 7）について、Phase 7 で以下の方針で追加する:

```ts
// apps/api/src/jobs/_shared/sync-jobs-schema.test.ts に追加するテスト例

describe("canonical contract values (issue-195)", () => {
  it("SYNC_JOB_TYPES contains exactly schema_sync and response_sync", () => {
    expect([...SYNC_JOB_TYPES]).toEqual(["schema_sync", "response_sync"]);
  });

  it("SYNC_LOCK_TTL_MS equals 600000 (10 minutes)", () => {
    expect(SYNC_LOCK_TTL_MS).toBe(10 * 60 * 1000);
    expect(SYNC_LOCK_TTL_MS).toBe(600_000);
  });

  it("rejects email key in metrics_json", () => {
    expect(() => assertNoPii({ email: "x@example.com" })).toThrow(/PII forbidden key/);
  });

  it("rejects email-shaped string value in metrics_json", () => {
    expect(() => assertNoPii({ foo: "x@example.com" })).toThrow(/PII email-shaped value/);
  });
});
```

推奨項目で不足のものは Phase 7 で同 describe ブロックに追加。

## 推奨/必須いずれも既存で網羅していた場合

- AC-4 evidence は「既存テストで網羅済み」を grep ログ + vitest 実行ログで証明し、Phase 7 (a) は no-op となる
- `outputs/phase-05/main.md` に「追加テスト 0 件」と明記し、`outputs/phase-11/grep-test-*.log` でも同期確認

## ローカル実行コマンド

```bash
# 棚卸しは grep のみ。Phase 7 で実装した場合の最終確認:
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test
```

## DoD

- [ ] 必須 4 項目（# 1 / # 2 / # 5 / # 7）の既存有無が判定されている
- [ ] 推奨 6 項目の既存有無が判定されている
- [ ] 不足項目について Phase 7 で追加するか、no-op で AC-4 を満たすかが確定

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 既存テスト棚卸し / 不足ケース一覧 / Phase 7 追加方針 |
| evidence | outputs/phase-05/existing-it-blocks.log | 既存 `it(` 行の grep 結果 |
| メタ | artifacts.json | Phase 5 を completed に更新（実行時） |

## 統合テスト連携

- 棚卸しのみ。Phase 7 で追加実装、Phase 9 / 11 で実行・evidence 化

## 完了条件

- [ ] 必須項目の既存有無が確定
- [ ] Phase 7 追加方針が確定（追加 N 件 or no-op）

## 次 Phase

- 次: 6（ADR 追記 + owner 表行追加 + 参照リンク追記）
- 引き継ぎ事項: 不足ケース一覧 / 追加方針
- ブロック条件: 棚卸し結果が verify suite B-2〜B-4 と矛盾

## 実行タスク

- 既存 contract test の網羅性を確認する
- 不足する canonical 値 assertion を列挙する
- Phase 7 の補強対象を確定する

## 参照資料

- `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- `docs/30-workflows/_design/sync-jobs-spec.md`

## 依存 Phase 参照

- Phase 4: `outputs/phase-04/main.md`
