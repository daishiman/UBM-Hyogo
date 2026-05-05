# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 11 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

本タスクは `visualEvidence: VISUAL` のため、**Phase 11 が evidence 取得の正本**となる。same-repo PR / fork PR / labeled trigger / workflow_dispatch audit / manual re-run の T-1〜T-5 dry-run smoke を実走し、各 run の `gh run view --log` で secrets / token 露出ゼロを目視確認、GitHub Actions UI と branch protection の required status checks 画面のスクリーンショットを保存して、AC-4 / AC-5 を実証する。`spec_created` 時点ではこれらは未実施であり、本 Phase は承認後の実行手順と証跡要件を固定する。

## 実行タスク

- `outputs/phase-11/manual-smoke-log.md` を作成し、T-1〜T-5 smoke の実走記録を表形式で残す。各行に：シナリオ ID（T-1〜T-5）、trigger 種別、PR / branch、実行 URL（`gh run view <run-id> --json url -q .url`）、結果（PASS/FAIL）、観測事項、secrets 露出有無 を記録する。
- T-1〜T-5 smoke の実走手順：
  - **T-1（same-repo PR）**：同一リポジトリ branch から PR を作成し、`pull_request_target` と `pull_request` の双方が想定通り分岐することを確認。
  - **T-2（fork PR）**：fork から PR を作成し、`pull_request_target` の triage workflow が走り label / コメントが付与されること、`pull_request` の build/test workflow が `permissions: { contents: read }` のみで走ることを確認。
  - **T-3（labeled trigger）**：label 追加時に `pull_request_target` 側の job が再実行され、build/test を invoke しないことを確認。
  - **T-4（workflow_dispatch audit）**：手動 audit job が trusted context で走り、PR head を checkout しないことを確認。
  - **T-5（manual re-run）**：GitHub Actions UI の re-run で job 名・permissions・required status checks 名が変化しないことを確認。
- secrets / token 露出ゼロの目視確認手順：
  - 各 run について `gh run view <run-id> --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' || echo OK` を実走。
  - `***` マスク以外で secrets が出現しないことを確認。マスクされていても出力先（環境変数名）が想定外でないことを目視確認。
  - 結果を manual-smoke-log.md の各行に記録。
- スクリーンショット取得：
  - `outputs/phase-11/screenshots/` に保存。最低枚数は 7 枚（T-1〜T-5 の GitHub Actions UI 各 1 枚 + branch protection main/dev 各 1 枚）に固定する。
  - 命名規則：`<scenario>-<view>-<date>.png`（例: `fork-pr-actions-ui-2026-04-30.png` / `branch-protection-main-required-checks-2026-04-30.png` / `same-repo-pr-actions-ui-2026-04-30.png` / `labeled-trigger-actions-ui-2026-04-30.png` / `workflow-dispatch-audit-actions-ui-2026-04-30.png`）。
  - `outputs/phase-11/screenshots/README.md` を作成し、ファイル一覧 / 撮影日時 / 各画像で確認できる内容（job 名・status・required check 一覧）/ 機微情報マスク有無を表形式で記述。
- required status checks の同期確認：`gh api repos/daishiman/UBM-Hyogo/branches/main/protection -q '.required_status_checks.contexts'` および `branches/dev/protection` の出力と、Actions UI 上の job 名・branch protection 画面の required check 名が一致するスクリーンショットを保存。
- 想定読者の到達経路を確認：(a) レビュアーが `index.md` → `phase-10.md` → `outputs/phase-10/go-no-go.md` → `outputs/phase-11/manual-smoke-log.md` / `screenshots/` に到達できる、(b) 後続評価タスク（UT-GOV-002-EVAL/SEC/OBS）担当者が `outputs/phase-11/screenshots/` から VISUAL evidence を引用できる経路。
- 表記整合最終確認：4 用語（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）の表記揺れゼロを `grep -ric` で確認。
- artifacts.json と本文の status 同期最終確認：13 Phase の status を `jq '.phases[] | "\(.phase) \(.status)"' artifacts.json` で抽出し、index.md / phase-NN.md と突き合わせる。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`
- `artifacts.json`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-5/runbook.md`
- `outputs/phase-9/quality-gate.md`
- `outputs/phase-10/go-no-go.md`
- `.github/workflows/pr-target-safety-gate.yml`
- `.github/workflows/pr-build-test.yml`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/screenshots/`（少なくとも 7 枚 + README.md）
- `outputs/phase-11/screenshots/README.md`

## 統合テスト連携

本 Phase は VISUAL evidence の取得と smoke 実走の正本。AC-4（T-1〜T-5 smoke + secrets 露出ゼロ）と AC-5（GitHub Actions UI / branch protection スクリーンショット）の両方を実証する。Phase 12 のドキュメント更新で本 Phase の証跡を `documentation-changelog.md` から相互リンクする。

## 完了条件

- [ ] manual-smoke-log.md に T-1〜T-5 の実行 URL と結果が記録されている。
- [ ] 各 run について secrets / token 露出ゼロが `gh run view --log` 出力で確認されている。
- [ ] `outputs/phase-11/screenshots/` に命名規則準拠のスクリーンショットが 7 枚以上保存されている。
- [ ] `outputs/phase-11/screenshots/README.md` にファイル一覧と各画像の説明が記述されている。
- [ ] required status checks の job 名同期が Actions UI / branch protection 画面のスクリーンショットで確認されている。
- [ ] 想定読者の 2 経路（レビュアー / 後続評価担当）が確認されている。
- [ ] 表記ゆれゼロが `grep` 結果で確認されている。
- [ ] artifacts.json と本文の status 同期が確認されている。
- [ ] artifacts.json の Phase 11 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
