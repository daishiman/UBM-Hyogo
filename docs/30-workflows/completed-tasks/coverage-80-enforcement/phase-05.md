# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | テストカバレッジ 80% 強制 (coverage-80-enforcement) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（T0 baseline / T1 vitest / T2 coverage-guard.sh / T3 package script / T4 CI soft / T5 テスト追加=別タスク / T6 lefthook / T7 hard gate / T8 正本同期） |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending（仕様化のみ完了 / 実 merge / 実 PR は Phase 13 ユーザー承認後の別オペレーション） |
| タスク種別 | implementation / NON_VISUAL / quality_governance |

## 目的

Phase 4 で固定した T1〜T10 を Green にするための **9 サブタスク（T0〜T8）実装ランブック** を仕様化する。各 T のファイル変更内容（設定値・行数感・YAML スケルトン）は本 Phase で文字情報として明示するが、**実コードファイル（`scripts/coverage-guard.sh` 等）は本 Phase / 本ワークフローでは作成しない**。実 merge / 実 PR 発行は Phase 13 ユーザー承認後の別オペレーションでのみ走る（user_approval_required: true）。

> **重要**: 本 Phase 冒頭で **jq バージョン確認 / mise exec 経由実行統一 / 3 段階 PR の merge 順序** を必須化する。違反した場合は実装着手不可（Phase 3 NO-GO 条件と整合）。

## 前提確認【実装着手前の必須ゲート】

実装担当者は **T0 に入る前に** 以下を確認する。1 件でも該当した場合は実装着手禁止 → Phase 3 NO-GO へ差し戻す。

