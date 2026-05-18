# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | issue-290-workflow-lint-gate |
| 作成日 | 2026-05-17 |

## レビュー観点

### 1. glob 化のリスク

| リスク | 対策 |
| --- | --- |
| 一時的に追加した検証用 yaml が誤検査される | `.github/workflows/` 配下は production workflow に限定する運用ルールを `index.md` で明記 |
| actionlint バージョン固定なし → CI ホスト変化で動作差分 | `download-actionlint.bash` 末尾にバージョン指定（`1.7.7` 等）を追加して固定 |

### 2. 自己 lint 重複の許容判断

`verify-gate-metadata.yml` (`line 41-48`) と `audit-correlation-verify.yml` (`line 66-69`) は、自身の job が成立する前段で自己 lint を行っている。これは「job 単位独立性」「他 workflow に依存しない fail-fast」のため意図的構成であり、`ci.yml` の全件 glob lint と重複しても**保持**する。

### 3. yamllint 不採用の妥当性

actionlint は内部で YAML パーサを利用しており、YAML 構文エラーは actionlint が `syntax-check` で検出する。代替を別途置く必要は薄い。

### 4. runbook の正本順位

`docs/30-workflows/runbooks/workflow-lint-local-recovery.md` を正本とする。`CLAUDE.md` は本タスクでは変更しない。workflow lint の具体手順は runbook と aiworkflow-requirements の deployment GHA 正本へ集約する。

## 俯瞰: 対象モジュール一覧

| モジュール | 役割 |
| --- | --- |
| `.github/workflows/ci.yml` の `workflow-shell-lint` job | actionlint 実行点（拡張対象） |
| `.github/workflows/verify-gate-metadata.yml` の actionlint step | 自己 lint（保持） |
| `.github/workflows/audit-correlation-verify.yml` の actionlint step | 自己 lint（保持） |
| `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` | runbook 正本（新規） |

## 設計承認

- [ ] glob 化方針承認
- [ ] yamllint 不採用承認
- [ ] runbook 正本パス承認
- [ ] actionlint バージョン固定方針承認
