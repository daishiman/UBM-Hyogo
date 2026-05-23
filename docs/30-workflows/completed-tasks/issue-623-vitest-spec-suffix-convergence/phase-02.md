# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は `vitest.config.ts` 編集差分、`scripts/hooks/block-test-suffix.sh` の bash 実装、`.github/workflows/verify-test-suffix.yml` の workflow 実装、`lefthook.yml` 追記の 4 種類の実コード変更を設計する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (タスク分解) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した AC-1〜AC-8、159 件 rename、CI gate 二層化、coverage delta = ±0% 保証を、(a) rename 戦略 / (b) vitest.config 差分 / (c) lefthook script / (d) verify workflow / (e) ADR 更新方針 の 5 成果物として具体化する。Phase 4 以降の実装が「設計通りに `git mv` → 編集 → 追加 → 記録」を機械的に実行できる粒度まで落とす。

## 設計成果物一覧

| ID | 成果物 | 対応 AC |
| --- | --- | --- |
| D-1 | `outputs/phase-02/rename-strategy.md` | AC-1 / AC-7 |
| D-2 | `outputs/phase-02/vitest-config-diff.md` | AC-2 / AC-3 / AC-7 |
| D-3 | `outputs/phase-02/lefthook-script-design.md` | AC-4 / AC-5 |
| D-4 | `outputs/phase-02/verify-workflow-design.md` | AC-6 |
| D-5 | `outputs/phase-02/adr-update-plan.md` | AC-8 |

---

## D-1: rename 戦略

### 対象 159 件分布

| 領域 | 件数 | rename 方針 |
| --- | --- | --- |
| apps/web | 83 | `git mv apps/web/...test.ts(x)` を 1 commit にまとめる |
| apps/api | 6 | 同上 1 commit |
| packages/shared | 17 | packages 単位で 1 commit |
| packages/integrations | 11 | packages 単位で 1 commit |
| scripts | 35 | scripts 単位で 1 commit |
| .claude/skills | 7 | skills 単位で 1 commit、indexes 再生成を後続 commit に分離 |

### 一括 rename 補助スクリプト（実装は Phase 4）

```bash
# 仕様だけ。Phase 4 で scripts/migration/rename-test-to-spec.sh として実装予定。
# 役割: 指定 path 配下の *.test.ts(x) を git mv で *.spec.ts(x) に rename
# 入力: $1 = 対象 path（例: apps/web）
# 出力: rename 件数を stdout、対象一覧を stderr
# 終了コード: 0 = 成功 / 1 = git status dirty / 2 = path 不正
```

| 仕様項目 | 値 |
| --- | --- |
| 配置 | `scripts/migration/rename-test-to-spec.sh`（Phase 4 で新規。本タスク完了後は `scripts/migration/` 配下で永続保持しても良いし削除しても良い。Phase 12 で判断） |
| 引数 | `$1` = 対象ディレクトリ（必須）、`--dry-run` で list-only モード |
| 動作 | `find $1 -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*'` をループし `git mv` 実行 |
| 安全装置 | 実行前に `git status --porcelain` が空でない場合は exit 1 |
| 副作用 | `git mv` のみ。コンテンツ変更は一切行わない |

### import-path 影響評価

- `*.test.ts(x)` を import している箇所が存在する可能性は低い（test 同士で import するパターンは稀）が、Phase 4 で `grep -rE "from ['\"].+\.test['\"]?" apps packages scripts` を実施し、ヒットした場合は同一 commit 内で import path も spec へ書き換える
- `__tests__/__fixtures__/` 等の fixture は対象外（suffix `*.test.*` でないため変化なし）

### coverage delta 検証手順（AC-7）

```bash
# rename 前
mise exec -- pnpm test --run --reporter=json > /tmp/before.json
jq '.numTotalTests' /tmp/before.json

# rename + vitest.config 編集後
mise exec -- pnpm test --run --reporter=json > /tmp/after.json
jq '.numTotalTests' /tmp/after.json

# 一致確認
diff <(jq '.numTotalTests' /tmp/before.json) <(jq '.numTotalTests' /tmp/after.json)
```

