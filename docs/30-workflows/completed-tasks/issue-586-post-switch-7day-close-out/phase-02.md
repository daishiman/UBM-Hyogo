# Phase 2: 既存実装調査

## 目的

親 #549 で実装済みの observation script / leakage grep / hourly workflow と、現行 GitHub Variables の状態を調査し、本タスクで追加する `vars.CF_AUDIT_CLASSIFIER` 参照 / artifact upload / hourly post-step / 7day summary job の挿入位置・差替点・制約を特定する。

## 調査対象

| 対象 | 確認事項 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 既存 `env:` ブロック / job 構造 / 既定 classifier の参照位置 / production env block の有無 / hourly schedule cron の値 / artifact upload 既存有無 |
| `.github/workflows/` 配下他 workflow | 7day summary 用 workflow 名の重複がないこと（`cf-audit-log-7day-summary.yml` 不在を確認） |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | `--aggregate` フラグの引数仕様 / `--input` の directory walk 経路 / 出力 JSON の必須 field / `expectedSnapshots` の現状有無 |
| `scripts/cf-audit-log/observation/fallback-rate-alert.ts` | `--threshold` / `--consecutive-hours` の引数仕様 / `gh issue create` の発火経路 / mock 化された Octokit の境界 |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | `--exit-on-detect` フラグの実装状態 / directory scan / stdin 入力経路 |
| `scripts/cf-audit-log/__tests__/` 配下 | 既存 focused test の対象 / `expectedSnapshots: 168` 件数検証の test 有無 |
| 既存 GitHub Variables（read-only） | `gh variable list --env production` で `CF_AUDIT_CLASSIFIER` が **未設定** であること（本タスク仕様書記載通り） |
| 親 #549 `outputs/phase-12/implementation-guide.md` | runtime path × evidence 表 / canonical evidence path / `pass_runtime_synced` 状態定義 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | `pass_runtime_synced` 文言の既存有無 / 4 観測軸の記述位置 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 親 #549 entry の現行 status |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | post-switch 7 日観測手順の既存記述位置 |

## 出力

`outputs/phase-02/main.md` に以下を記録:

- 各ファイルの現行構造の要約（行数 / job 名 / steps の主要 step 名）
- `cf-audit-log-monitor.yml` の hourly job への step 挿入位置を行番号で特定（artifact upload / leakage grep post-step / fallback alert post-step）
- `post-switch-monitor.ts --aggregate` の出力 JSON schema（必須 field の現状一覧）
- `fallback-rate-alert.ts` の Issue 起票経路（`gh issue create` の cmd 構築位置）
- `secret-leakage-grep.ts --exit-on-detect` の実装状態（既実装 / 要追加）
- 7day summary workflow 新規ファイル名 `cf-audit-log-7day-summary.yml` の重複なし確認
- GitHub Variables 現状: `CF_AUDIT_CLASSIFIER` の env scope 未設定確認手順（実値表示禁止）
- SSOT 4 ファイルの `pass_runtime_synced` 文言挿入位置の特定

## 完了条件

- [ ] 上記対象すべてを実体読みして `outputs/phase-02/main.md` に要約
- [ ] `cf-audit-log-monitor.yml` への post-step 挿入位置を行番号付きで特定（hourly job 末尾の `steps:` 配下を想定）
- [ ] `post-switch-monitor.ts --aggregate` の出力 JSON 必須 field を一覧化（`expectedSnapshots` 追加要否を含む）
- [ ] `secret-leakage-grep.ts --exit-on-detect` の実装状態を確定（実装済みなら追加変更なし、未実装なら親 #549 Phase 2 既調査を再確認）
- [ ] SSOT 4 ファイルの `pass_runtime_synced` 文言 anchor を行番号で特定

## 参照資料

- `index.md`
- `phase-01.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-02.md`

## 統合テスト連携

- Phase 7 で本調査結果を test fixture / 7day summary dry-run 設計に反映

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 02 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 02-1 | hourly job への step 挿入位置を行番号で特定 |
| 02-2 | `post-switch-monitor.ts --aggregate` の I/O contract を確定 |
| 02-3 | SSOT 4 ファイルの anchor を行番号で特定 |

## 成果物/実行手順

`outputs/phase-02/main.md` を配置する。実装時は Phase 5/6 の I/O 契約と直接接続する。

## 依存Phase参照

Phase 1 の Gate decision table を上流契約として参照する。