```bash
# 必須・GET / version 確認のみ / 副作用なし
mise --version                                                # mise 導入済み
mise exec -- node --version                                   # v24 系
mise exec -- pnpm --version                                   # 10 系
mise exec -- jq --version                                     # 1.6+
git remote -v | rg origin                                     # origin 解決可
gh auth status                                                # gh CLI 認証済み
ls .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md
ls .claude/skills/task-specification-creator/references/coverage-standards.md
ls vitest.config.ts lefthook.yml .github/workflows/ci.yml
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| Node | 24.x（mise 経由） | 18 系 / 20 系（mise 未経由） |
| pnpm | 10.x | 8 / 9 系 |
| jq | 1.6+ | 1.5 以下（macOS デフォルト） |
| Phase 1〜4 status | `completed` | いずれかが `pending` |
| 既存 vitest.config.ts | 存在 | 不在（先に Vitest 導入が必要） |
| Phase 13 ユーザー承認 | 取得済み（実 merge / PR 時） | 未取得（T7 / T8 の merge 禁止） |

**1 件でも NO-GO → 実装着手禁止 → 本 Phase を pending に戻す。**

## 実行タスク

- タスク1: T0〜T8 の 9 サブタスクを 3 段階 PR（PR① / PR② / PR③）に割り当て、merge 順序を確定する。
- タスク2: 各 T のファイル変更内容（設定値・行数感・YAML スケルトン）を文字情報として明示する。
- タスク3: 各 T の完了条件（Phase 4 の T1〜T10 との対応）を表化する。
- タスク4: 実 merge / 実 PR は Phase 13 ユーザー承認後に限定する境界を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-04.md | T1〜T10（Green 条件） |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-02.md | トポロジ / coverage-guard.sh I/O 仕様 / vitest config / CI / lefthook / 3 段階 PR |
| 必須 | docs/30-workflows/coverage-80-enforcement/phase-03.md | 採用案 PASS / R-1〜R-4 |
| 必須 | .claude/skills/task-specification-creator/references/coverage-standards.md | Phase 6/7 検証テンプレ（T8 で更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md | 80%/65% 旧正本（T8 で更新対象） |
| 参考 | https://vitest.dev/guide/coverage | v8 provider 仕様 |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-05.md | 実装ランブックフォーマット参照 |

## 実装手順（9 サブタスク / 仕様レベル）

### T0: baseline 計測（PR① 着手前 / 副作用なし）

- 目的: 全 package の現状カバレッジ値を計測し、PR② で追加すべきテスト量を可視化する（AC-7 / AC-12）。
- 実装内容（仕様レベル）:
  - `mise exec -- pnpm install --frozen-lockfile` 後、`mise exec -- pnpm -r --workspace-concurrency=1 test:coverage` を **既存 vitest 設定のまま** 走らせる（vitest.config.ts は未変更）。
  - 各 package の `coverage/coverage-summary.json` を `jq` で集計し、package × metric（lines / branches / functions / statements）の現状値を `outputs/phase-11/coverage-baseline-summary.md` の表として記録（行数感: ヘッダ込み 30〜60 行）。
  - 同 summary に「PR② で追加すべき推定テスト数（不足 metric × 5 package）」を併記。
- ファイル変更: なし（計測結果記録のみ。記録先は Phase 11 outputs 配下を予約）。
- 完了条件: T1 の Red 状態が定量化され、Phase 11 / Phase 13 の PR① 説明文に反映可能な数値が出揃う。
- PR 割り当て: PR① の前段で実施（merge 不要 / 計測結果のみ commit）。

### T1: vitest.config.ts に coverage セクション追加（PR①）

- 目的: 全 package 一律 80% 閾値を vitest 設定で固定する（AC-1 / Phase 4 T2）。
- 実装内容（仕様レベル）:
  - `vitest.config.ts` の `defineConfig({ test: { ... } })` に `coverage` フィールドを追加（行数感: 約 35〜40 行追加）。
  - 設定値は Phase 2 §vitest.config.ts 更新仕様の TypeScript リテラルに従う:
    - `provider: 'v8'`
    - `reporter: ['text', 'json-summary', 'lcov', 'html']`
    - `reportsDirectory: './coverage'`
    - `thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 }`
    - `include`: `['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}']`
    - `exclude`: `['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/node_modules/**', '**/.next/**', '**/.open-next/**', '**/.wrangler/**', 'apps/web/src/app/**/{page,layout,loading,error,not-found}.tsx', 'apps/web/next.config.*', 'apps/web/middleware.ts', '**/wrangler.toml', '**/*.d.ts', '**/*.config.{ts,js,mjs,cjs}', '**/dist/**', '**/build/**']`
    - `perFile: false`
  - 既存 `test` セクション（include / exclude / setupFiles 等）には変更を加えない。
  - `package.json` の devDependencies に `@vitest/coverage-v8` を追加（バージョンは既存 `vitest` に合わせる）。
- ファイル変更: `vitest.config.ts`（編集 / +35〜40 行） / `package.json`（編集 / +1 行）。
- 完了条件: Phase 4 T2 の (1)(2)(3) すべてが Green。`mise exec -- pnpm test:coverage` でルート実行し `coverage/coverage-summary.json` が生成。
- PR 割り当て: PR①。

### T2: scripts/coverage-guard.sh の新設（PR①）

- 目的: package 別集計 + 未達検出 + Top10 + テスト雛形 stderr 出力 + exit code 制御（AC-2 / AC-3 / Phase 4 T1 / T7）。
- 実装内容（仕様レベル / 実コードは書かない）:
  - 新規ファイル `scripts/coverage-guard.sh`（行数感: 約 100〜130 行 / shebang `#!/usr/bin/env bash` + `set -euo pipefail`）。
  - 構成:
    1. **オプション解析**: `--changed` / `--package <name>` / `--threshold <num>` / `--help` を `getopts` または手書き while ループで処理（行数感 25 行）。
    2. **vitest 実行**: `--changed` 時は `git diff --name-only origin/main...HEAD` で touched package 推定 → `pnpm --filter <pkg> test:coverage`。フル時は `pnpm -r --workspace-concurrency=1 test:coverage`（行数感 20 行）。
    3. **集計**: `apps/*/coverage/coverage-summary.json` と `packages/*/coverage/coverage-summary.json` を for-loop で走査し、`jq -e '.total | (.lines.pct, .branches.pct, .functions.pct, .statements.pct)'` で 4 metrics を抽出（行数感 25 行）。
    4. **判定**: いずれか < threshold で `FAIL_FOUND=1` を立てる（行数感 10 行）。
    5. **不足ファイル列挙**: `coverage-final.json` を `jq '[to_entries[] | {file: .key, lines_pct: ((.value.l // {}) | (length as $L | (map(select(. > 0)) | length) / ($L|. // 1) * 100))}] | sort_by(.lines_pct) | .[:10]'` 相当で Top10 算出（行数感 25 行 / jq 1.6+ 前提）。
    6. **stderr 出力**: Phase 2 §出力（stderr）の「FAIL: <pkg> <metric>=<pct>%」「Top10 unsatisfied files」「suggested test: {src}/{file}.test.ts」「HINT: …」のフォーマットを忠実に出力（行数感 20 行）。
    7. **exit**: `FAIL_FOUND=1` → `exit 1` / jq 失敗 / vitest 失敗 → `exit 2` / 全 OK → `exit 0`（行数感 5 行）。
  - **環境変数**: `CI=true` 時は冗長 HINT を抑制し、ローカル時は HINT を full 出力。
  - **依存**: `jq`（1.6+） / `bash` / `git` / `mise` 経由 `node` / `pnpm`。
