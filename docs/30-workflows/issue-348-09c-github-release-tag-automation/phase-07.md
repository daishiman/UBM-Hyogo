# Phase 7: GitHub Actions workflow 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |
| 実装区分 | 実装仕様書 |

## 目的
`.github/workflows/release-create.yml` の `on` トリガ・`permissions`・job steps・必要 secrets・actionlint 適合条件を仕様化する。tag push と `workflow_dispatch` の 2 トリガで `bash scripts/release/create-github-release.sh --apply --tag $TAG` を実行する。

## 実行タスク
詳細は `outputs/phase-7/phase-7.md` を正本とする。

## 統合テスト連携
Phase 4 で設計した actionlint clean を Phase 10 で確認し、Phase 11 で既存 tag を使った 1 件 release 作成 evidence を取得する。

## 参照資料
- `outputs/phase-7/phase-7.md`
- Phase 5 / 6 の script・template 仕様

## 成果物
- `outputs/phase-7/phase-7.md`
- `.github/workflows/release-create.yml`（仕様確定）

## 完了条件
- Phase 7 正本ファイルが存在する。
- `on.push.tags` / `on.workflow_dispatch.inputs.tag` の両トリガ設計が仕様化されている。
- `permissions: contents: write` と `GITHUB_TOKEN` のみで動作することが確定している。
- actionlint clean を満たす YAML 構造が仕様化されている。