期待: diff が空（exit 0）。

---

## D-2: vitest.config.ts 差分設計

### 編集対象

- ファイル: `vitest.config.ts`
- ブロック 1: `test.include` (現状 L42-48)
- ブロック 2: `test.coverage.exclude` (現状 L57-77)

### before / after

#### `test.include`

before:
```ts
include: [
  "apps/**/src/**/*.{test,spec}.{ts,tsx}",
  "apps/**/app/**/*.{test,spec}.{ts,tsx}",
  "apps/**/migrations/**/*.{test,spec}.ts",
  "packages/**/src/**/*.{test,spec}.{ts,tsx}",
  "scripts/**/*.{test,spec}.ts",
],
```

after:
```ts
include: [
  "apps/**/src/**/*.spec.{ts,tsx}",
  "apps/**/app/**/*.spec.{ts,tsx}",
  "apps/**/migrations/**/*.spec.ts",
  "packages/**/src/**/*.spec.{ts,tsx}",
  "scripts/**/*.spec.ts",
],
```

#### `coverage.exclude`

before（抜粋）:
```ts
exclude: [
  "**/*.test.{ts,tsx}",
  "**/*.spec.{ts,tsx}",
  "**/node_modules/**",
  // ... 以下省略
],
```

after（抜粋）:
```ts
exclude: [
  "**/*.spec.{ts,tsx}",
  "**/node_modules/**",
  // ... 以下省略
],
```

### 検証 grep

| 検証 | コマンド | 期待値 |
| --- | --- | --- |
| 二段階記法残存 | `grep -E '\{test,spec\}' vitest.config.ts` | 0 hit |
| test exclude 残存 | `grep -E '\*\.test\.\{ts,tsx\}' vitest.config.ts` | 0 hit |
| spec include 存在 | `grep -E '\*\.spec\.\{ts,tsx\}' vitest.config.ts` | 5 hit 以上 |

---

## D-3: lefthook script 設計

### `scripts/hooks/block-test-suffix.sh`

| 項目 | 値 |
| --- | --- |
| 配置 | `scripts/hooks/block-test-suffix.sh`（権限 0755） |
| シェバン | `#!/usr/bin/env bash` |
| `set` | `set -euo pipefail` |
| 役割 | git staged ファイルから `*.test.ts(x)` を検出し、1 件でも見つかれば exit 1 |
| 検出コマンド | `git diff --cached --name-only --diff-filter=AM` で staged 取得 → `grep -E '\.test\.(ts\|tsx)$'` |
| node_modules 除外 | `grep -v '/node_modules/'` で除外 |
| 例外パス | なし（リポジトリ全体に対して厳格適用） |
| 出力 | 検出時に reject 対象パスを 1 行ずつ stderr 出力 |
| 終了コード | 検出 0 件 → exit 0、検出あり → exit 1 |
| 並列性 | 既存 `staged-task-dir-guard` と独立。state 共有なし |

### `lefthook.yml` 追記差分

```yaml
pre-commit:
  parallel: true
  commands:
    main-branch-guard:
      run: bash scripts/hooks/main-branch-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 main / dev ブランチへの直接コミットは禁止されています。
    staged-task-dir-guard:
      run: bash scripts/hooks/staged-task-dir-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 ブランチと無関係なタスクディレクトリが含まれています。
    block-test-suffix:                              # ← 追加
      run: bash scripts/hooks/block-test-suffix.sh
      stage_fixed: false
      fail_text: |
        🚫 新規テストファイルは *.spec.{ts,tsx} のみ許可されています。
        該当ファイルを *.spec.ts(x) にリネームしてから commit してください。
```

### 動作確認（Phase 4 で実施）

```bash
git checkout -b test/verify-block-test-suffix
mkdir -p apps/api/src/__tests__
printf "import { describe, it } from 'vitest';\ndescribe('x', () => it('y', () => {}));\n" > apps/api/src/__tests__/dummy.test.ts
git add apps/api/src/__tests__/dummy.test.ts
git commit -m "test gate"
# 期待: pre-commit hook が exit 1 で reject
```

