# Phase 5 成果物 — 実装ランブック

## 1. ランブック概要

coverage-80-enforcement 採用案（全 package 一律 80% / 3 段階 PR / `scripts/coverage-guard.sh` 新設 / vitest v8 + lefthook + CI 二重防御）の **9 サブタスク（T0〜T8）ランブック** を定義する。T0（baseline）/ T1（vitest config）/ T2（coverage-guard.sh）/ T3（package script）/ T4（CI soft）/ T5（テスト追加=別タスク参照）/ T6（lefthook）/ T7（hard gate）/ T8（正本同期）の順序を厳守し、3 段階 PR（PR① → PR② → PR③）の merge 順を守る。実 merge / 実 PR 発行 / branch protection 同期は **Phase 13 ユーザー承認後** にのみ走る（user_approval_required: true）。本ファイルはコマンド系列・設定値・YAML スケルトンを記述するが**実コードファイルの作成は本ワークフローの範囲外**。

## 2. 状態（NOT EXECUTED テンプレ）

| サブタスク | 状態 | 副作用 | PR | Phase 13 承認 必須 |
| --- | --- | --- | --- | --- |
| T0 baseline 計測 | NOT EXECUTED | なし（計測のみ） | PR① 前段 | 不要 |
| T1 vitest.config.ts coverage 追加 | NOT EXECUTED | 設定変更 | PR① | 必須（merge 時） |
| T2 scripts/coverage-guard.sh 新設 | NOT EXECUTED | 新規ファイル | PR① | 必須 |
| T3 package script 統一 | NOT EXECUTED | 5 package + ルート編集 | PR① | 必須 |
| T4 CI coverage-gate (soft) | NOT EXECUTED | CI workflow 編集 | PR① | 必須 |
| T5 不足テスト追加 | 別タスク化 | 各 package src/* 追加 | PR②（別タスク群） | 別タスク側で必須 |
| T6 lefthook pre-push 統合 | NOT EXECUTED | hook 設定 | PR③ | 必須 |
| T7 CI hard gate 化 | NOT EXECUTED | continue-on-error 削除 + branch protection PUT（別オペ） | PR③ | 必須 |
| T8 正本同期 | NOT EXECUTED | 3 ファイル編集 | PR③ | 必須 |

## 3. 前提確認（必須ゲート）

```bash
mise --version
mise exec -- node --version       # v24
mise exec -- pnpm --version       # v10
mise exec -- jq --version         # 1.6+
git remote -v | rg origin
gh auth status
ls vitest.config.ts lefthook.yml .github/workflows/ci.yml
ls .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md
ls .claude/skills/task-specification-creator/references/coverage-standards.md
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| Node | 24.x（mise 経由） | mise 未経由 / 18 / 20 系 |
| pnpm | 10.x | 8 / 9 系 |
| jq | 1.6+ | macOS デフォルト 1.5 以下 |
| Phase 1〜4 | `completed` | `pending` 残存 |
| Phase 13 承認 | merge 時に取得済み | 未取得（merge 禁止） |

## 4. T0: baseline 計測（PR① 前段 / 副作用なし）

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm -r --workspace-concurrency=1 test:coverage   # 既存 vitest 設定のまま
# 各 package の coverage/coverage-summary.json を集計
for p in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do
  if [ -f "$p/coverage/coverage-summary.json" ]; then
    jq -r --arg p "$p" '.total | "\($p)\tlines=\(.lines.pct)\tbranches=\(.branches.pct)\tfunctions=\(.functions.pct)\tstatements=\(.statements.pct)"' "$p/coverage/coverage-summary.json"
  else
    echo "$p\tNO_SUMMARY"
  fi
done
```

- 出力先: `docs/30-workflows/coverage-80-enforcement/outputs/phase-11/coverage-baseline-summary.md`
- 完了条件: 5 package × 4 metrics の現状値が表化され、PR② で追加すべき推定テスト量が併記されている。

## 5. T1: vitest.config.ts に coverage セクション追加（PR①）

- 既存 `defineConfig({ test: { ... } })` の `test` セクションに **`coverage`** フィールドを追加（+35〜40 行）。
- 設定値（Phase 2 §vitest.config.ts 更新仕様準拠）:
  - `provider: 'v8'` / `reporter: ['text', 'json-summary', 'lcov', 'html']` / `reportsDirectory: './coverage'`
  - `thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 }`
  - `include: ['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}']`
  - `exclude`: test/spec / node_modules / .next / .open-next / .wrangler / Next.js page・layout・loading・error・not-found / next.config / middleware / wrangler.toml / *.d.ts / *.config.* / dist / build
  - `perFile: false`
- `package.json` devDependencies に `@vitest/coverage-v8`（既存 vitest と同じ major / minor）を追加。
- 検証: `mise exec -- pnpm test:coverage && jq -e '.total.lines.pct' coverage/coverage-summary.json`

## 6. T2: scripts/coverage-guard.sh 新設（PR①）

- 新規ファイル（行数感 100〜130 行 / shebang `#!/usr/bin/env bash` + `set -euo pipefail`）。
- 構成:
  1. オプション解析（`--changed` / `--package` / `--threshold` / `--help` / 25 行）
  2. vitest 実行（`--changed` 時は `git diff --name-only origin/main...HEAD` ベース / 20 行）
  3. summary 集計（`apps/*/coverage/coverage-summary.json` + `packages/*/coverage/coverage-summary.json` を for-loop / 25 行）
  4. 判定（4 metrics × N package を threshold と比較 / 10 行）
  5. 不足ファイル Top10（`coverage-final.json` を jq で line 単位 pct 算出後 sort_by + .[:10] / 25 行）
  6. stderr 出力（Phase 2 §出力フォーマット忠実 / 20 行）
  7. exit code（0 全 OK / 1 未達 / 2 環境エラー / 5 行）
- 環境変数: `CI=true` で HINT 抑制 / ローカルは full HINT。
- 依存: jq 1.6+ / bash / git / mise 経由 node・pnpm。
- **本ワークフロー / 本 Phase ではこのファイルを作成しない**（仕様記述のみ）。

## 7. T3: 各 package script 統一（PR①）

- 5 package の `package.json` `scripts` に `test` / `test:coverage` を Phase 2 §各 package script 統一仕様の形式で追加（既存 `test` は上書き）。各 +2 行 × 5 = 10 行。
- ルート `package.json` `scripts` に `test:coverage: bash scripts/with-env.sh vitest run --coverage` と `coverage:guard: bash scripts/coverage-guard.sh` を追加（+2 行）。
- 検証: `for p in apps/web apps/api packages/shared packages/integrations packages/integrations/google; do jq -e '.scripts["test:coverage"]' "$p/package.json"; done`

## 8. T4: CI coverage-gate job (soft) 追加（PR①）

`.github/workflows/ci.yml` に下記スケルトンを追加（+25〜30 行）:

```yaml
coverage-gate:
  runs-on: ubuntu-latest
  needs: [setup]
  continue-on-error: true   # ★ PR① では true / PR③ で削除
  steps:
    - uses: actions/checkout@v4
    - uses: jdx/mise-action@v2
    - run: mise exec -- pnpm install --frozen-lockfile
    - run: mise exec -- bash scripts/coverage-guard.sh
      env:
        CI: 'true'
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: coverage-report
        path: |
          apps/*/coverage/
          packages/*/coverage/
          packages/integrations/*/coverage/
    - name: Upload to Codecov (optional)
      if: env.CODECOV_TOKEN != ''
      uses: codecov/codecov-action@v4
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        fail_ci_if_error: false
```

- 検証: `gh workflow view ci.yml | rg coverage-gate`

## 9. T5: 不足テスト追加（別タスク化 / 参照のみ）

- **本ワークフローでは実施しない**。
- PR② を package×metric 単位の sub PR 群として別タスク発行。
- 推奨順序: `packages/shared` → `packages/integrations` → `packages/integrations/google` → `apps/api` → `apps/web`。
- 各 sub PR の Green 条件: 当該 package の `coverage-gate` warning が消える。

## 10. T6: lefthook pre-push 統合（PR③）

`lefthook.yml` に追加（+8 行）:

```yaml
pre-push:
  parallel: false
  commands:
    coverage-guard:
      run: bash scripts/coverage-guard.sh --changed
      stage_fixed: false
      skip:
        - merge
        - rebase
