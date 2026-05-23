# Phase 13: PR 作成

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 13 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. PR メタ情報

| 項目 | 値 |
|------|-----|
| base | `dev`（既定。production リリース時のみ `main`） |
| head | `feat/contract-stage-2`（候補。実 branch 名は作業時確定） |
| title 例 | `test(api): add Stage 2 cross-route contract test (2d)` |

---

## 2. PR 本文構造

```
## Summary
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` を新規追加し、2a/2b/2c の UI fixture と zod schema の同型性を CI で機械検証する
- 既存 route 3 ファイル（`requests.ts` / `audit.ts` / `member-delete.ts`）に named export 微修正を加える（既存呼び出し非破壊）
- pure unit、副作用なし、DB / Network / binding に触らない

## Why
- 2a/2b/2c の Playwright fixture と本番 API zod schema の drift を CI で検知する補完層
- drift があれば mock では通る環境で本番 API が 422/400 を返す事故を防ぐ

## 変更ファイル
- 新規: `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（200-260 行、7 describe）
- 微修正:
  - `apps/api/src/routes/admin/member-delete.ts`（`DeleteBodyZ` を named export 化）
  - `apps/api/src/routes/admin/requests.ts`（末尾に `export { ListQueryZ as ListRequestsQueryZ }`）
  - `apps/api/src/routes/admin/audit.ts`（末尾に `export { QueryZ as ListAuditQueryZ }`）
- ドキュメント: `docs/30-workflows/task-spec-2d-contract-stage-2/`（index + Phase 1-13）

## 不変条件適合
- 既存 API endpoint surface のみ参照（新 endpoint 追加 0）
- D1 schema 変更 0 / Google Form 変更 0
- 2d test 内 `z.object(` 0 件（CONST_007）
- skip 0 件
- `apps/web` 依存 0
- `DeleteBodyZ` の packages/shared 昇格は別 PR

## Evidence
- `outputs/phase-11/vitest-contract-stage-2.txt`（7 describe / 21 tests pass）
- `outputs/phase-11/typecheck.txt`（exit 0）
- `outputs/phase-11/lint.txt`（exit 0）
- `outputs/phase-11/grep-gate.txt`（z.object 0 / skip 0）

## Test plan
- [x] `pnpm exec vitest run apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts --config=vitest.config.ts --root=.` 7 describe / 21 tests green
- [x] `pnpm --filter @ubm-hyogo/api typecheck` exit 0
- [x] `pnpm lint` exit 0
- [x] grep gate: `z.object(` 0 件、`*.skip` 0 件
```

---

## 3. PR チェックリスト

| # | 項目 | 状態 |
|---|------|------|
| 1 | base は `dev` | ready |
| 2 | DoD 13 件すべて PASS | PASS |
| 3 | 不変条件 8 件すべて PASS | PASS |
| 4 | Phase 11 evidence 4 ファイルが PR 本文 Evidence 節に列挙されている | ready |
| 5 | 2a/2b/2c 仕様書側の fixture 整合（merge response の `archivedSourceMemberId` 含む）を Phase 12 で通知済 | PASS |
| 6 | screenshot は NON_VISUAL のため 0 件（PR 本文に screenshot 節を作らない） | PASS |
| 7 | `git diff dev...HEAD --name-only` で漏れなく PR に含まれている | pending_user_approval |

---

## 4. 作成コマンド例

```bash
gh pr create --base dev --title "test(api): add Stage 2 cross-route contract test (2d)" --body "$(cat <<'EOF'
（§2 PR 本文）
EOF
)"
```

---

## 5. PR 作成後

| # | 確認 |
|---|------|
| 1 | CI で `apps/api` test job が pass |
| 2 | drift 検知の機械化が CI 上で機能（試しに 1 fixture 改変 → 2d red を観察するのは別検証） |
| 3 | 2a/2b/2c が並列で merge されたとき、本 test が drift を捕捉する設計が成立していることを reviewer comment 不要で示す |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| approval gate | pending_user_approval |

## 目的

PR 作成前の local check と change summary を残し、commit / push / PR 作成はユーザー明示承認後にだけ実行する。

## 実行タスク

1. `outputs/phase-13/local-check-result.md` に local check 結果を記録する。
2. `outputs/phase-13/change-summary.md` に変更範囲を記録する。
3. `outputs/phase-13/pr-info.md` に PR title / base / head / body draft を記録する。
4. ユーザー承認前は `outputs/phase-13/pr-creation-result.md` に blocked evidence を記録し、ユーザー承認後のみ実際の PR 作成結果で上書きする。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `outputs/phase-11/main.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`（承認前は blocked evidence、承認後のみ実 PR 作成結果）

## 完了条件

- [x] local check result が記録されている
- [x] change summary が記録されている
- [x] PR draft 情報が記録されている
- [x] commit / push / PR 作成をユーザー承認なしに実行していない
- [x] タスク100%実行確認: Phase 13 の readiness 実行タスクをすべて完了している。実 PR 操作はユーザー承認後のみ実行する