---

## D-4: GitHub Actions verify workflow 設計

### `.github/workflows/verify-test-suffix.yml`

| 項目 | 値 |
| --- | --- |
| 配置 | `.github/workflows/verify-test-suffix.yml` |
| name | `verify-test-suffix` |
| trigger | `push` (branches: `main`, `dev`) と `pull_request` (branches: `main`, `dev`) |
| permissions | `contents: read`（最小） |
| concurrency | `group: verify-test-suffix-${{ github.ref }}`、`cancel-in-progress: true` |
| runner | `ubuntu-latest` |
| steps | (1) `actions/checkout@v4` (2) `*.test.ts(x)` 検出 step |
| 検出 step | `find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -not -path './node_modules/*' -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.open-next/*'` の結果を変数化し、行数 > 0 で `exit 1` |
| 失敗時メッセージ | "Detected legacy *.test.ts(x) files. Use *.spec.{ts,tsx} only." + ファイル一覧 |
| 成功時メッセージ | "No legacy *.test.ts(x) files detected." |

### workflow 雛形（Phase 4 で実装）

```yaml
name: verify-test-suffix

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

permissions:
  contents: read

concurrency:
  group: verify-test-suffix-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Detect legacy *.test.ts(x) files
        run: |
          set -euo pipefail
          matches=$(find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) \
            -not -path '*/node_modules/*' \
            -not -path '*/.next/*' \
            -not -path '*/.open-next/*' || true)
          if [ -n "${matches}" ]; then
            echo "🚫 Legacy *.test.ts(x) files detected:" >&2
            echo "${matches}" >&2
            echo "Rename to *.spec.{ts,tsx}." >&2
            exit 1
          fi
          echo "✅ No legacy *.test.ts(x) files."
```

### 既存 verify workflow との整合

- 命名は `verify-*.yml` で揃える（既存 `verify-indexes.yml` に整合）
- branch protection の required status checks に **本タスクでは追加しない**（CI gate として動作することのみが要件 AC-6 の範囲）。required 化は別タスクで判断する

---

## D-5: ADR / CLAUDE.md / skill changelog 更新方針

### CLAUDE.md 追記

- 追記先: `CLAUDE.md` の「重要な不変条件」セクション末尾、または「よく使うコマンド」前
- 追記内容（1 行）: `8. 新規テストファイルは *.spec.{ts,tsx} のみ許可。*.test.ts(x) は CI gate で reject される`
- Phase 12 で diff を outputs/phase-12/ に保存

### ADR 追記

- 追記先: `docs/30-workflows/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`
- 追記セクション: `## 履歴` または末尾に append
- 追記内容:
  ```
  ## 2026-05-12 update (issue-623)
  - 二段階対応（`*.{test,spec}` 並存）を終了。
  - `vitest.config.ts` の `test.include` / `coverage.exclude` を `*.spec.{ts,tsx}` 単一に収斂。
  - 159 件の `*.test.ts(x)` を `git mv` で rename 完了。
  - 再混入を block する CI gate を導入: `scripts/hooks/block-test-suffix.sh` + `.github/workflows/verify-test-suffix.yml`。
  ```

### skill changelog 追記

