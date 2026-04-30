# Phase 2 — 設計（main）

## Status

spec_created

> 本書は Phase 2 の概要であり、実装設計の詳細は併存する `design.md` に記述する。本タスクは **実 workflow ファイル編集** を前提とした設計であり、上流 dry-run 仕様（草案 YAML）から **実投入 YAML 設計** へ再構成している。

## 1. Phase 2 の目的

Phase 1 で固定した真の論点 (a)〜(d) と上流 dry-run の責務分離設計を、**実ファイル `.github/workflows/pr-target-safety-gate.yml` および `.github/workflows/pr-build-test.yml` の編集差分**として落とし込む。Phase 5 runbook が参照する diff 構造、permissions 階層、required status checks の job 名同期方針、ロールバック粒度を `design.md` で確定する。

## 2. 主要な設計決定（要約）

| 決定 | 詳細 |
| --- | --- |
| triage workflow の trigger | `pull_request_target`（types: `opened` / `synchronize` / `labeled` / `reopened`） |
| triage の checkout 方針 | PR head は checkout しない。必要時のみ `ref: ${{ github.event.pull_request.base.sha }}` |
| build/test workflow の trigger | `pull_request`（types: `opened` / `synchronize` / `reopened`） |
| build/test の permissions | `permissions: { contents: read }` のみ（job 単位） |
| workflow デフォルト | 両 workflow とも top-level `permissions: {}` |
| `persist-credentials` | 全 `actions/checkout` で `false` 強制 |
| ロールバック | 単一 `git revert` コミット粒度 |
| job 名同期 | `pr-target-safety-gate / triage` および `pr-build-test / build-test` を branch protection contexts と一致させる |

詳細は `design.md` を参照。

## 3. 上流 dry-run 仕様との差分

| 項目 | 上流 dry-run | 本 IMPL タスク |
| --- | --- | --- |
| YAML の扱い | 構造方針の参照用 draft（`*.workflow.yml.draft`） | **実ファイル投入**（`.github/workflows/*.yml`） |
| build workflow 名 | `pr-untrusted-build.yml` | `pr-build-test.yml`（既存命名規約に整合） |
| 検証 | docs-only / 静的検査未実走 | actionlint / yq / grep の **実走**＋ 4 系統 dry-run |
| evidence | NON_VISUAL | **VISUAL**（GitHub Actions UI / branch protection screenshot） |

## 4. 成果物への相互参照

- `outputs/phase-2/design.md`：実装設計の正本（責務分離 / permissions / "pwn request" 非該当 5 箇条 / ロールバック / 棚卸し方針）
- `outputs/phase-1/main.md`：要件入力
- `outputs/phase-3/review.md`：本設計に対するレビュー署名

## 5. 完了条件チェック

- [x] 責務分離設計（実ファイルパス付き）を design.md に記述
- [x] workflow デフォルト `permissions: {}` ＋ job 単位最小昇格を design.md に記述
- [x] 全 `actions/checkout` への `persist-credentials: false` 強制を design.md に記述
- [x] "pwn request" 非該当 5 箇条を実装側検証手段とともに表化
- [x] ロールバック設計（単一 revert）と required status checks 名 drift 検知コマンドを記述
- [x] required status checks の job 名同期方針を記述