- ファイル変更: `scripts/coverage-guard.sh`（新規）。
- **本 Phase / 本ワークフローではこのファイルを作成しない**（仕様記述のみ）。実新設は Phase 13 ユーザー承認後の PR① で実施。
- 完了条件: Phase 4 T1（exit code 0/1/2 + stderr フォーマット + `--changed`）と T7（異常入力ハンドリング）がすべて Green。
- PR 割り当て: PR①。

### T3: 各 package script 統一（PR①）

- 目的: ルートと 5 package で `test` / `test:coverage` / `coverage:guard` を統一する（AC-4 / Phase 4 T3）。
- 実装内容（仕様レベル）:
  - 各 package（`apps/web` / `apps/api` / `packages/shared` / `packages/integrations` / `packages/integrations/google`）の `package.json` の `scripts` に以下を追加（既存 `test` script は上書き）:
    - `test`: Phase 2 §各 package script 統一仕様の `vitest run --root=../.. --config=../../vitest.config.ts <pkg-rel-path>` 形式
    - `test:coverage`: 上記 + `--coverage`
  - ルート `package.json` の `scripts` に追加:
    - `test:coverage`: `bash scripts/with-env.sh vitest run --coverage`
    - `coverage:guard`: `bash scripts/coverage-guard.sh`
  - 各 package の追加行数感: 2 行 × 5 package = 10 行 / ルート: 2 行。
- ファイル変更: 5 package × `package.json`（編集） / ルート `package.json`（編集）。
- 完了条件: Phase 4 T3 (1)(2)(3)(4) すべて Green。
- PR 割り当て: PR①。

### T4: CI workflow に coverage-gate job 追加（PR① soft / PR③ hard）

- 目的: CI gate を 2 段階で導入し、PR① では warning のみ、PR③ で hard gate 化（AC-5 / Phase 4 T4 / T6）。
- 実装内容（仕様レベル）:
  - `.github/workflows/ci.yml` に `coverage-gate` job を追加（行数感: 約 25〜30 行 YAML スケルトン）:
    - `runs-on: ubuntu-latest`
    - `needs: [setup]`（既存 setup job 名に合わせる）
    - **PR① 時**: `continue-on-error: true`（必須 / 鶏卵問題回避）
    - steps:
      1. `actions/checkout@v4`
      2. `jdx/mise-action@v2`
      3. `mise exec -- pnpm install --frozen-lockfile`
      4. `mise exec -- bash scripts/coverage-guard.sh`（env: `CI: 'true'`）
      5. `actions/upload-artifact@v4`（`if: always()` / name: `coverage-report` / paths: `apps/*/coverage/`, `packages/*/coverage/`, `packages/integrations/*/coverage/`）
      6. （任意）`codecov/codecov-action@v4`（`if: env.CODECOV_TOKEN != ''` / `fail_ci_if_error: false`）
  - **PR③ 時の差分**: `continue-on-error: true` を **削除** + branch protection の `required_status_checks.contexts` に `coverage-gate` 追加（UT-GOV-001 / UT-GOV-004 経由 / 別オペ）。
- ファイル変更: `.github/workflows/ci.yml`（編集 / PR① で +25〜30 行 / PR③ で -1 行）。
- 完了条件: Phase 4 T4（PR① soft）と T6（PR③ hard 切替）が Green。
- PR 割り当て: PR① で追加 / PR③ で hard 化。