- 追記先候補:
  - `.claude/skills/task-specification-creator/SKILL-changelog.md`
  - `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- 追記内容: 「2026-05-12 issue-623: test suffix を spec 単一に収斂。新規 `*.test.ts(x)` 追加は禁止」
- `.claude/skills/aiworkflow-requirements/indexes/` 再生成（影響時）: Phase 4 で `pnpm indexes:rebuild` を実行し、indexes 差分があれば commit に含める

---

## 関数 / スクリプトのシグネチャ（CONST_005）

| 名称 | I/F | 入力 | 出力 | 終了コード |
| --- | --- | --- | --- | --- |
| `scripts/hooks/block-test-suffix.sh` | bash | (なし) | stderr: 検出ファイル一覧 / stdout: なし | 0 = 検出なし / 1 = 検出あり |
| `scripts/migration/rename-test-to-spec.sh`（任意） | bash | `$1`=対象 path、`--dry-run` 任意 | stdout: rename 件数 / stderr: 対象一覧 | 0 = 成功 / 1 = dirty / 2 = path 不正 |
| `.github/workflows/verify-test-suffix.yml` の `verify` job | YAML job | (checkout 後の repo) | (なし) | step exit code を job 結果に反映 |

## テスト方針

- **rename 完全性**: `find` で `*.test.ts(x)` を全リポジトリ走査し、件数 0 を Phase 11 evidence にスナップショット
- **vitest discovery 不変**: rename 前後で `pnpm test --run --reporter=json` の `numTotalTests` 一致を JSON diff で確認
- **pre-commit hook 動作**: dummy `*.test.ts` を staged し、`git commit` が exit 1 になることを Phase 11 で再現
- **GitHub Actions workflow 動作**: feature branch に dummy `*.test.ts` を push し、`verify-test-suffix` job が fail することを確認（Phase 11 evidence）
- **coverage delta**: rename 前後で `pnpm test --coverage --reporter=json-summary` の `total.lines.pct` 差が ±0.0% であることを Phase 11 で確認

## 実行コマンド一覧

```bash
# Phase 4 で利用するコマンドの一覧（実行は Phase 4 以降）
mise exec -- pnpm test --run --reporter=json > /tmp/before.json
bash scripts/migration/rename-test-to-spec.sh apps/web
bash scripts/migration/rename-test-to-spec.sh apps/api
bash scripts/migration/rename-test-to-spec.sh packages/shared
bash scripts/migration/rename-test-to-spec.sh packages/integrations
bash scripts/migration/rename-test-to-spec.sh scripts
bash scripts/migration/rename-test-to-spec.sh .claude/skills
mise exec -- pnpm test --run --reporter=json > /tmp/after.json
diff <(jq '.numTotalTests' /tmp/before.json) <(jq '.numTotalTests' /tmp/after.json)
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD (Phase 2 完了基準)

- [ ] D-1〜D-5 の 5 成果物が `outputs/phase-02/` に作成されている
- [ ] vitest.config.ts の before/after diff が D-2 に確定している
- [ ] `block-test-suffix.sh` の I/O / 終了コード / 並列性が D-3 に明記されている
- [ ] `verify-test-suffix.yml` の trigger / permissions / steps が D-4 に確定している
- [ ] ADR / CLAUDE.md / skill changelog の追記方針が D-5 に確定している
- [ ] CONDITIONAL（既存 hook 競合 / workflow 命名整合 / `__tests__` path 影響）の最終回答が記録されている

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト命名規約の正本（存在する場合に Phase 12 で追記） |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | rename 後の re-index 対象 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期手順 |

## 次 Phase

- 次: 3 (タスク分解)
- 引き継ぎ事項: D-1〜D-5 の 5 成果物、CONST_005 シグネチャ、テスト方針、実行コマンド、DoD を Phase 3 タスク分解に渡す
- ブロック条件: D-1〜D-5 のいずれかが未確定の場合は Phase 3 に進まない

## 実行タスク

- D-1〜D-5 を Phase 3 の T-01〜T-19 へ変換する。

## 参照資料

- `vitest.config.ts`
- `lefthook.yml`
- `.github/workflows/verify-indexes.yml`

## 成果物/実行手順

- `outputs/phase-02/rename-strategy.md`
- `outputs/phase-02/vitest-config-diff.md`
- `outputs/phase-02/lefthook-script-design.md`
- `outputs/phase-02/verify-workflow-design.md`
- `outputs/phase-02/adr-update-plan.md`

## 完了条件

- AC-1〜AC-8 の設計対応先が確定している。

## 統合テスト連携

- Phase 9 / 10 / 11 の evidence gate へ接続する。
