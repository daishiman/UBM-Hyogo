# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 4 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

`pull_request_target` safety gate の **dry-run シナリオマトリクス**を仕様化する。fork PR / same-repo PR / labeled / scheduled / re-run の 5 シナリオで token 露出ゼロを確認するためのテスト観点と証跡名を Phase 4 で固定する。

## 実行タスク

- `outputs/phase-4/test-matrix.md` に dry-run マトリクスを表形式で記述する：

  | ID | シナリオ | trigger | 期待挙動 | 証跡 |
  | --- | --- | --- | --- | --- |
  | T-1 | same-repo PR | `pull_request` | build/test 実行・`contents: read` のみ・secrets 非参照 | `dry-run-log.md` の T-1 セクション |
  | T-2 | fork PR | `pull_request` | build/test 実行・secrets 非参照・GITHUB_TOKEN 読み取り専用 | T-2 セクション |
  | T-3 | fork PR triage | `pull_request_target` | label 操作のみ・PR head を checkout しない | T-3 セクション |
  | T-4 | labeled trigger | `pull_request_target.types: [labeled]` | 特定 label でのみ起動・PR head 非実行 | T-4 セクション |
  | T-5 | scheduled re-run | `schedule` / `workflow_dispatch` | 手動再実行で token 露出が増えないこと | T-5 セクション |
- 各シナリオで検証する観点を統一する：(a)`permissions:` 出力ログ、(b)`actions/checkout` の `ref` と `persist-credentials`、(c)secrets 参照の有無、(d)PR head の commit SHA がジョブで eval されないこと。
- 静的検査ステップを記述する：`actionlint`、`yq '.permissions'`、`grep -n 'persist-credentials' .github/workflows/*.yml`、`grep -RnE 'github\\.event\\.pull_request\\.head\\.(ref|sha)' .github/workflows/`。
- 動的検査ステップを記述する（実走は Phase 5 以降の別 PR）：fork repo を一時作成 → PR を起こす → workflow run の logs を取得 → secrets / token が露出していないことを `gh run view --log` で grep する手順を仕様レベルで定義。
- 失敗判定基準：(F-1)`pull_request_target` workflow が PR head を checkout している、(F-2)`persist-credentials: false` が欠落、(F-3)secrets が fork build に渡る、(F-4)`permissions:` がトップレベルで広範に付与されている。F-1〜F-4 はいずれも MAJOR とし、Phase 9 quality-gate の MAJOR 0 件条件に直結させる。
- 証跡命名規約：`outputs/phase-4/test-matrix.md`、`outputs/phase-9/dry-run-log.md`（Phase 9 で実走仕様を記述）、ファイルは Phase 5 以降の実装タスクで埋める。
- test-matrix.md の必須列を `event type` / `actor` / `checkout ref` / `permissions` / `secrets access` / `expected result` / `evidence path` に固定し、後続実装タスクが証跡を同じ形で埋められるようにする。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-2/design.md`
- `outputs/phase-3/review.md`
- `https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target`
- `https://github.com/rhysd/actionlint`

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 統合テスト連携

dry-run の実走は本タスク非対象。test-matrix.md に観点・コマンド・期待挙動を仕様化し、後続実装タスクが実走時に証跡を埋める設計とする。

## 完了条件

- [ ] dry-run マトリクス T-1〜T-5 が表形式で記述されている。
- [ ] 静的検査コマンド（actionlint / yq / grep）が記述されている。
- [ ] 動的検査の手順が仕様レベルで定義されている。
- [ ] 失敗判定基準 F-1〜F-4 が MAJOR として固定されている。
- [ ] 証跡命名規約が記述されている。
- [ ] artifacts.json の Phase 4 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
