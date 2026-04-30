# 手動 smoke 実走ログ — T-1〜T-5

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 11 |
| visualEvidence | VISUAL |
| ステータス | spec_created（全行 PENDING） |
| 実走トリガ | Phase 13 ユーザー承認後 |

## 凡例

- **シナリオ ID**: T-1〜T-5（`outputs/phase-4/test-matrix.md` 準拠）
- **trigger**: GitHub Actions の起動 event 種別
- **PR / branch**: 実走に使う PR 番号 or branch 名
- **実行 URL**: `gh run view <run-id> --json url -q .url` の出力
- **結果**: `PASS` / `FAIL`
- **観測事項**: 実機で観測した job 名・permissions・required status checks 名等
- **secrets 露出**: `NONE` / `LEAKED`（`gh run view --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)'` の結果）

## 実走表

| シナリオ ID | trigger | PR / branch | 実行 URL | 結果 | 観測事項 | secrets 露出 |
| --- | --- | --- | --- | --- | --- | --- |
| T-1 | `pull_request` + `pull_request_target`（same-repo） | (PENDING) | (PENDING Phase 13 ユーザー承認後) | PENDING | PENDING | PENDING |
| T-2 | `pull_request` + `pull_request_target`（fork） | (PENDING) | (PENDING Phase 13 ユーザー承認後) | PENDING | PENDING | PENDING |
| T-3 | `pull_request_target` (`labeled`) | (PENDING) | (PENDING Phase 13 ユーザー承認後) | PENDING | PENDING | PENDING |
| T-4 | `workflow_dispatch` (manual audit) | (PENDING) | (PENDING Phase 13 ユーザー承認後) | PENDING | PENDING | PENDING |
| T-5 | manual re-run（GitHub Actions UI） | (PENDING) | (PENDING Phase 13 ユーザー承認後) | PENDING | PENDING | PENDING |

## 各シナリオの確認観点（実走時に必ず記録する項目）

### T-1（same-repo PR）
- `pull_request` build-test workflow が `permissions: { contents: read }` のみで起動するか
- `pull_request_target` safety gate workflow が triage（label / コメント）のみで PR head を checkout していないか
- 両 workflow の job 名が branch protection の required status checks 名と一致するか

### T-2（fork PR）
- `pull_request_target` triage workflow が trusted context で起動し、label / コメント付与のみで完了するか
- `pull_request` build-test workflow が `contents: read` のみで起動し、secrets を参照していないか
- triage 側で PR head の checkout / install / build step が **存在しない**ことを log で確認

### T-3（labeled trigger）
- label 追加で `pull_request_target` 側のみが再実行され、build/test を invoke しないか
- 既に走った build-test の re-run が誤発火しないか

### T-4（workflow_dispatch audit）
- 手動 audit job が trusted context で走り、PR head を checkout しないか
- 走る workflow の `permissions:` が最小昇格（必要な job のみ）か

### T-5（manual re-run）
- GitHub Actions UI の Re-run all jobs で job 名が変わらないか
- `permissions:` / required status checks 名が変化しないか
- branch protection の必須 check 名と再一致するか

## 実走時の埋め方（Phase 13 承認後）

1. 各シナリオの PR / branch を準備（fork PR は別アカウントから push）。
2. 起動した run について以下を順に実行：
   ```bash
   RUN_ID=<run-id>
   gh run view "$RUN_ID" --json url -q .url
   gh run view "$RUN_ID" --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' || echo "secrets:NONE"
   gh run view "$RUN_ID" --json jobs -q '.jobs[].name'
   ```
3. 上記出力を「実行 URL / 結果 / 観測事項 / secrets 露出」列に転記。
4. 表記揺れ確認：`grep -ric "pull_request_target safety gate\|triage workflow\|untrusted build workflow\|pwn request pattern" outputs/phase-11/manual-smoke-log.md`
5. `artifacts.json` の Phase 11 status を更新。

## 補足

- `***` マスクで出力された値は secrets 露出ではない（GitHub Actions の標準マスクが機能している証跡）。マスクされていない平文での露出が出た場合のみ `LEAKED` と記載し、即時ロールバック（`outputs/phase-5/runbook.md` の git revert 手順）を実行する。
- 全シナリオが `PASS` かつ secrets 露出 `NONE` であることが AC-4 の合格条件。
