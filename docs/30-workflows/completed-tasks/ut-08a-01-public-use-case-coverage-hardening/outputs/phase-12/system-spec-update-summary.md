# System Spec Update Summary — ut-08a-01-public-use-case-coverage-hardening

aiworkflow-requirements 正本仕様（`.claude/skills/aiworkflow-requirements/`）を UT-08A-01 implementation coverage hardening の実態に同期するための更新サマリー。Step 1（更新計画）/ Step 2A（planned wording 残存確認）/ Step 2B（実更新ログ）の 3 段で記録する。public/member/admin boundary と「apps/web から D1 直接アクセス禁止」の不変条件は変更しない。

## Step 1: 更新計画

| 対象ファイル | 更新内容 | 同期理由 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-08A-01 implementation-guide.md への直接参照追加、wave-1 boundary 文言を UT-08A-01 implementation 化に合わせて更新 | wave-2 docs-only 表記が実装完了の実態と乖離していたため |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | wave-2 行に UT-08A-01 workflow root を追加、状態を `Phase 1-12 completed / Phase 13 pending_user_approval` に更新、`schemaAliasAssign` timeout を focused-test と分離する旨を明記 | resource-map が wave-1 のみの記述だったため |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | UT-08A-01 を `implemented-local / implementation` として明記、wave-2 配下に canonical implementation root として追記、AC / 境界に public use-case + route focused test を反映 | task-workflow-active が UT-08A-01 を docs-only 扱いしていたため |
| `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` | UT-08A-01 行を `wave-2-parallel-coverage/` 配下から workflow root 直下へ移動、状態を `implemented-local / implementation` に昇格、Phase 12 strict 7-file 注記、Gate Boundary を「Upgrade gate is advanced by UT-08A-01」に書き換え | inventory が UT-08A-01 を `spec_created / docs-only` のままにしていたため |

## Step 2A: planned wording 残存確認

`.claude/skills/task-specification-creator/references/phase-template-phase12.md` 規定の planned wording 残存確認コマンドを実行:

```bash
rg -n "仕様策定のみ|実行予定|保留として記録" \
  docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' || echo "planned wording なし"
```

結果: `planned wording なし`。Step 2B での実更新は完了済で、planned wording は本タスクの phase-12 outputs 配下に残存していない。

## Step 2B: 実更新ログ

`git diff -- .claude/skills/aiworkflow-requirements/` から抽出した主要差分。実更新は完了済。

### 1. `indexes/quick-reference.md`

主要変更点:

- 「UT coverage 2026-05 wave」リファレンス表に新行追加:

  ```diff
  + | UT-08A-01 public API coverage hardening | `docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/outputs/phase-12/implementation-guide.md` |
  ```

- Boundary 段落を以下に書き換え:

  ```diff
  - Boundary: wave-1 is `implemented-local / test-fixture implementation / NON_VISUAL`; only `apps/api/src/jobs/__fixtures__/d1-fake.ts` is changed. Runtime production code, apps/web, packages/*, commit, push, and PR creation remain blocked until Phase 13 user approval. The 85% upgrade gate remains delegated to UT-08A-01.
  + Boundary: wave-1 is `implemented-local / test-fixture implementation / NON_VISUAL`; only `apps/api/src/jobs/__fixtures__/d1-fake.ts` is changed. UT-08A-01 is `implemented-local / implementation / NON_VISUAL` and changes apps/api focused tests only (`apps/api/src/use-cases/public/__tests__/`, `apps/api/src/routes/public/index.test.ts`). Runtime production code, apps/web, packages/*, commit, push, and PR creation remain blocked until Phase 13 user approval. The 85% upgrade gate is advanced by UT-08A-01, while full apps/api coverage remains separated from pre-existing `schemaAliasAssign` timeout risk.
  ```

### 2. `indexes/resource-map.md`

主要変更点:

- wave-2 集約行のキーを 3 タスクルート連結に拡張し、UT-08A-01 を canonical workflow root として追加:

  ```diff
  - | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` + `docs/30-workflows/completed-tasks/ut-coverage-2026-05-wave/` | 2026-05-01 | wave-1 implemented-local / test-fixture implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | ... Upgrade gate (Statements/Functions/Lines >=85%, Branches >=80%) is delegated to UT-08A-01. ...
  + | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` + `docs/30-workflows/completed-tasks/ut-coverage-2026-05-wave/` + `docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/` | 2026-05-03 | wave-1 implemented-local ... ; UT-08A-01 implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | ... UT-08A-01 adds apps/api public use-case and public route focused tests only ... Upgrade gate is advanced by UT-08A-01; full apps/api coverage run may still hit pre-existing `schemaAliasAssign` timeout and is tracked as focused-test evidence, not production runtime evidence. ...
  ```

### 3. `references/task-workflow-active.md`

主要変更点:

- ステータス行に UT-08A-01 public API test implementation を追記:

  ```diff
  - | ステータス | implemented-local / test-fixture + admin component test implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
  + | ステータス | implemented-local / test-fixture + admin component + UT-08A-01 public API test implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
  ```

- wave-2 行に canonical implementation root を併記:

  ```diff
  - | wave-2 | `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/` |
  + | wave-2 | `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/`; UT-08A-01 canonical implementation root: `docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/` |
  ```

- 目的 / AC / 境界に UT-08A-01 を追記し、`ut-08a-01` gate（public use-case negative matrix、D1 failure、public route cache/auth boundary focused tests）を明記。`schemaAliasAssign` timeout は別系統リスクとして分離。

### 4. `references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`

主要変更点:

- UT-08A-01 行を wave-2 配下から workflow ルート直下へ移動し、状態を昇格:

  ```diff
  - | `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/` | spec_created / docs-only / NON_VISUAL / remaining-only | ... |
  + | `docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/` | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | public use-case + public route focused tests; Phase 11 NON_VISUAL measured evidence and Phase 12 strict 7 files |
  ```

- Phase 12 strict files 注記に UT-08A-01 を追記:

  ```diff
  - Wave-2 workflows use the same strict 7-file Phase 12 set. `ut-web-cov-01-admin-components-coverage` additionally records measured Phase 11 focused Vitest evidence ...
  + Wave-2 workflows use the same strict 7-file Phase 12 set. `ut-web-cov-01-admin-components-coverage` and `ut-08a-01-public-use-case-coverage-hardening` additionally record measured Phase 11 focused Vitest evidence ...
  ```

- Gate Boundary を「Upgrade gate is advanced by UT-08A-01」に書き換え、Implementation boundary に `apps/api test files only` を追加。

## 不変条件チェック

| 不変条件 | 影響 |
| --- | --- |
| public/member/admin boundary | 変更なし |
| apps/web から D1 直接アクセス禁止 | 変更なし（テスト追加は apps/api 内で完結） |
| GAS prototype を本番仕様に昇格させない | 変更なし |
| Google Form schema 外データの分離 | 変更なし |

## 完了判定

- Step 1 / Step 2A / Step 2B 全て記録済
- planned wording 残存 0 件
- 4 ファイルの実更新は `git status` でステージ可能な `M` 状態として確認済
