# Phase 9 成果物: 品質保証

> 本成果物は `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/phase-09.md` を
> 正本とする。本ファイルは確定事項の要約であり、仕様の差分が生じた場合は phase-09.md を優先する。

## 確定事項の要約

- 最終 QA は QA チェックリスト Q-1〜Q-9 で実施し、AC-1〜AC-6 の充足を判定する。
- 「ファイル削除」を PASS 基準にしない（FB-UI-02-1）。Q-5 は逆に**単数 helper を削除していないこと**を確認する。

## QA チェックリスト

| # | 項目 | 検証 | PASS 基準 |
| --- | --- | --- | --- |
| Q-1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| Q-2 | lint | `mise exec -- pnpm lint` | exit 0 |
| Q-3 | 対象 vitest | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/__tests__/responseFields.repository.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 2 spec 全 PASS |
| Q-4 | 不変条件 #5（apps/web 非接触） | `git diff --name-only origin/dev...HEAD \| grep -c '^apps/web/'` | 0 件 |
| Q-5 | 単数 helper 温存 | `grep -rn "listFieldsByResponseId\b" apps/api/src` | 単数定義 + caller 残存（削除を基準にしない） |
| Q-6 | fields クエリ ≦ 1（AC-3） | query 回数アサーション | member N 件でも fields query 1 回（空時 0） |
| Q-7 | 出力形状不変（AC-4） | 既存 use-case テスト緑 | view 出力の値・形状が Before 一致 |
| Q-8 | スコープ外不変（AC-5） | `git diff --name-only origin/dev...HEAD` | tags/schema/endpoint/Google Form 差分なし |
| Q-9 | `as never` 全廃 | `grep -n "as never" apps/api/src/use-cases/public/list-public-members.ts` | 0 件 |

## AC ↔ QA 対応

| AC | 対応 QA |
| --- | --- |
| AC-1 helper 追加 | Q-5 / Q-3 |
| AC-2 Map(key=response_id) groupBy | Q-3 / Q-7 |
| AC-3 fields クエリ ≦ 1 回帰 | Q-6 |
| AC-4 出力不変 | Q-7 |
| AC-5 スコープ外不変 | Q-4 / Q-8 |
| AC-6 typecheck/lint/vitest 緑 | Q-1 / Q-2 / Q-3 |
