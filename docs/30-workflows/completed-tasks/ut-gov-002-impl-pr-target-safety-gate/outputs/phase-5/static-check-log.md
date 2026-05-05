# Phase 5 — 静的検査ログ（static-check-log）

## Status

spec_created（テンプレ。**実走部分は Phase 13 ユーザー承認後に実装実行時に埋める**。）

> 本書は Phase 4 test-matrix.md §3 の 5 コマンドの実走結果テンプレ。`spec_created` 時点ではコマンドと期待結果のみを固定し、実出力 / 実行日時 / runner は実装実行時に埋める。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 5 |
| 種別 | static check log（実走テンプレ） |
| 実行予定 | Phase 13 ユーザー承認後 |

## 検査コマンド一覧（5 種）

| # | コマンド | 期待結果 | 失敗時分類 | 実走結果 |
| --- | --- | --- | --- | --- |
| SC-1 | `actionlint .github/workflows/*.yml` | exit 0、出力なし | F-1〜F-5 のいずれか（出力に応じて分類） | （実装実行時に埋める） |
| SC-2 | `yq '.permissions' .github/workflows/pr-target-safety-gate.yml` | `{}` または `null` | F-4 | （実装実行時に埋める） |
| SC-3 | `yq '.permissions' .github/workflows/pr-build-test.yml` | `{}` または `{contents: read}` | F-4 | （実装実行時に埋める） |
| SC-4 | `grep -RnE 'persist-credentials:\s*false' .github/workflows/` | 全 `actions/checkout` 使用箇所で hit | F-2 | （実装実行時に埋める） |
| SC-5 | `grep -RnE 'github\.event\.pull_request\.head\.(ref\|sha)' .github/workflows/` | trusted (`pull_request_target`) workflow で 0 件、`pull_request` workflow の `with.ref` への代入のみ許容 | F-1 | （実装実行時に埋める） |

## 補助検査（推奨実走）

| # | コマンド | 期待結果 | 失敗時分類 | 実走結果 |
| --- | --- | --- | --- | --- |
| SC-6 | `grep -RnE '^\s*workflow_run\s*:' .github/workflows/` | 0 件（代替案 D 却下根拠） | （MAJOR / NO-GO） | （実装実行時に埋める） |
| SC-7 | `grep -RnE '\$\{\{\s*github\.event\.pull_request\.(head\.\|title\|body)' .github/workflows/` | trusted job の `run:` で 0 件 | F-1 拡張 | （実装実行時に埋める） |
| SC-8 | `grep -L 'persist-credentials:' .github/workflows/*.yml` | `actions/checkout` を含む workflow ですべて persist-credentials を明示 | F-2 | （実装実行時に埋める） |
| SC-9 | `grep -RnE '\$\{\{\s*secrets\.' .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml` | 0 件（triage / build-test 双方で secrets 不参照） | F-3 | （実装実行時に埋める） |
| SC-10 | `grep -RnE 'uses: [^@]+@(v[0-9]+\|main\|master)$' .github/workflows/` | 0 件（UT-GOV-007 SHA pin 前提） | （MAJOR / NO-GO N-3） | （実装実行時に埋める） |

## 実走時記入欄

実装実行時に以下を埋める（`spec_created` では空）。

```text
実行日時: YYYY-MM-DD HH:MM (JST)
実行者: <GitHub user>
runner: local (mise exec) / GitHub Actions
ブランチ: <branch-name>
HEAD SHA: <40-char-sha>
```

## Codex review local check（2026-04-30）

Phase 12 review 中に、承認不要で実行できるローカル静的確認だけ実施した。

| Check | コマンド | 結果 |
| --- | --- | --- |
| YAML syntax | `ruby -e "require 'yaml'; ARGV.each { \|f\| YAML.load_file(f); puts \"OK #{f}\" }" .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml` | PASS（2 workflow とも parse OK） |
| permissions | `ruby -e "require 'yaml'; ..."` | PASS（top-level `{}`、job は `triage => pull-requests: write` / `build-test => contents: read`） |
| forbidden patterns | `rg -n "secrets\\.|workflow_run|id-token|contents: write|actions: write|github\\.event\\.pull_request\\.head" .github/workflows/pr-*.yml` | PASS（`github.event.pull_request.head.sha` は untrusted `pull_request` checkout の `with.ref` のみ。`secrets.*` / `workflow_run` / write 権限なし） |
| actionlint availability | `pnpm dlx actionlint ...` / `mise exec -- npx -y actionlint ...` | BLOCKED（npm package に executable がなく、この環境では actionlint binary 不在） |

本セクションは Phase 13 承認後の GitHub Actions 実走・VISUAL evidence の代替ではない。

### SC-1 actionlint 出力

```text
# 実装実行時に埋める
# 期待: exit 0、空出力
```

### SC-2 yq permissions (triage) 出力

```text
# 実装実行時に埋める
# 期待: "{}" または null
```

### SC-3 yq permissions (build-test) 出力

```text
# 実装実行時に埋める
# 期待: "{}" または "{contents: read}"
```

### SC-4 grep persist-credentials 出力

```text
# 実装実行時に埋める
# 期待: actions/checkout 使用箇所すべてで hit する行
```

### SC-5 grep head.* eval 出力

```text
# 実装実行時に埋める
# 期待: pr-target-safety-gate.yml で 0 件、pr-build-test.yml は with.ref 代入行のみ
```

## F-1〜F-5 集計

実走後に各 F-ID の検出件数をここに記録する。MAJOR 0 件であることを Phase 9 quality-gate.md に転記。

| F-ID | 検出件数 | 該当ファイル | 対応 |
| --- | --- | --- | --- |
| F-1 | （実走後埋める） | … | … |
| F-2 | （実走後埋める） | … | … |
| F-3 | （実走後埋める） | … | … |
| F-4 | （実走後埋める） | … | … |
| F-5 | （実走後埋める） | … | … |

## 完了条件

- [x] 5 主要コマンド（SC-1〜SC-5）と期待結果を表形式で固定
- [x] 補助コマンド（SC-6〜SC-10）も期待結果と F-ID を併記
- [x] 実走部分は「Phase 13 ユーザー承認後に実装実行時に埋める」と明記
- [x] F-1〜F-5 集計欄を準備
