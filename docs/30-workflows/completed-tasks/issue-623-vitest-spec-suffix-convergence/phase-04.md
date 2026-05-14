# Phase 4: 実装計画（rename 実施）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は Phase 3 タスク分解 T-01〜T-09 を 1 サイクル内に完了させる実装作業（`git mv` 159 件 / 補助スクリプト新規 / import-path 修正 / skill indexes 再生成）を計画する。実コードベース実体への書き込みを直接伴うため実装仕様書。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 実装計画（rename 実施） |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 3 (タスク分解) |
| 次 Phase | 5 (vitest.config 収斂) |
| 状態 | spec_created |

## 目的

Phase 3 で確定した T-01〜T-09 を実行し、`*.test.ts(x)` 159 件を `*.spec.ts(x)` に `git mv` で rename する。本 Phase 完了時点で:

- `find . -name '*.test.ts*' | grep -v node_modules | grep -v .next | grep -v .open-next` が **0 件**
- すべての rename が `git log --diff-filter=R --name-status` で `R100` として記録される（履歴保持）
- 領域別 6 コミット + 補助スクリプト 1 コミット + indexes 再生成 1 コミット + import-path 修正 1 コミット の合計最大 9 コミットで完了
- `mise exec -- pnpm typecheck` が PASS
- vitest.config.ts は **未編集**（Phase 5 で編集する。本 Phase で編集すると silent skip リスクが発生）

## 変更対象ファイル一覧（CONST_005）

| 変更種別 | パス | T-ID | 件数 |
| --- | --- | --- | --- |
| 新規 | `scripts/migration/rename-test-to-spec.sh` | T-01 | 1 |
| rename | `apps/web/**/*.test.ts(x)` → `*.spec.ts(x)` | T-02 | 83 |
| rename | `apps/api/**/*.test.ts(x)` → `*.spec.ts(x)` | T-03 | 6 |
| rename | `packages/shared/**/*.test.ts(x)` → `*.spec.ts(x)` | T-04 | 17 |
| rename | `packages/integrations/**/*.test.ts(x)` → `*.spec.ts(x)` | T-05 | 11 |
| rename | `scripts/**/*.test.ts` → `*.spec.ts` | T-06 | 35 |
| rename | `.claude/skills/**/*.test.ts` → `*.spec.ts` | T-07 | 7 |
| 編集 | `.claude/skills/aiworkflow-requirements/indexes/*.json` | T-08 | 自動再生成 |
| 編集 | import 元ファイル（`from "...test"` がある場合のみ） | T-09 | 0〜N |

> 本 Phase では `vitest.config.ts` / `lefthook.yml` / `.github/workflows/` / `CLAUDE.md` / ADR は **編集しない**。これらは Phase 5-8 が責務。

## T-01: rename 補助スクリプトの実装

### スクリプト仕様（CONST_005）

| 項目 | 値 |
| --- | --- |
| パス | `scripts/migration/rename-test-to-spec.sh` |
| 権限 | `0755` |
| シェバン | `#!/usr/bin/env bash` |
| `set` | `set -euo pipefail` |
| 引数 | `$1`=対象ディレクトリ（必須）、`$2`=`--dry-run` 任意 |
| 入力副作用 | リポジトリ作業ツリー（`git mv` のみ） |
| 出力 | stdout: rename 件数 / stderr: 対象一覧 |
| 終了コード | `0`=成功 / `1`=git status dirty / `2`=path 不正 |

### スクリプト構造（実装シグネチャ）

```bash
#!/usr/bin/env bash
set -euo pipefail

# usage: rename-test-to-spec.sh <path> [--dry-run]
TARGET="${1:?usage: rename-test-to-spec.sh <path> [--dry-run]}"
MODE="${2:-apply}"

# 1. path 検証
[[ -d "${TARGET}" ]] || { echo "::error::invalid path: ${TARGET}" >&2; exit 2; }

# 2. dirty 検証（--dry-run は除外）
if [[ "${MODE}" != "--dry-run" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "::error::working tree is dirty; commit or stash first" >&2
    exit 1
  fi
fi

# 3. 対象列挙
mapfile -t files < <(find "${TARGET}" -type f \
  \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/.open-next/*')

# 4. rename ループ
count=0
for f in "${files[@]}"; do
  new="${f%.test.ts}.spec.ts"
  [[ "${f}" == *.test.tsx ]] && new="${f%.test.tsx}.spec.tsx"
  echo "${f} -> ${new}" >&2
  [[ "${MODE}" == "--dry-run" ]] || git mv "${f}" "${new}"
  count=$((count + 1))
done

echo "${count}"
```

