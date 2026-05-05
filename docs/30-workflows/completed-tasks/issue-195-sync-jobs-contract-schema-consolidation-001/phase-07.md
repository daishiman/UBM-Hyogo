# Phase 7: contract test 補強（不足時のみ） + database-schema.md 参照再確認

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | contract test 補強 + database-schema.md 参照再確認 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 6 (ADR 追記 + owner 表行追加 + 参照リンク追記) |
| 次 Phase | 8 (unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は条件付きで実体ファイル変更を伴う。Phase 5 棚卸し結果に基づき、不足が確定した契約テストのみ追加し、`database-schema.md` の `sync_jobs` 節は再確認のみを行う（既に整っていれば no-op）。

## 目的

AC-4「contract test の canonical 値網羅」と AC-5「`database-schema.md` の `_design/sync-jobs-spec.md` 参照統一」を満たす。

## 実行タスク

### A. contract test 補強（条件付き / コミット C2）

1. Phase 5 棚卸し結果（`outputs/phase-05/main.md`）を参照
2. 必須 4 項目（# 1 / # 2 / # 5 / # 7）について不足分があれば `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` に追加
3. 推奨項目で不足のものは同 describe ブロックに追加
4. `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` で全件 PASS を確認
5. 1 コミット（C2）にまとめる

### B. database-schema.md 再確認（条件付き / コミット C3）

1. `.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節を読み、`_design/sync-jobs-spec.md` 参照に統一されているか確認
2. 既に統一されていれば no-op、`outputs/phase-07/main.md` に grep 結果と「該当なし」を記録
3. 統一されていない箇所があれば最小差分で `_design/sync-jobs-spec.md` 参照に置換し、コミット C3 にまとめる

## 変更対象ファイル（条件付き）

| 種別 | パス | 条件 |
| --- | --- | --- |
| 編集 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | Phase 5 で必須 4 項目に不足あり |
| 編集 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節が `_design/` 参照に未統一 |

## contract test 追加テンプレート

```ts
// apps/api/src/jobs/_shared/sync-jobs-schema.test.ts に追加（不足項目のみ）

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

import 文は既存と重複しないよう注意（`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `assertNoPii` が import 済みでなければ追加）。

## database-schema.md 再確認手順

```bash
# 既存参照の確認
rg -n "sync_jobs" .claude/skills/aiworkflow-requirements/references/database-schema.md
rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md

# 期待: `_design/sync-jobs-spec.md` への 1-hop 参照が `sync_jobs` 節に含まれている
```

統一されていない場合の修正例:

```md
### sync_jobs

正本: [`docs/30-workflows/_design/sync-jobs-spec.md`](../../../../docs/30-workflows/_design/sync-jobs-spec.md)
（runtime SSOT は `apps/api/src/jobs/_shared/sync-jobs-schema.ts`）
```

## ローカル実行コマンド

```bash
# A. contract test
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test

# B. database-schema.md
rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md

# 既存テスト回帰
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1
```

## DoD

- [ ] AC-4 必須 4 項目が contract test で網羅されている（追加 or 既存）
- [ ] vitest 全件 PASS
- [ ] 既存テスト（`sync-forms-responses` / `sync-sheets-to-d1`）が回帰なし
- [ ] AC-5 `database-schema.md` の `sync_jobs` 節が `_design/sync-jobs-spec.md` 参照に統一（or no-op evidence）
- [ ] `outputs/phase-07/main.md` に追加 it 件数 / database-schema.md の no-op 判定が記録

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 編集（条件付き） | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | 不足契約テストの追加 |
| 編集（条件付き） | .claude/skills/aiworkflow-requirements/references/database-schema.md | `_design/` 参照統一 |
| ドキュメント | outputs/phase-07/main.md | 実装ログ / 追加 it 件数 / no-op 判定 |
| メタ | artifacts.json | Phase 7 を completed に更新（実行時） |

## 統合テスト連携

- vitest 単独実行で本 Phase 完結
- Phase 9 で全体 typecheck / lint / vitest 再実行、Phase 11 で evidence 化

## 完了条件

- [ ] vitest 全件 PASS
- [ ] AC-4 / AC-5 の verify suite が満たされる見込み
- [ ] 1 コミット（C2 / C3）にまとまっている（不要なら作成しない）

## 次 Phase

- 次: 8（unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認）
- 引き継ぎ事項: contract test 追加件数 / database-schema.md 編集有無
- ブロック条件: vitest fail / 既存テスト破壊

## 参照資料

- `apps/api/src/jobs/_shared/sync-jobs-schema.ts`
- `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 依存 Phase 参照

- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
