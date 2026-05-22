# Phase 6: lefthook pre-commit gate（block-test-suffix）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 新規 bash script `scripts/hooks/block-test-suffix.sh` を実装し、`lefthook.yml` の `pre-commit.commands` に新規 command `block-test-suffix` を追加する。実コードの新規追加と既存設定への追記を伴うため実装仕様書。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | lefthook pre-commit gate |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 5 (vitest.config 収斂) |
| 次 Phase | 7 (GitHub Actions verify-test-suffix) |
| 状態 | spec_created |

## 目的

ローカル開発で `*.test.ts(x)` が staged された commit を即座に reject する pre-commit gate を導入する。`--no-verify` を使わない限り、新規テストファイルは `*.spec.{ts,tsx}` のみが許容される構造を作る。

本 Phase で導入するのは以下 2 点:

1. `scripts/hooks/block-test-suffix.sh` の新規実装（独立 script、既存 `staged-task-dir-guard` 等を改変しない）
2. `lefthook.yml` の `pre-commit.commands` に `block-test-suffix` command を追記

## 変更対象ファイル一覧（CONST_005）

| 変更種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `scripts/hooks/block-test-suffix.sh` | bash script。staged から `*.test.ts(x)` 検出、検出時 exit 1 |
| 編集 | `lefthook.yml` | `pre-commit.commands` 配下に `block-test-suffix` 1 command 追加 |

## bash script の完全な実装案

### `scripts/hooks/block-test-suffix.sh`

```bash
#!/usr/bin/env bash
# scripts/hooks/block-test-suffix.sh
#
# 役割:
#   pre-commit で staged ファイルから *.test.ts / *.test.tsx を検出し、
#   1 件でも見つかれば exit 1 で commit を reject する。
#   テストファイル suffix は *.spec.{ts,tsx} のみを許可する
#   ADR (issue-325 / issue-623) を構造的に強制するための gate。
#
# 入力:
#   引数: なし
#   依存: git
#
# 出力:
#   stderr: 検出ファイルパス一覧（1 行 1 ファイル）
#   stdout: なし
#
# 終了コード:
#   0  検出なし（commit 続行）
#   1  検出あり（commit reject）
#
# 並列性:
#   既存 main-branch-guard / staged-task-dir-guard と独立。
#   外部状態を一切共有しない。lefthook の parallel: true 下で安全に動作。

set -euo pipefail

# staged ファイル一覧（追加・変更のみ）を取得
staged="$(git diff --cached --name-only --diff-filter=AM)"

# 空なら exit 0
[[ -z "${staged}" ]] && exit 0

# *.test.ts / *.test.tsx を抽出（node_modules / .next / .open-next は除外）
matches="$(printf '%s\n' "${staged}" \
  | grep -E '\.test\.(ts|tsx)$' \
  | grep -vE '(^|/)(node_modules|\.next|\.open-next)/' \
  || true)"

if [[ -n "${matches}" ]]; then
  {
    echo "🚫 新規テストファイルは *.spec.{ts,tsx} のみ許可されています。"
    echo "以下のファイルを *.spec.ts(x) にリネームしてから commit してください:"
    echo
    printf '%s\n' "${matches}"
  } >&2
  exit 1
fi

exit 0
```

### 実装ルール

| 項目 | 値 |
| --- | --- |
| パス | `scripts/hooks/block-test-suffix.sh` |
| 権限 | `0755`（`chmod 0755` を必ず実行） |
| シェバン | `#!/usr/bin/env bash` |
| `set` | `set -euo pipefail` |
| 例外パス | なし。リポジトリ全体に厳格適用 |
| `--no-verify` 回避策 | 本 hook では実装しない（個人開発ポリシーで `--no-verify` 利用を別途禁止） |

## lefthook.yml に追加する具体 YAML

### 現状（before）

```yaml
pre-commit:
  parallel: true
  commands:
    main-branch-guard:
      run: bash scripts/hooks/main-branch-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 main / dev ブランチへの直接コミットは禁止されています。
        feature ブランチに切り替えてから commit してください。
    staged-task-dir-guard:
      run: bash scripts/hooks/staged-task-dir-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 ブランチと無関係なタスクディレクトリが含まれています。
        意図的に含める場合: git commit --no-verify
        除外する場合:       git restore --staged <path>
```

### 編集後（after）

```yaml
pre-commit:
  parallel: true
  commands:
    main-branch-guard:
      run: bash scripts/hooks/main-branch-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 main / dev ブランチへの直接コミットは禁止されています。
        feature ブランチに切り替えてから commit してください。
    staged-task-dir-guard:
      run: bash scripts/hooks/staged-task-dir-guard.sh
      stage_fixed: false
      fail_text: |
        🚫 ブランチと無関係なタスクディレクトリが含まれています。
        意図的に含める場合: git commit --no-verify
        除外する場合:       git restore --staged <path>
    block-test-suffix:
      run: bash scripts/hooks/block-test-suffix.sh
      stage_fixed: false
      fail_text: |
        🚫 新規テストファイルは *.spec.{ts,tsx} のみ許可されています。
        該当ファイルを *.spec.ts(x) にリネームしてから commit してください。
```

### 追記ルール

- 既存 `main-branch-guard` / `staged-task-dir-guard` の構造は変更しない
- `parallel: true` を継承（独立 step として並列実行）
- インデント・改行は既存と同一スタイル（spaces 2、`fail_text` は `|` block scalar）
- `block-test-suffix` を末尾に追加（順序は機能影響なし、parallel）

## staged file 検出ロジック