### DoD

- `bash -n scripts/migration/rename-test-to-spec.sh` で構文 OK
- `bash scripts/migration/rename-test-to-spec.sh apps/web --dry-run` で 83 件 list 出力
- chmod `0755` で実行権限付与
- 1 コミット: `chore(test): add rename-test-to-spec.sh helper`

## T-02〜T-07: 領域別 rename 実行手順

各タスクは以下の単一手順で実行する（領域名のみ差し替え）。

```bash
# 例: apps/web
git status --porcelain  # 空であること
bash scripts/migration/rename-test-to-spec.sh apps/web
git status --short      # rename 件数 == 領域分布値
git diff --stat
git log --diff-filter=R --name-status -1  # 未コミット段階では空
mise exec -- pnpm typecheck                # PASS 確認
git add -A
git commit -m "refactor(test): rename apps/web *.test.ts(x) to *.spec"
git log -1 --diff-filter=R --name-status | head -5  # R100 が並ぶ
```

### 領域別期待件数

| 領域 | 期待件数 | コミットメッセージ |
| --- | --- | --- |
| apps/web | 83 | `refactor(test): rename apps/web *.test.ts(x) to *.spec` |
| apps/api | 6 | `refactor(test): rename apps/api *.test.ts(x) to *.spec` |
| packages/shared | 17 | `refactor(test): rename packages/shared *.test.ts(x) to *.spec` |
| packages/integrations | 11 | `refactor(test): rename packages/integrations *.test.ts(x) to *.spec` |
| scripts | 35 | `refactor(test): rename scripts *.test.ts to *.spec` |
| .claude/skills | 7 | `refactor(test): rename skill fixtures *.test.ts to *.spec` |

### 副作用・エラーハンドリング

- `git mv` 中に conflict が出る場合は他ブランチからの merge を中断し、本ブランチで再実行
- 件数が領域分布値と一致しない場合は手動で `find` 再確認し、差分（`*.test.spec.ts` 等の異形）を Phase 11 evidence に記録
- typecheck が fail した場合は T-09 import-path 修正を先行させる