### T5: 不足テスト追加（**別タスク化** / 参照のみ）

- 目的: PR② で各 package 80% 達成。**本ワークフローはテスト追加を実施しない**（テスト追加自体を別タスク = `coverage-80-test-additions/<package>/` 等として分割発行する設計）。
- 実装内容（仕様レベル / 参照のみ）:
  - PR② は **package×metric 単位の sub PR 群** として分割発行。
  - 各 sub PR のスコープ: `<package>` の不足 metric を 80% 到達まで埋めるテスト追加（`*.test.ts` / `*.int.test.ts`）。
  - 各 sub PR の Green 条件: `coverage-gate` の warning が当該 package について消える。
  - 推奨順序: dependencies の少ない package から（`packages/shared` → `packages/integrations` → `packages/integrations/google` → `apps/api` → `apps/web`）。
  - **本 Phase / 本ワークフローでは `*.test.ts` を 1 ファイルも作成しない**（参照のみ）。
- ファイル変更: なし（本ワークフローでは参照のみ）。
- 完了条件: Phase 4 T6 PR② 部の Green 条件が満たされる（別タスク側で確認）。
- PR 割り当て: PR②（別タスク発行 / 本ワークフロー外）。

### T6: lefthook pre-push 統合（PR③）

- 目的: ローカル push 前に coverage-guard を起動し未達なら block（AC-6 / Phase 4 T5）。
- 実装内容（仕様レベル）:
  - `lefthook.yml` に `pre-push` セクションを追加（既存 `pre-commit` 等は保持 / 行数感 +8 行）:
    - `pre-push.parallel: false`
    - `pre-push.commands.coverage-guard.run: bash scripts/coverage-guard.sh --changed`
    - `pre-push.commands.coverage-guard.stage_fixed: false`
    - `pre-push.commands.coverage-guard.skip: [merge, rebase]`
  - ルート `package.json` の `prepare` script に `lefthook install` が含まれることを再確認（既存 / 変更不要）。
  - **抜け道なし方針**: `--no-verify` での bypass は CI hard gate（T7）で必ず再 block される。`LEFTHOOK=0 git push` のみローカル skip 可能だが、CI で同等 check が走る。
- ファイル変更: `lefthook.yml`（編集 / +8 行）。
- 完了条件: Phase 4 T5（hook 起動 + skip / parallel 構成 + `--no-verify` 防御） が Green。
- PR 割り当て: PR③。

### T7: CI hard gate 化（PR③）

- 目的: CI を required gate 化し、80% 未満 PR の merge を構造的に block（AC-5 / AC-9 / Phase 4 T6 / T8）。
- 実装内容（仕様レベル）:
  - `.github/workflows/ci.yml` の `coverage-gate.continue-on-error: true` を **削除**（行数: -1 行 / `continue-on-error` キー自体を消す）。
  - branch protection 同期（**別オペ / UT-GOV-001 / UT-GOV-004 経由**）:
    - `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input <payload>` で `required_status_checks.contexts` に `coverage-gate` を追加した payload を投入。
    - 同じ操作を `main` ブランチに対しても実施（dev / main は **別コマンドで** 独立 PUT / bulk 化禁止）。
    - 本ワークフローでは PUT を実行しない。Phase 13 ユーザー承認後の別オペレーションで UT-GOV-001 ランブックに従って実施。
- ファイル変更: `.github/workflows/ci.yml`（編集 / -1 行）。
- 完了条件: Phase 4 T6 / T8 の Green 条件すべて達成。80% 未満 dummy 破壊 PR で merge button が disable になることを Phase 11 smoke で確認。
- PR 割り当て: PR③。

### T8: 正本同期（PR③）

