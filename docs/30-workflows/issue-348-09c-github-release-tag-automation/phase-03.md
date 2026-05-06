# Phase 3: スクリプト I/F 設計 / `.github/workflows/release-create.yml` 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-3/phase-3.md` |

## 目的
`generate-release-notes.sh` / `create-github-release.sh` の引数・stdout・exit code 契約と、`.github/workflows/release-create.yml` のトリガ・job 構成を確定する。`scripts/cf.sh` 経由の必要性を判定する（→ `gh` のみで Cloudflare 操作なし、不要と確定）。

## 実行タスク
詳細は `outputs/phase-3/phase-3.md` を正本とする。

## 統合テスト連携
Phase 4 で `actionlint` / `shellcheck` / bats による契約検証を実施。

## 参照資料
- `outputs/phase-3/phase-3.md`
- `outputs/phase-2/phase-2.md`

## 成果物
- `outputs/phase-3/phase-3.md`

## 完了条件
- 2 スクリプトの I/F 表 / workflow のトリガ・job ステップ / `cf.sh` 不要判定の根拠が明記されている。
