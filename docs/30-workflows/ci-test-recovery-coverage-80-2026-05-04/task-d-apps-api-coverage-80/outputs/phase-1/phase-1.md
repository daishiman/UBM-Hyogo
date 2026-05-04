# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Task D（apps/api coverage ≥80% 達成）の AC を確定し、Task B 完了後の baseline coverage を実測した上で、未達ファイル群を 4 lane（route / use-case / repository / middleware）に分類して後続 Phase へ引き渡す。

## Step 0: P50 チェック（必須）

```bash
git log --oneline -- apps/api/src | head -20
rg --files apps/api/src --type ts | wc -l
rg --files apps/api/src --type ts | grep -c "\.test\.ts$"
ls apps/api/coverage/ 2>&1 || echo "coverage dir not yet generated (Task B 完了後に生成)"
```

期待: ソース 239 件・既存 test 104 件規模、Task B 完了後は `apps/api/coverage/coverage-summary.json` が存在する。

## Phase 1 必須先行アクション（GO 条件確定）

1. **Task B 完了確認**:
   ```bash
   ls docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-*/outputs/phase-11/ 2>&1
   gh pr list --search "ci-recover-task-b" --state merged --limit 5
   ```
   Task B PR が merged かつ `outputs/phase-11/` に test 全件 pass の evidence がある場合のみ GO。

2. **baseline coverage 取得**:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 | tee outputs/phase-1/api-coverage-baseline.log
   cp apps/api/coverage/coverage-summary.json outputs/phase-1/coverage-baseline.json
   ```

3. **未達ファイル抽出**:
   ```bash
   jq -r '
     to_entries
     | map(select(.key != "total"))
     | map(select(
         .value.lines.pct < 80 or
         .value.branches.pct < 80 or
         .value.functions.pct < 80 or
         .value.statements.pct < 80
       ))
     | .[] | "\(.key)\t\(.value.lines.pct)\t\(.value.branches.pct)\t\(.value.functions.pct)\t\(.value.statements.pct)"
   ' outputs/phase-1/coverage-baseline.json | tee outputs/phase-1/uncovered-files.tsv
   ```

4. **lane 分類**:
   `outputs/phase-1/uncovered-files.tsv` を以下 4 lane にラベル付けし `outputs/phase-1/uncovered-by-lane.md` に集計する。
   - **route lane**: `apps/api/src/routes/**` 配下
   - **use-case lane**: `apps/api/src/use-cases/**` 配下
   - **repository lane**: `apps/api/src/repository/**` 配下
   - **middleware lane**: `apps/api/src/middleware/**` 配下
   - **その他 lane**: `_shared/` `utils/` `view-models/` `workflows/` `services/` `jobs/` `sync/` （件数次第で適切な lane に統合 or 専用 lane 化）

5. **Issue #320 系 4 ファイル現状確認**:
   ```bash
   for f in get-form-preview list-public-members get-public-stats get-public-member-profile; do
     jq --arg f "$f" '
       to_entries | map(select(.key | contains($f)))
       | .[] | { file: .key, lines: .value.lines.pct, branches: .value.branches.pct }
     ' outputs/phase-1/coverage-baseline.json
   done | tee outputs/phase-1/issue-320-baseline.md
   ```

## Acceptance Criteria

- **AC-1**: `apps/api/coverage/coverage-summary.json#total` の Lines / Branches / Functions / Statements が **すべて ≥80%** に到達する
- **AC-2**: Issue #320 系 4 use-case（`get-form-preview` / `list-public-members` / `get-public-stats` / `get-public-member-profile`）と対応 route handler（`apps/api/src/routes/public/*.ts`）が個別 metric ≥80%
- **AC-3**: `bash scripts/coverage-guard.sh --package apps/api` exit 0
- **AC-4**: 既存テスト regression 0（Task B 完了時の test 件数 ± 新規追加分のみ。skip / xtest の混入禁止）
- **AC-5**: D1 binding 依存 repository test は int-test-skill の Mock provider pattern を使用（`apps/api/src/repository/__fixtures__/d1mock.ts` または `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` を再利用）
- **AC-6**: Hono route handler test は `app.fetch(new Request(...))` で in-process integration test を行い、本物の D1 binding を Miniflare 経由で注入
- **AC-7**: 80% 到達不能ファイルが発生した場合、`apps/api/vitest.config.ts` の `coverage.exclude` に追加し、理由を `outputs/phase-12/unassigned-task-detection.md` に CONST_007 形式で記録（後送り PR を作らない）

## 不変条件

- CLAUDE.md 不変条件 #5（D1 access apps/api 限定）/ #6（GAS prototype 不昇格）/ #1（form schema を fixture でハードコードしすぎない）を継承
- `apps/web` から `apps/api` の D1 binding に直接触るテストは禁止
- 既存 `apps/api/migrations/*.sql` を変更しない（test 用 schema は migrations を loader で再利用）

## Gate 重複明記（T-6 AC-5 / Issue #161 対応）

| Phase | gate 表現 |
| --- | --- |
| Phase 1（前提条件） | Task B 完了で `coverage-summary.json` 生成可能 + 13 件 failure 解消 |
| Phase 2（依存順序） | Task B 未完了時 Phase 4 着手禁止（baseline 取れない） |
| Phase 3（NO-GO 条件） | Task B 未完了 / baseline で apps/api total < 50% など過剰未達 / D1 binding が test runtime で取得不能 |

## 統合テスト連携

- Task B の `outputs/phase-11/` から regression check 結果を継承
- 本タスク完了後、親 wave `ci-test-recovery-coverage-80-2026-05-04` の Phase 11 集約 evidence と Task E（hard gate 化）に直接接続

## 多角的チェック観点（AI が判断）

- Issue #320 系 4 ファイルの未達理由が「branch coverage 不足」か「entire untested」かを区別する
- repository lane の D1 mock pattern が int-test-skill 推奨形と乖離していないか
- middleware lane の auth gate test が `getCookie` / `c.req.header('authorization')` の両系統を網羅できているか

## サブタスク管理

- [ ] Task B 完了確認
- [ ] api-coverage-baseline.log 取得
- [ ] coverage-baseline.json 保存
- [ ] uncovered-files.tsv 抽出
- [ ] uncovered-by-lane.md 集計（4 lane + その他）
- [ ] issue-320-baseline.md 作成
- [ ] go-no-go-decision.md 作成

## 成果物

- `outputs/phase-1/api-coverage-baseline.log`
- `outputs/phase-1/coverage-baseline.json`
- `outputs/phase-1/uncovered-files.tsv`
- `outputs/phase-1/uncovered-by-lane.md`
- `outputs/phase-1/issue-320-baseline.md`
- `outputs/phase-1/go-no-go-decision.md`

## 完了条件

- [ ] AC-1〜AC-7 が文書化されている
- [ ] Task B 完了が確認できている（または NO-GO 記録）
- [ ] coverage-baseline.json を取得し未達ファイル一覧が 4 lane に分類されている
- [ ] coverage Statements / Branches / Functions / Lines のいずれかが <80% であることを baseline で記録（補強対象が確定している）

## タスク 100% 実行確認【必須】

- [ ] AC × 7 すべて記載
- [ ] Gate 重複明記 3 箇所
- [ ] NO-GO 条件記載
- [ ] artifacts.json.metadata.visualEvidence = NON_VISUAL を index.md と同期確認

## 次 Phase

Phase 2（設計）。GO 判定後のみ進行。
