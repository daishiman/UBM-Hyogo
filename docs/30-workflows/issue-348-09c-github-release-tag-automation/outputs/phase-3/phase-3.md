# Phase 3: スクリプト I/F 設計 / `.github/workflows/release-create.yml` 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | completed |

## 目的

Phase 2 の placeholder 仕様を入力として、`generate-release-notes.sh` / `create-github-release.sh` の引数・stdout・exit code 契約と、`.github/workflows/release-create.yml` のトリガ・job 構成を確定する。`scripts/cf.sh` 経由の必要可否も明示する。

## Step 0: P50 チェック（必須）

```bash
mkdir -p outputs/phase-3

# 1) `gh release create` の dry-run 等価コマンド（実 API 不要のローカル検証）
gh release create --help 2>&1 \
  | tee outputs/phase-3/gh-release-create-help.log

# 2) workflow_dispatch で参照する secrets / permissions（既存運用の確認）
ls .github/workflows/ \
  | tee outputs/phase-3/existing-workflows.log

# 3) `scripts/cf.sh` 利用要否の判定（Cloudflare API を本タスクで叩くか）
grep -lE 'wrangler|cloudflare' scripts/release/ 2>/dev/null || echo "no cloudflare deps in scripts/release/" \
  | tee outputs/phase-3/cf-need-check.log
```

## `cf.sh` 利用要否の判定（結論: 不要）

| 操作 | 必要 CLI | `cf.sh` 経由必要か |
| --- | --- | --- |
| release note 生成 | bash + `sed` のみ | 不要（純 bash） |
| `gh release create` | `gh` | 不要（`cf.sh` は wrangler ラッパー） |
| tag 検証 | `git` | 不要 |

→ 本タスクは Cloudflare API を一切叩かないため、`scripts/cf.sh` は **使用しない**。CLAUDE.md の「Cloudflare 系 CLI 実行ルール」とは独立。

## `generate-release-notes.sh` I/F

```text
USAGE:
  scripts/release/generate-release-notes.sh \
    --tag <vYYYYMMDD-HHMM> \
    --commit <full-sha> \
    --changelog-path <path> \
    --evidence-url <url> \
    [--rollback-url <url>] \
    [--followup-url <url>] \
    [--generated-at <iso8601>] \
    [--template <path>]

STDOUT:
  release note markdown 本文（placeholder 全解決済）

EXIT CODE:
  0  正常
  0  正常
  64 引数不足 / tag format invalid / commit format invalid
```

| 引数 | 既定値 | 用途 |
| --- | --- | --- |
| `--tag` | なし | release tag（必須） |
| `--commit` | なし | target commit full sha（必須） |
| `--changelog-path` | なし | Phase 12 changelog のローカル path（必須） |
| `--evidence-url` | なし | Phase 11 evidence ディレクトリの GitHub URL（必須） |
| `--rollback-url` | `N/A` | rollback evidence URL（任意。fallback は文字列 `N/A`） |
| `--followup-url` | `N/A` | known follow-up URL（任意） |
| `--generated-at` | 現在 UTC | 決定論テスト用の生成時刻固定値 |
| `--template` | `scripts/release/release-notes.template.md` | 上書き可能 |

fallback ルール:

- `--changelog-path` が存在しない → fallback 文言を release note に埋め込む
- `--rollback-url` / `--followup-url` 省略 → `N/A` をそのまま埋め込む

## `create-github-release.sh` I/F

```text
USAGE:
  scripts/release/create-github-release.sh \
    --tag <vYYYYMMDD-HHMM> \
    --target <full-sha> \
    --changelog-path <path> \
    --evidence-url <url> \
    (--dry-run | --apply) \
    [--draft]

EXIT CODE:
  0  正常
  0  正常
  64 引数不足 / フラグ排他違反 / tag format invalid / commit format invalid / 既存 release 検出
```

| フラグ | 挙動 |
| --- | --- |
| `--dry-run` | tag/commit 検証 + release note プレビュー stdout 出力。`gh release create` を呼ばない |
| `--apply` | dry-run 検証通過後、`gh release create <tag> --target <commit> --notes-file <path>` を実行 |
| `--draft` | apply 時に draft release として作成する |

`--dry-run` と `--apply` は排他。両方なし / 両方あり → exit 2。

検証順序:

1. tag format regex
2. target commit が sha 文字列であること
3. `--dry-run` では release note を stdout へ出力し、副作用を発生させない
4. `--apply` 時のみ `gh release view <tag>` で既に release が無いこと
5. `--apply` 時のみ `gh release create <tag> --target <commit> --notes-file <tmp>` を実行

## `.github/workflows/release-create.yml` 設計

### トリガ

| トリガ | 条件 |
| --- | --- |
| `on.push.tags` | `'v*'`（`vYYYYMMDD-HHMM` を含む。job 内で正規表現再検証） |
| `on.workflow_dispatch.inputs.tag` | 手動 trigger 用。既存 tag を指定して release を再生成（dry-run のみ） |

### permissions

```yaml
permissions:
  contents: write   # gh release create に必須
```

### job 構成（単一 job: `release-create`）

| step | 内容 |
| --- | --- |
| 1 | `actions/checkout@vN`（`fetch-depth: 0` で全 tag / commit 取得） |
| 2 | `gh` CLI セットアップ（runner プリインストール）+ `GITHUB_TOKEN` 利用 |
| 3 | tag / commit を `GITHUB_REF_NAME` / `GITHUB_SHA` から解決 |
| 4 | `scripts/release/generate-release-notes.sh` 実行 → `release-notes.md` 出力 |
| 5 | `--dry-run` で `create-github-release.sh` 実行（push トリガ / workflow_dispatch 共通） |
| 6 | push トリガかつ tag が `v[0-9]{8}-[0-9]{4}` に一致 → `--apply` 実行 |
| 7 | artifact upload (`release-notes.md`, `dry-run.log`, `apply.log`) |

### 差分: workflow_dispatch は dry-run までで停止

手動 trigger は誤爆事故防止のため `--apply` を実行しない。実 release 作成は tag push 経路に限定する。

## エラー伝播 / ログ

- 各 step の stdout / stderr は `tee outputs/phase-3/<step>.log` 相当の artifact に保存
- 非 0 exit code は workflow を fail させ、後続 step を skip

## 成果物

- `outputs/phase-3/phase-3.md`
- `outputs/phase-3/script-interface.md`（I/F 表のスナップショット）
- `outputs/phase-3/workflow-design.md`
- `outputs/phase-3/cf-need-check.log`

## 次 Phase の前提条件

スクリプト I/F / workflow 構成を入力として、Phase 4 で bats / actionlint / shellcheck の検証シナリオを設計する。
