# Phase 13: commit / PR

## 13.1 ユーザー承認ゲート

このフェーズの commit / push / PR 作成は **すべてユーザー明示承認後にのみ実行**。本仕様書の作成段階では未実行。

## 13.2 想定 commit 構成

```
feat(issue-900): add top-level permissions to 12 workflows for least-privilege hardening

- backend-ci.yml / d1-migration-verify.yml / e2e-tests.yml / lighthouse.yml /
  playwright-smoke.yml / playwright-visual-baseline-update.yml /
  playwright-visual-full.yml / validate-build.yml / verify-design-tokens.yml /
  verify-esbuild.yml / verify-primitive-adoption.yml / web-cd.yml
  に top-level `permissions: contents: read` を追加。
- 既存 job-level permissions（write 系）は不変。
- `scripts/verify-workflow-top-level-permissions.sh` を追加し
  `ci.yml` の actionlint step 直後に verify step を追加。

Refs: #900
```

## 13.3 PR 作成

```bash
# base = dev（既定）
gh pr create --base dev --title "feat(issue-900): top-level workflow permissions least-privilege audit" \
  --body-file docs/30-workflows/completed-tasks/issue-900-workflow-permissions-least-privilege-audit/outputs/phase-13/pr-body.md
```

## 13.4 PR body 構成

`outputs/phase-13/pr-body.md` には以下を含める:
- Summary（3 行）
- 変更ファイル一覧（12 workflows + verify script + ci.yml 修正）
- Phase 9 QA gate 結果（4 ゲート全 PASS）
- 不変条件チェック結果（required context 不変・既存 job-level 維持）
- スクリーンショット: なし（NON_VISUAL）

## 13.5 issue 連携

issue #900 は CLOSED 状態を **維持** する（ユーザー指示）。本 PR 内で issue を再 open しない。PR description に `Refs #900` のみ記載し、PR merge 後の自動 close 発火を避ける（`Fixes #900` は使わない）。

## 13.6 Gate-C: マージ前最終チェック

- [ ] 全 required status check green
- [ ] actionlint green
- [ ] `verify-workflow-top-level-permissions.sh` step green
- [ ] visual baselineupdate workflow 自体が新たに red になっていない（job-level write 権限維持の証跡）
- [ ] ユーザー明示承認