- 目的: aiworkflow-requirements / coverage-standards / codecov.yml の旧閾値を全 package 一律 80% に同期（AC-10 / AC-11 / Phase 4 T10）。
- 実装内容（仕様レベル）:
  - `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`（編集）: 旧 desktop=80% / shared=65% 表を全 package 一律 80% に書き換え（行数感: 表 1 つ ±10 行）。
  - `.claude/skills/task-specification-creator/references/coverage-standards.md`（編集）: 「Phase 6/7 で `bash scripts/coverage-guard.sh` を実行する」旨と stderr 出力フォーマット参照を追記（行数感: +20 行）。
  - `codecov.yml`（編集 / 任意）: `coverage.status.project.target` と `coverage.status.patch.target` を共に 80% に統一（行数感: 2 行修正）。
  - Phase 12 system-spec-update-summary.md に差分要約を集約。
- ファイル変更: 上記 3 ファイル（編集）+ Phase 12 outputs（別 Phase）。
- 完了条件: Phase 4 T10 の Green 条件（旧閾値の出現が 0 件 / coverage-guard.sh 参照が追記済み / codecov.yml が同期済み）すべて達成。
- PR 割り当て: PR③。

## 3 段階 PR 段取りと merge 順序

| # | PR | 含むサブタスク | merge 前提条件 | merge 後の状態 |
| --- | --- | --- | --- | --- |
| 1 | PR① | T0 baseline + T1 vitest config + T2 coverage-guard.sh + T3 package script + T4 CI soft gate | 既存 typecheck / lint が green / `coverage-gate` は warning（continue-on-error: true）で許容 | CI に soft gate 設置 / ローカル `pnpm coverage:guard` 利用可 |
| 2 | PR② sub-N | T5 各 package 別テスト追加（別タスク発行） | 当該 package の `coverage-gate` warning が消える | 段階的に warning が消化される |
| 3 | PR③ | T6 lefthook + T7 hard gate + T8 正本同期 | 全 package で `coverage-gate` warning 0 / UT-GOV-001 / UT-GOV-004 完了 / Phase 11 smoke で破壊 PR block 確認済み | hard gate 稼働 / branch protection contexts 登録済み / 正本同期完了 |

> **merge 順序厳守**: PR① → PR②（複数 sub PR）→ PR③ の順。PR② を経ずに PR③ を merge すると hard gate 暴発で全 PR が block する（鶏卵問題の発火）。

## コミット粒度

| # | スコープ | メッセージ | レビュー観点 |
| --- | --- | --- | --- |
| 1 | T1 + T3 | `chore(test): add vitest coverage v8 config and unify package scripts (PR1 of 3)` | thresholds 80% × 4 metrics / exclude 網羅 / package script 5 件統一 |
| 2 | T2 | `feat(scripts): add coverage-guard.sh with top10 + test stub stderr output (PR1 of 3)` | exit code 0/1/2 / stderr フォーマット / `--changed` flag |
| 3 | T4 | `ci(quality): add coverage-gate soft job (continue-on-error) (PR1 of 3)` | continue-on-error: true / artifact upload / mise-action |
| 4 | T6 | `chore(quality): integrate coverage-guard into lefthook pre-push (PR3 of 3)` | parallel: false / skip merge,rebase / --changed |
| 5 | T7 | `ci(quality): switch coverage-gate to hard gate (remove continue-on-error) (PR3 of 3)` | continue-on-error 削除 / contexts 同期前提（別オペ） |
| 6 | T8 | `docs(skill): sync coverage 80% canonical sources (PR3 of 3)` | quality-requirements-advanced.md / coverage-standards.md / codecov.yml 三方向同期 |

## 検証コマンド（実装担当者向け / NOT EXECUTED）

```bash
# T0 baseline 完了後
test -f docs/30-workflows/coverage-80-enforcement/outputs/phase-11/coverage-baseline-summary.md

# T1 完了後（Phase 4 T2）
mise exec -- pnpm test:coverage
jq -e '.total.lines.pct' coverage/coverage-summary.json

# T2 完了後（Phase 4 T1 / T7）
test -x scripts/coverage-guard.sh
bash scripts/coverage-guard.sh --help

# T3 完了後（Phase 4 T3）
for p in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do
  jq -e '.scripts["test:coverage"]' "$p/package.json"
done

# T4 完了後（Phase 4 T4）
gh workflow view ci.yml | rg coverage-gate

# T6 完了後（Phase 4 T5）
mise exec -- lefthook run pre-push --files-from-stash || echo "expected red on under-coverage"

# T7 完了後（Phase 4 T6 / T8 / 別オペ実施後）
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_status_checks.contexts | index("coverage-gate")'

# T8 完了後（Phase 4 T10）
rg "65%|85%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md  # => 0 件
rg "coverage-guard.sh" .claude/skills/task-specification-creator/references/coverage-standards.md  # => 1 件以上
```