```

- ルート `package.json` の `prepare` に `lefthook install` が含まれていることを再確認（既存）。
- `--no-verify` 抜け道は CI hard gate（T7）で再 block される。`LEFTHOOK=0 git push` のみローカル skip 可能。

## 11. T7: CI hard gate 化（PR③）

- `.github/workflows/ci.yml` の `coverage-gate.continue-on-error: true` を **削除**（-1 行）。
- branch protection 同期（**別オペ / UT-GOV-001 ランブック準拠**）:

  ```bash
  # dev / main は別コマンドで独立 PUT（bulk 禁止）
  gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input <payload-with-coverage-gate>
  gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input <payload-with-coverage-gate>
  ```

- 本ワークフローでは PUT を実行しない。Phase 13 ユーザー承認後の別オペレーション（UT-GOV-001 / UT-GOV-004 経由）で実施。
- 検証: `gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_status_checks.contexts | index("coverage-gate")'`（非 null 期待）。

## 12. T8: 正本同期（PR③）

- `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`: 旧 desktop=80% / shared=65% 表を全 package 一律 80% に統一（±10 行）。
- `.claude/skills/task-specification-creator/references/coverage-standards.md`: `bash scripts/coverage-guard.sh` 参照と stderr フォーマットを追記（+20 行）。
- `codecov.yml`: `coverage.status.project.target` と `coverage.status.patch.target` を共に 80% に統一（2 行修正 / 任意）。
- Phase 12 system-spec-update-summary.md に差分要約を集約。
- 検証: `rg "65%|85%" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md`（0 件期待） / `rg "coverage-guard.sh" .claude/skills/task-specification-creator/references/coverage-standards.md`（1 件以上期待）。

