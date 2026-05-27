# Workflow: issue-255-coverage-threshold-sync-lint

## 実装区分

**実装完了ワークフロー**（Phase 1-12 は完了、Phase 13 は user 明示承認後の commit / push / PR まで blocked）。`scripts/coverage-threshold-lint.ts` / `scripts/__tests__/coverage-threshold-lint.spec.ts` / `.github/workflows/coverage-threshold-lint.yml` / `package.json` 編集まで同一サイクルで反映し、NON_VISUAL local evidence を `outputs/phase-11/evidence/` に保存した。

## 概要

GitHub Issue [#255](https://github.com/daishiman/UBM-Hyogo/issues/255) (state=**CLOSED** / Refs 運用) の要件「coverage 80% 閾値 3 点同期 lint」を、`scripts/coverage-threshold-lint.ts` という node スクリプトとして導入した。閾値は次の 3 箇所に登場する候補があり、片方だけ古い値に戻る drift を CI で検知する。

1. 正本: `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` — 表組みの `apps/web | apps/api | packages/shared` 行 / lines・branches・functions・statements 4 列
2. 実行設定 1: `scripts/coverage-guard.sh` — `^THRESHOLD=(\d+)` の値（line 22）
3. 実行設定 2: `codecov.yml`（**任意** / repo に未配置 → 出現時のみ）— `coverage.status.project.target` / `patch.target`

Codecov 未導入時は 2 点同期、`codecov.yml` 出現で 3 点に**動的拡張**する設計のため、Codecov 導入意思決定とは独立に本ワークフロー単独で完結する（CONST_007 適用）。

## Issue CLOSED と実装反映の根拠

| 検証項目 | コマンド | 結果 |
| --- | --- | --- |
| Issue state | `gh issue view 255 --json state` | `CLOSED`（user 指示で reopen せず Refs 運用） |
| script 実装 | `test -f scripts/coverage-threshold-lint.ts` | exit 0 |
| spec 実装 | `test -f scripts/__tests__/coverage-threshold-lint.spec.ts` | exit 0 |
| CI workflow 実装 | `test -f .github/workflows/coverage-threshold-lint.yml` | exit 0 |
| codecov.yml 不在 | `test -f codecov.yml` | exit 1（任意 source / 未配置） |
| 正本 80% 表記 | `grep -nE "\\| 80\\s+\\|" .claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | hit（quality-requirements-advanced.md 内の coverage 表） |
| 実行設定 80% | `grep -nE "^THRESHOLD=" scripts/coverage-guard.sh` | `THRESHOLD=80`（line 22） |

## ステータス

| 項目 | 値 |
| --- | --- |
| ブランチ | `feat/issue-255-coverage-threshold-sync-lint` |
| baseRef | `origin/dev` |
| 種別 | implementation（local implementation complete） |
| visualEvidence | `NON_VISUAL`（CLI exit code と stderr の差分テーブル評価） |
| 想定 PR base | `dev` |
| workflow_state | `implemented_local_evidence_captured` |
| Issue link | #255（CLOSED 維持 / Refs 運用） |
| 元タスク指示書 | `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md`（本ワークフローで consumed） |

## ワークフロー構成

| Phase | ファイル | 役割 |
| --- | --- | --- |
| 1 | `phase-01.md` | 要件定義（FR/NFR/DoD と Issue CLOSED の Refs 運用根拠） |
| 2 | `phase-02.md` | 影響範囲 / スコープ境界 / 参照仕様 |
| 3 | `phase-03.md` | モジュール俯瞰 / 設計方針 / 代替案比較 |
| 4 | `phase-04.md` | I/O 契約（CLI 引数 / 入出力 / exit code） |
| 5 | `phase-05.md` | データモデル（正本パース構造 / `ThresholdSource` / `LintResult`） |
| 6 | `phase-06.md` | 唯一の変更 diff（追加 / 編集ファイル一覧） |
| 7 | `phase-07.md` | 不変条件 / SSOT 整合性（CLAUDE.md 不変条件 #8、`*.spec.ts` 必須） |
| 8 | `phase-08.md` | エラーパターン / fail-fast / rollback |
| 9 | `phase-09.md` | テスト計画（vitest fixture 4 ケース最小） |
| 10 | `phase-10.md` | デプロイ手順 / CI gate 配線 |
| 11 | `phase-11.md` | NON_VISUAL local evidence（lint + focused Vitest） |
| 12 | `phase-12.md` | 実装ガイド / SSOT 同期 / skill feedback ルーティング |
| 13 | `phase-13.md` | PR 作成（多段ゲート / `dev` base / user 明示承認必須） |

## 不変条件

- CLAUDE.md 不変条件 #8: 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.ts` は禁止 / lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject）
- CLAUDE.md 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（本タスクは無関係 / 影響なしを Phase 2 で明示）
- aiworkflow-requirements 正本ファイルへの「機械可読化のための構造変更」は本タスクで**行わない**。lint 側で Markdown 表組みを正規表現で抽出する設計を取り、正本側の構造化は追加タスク化せず本タスクで吸収
- `scripts/coverage-guard.sh` の `THRESHOLD=80` は変更しない（lint の入力として読むのみ）

## 既知のスコープ外

| 事象 | 対応先 |
| --- | --- |
| Codecov 課金プラン判断 / SaaS 導入 | 本タスクのスコープ外。`codecov.yml` 出現時に lint が 2 → 3 点に動的拡張するため、Codecov 導入時に lint 側の追加変更は不要 |
| 閾値 80% そのものの変更 | 80% 維持。本タスクは drift 検知のみ |
| 正本側（quality-requirements-advanced.md）の YAML frontmatter 化 / Anchor 埋め込み | 構造化は本タスクで実施しない。正規表現抽出失敗時は exit 2（drift と区別）で fail-fast |
| coverage-guard.sh 自体のテスト追加 | issue-255 のスコープ外 |

## 後続タスクの取り扱い

`docs/30-workflows/unassigned-task/task-codecov-threshold-sync-lint-001.md` は本ワークフローで consumed し、`docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` へ移動した。

## Runbook（正本 / 実行設定の対応表）

| 役割 | パス | 抽出方法 | source name |
| --- | --- | --- | --- |
| 正本（SSOT） | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | 行 anchor `\| (apps/web\|apps/api\|packages/shared) \|` 配下の数値 4 列 | `aiworkflow-requirements` |
| 実行設定 1 | `scripts/coverage-guard.sh` | `^THRESHOLD=(\d+)` | `coverage-guard.sh` |
| 実行設定 2（任意） | `codecov.yml` | `coverage.status.project.target` / `patch.target` | `codecov.yml` |

正本値変更時の運用手順:

1. `quality-requirements-advanced.md` の 80 を新値に書き換える
2. `scripts/coverage-guard.sh` の `THRESHOLD=` 行を新値に書き換える
3. `codecov.yml` 存在時は `coverage.status.project.target` / `patch.target` を新値に揃える
4. `node --import tsx scripts/coverage-threshold-lint.ts` を実行し exit 0 を確認
5. CI で `coverage-threshold-lint` job が緑になることを確認

## Gate 構成

| Gate | 名称 | 内容 | 状態 |
| --- | --- | --- | --- |
| G0 | spec 完了 | Phase 1-12 仕様書全て作成 / gate-metadata + verify:phase12-compliance + indexes:rebuild green | passed (this cycle) |
| G1 | local 実装 PASS | `pnpm exec vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` / `pnpm lint:coverage-threshold` exit 0 | passed (this cycle) |
| G2 | CI 緑 | PR 上で `coverage-threshold-lint` job が緑 | pending |
| G3 | merge → dev | dev 上で job 緑 | pending |

G2 以降は **user 明示承認後にのみ着手**する。