| 段階 | コマンド | 役割 |
| --- | --- | --- |
| 1. staged 取得 | `git diff --cached --name-only --diff-filter=AM` | 追加 / 変更ファイルのパスを改行区切りで取得（rename `R` は対象外＝rename で `.spec` 化された結果は通る） |
| 2. suffix 抽出 | `grep -E '\.test\.(ts\|tsx)$'` | 拡張子末尾 `.test.ts` / `.test.tsx` のみマッチ |
| 3. 除外パス | `grep -vE '(^\|/)(node_modules\|\.next\|\.open-next)/'` | サードパーティ・ビルド成果物を除外 |
| 4. 判定 | `[[ -n "${matches}" ]]` | 1 件でもあれば exit 1 |

## exit code 規約

| code | 意味 | 後続挙動 |
| --- | --- | --- |
| 0 | 検出なし | lefthook は他 commands と並列に成功扱い |
| 1 | 検出あり | lefthook が pre-commit を中断、`fail_text` を表示 |
| 2 以上 | 想定外（`set -e` による中断含む） | lefthook は失敗として扱う |

## 副作用

- working tree への書き込みなし（read-only hook）
- staged 状態の変更なし（`stage_fixed: false`）
- 他 commands との state 共有なし

## エラーハンドリング

- `git diff --cached` 失敗（git リポジトリ外実行など）→ `set -e` で exit 1 となり commit 中断（適切）
- staged 空（amend なし新規 commit など）→ 早期 exit 0
- `grep` が 0 件で `set -o pipefail` により非ゼロ終了するケースは `|| true` でガード

## テスト方針

### 単体（bash -n / shellcheck）

```bash
bash -n scripts/hooks/block-test-suffix.sh
shellcheck scripts/hooks/block-test-suffix.sh  # 可能なら
```

### 動作確認（reject ケース）

```bash
git checkout -b test/verify-block-test-suffix-issue-623
mkdir -p apps/api/src/__tests__
cat > apps/api/src/__tests__/dummy.test.ts <<'EOF'
import { describe, it } from 'vitest';
describe('x', () => it('y', () => {}));
EOF
git add apps/api/src/__tests__/dummy.test.ts
set +e
git commit -m "test gate"
status=$?
set -e
[[ "${status}" -ne 0 ]] || { echo "FAIL: hook should reject" >&2; exit 1; }
git rm --cached apps/api/src/__tests__/dummy.test.ts
rm apps/api/src/__tests__/dummy.test.ts
git checkout -
git branch -D test/verify-block-test-suffix-issue-623
```

### 動作確認（pass ケース）

```bash
# *.spec.ts を staged して通常 commit が通ることを確認
echo "// noop" > apps/api/src/__tests__/dummy.spec.ts
git add apps/api/src/__tests__/dummy.spec.ts
git commit -m "test gate pass case"  # 成功すること
git reset --soft HEAD~1
git rm --cached apps/api/src/__tests__/dummy.spec.ts
rm apps/api/src/__tests__/dummy.spec.ts
```

### 並列性確認

```bash
# 既存 hook (main-branch-guard / staged-task-dir-guard) が同時実行で fail しないか確認
LEFTHOOK_VERBOSE=1 git commit --allow-empty -m "verify parallel" --dry-run || true
```

## ローカル実行・検証コマンド

```bash
# 1. script 配置
chmod 0755 scripts/hooks/block-test-suffix.sh
bash -n scripts/hooks/block-test-suffix.sh

# 2. lefthook.yml 編集後の YAML 構文確認
mise exec -- pnpm exec yaml-lint lefthook.yml || \
  python3 -c "import yaml; yaml.safe_load(open('lefthook.yml'))"

# 3. lefthook install（pnpm install の prepare で自動だが念のため）
mise exec -- pnpm exec lefthook install

# 4. reject ケース動作確認（上記スクリプト）

# 5. commit
git add scripts/hooks/block-test-suffix.sh lefthook.yml
git commit -m "feat(hooks): add block-test-suffix pre-commit guard"
```

## DoD（Phase 6 完了基準）

- [ ] `scripts/hooks/block-test-suffix.sh` が新規追加され `0755` で実行可能
- [ ] `bash -n` で構文 OK
- [ ] `lefthook.yml` の `pre-commit.commands` に `block-test-suffix` が追加されている
- [ ] 既存 `main-branch-guard` / `staged-task-dir-guard` の記述が変化していない
- [ ] reject ケース（`*.test.ts` staged）で `git commit` が exit 1（AC-4 / AC-5）
- [ ] pass ケース（`*.spec.ts` staged）で commit が成功
- [ ] 1 コミット（または 2 コミット）で完了:
  - `feat(hooks): add block-test-suffix pre-commit guard`

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | テスト規約・gate 設計指針 |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 で hook 記述を sync する手順 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | lefthook.yml | 編集対象 |
| 必須 | scripts/hooks/staged-task-dir-guard.sh | 並列実行する独立 step の参照実装 |
| 必須 | scripts/hooks/main-branch-guard.sh | bash hook の exit code / fail_text 参照 |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | D-3 設計 |
| 参考 | docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md | lefthook 設計正本 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | scripts/hooks/block-test-suffix.sh | 新規 bash script |
| 設定 | lefthook.yml | `block-test-suffix` command 追加版 |
| ドキュメント | outputs/phase-06/hook-verification.md | reject/pass ケースの動作確認ログ |

## 次 Phase

- 次: 7 (GitHub Actions verify-test-suffix)
- 引き継ぎ事項: pre-commit gate 動作状態、reject ログサンプル
- ブロック条件: reject ケースで exit 0 となる場合、または既存 hook を巻き込んで fail する場合は Phase 7 に進まない

## 実行タスク

- T-11 / T-12 を実行し、hook script と lefthook 配線を追加する。

## 完了条件

- dummy `*.test.ts` staged commit が reject される。

## 統合テスト連携

- Phase 9-2-A / 9-2-C の evidence として保存する。
