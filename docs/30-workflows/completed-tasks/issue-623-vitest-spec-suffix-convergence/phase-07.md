# Phase 7: GitHub Actions verify-test-suffix workflow

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `.github/workflows/verify-test-suffix.yml` を新規実装し、`main` / `dev` への push と PR で `*.test.ts(x)` 残存 0 件を CI 上で強制する。YAML workflow の新規追加を伴うため実装仕様書。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | vitest.config の test/spec 二段階対応を spec 単一に収斂 (issue-623) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | GitHub Actions verify-test-suffix |
| 作成日 | 2026-05-12 |
| 担当 | delivery |
| 前 Phase | 6 (lefthook pre-commit gate) |
| 次 Phase | 8 (ドキュメント追従) |
| 状態 | spec_created |

## 目的

`--no-verify` 等で pre-commit gate が回避されても、main / dev への push と PR で `*.test.ts(x)` を構造的に reject する CI gate（GitHub Actions workflow）を導入する。命名は既存 `verify-indexes-up-to-date` workflow に倣い、`verify-test-suffix` で統一する。

## 変更対象ファイル一覧（CONST_005）

| 変更種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `.github/workflows/verify-test-suffix.yml` | `verify-test-suffix` job を 1 件含む workflow |

## 既存 verify-indexes.yml からの差分方針

| 項目 | verify-indexes-up-to-date | verify-test-suffix（本タスク） |
| --- | --- | --- |
| `name` | `verify-indexes-up-to-date` | `verify-test-suffix` |
| trigger push | `branches: [main]` | `branches: [main, dev]`（指示に基づき dev も対象） |
| trigger PR | `branches: [main, dev]` | `branches: [main, dev]` |
| permissions | `contents: read` | `contents: read`（同等） |
| concurrency group | `verify-indexes-${{ github.ref }}` | `verify-test-suffix-${{ github.ref }}` |
| runner | `ubuntu-latest` | `ubuntu-latest` |
| job name | `verify-indexes-up-to-date` | `verify-test-suffix` |
| 依存 | pnpm/setup-node + install + rebuild | **依存なし**（pure shell 1 step） |
| 検出ロジック | indexes diff | `find -name '*.test.ts*'` で残存数 > 0 検出 |

## 具体的な workflow YAML

### `.github/workflows/verify-test-suffix.yml`

```yaml
# 目的: *.test.ts(x) の残存・新規混入を CI で構造的に reject する authoritative gate
# 監視対象: リポジトリ全体（node_modules / .next / .open-next を除く）
# 設計の正本: docs/30-workflows/issue-623-vitest-spec-suffix-convergence/outputs/phase-02/verify-workflow-design.md
# 関連 AC: AC-1 / AC-6（index.md 参照）
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
  verify-test-suffix:
    name: verify-test-suffix
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Detect legacy *.test.ts(x) files
        run: |
          set -euo pipefail

          matches="$(find . -type f \
            \( -name '*.test.ts' -o -name '*.test.tsx' \) \
            -not -path './node_modules/*' \
            -not -path '*/node_modules/*' \
            -not -path '*/.next/*' \
            -not -path '*/.open-next/*' \
            -not -path './.git/*' \
            || true)"

          if [ -n "${matches}" ]; then
            {
              echo "::error::Legacy *.test.ts(x) files detected. Use *.spec.{ts,tsx} only."
              echo "--- Detected files ---"
              echo "${matches}"
              echo "----------------------"
              echo "Rename to *.spec.{ts,tsx}:"
              echo "  bash scripts/migration/rename-test-to-spec.sh <dir>"
            } >&2
            exit 1
          fi

          echo "✅ No legacy *.test.ts(x) files."
```

## YAML 構造解説

### `on`

- `push: branches: [main, dev]` — main / dev への push（マージ含む）で trigger
- `pull_request: branches: [main, dev]` — main / dev を base とする PR で trigger

### `permissions`

- `contents: read` のみ。書き込み権限を付与しない最小権限

### `concurrency`

- 同一 ref の重複実行を `cancel-in-progress: true` でキャンセル
- group 名は `verify-test-suffix-` プレフィックスで他 workflow と衝突回避

### `jobs.verify-test-suffix`

- job key と `name` を一致させ、required status check 追加時の指定を簡潔化
- pnpm / Node setup は **不要**（pure shell で `find` のみ）
- `actions/checkout@v4` + 単一 shell step で完結

### 検出 step

| 段階 | コマンド | 役割 |
| --- | --- | --- |
| 1 | `find . -type f \( -name '*.test.ts' -o -name '*.test.tsx' \)` | 全リポジトリ走査 |
| 2 | `-not -path '*/node_modules/*'` etc. | 除外パス（ローカル `find` と同等基準） |
| 3 | `\|\| true` | hit 0 件で非ゼロ終了するシェル挙動を吸収 |
| 4 | `[ -n "${matches}" ]` | 1 件以上で `::error::` 出力後 exit 1 |

## 入出力・副作用

