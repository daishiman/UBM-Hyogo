# Phase 9: SSOT 反映（aiworkflow-requirements `schema-alias-backfill-runbook.md` / indexes）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |
| 変更対象 | `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md`（新規 or 編集）, `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（編集） |

## 目的
50k stress trial 導線を aiworkflow-requirements skill の正本仕様に組み込み、後続タスク（cursor semantics 採用判断 follow-up 等）から参照可能にする。

## 実行タスク
1. `references/schema-alias-backfill-runbook.md` の有無を確認。なければ新規作成、あれば「50k extended fixture stress trial」セクションを追記。
2. 追記内容:
   - 50k fixture の synthetic data ポリシー
   - production への bulk INSERT permanent ban
   - 10 trials の evidence schema（5 フィールド）
   - 親 workflow Phase 11 evidence へのリンク（`docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md`）
3. `indexes/keywords.json` に新 reference を追加（keyword: `schema alias back-fill 50k`, `extended fixture stress trial`）。
4. `pnpm indexes:rebuild` 実行で drift 解消。
5. CI `verify-indexes-up-to-date` gate を local で確認（`.github/workflows/verify-indexes.yml` 相当の検証）。

## 統合テスト連携
Phase 12 の `phase12-task-spec-compliance-check.md` で SSOT 反映の有無を確認。

## 参照資料
- `.claude/skills/aiworkflow-requirements/`
- `.claude/skills/aiworkflow-requirements/indexes/`

## 成果物
- `.claude/skills/aiworkflow-requirements/references/schema-alias-backfill-runbook.md`（更新）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（更新）
- `outputs/phase-9/phase-9.md`

## 完了条件
- `references/schema-alias-backfill-runbook.md` に 50k stress trial セクションが存在。
- `indexes/keywords.json` の keyword 検索で本タスクの reference が hit。
- `pnpm indexes:rebuild` 後、CI verify-indexes-up-to-date が local で PASS。