## T-08: skill indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git add .claude/skills/aiworkflow-requirements/indexes
git diff --cached --stat
git commit -m "chore(skills): regenerate indexes after suffix rename"
```

### DoD

- `.claude/skills/aiworkflow-requirements/indexes/*.json` の suffix 揺れが 0
- `verify-indexes-up-to-date` workflow が green
- diff が空なら本コミットは作成しない（skipped）

## T-09: import-path 修正

### 検出手順

```bash
# rename 完了後に test ファイルの import を grep
grep -rEn "from ['\"][^'\"]+\.test['\"]" apps packages scripts || echo "no hit"
grep -rEn "import\([^)]*\.test[^)]*\)" apps packages scripts || echo "no hit"
```

### 期待動作

- ヒット 0 件の場合: 本タスクは skip
- ヒット ありの場合: 各 import を `.spec` に書き換え `mise exec -- pnpm typecheck` 通過後にコミット
  - コミットメッセージ: `fix(test): update import paths after suffix rename`

### エラーハンドリング

- typecheck が依然 fail する場合、`tsconfig.json` の `paths` / `include` に test path 特例がないか確認
- 復旧不能な場合は `git reset --hard HEAD~N` で領域単位に巻き戻し、T-02〜T-07 から再実施

## テスト方針

| 観点 | 手順 | 期待 |
| --- | --- | --- |
| rename 完全性 | `find . -name '*.test.ts*' \! -path '*/node_modules/*' \! -path '*/.next/*' \! -path '*/.open-next/*'` | 0 件 |
| 履歴保持 | `git log -1 --diff-filter=R --name-status` を各 rename commit で実行 | `R100` が並ぶ |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| vitest discovery（事前計測） | `mise exec -- pnpm test --run --reporter=json > /tmp/before.json && jq '.numTotalTests' /tmp/before.json` | Phase 5 比較用に保存 |
| indexes drift | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` | 差分 0 |

> **注**: 本 Phase 完了時点では vitest.config.ts は二段階対応のまま。`{test,spec}` glob が両 suffix を許容するため、rename 中の中間状態でも `numTotalTests` は変動しない。実際の収斂は Phase 5 で行う。

## ローカル実行・検証コマンド

```bash
# 0. 事前計測（Phase 5 の比較材料として保存）
mise exec -- pnpm test --run --reporter=json > /tmp/issue-623-before.json
jq '.numTotalTests' /tmp/issue-623-before.json

# 1. T-01: 補助スクリプト
chmod 0755 scripts/migration/rename-test-to-spec.sh
bash -n scripts/migration/rename-test-to-spec.sh
git add scripts/migration/rename-test-to-spec.sh
git commit -m "chore(test): add rename-test-to-spec.sh helper"

# 2. T-02〜T-07: 領域別 rename（順次実行）
for dir in apps/web apps/api packages/shared packages/integrations scripts .claude/skills; do
  bash scripts/migration/rename-test-to-spec.sh "${dir}"
  mise exec -- pnpm typecheck
  git add -A
  git commit -m "refactor(test): rename ${dir} *.test.ts(x) to *.spec"
done

# 3. T-08: indexes 再生成
mise exec -- pnpm indexes:rebuild
if ! git diff --quiet .claude/skills/aiworkflow-requirements/indexes; then
  git add .claude/skills/aiworkflow-requirements/indexes
  git commit -m "chore(skills): regenerate indexes after suffix rename"
fi

# 4. T-09: import-path 修正（必要時）
grep -rEn "from ['\"][^'\"]+\.test['\"]" apps packages scripts || true

# 5. 検証
find . -name '*.test.ts' -o -name '*.test.tsx' \
  | grep -vE '(node_modules|\.next|\.open-next)' | wc -l  # 0
mise exec -- pnpm typecheck
```

## DoD（Phase 4 完了基準）

- [ ] `scripts/migration/rename-test-to-spec.sh` が新規追加され `0755` で実行可能
- [ ] `*.test.ts(x)` 残存ファイル数 = 0（node_modules / .next / .open-next 除く）
- [ ] 6 領域すべてが期待件数で rename 完了
- [ ] `mise exec -- pnpm typecheck` が PASS
- [ ] `.claude/skills/aiworkflow-requirements/indexes` に drift がない
- [ ] `import .test` ヒット 0 件、または T-09 で修正済み
- [ ] vitest.config.ts は未編集（Phase 5 の責務）

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/` | T-08 で再生成対象 |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト命名規約参照（存在時） |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 同期との整合性 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | D-1 rename 戦略 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-03.md | T-01〜T-09 DoD |
| 必須 | vitest.config.ts | Phase 5 編集予定（本 Phase では参照のみ） |
| 参考 | scripts/hooks/staged-task-dir-guard.sh | bash hook の書式参考 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | scripts/migration/rename-test-to-spec.sh | rename 補助 bash script |
| rename | apps/web / apps/api / packages/* / scripts / .claude/skills 配下 159 件 | `*.test.ts(x)` → `*.spec.ts(x)` |
| 編集 | .claude/skills/aiworkflow-requirements/indexes/*.json | 再生成成果（drift 時のみ） |
| ドキュメント | outputs/phase-04/rename-log.md | 領域別 rename 件数記録、`git log --diff-filter=R` 抜粋 |

## 次 Phase

- 次: 5 (vitest.config 収斂)
- 引き継ぎ事項: rename 完了状態、`numTotalTests`（before）の値、`*.test.ts*` 残存 0 件の `find` 出力
- ブロック条件: `*.test.ts*` 残存 1 件以上、または `pnpm typecheck` fail のまま Phase 5 に進まない

## 実行タスク

- T-01〜T-09 を順序どおり実行する。

## 完了条件

- `*.test.ts(x)` 残存 0 件と typecheck 成功を確認する。

## 統合テスト連携

- Phase 9 の before/after discovery 比較へ rename 結果を渡す。