## 13. 3 段階 PR 段取りと merge 順序

| # | PR | 含むサブタスク | merge 前提 | merge 後 |
| --- | --- | --- | --- | --- |
| 1 | PR① | T0 + T1 + T2 + T3 + T4 | 既存 typecheck / lint green / coverage-gate は warning 許容 | CI に soft gate 設置 |
| 2 | PR② sub-N | T5（別タスク） | 当該 package の warning 消化 | 段階的に warning 消化 |
| 3 | PR③ | T6 + T7 + T8 | 全 package warning 0 / UT-GOV-001 / UT-GOV-004 完了 / Phase 11 smoke 完了 | hard gate 稼働 / contexts 登録 / 正本同期 |

> **merge 順序厳守**: PR① → PR②（複数 sub PR）→ PR③。順序違反は鶏卵問題で全 PR が block。

## 14. コミット粒度

| # | スコープ | メッセージ案 |
| --- | --- | --- |
| 1 | T1 + T3 | `chore(test): add vitest coverage v8 config and unify package scripts (PR1 of 3)` |
| 2 | T2 | `feat(scripts): add coverage-guard.sh with top10 + test stub stderr output (PR1 of 3)` |
| 3 | T4 | `ci(quality): add coverage-gate soft job (continue-on-error) (PR1 of 3)` |
| 4 | T6 | `chore(quality): integrate coverage-guard into lefthook pre-push (PR3 of 3)` |
| 5 | T7 | `ci(quality): switch coverage-gate to hard gate (PR3 of 3)` |
| 6 | T8 | `docs(skill): sync coverage 80% canonical sources (PR3 of 3)` |

## 15. 引き渡し（Phase 6 へ）

- 9 サブタスク分離が Phase 6 異常系の前提
- T2 coverage-guard.sh I/O 仕様が異常系（summary 欠損 / OS 依存 / threshold 暴発）の入力
- T7 hard gate 化と T8 正本同期は Phase 13 ユーザー承認後（user_approval_required: true）
- T5 テスト追加は別タスク化（本ワークフロー外）/ Phase 11 smoke で sub PR 群の終了確認
