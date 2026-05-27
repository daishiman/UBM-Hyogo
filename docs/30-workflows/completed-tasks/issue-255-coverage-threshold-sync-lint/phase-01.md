# Phase 1: 要件定義

> **実装区分: 実装仕様書**。本ワークフローでは Phase 1-12 の仕様書のみを作成し、コード実装そのものは行わない。Phase 13 の commit / push / PR は user 明示承認後に着手する。GitHub Issue #255 は CLOSED のまま Refs 運用とする（user 指示で reopen しない）。

## 1.1 Issue 状態と Refs 運用の根拠

Issue #255 (`[U-5] coverage threshold 3点同期 lint`) は **state=CLOSED** だが、コード/CI/spec はいずれも未着手である:

| 検証項目 | 期待 | 実測 | 結論 |
| --- | --- | --- | --- |
| `gh issue view 255 --json state -q .state` | `CLOSED` | `CLOSED` | CLOSED 維持（Refs 運用） |
| `test -f scripts/coverage-threshold-lint.ts` | absent | exit 1（不在） | 未実装 |
| `test -f scripts/__tests__/coverage-threshold-lint.spec.ts` | absent | exit 1（不在） | 未実装 |
| `test -f .github/workflows/coverage-threshold-lint.yml` | absent | exit 1（不在） | CI job 未配線 |
| `test -f codecov.yml` | optional | exit 1（不在） | 任意 source / 未配置 |
| `grep -nE "^THRESHOLD=" scripts/coverage-guard.sh` | `THRESHOLD=80` | `22:THRESHOLD=80` | 実行設定は 80 |
| `grep -nE "\\| 80" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | hit | hit | 正本も 80 |

初期状態では「CLOSED かつ実装未着手」が機械的に確定していた。CLOSED issue の reopen はせず、本ワークフローを Refs として参照し、同一サイクルで実装まで反映した。

## 1.2 不具合・課題の事実関係

coverage 80% 閾値は次の 3 箇所に登場する候補がある:

1. **正本 (SSOT)**: `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` — `apps/web | apps/api | packages/shared` の coverage 表の `lines | branches | functions | statements` 4 列
2. **実行設定 1**: `scripts/coverage-guard.sh` — line 22 の `THRESHOLD=80`
3. **実行設定 2（任意）**: `codecov.yml` — `coverage.status.project.target` / `patch.target`（現状未配置）

3 箇所の手動同期は誤りやすく、PR レビューでも見落とされる。Codecov 導入時には SaaS 表示と CI hard gate の基準が乖離するリスクがある。

## 1.3 真因の確定（Why）

| 階層 | 内容 |
| --- | --- |
| 観測 | 正本と実行設定の値が手動で同期される構造で、片方だけ古い値に戻る drift が発生し得る |
| 直接原因 | 整合 lint が存在しないため、PR diff で 1 箇所だけ更新されても CI が pass する |
| 一段上 | aiworkflow-requirements は Markdown 表組み形式で機械可読でなく、正規表現での抽出が前提となる |
| 根本 | 同じ数値を複数ファイルに手書きする運用 + 検証 gate 不在 |

## 1.4 機能要件

| ID | 要件 |
| --- | --- |
| FR-1 | `scripts/coverage-threshold-lint.ts` が 2 または 3 source を読み、不一致時に exit 1 し stderr に差分テーブルを出す |
| FR-2 | `codecov.yml` 不在時は 2 source、存在時は 3 source で動的に判定する |
| FR-3 | 全 source 一致時に exit 0 と stdout `coverage-threshold-lint: OK (sources=<N>, threshold=<value>)` を出す |
| FR-4 | 正本（aiworkflow-requirements）の値抽出に失敗した場合は exit 2 で fail-fast（drift exit 1 と区別） |
| FR-5 | CI workflow `coverage-threshold-lint` が PR 上で pass/fail を反映する |
| FR-6 | `package.json` に `lint:coverage-threshold` script を追加し、ローカル実行を統一する |

## 1.5 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-1 | 実行時間は 1 秒以内（ファイル read + 正規表現のみ） |
| NFR-2 | 依存追加なし（`js-yaml` は使わず、`codecov.yml` の `target:` 行を行 anchor の正規表現で抽出） |
| NFR-3 | スクリプトは `--import tsx` 経由で実行（既存 monorepo の慣例に整合） |
| NFR-4 | テストファイルは `*.spec.ts`（CLAUDE.md 不変条件 #8） |
| NFR-5 | スクリプト本体は副作用なし（read-only / stdout / stderr / exit のみ） |
| NFR-6 | 引数 `--json` で機械可読出力を提供する |

## 1.6 完了条件 (DoD)

| ID | 条件 | 検証方法 |
| --- | --- | --- |
| DoD-1 | `pnpm typecheck` PASS | `mise exec -- pnpm typecheck` |
| DoD-2 | `pnpm vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` PASS | 4 fixture（一致 / 不一致 / codecov.yml 有無 / SSOT パース失敗） |
| DoD-3 | `node --import tsx scripts/coverage-threshold-lint.ts` exit 0 | 現状 80 / 80 一致のため |
| DoD-4 | CI workflow が PR で fail/pass を正しく反映 | 値を意図的に 70 に変えた dry-run で fail を確認 |
| DoD-5 | runbook に正本/実行設定の対応表 | `index.md` の Runbook セクションに記載済み |

## 1.7 受入条件（Issue #255 AC との対応）

| Issue AC | 対応 phase | 充足条件 |
| --- | --- | --- |
| AC-1: `scripts/coverage-threshold-lint.ts` が 3 ソースを読み比較・差分時 exit 1 | Phase 4 / 6 | I/O 契約と diff 一覧に明示 |
| AC-2: CI に `coverage-threshold-lint` job 追加 | Phase 10 | `.github/workflows/coverage-threshold-lint.yml` を独立 workflow として追加 |
| AC-3: `aiworkflow-requirements` を正本、他を実行設定とする対応表が runbook に明記 | `index.md` Runbook | 既記載 |
| AC-4: Codecov 未導入時は 2 点同期、`codecov.yml` 出現で 3 点に動的拡張 | Phase 3 / 4 | dynamic source selection 設計に組み込み済み |