## 統合テスト連携

T1〜T10（Phase 4）を T0〜T8 の Green 条件として参照し、Phase 6 の異常系（10〜15 ケース）で fail path を追加検証する。Phase 11 smoke は T0 baseline / T6 lefthook / T7 hard gate 切替を実走、Phase 13 で 3 段階 PR の merge を最終確定する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-05/main.md | 9 サブタスク実装ランブック（NOT EXECUTED テンプレ） |
| 別オペ成果（参考） | scripts/coverage-guard.sh / vitest.config.ts diff / .github/workflows/ci.yml diff / lefthook.yml diff / 5 package.json diff / 正本同期差分 | 本ワークフローでは生成しない（Phase 13 ユーザー承認後に実装担当者が生成） |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] T0〜T8 の 9 サブタスクが `outputs/phase-05/main.md` に NOT EXECUTED テンプレで列挙されている
- [ ] 各 T のファイル変更内容（設定値・行数感・YAML スケルトン）が文字情報として明示されている
- [ ] 3 段階 PR（PR① / PR② / PR③）への割り当てと merge 順序が明記されている
- [ ] T2 の coverage-guard.sh が Phase 2 §I/O 仕様 / exit code 仕様 / stderr フォーマットを完全に踏襲する設計になっている
- [ ] T5（テスト追加）が別タスク化されている旨が明記されている
- [ ] T7 hard gate 化と T8 正本同期の前提として UT-GOV-001 / UT-GOV-004 完了が必要である旨が明記されている
- [ ] jq バージョン確認 / mise exec 経由実行統一が前提ゲートに組み込まれている
- [ ] 本ワークフローで実コードファイル（scripts/coverage-guard.sh 等）を作成しない旨が明示されている
- [ ] 各 T の完了条件（Phase 4 T1〜T10 との対応）が表化されている

## 苦戦防止メモ

1. **PR① で `continue-on-error: true` を絶対に外さない**: 鶏卵問題発火で全 PR block。T4 と T7 の差分管理を厳格化。
2. **dev / main は別コマンドで PUT**: T7 の branch protection 同期は UT-GOV-001 ランブック（dev / main 独立 PUT / bulk 化禁止）に準拠。
3. **`scripts/coverage-guard.sh` は `set -euo pipefail` 必須**: 異常入力でのサイレント exit 0 を防ぐ（Phase 4 T7 / Phase 6 異常系）。
4. **vitest exclude リストは Phase 11 baseline 後に再評価**: Edge runtime / OpenNext bundle で実質的なカバレッジが下がりすぎる場合は exclude を絞る再調整を Phase 11 で実施（Phase 3 R-1）。
5. **T8 の codecov.yml 同期は任意**: codecov 利用しない選択も可能。`patch.target` を `project.target` と同期しないと PR diff coverage が暴発する点だけ守る（苦戦想定 6）。
6. **本 Phase 自身は実コード作成しない**: 仕様化のみ。T0〜T8 の実走は Phase 13 ユーザー承認後の別オペレーション。

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 9 サブタスクの分離が異常系（summary 欠損 / OS 依存 / 切替忘却 / 二重正本 / 鶏卵 / 集計困難 / 遅延）の前提
  - T2 の coverage-guard.sh I/O 仕様が Phase 6 異常系の入力
  - T7 hard gate 化と T8 正本同期は Phase 13 ユーザー承認後（user_approval_required: true）
  - T5 テスト追加は別タスク化（本ワークフロー外）
- ブロック条件:
  - PR 割り当て / merge 順序が Phase 4 / Phase 13 と整合しない
  - T2 の coverage-guard.sh 設計が Phase 2 I/O 仕様から逸脱
  - jq バージョン確認 / mise exec 経由統一が前提ゲートから欠落
  - T5 が別タスク化されず本ワークフロー内でテスト追加を試みる