| 項目 | 値 |
| --- | --- |
| 入力 | git checkout 後の作業ツリー |
| 出力 | step log（`::error::` annotation 含む） |
| 副作用 | なし（read-only） |
| 失敗時挙動 | `exit 1` で job が red、PR 上の Required check 化されていれば merge ブロック |
| 成功時挙動 | `✅ No legacy ...` を log 出力し exit 0 |

## エラーハンドリング

- `find` が `Permission denied` 等で部分失敗する可能性は GitHub-hosted runner では通常ない。`|| true` で `find` 自体の失敗は吸収
- `set -euo pipefail` 配下で `matches` 変数は `|| true` でガード済み
- workflow 自体の YAML syntax error は `actionlint` で事前検出（リポジトリの既存 CI に依存）

## 既存 workflow との整合

| 項目 | 値 |
| --- | --- |
| 命名 | `verify-*.yml` で揃える（既存 `verify-indexes.yml` と整合） |
| permissions | 既存と同じ `contents: read` |
| concurrency | プレフィックスを workflow 単位で分離 |
| Required status check | **本タスクでは branch protection への追加は行わない**（AC-6 の範囲外）。required 化は別タスクで判断 |

## テスト方針

### 静的検証

```bash
# YAML 構文
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/verify-test-suffix.yml'))"

# actionlint（リポジトリ標準）
mise exec -- bash scripts/ci/run-actionlint.sh || true
```

### 動作確認（ローカル equivalent）

```bash
# workflow の shell step を手元で再現
set -euo pipefail
matches="$(find . -type f \
  \( -name '*.test.ts' -o -name '*.test.tsx' \) \
  -not -path './node_modules/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/.open-next/*' \
  -not -path './.git/*' \
  || true)"
if [ -n "${matches}" ]; then
  echo "FAIL (would-be CI fail):"
  echo "${matches}"
  exit 1
fi
echo "PASS"
```

### Reject 再現（feature branch push）

```bash
git checkout -b test/verify-workflow-issue-623
mkdir -p apps/api/src/__tests__
echo "// dummy" > apps/api/src/__tests__/probe.test.ts
git add -A
git commit -m "probe legacy suffix (will be reverted)" --no-verify
git push -u origin test/verify-workflow-issue-623
gh pr create --base dev --title "probe verify-test-suffix" --body "probe"
gh run watch  # verify-test-suffix が fail することを確認
# cleanup
gh pr close --delete-branch
```

> 本検証は Phase 11 evidence 収集と合わせて 1 回だけ実施し、PR は merge せずクローズする。

### Pass 確認

- 本タスクの実 PR（Phase 13）で `verify-test-suffix` が green であることをもって AC-1 / AC-6 を兼ねて検証

## ローカル実行・検証コマンド

```bash
# 1. workflow 配置
mkdir -p .github/workflows  # 既存想定
# .github/workflows/verify-test-suffix.yml を Write

# 2. YAML 構文
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/verify-test-suffix.yml'))"

# 3. shell step を手元で再現（上記参照）

# 4. commit
git add .github/workflows/verify-test-suffix.yml
git commit -m "ci: add verify-test-suffix workflow"
```

## DoD（Phase 7 完了基準）

- [ ] `.github/workflows/verify-test-suffix.yml` が新規追加されている
- [ ] `name: verify-test-suffix` / `jobs.verify-test-suffix.name: verify-test-suffix` の両方が指定されている
- [ ] trigger が `push: [main, dev]` および `pull_request: [main, dev]` の両方
- [ ] `permissions: contents: read` 最小権限
- [ ] YAML 構文 OK（python3 yaml で parse 成功）
- [ ] ローカル equivalent shell step が exit 0（Phase 4-5 完了後の状態）
- [ ] Reject 再現で job が red になることを Phase 11 で確認予定
- [ ] 1 コミット `ci: add verify-test-suffix workflow` で完了

## aiworkflow-requirements 参照セクション

| 参照対象 | 用途 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/testing.md` | CI gate 設計指針（存在時） |
| `.claude/skills/task-specification-creator/references/spec-update-workflow.md` | Phase 12 で workflow 記述を sync |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/verify-indexes.yml | 既存 verify workflow のテンプレート |
| 必須 | docs/30-workflows/issue-623-vitest-spec-suffix-convergence/phase-02.md | D-4 設計 |
| 参考 | .github/workflows/ | 他 verify-* 命名と整合確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設定 | .github/workflows/verify-test-suffix.yml | 新規 GitHub Actions workflow |
| ドキュメント | outputs/phase-07/workflow-design.md | trigger / permissions / steps の最終形と動作検証ログ |

## 次 Phase

- 次: 8 (ドキュメント追従)
- 引き継ぎ事項: workflow 配置完了、ローカル equivalent shell の PASS 確認、Phase 11 reject reproducibility plan
- ブロック条件: YAML syntax error または `find` が誤検出するパターンが残る場合は Phase 8 に進まない

## 実行タスク

- T-13 を実行し、`verify-test-suffix.yml` を追加する。

## 完了条件

- `*.test.ts(x)` 0 件で green、1 件以上で red になる検出条件を確認する。

## 統合テスト連携

- Phase 9-2-B / Phase 11 AC-6 evidence に接続する。
