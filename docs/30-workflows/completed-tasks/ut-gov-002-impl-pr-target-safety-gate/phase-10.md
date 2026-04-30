# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 10 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

Phase 1〜9 の総和をレビュアー視点で再点検し、**Go / No-Go 判定**を `outputs/phase-10/go-no-go.md` に記録する。実装タスクの最終レビューでは、静的検査・dry-run smoke・VISUAL evidence・"pwn request" 非該当根拠・ロールバック手順・本タスク非対象の後続委譲の 6 軸で総合判定する。Phase 11 の手動 evidence 取得 / Phase 13 のユーザー承認ゲートに進む前段の最終関門として機能する。

## 実行タスク

- `outputs/phase-10/go-no-go.md` を作成し、AC × 証跡 × 判定の 3 列表で AC-1〜AC-9 を 1 行ずつ並べる。各 AC について：(a)受入条件、(b)裏付け証跡（Phase 5/8/9/11 のどこか）、(c)PASS/MINOR/MAJOR 判定の 3 列を埋める。
- **GO 条件**を独立表に明示：
  - 静的検査（actionlint / yq / grep）が全て PASS。
  - T-1〜T-5 dry-run smoke（same-repo PR / fork PR / labeled trigger / workflow_dispatch audit / manual re-run）が全て PASS で記録されている。
  - VISUAL evidence（GitHub Actions UI / branch protection 画面）のスクリーンショットが Phase 11 で揃っている。
  - "pwn request" 非該当 5 箇条の根拠が Phase 3 / 9 で重複明記されている。
  - ロールバック手順（単一 `git revert`）が Phase 5 / 10 で机上検証済み。
  - required status checks の job 名同期が `gh api` 出力で確認されている。
- **NO-GO 条件**を独立表に明示：
  - PR head の checkout / install / build が `pull_request_target` 側に残存している。
  - `persist-credentials: false` が未指定の `actions/checkout` がある。
  - `workflow_run` 経由で secrets が fork PR build に橋渡しされる経路が出現している。
  - required status checks の job 名 drift（branch protection と実 workflow の不一致）が検知されている。
  - fork PR の dry-run run logs に secrets / token 露出兆候がある。
  - 静的検査 PASS / T-1〜T-5 smoke PASS / VISUAL evidence のいずれかが揃っていない。
- **ステークホルダー提示物**：solo 運用のため必須レビュアー数は 0 だが、後続評価タスクへ提示すべき成果物を列挙する：(a) `outputs/phase-9/quality-gate.md`、(b) `outputs/phase-11/manual-smoke-log.md`、(c) `outputs/phase-11/screenshots/`、(d) `outputs/phase-8/before-after.md`、(e) `.github/workflows/pr-target-safety-gate.yml` / `pr-build-test.yml` の最終 diff。提示先は platform / devops / security の 3 ロール（実体は本人だが、後続タスク UT-GOV-002-EVAL/SEC/OBS の起動条件として記録）。
- **本タスク非対象の後続委譲**を明示：
  - secrets rotate → 別タスクで実施（trigger 条件: 本実装後の任意タイミング）。
  - OIDC 化（`id-token: write` 評価） → **UT-GOV-002-EVAL** へ委譲。
  - security review 最終署名 → **UT-GOV-002-SEC** へ委譲。
  - secrets inventory automation → **UT-GOV-002-OBS** へ委譲。
  - 委譲先タスクの起票条件・引き継ぎ事項を Phase 12 unassigned-task-detection.md に転記する旨を記述。
- ロールバック設計の最終確認：単一 revert コミットで safety gate 適用前へ戻せること、required status checks 名 drift 検知コマンド（`gh api repos/daishiman/UBM-Hyogo/branches/main/protection`）を再記録。
- レビュアー指定方針：solo 開発のため必須レビュアー数は 0。CI gate / 線形履歴 / 会話解決必須 / force push 禁止で品質を担保する旨を再確認（CLAUDE.md 準拠）。
- Go / No-Go の最終判定：MAJOR 0 件かつ AC 9/9 PASS かつ NO-GO 条件いずれも非該当の場合のみ Go。Go 判定時は Phase 11 の VISUAL evidence 取得と Phase 12 ドキュメント更新へ進む。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `index.md`（AC-1〜AC-9）
- `outputs/phase-3/review.md`
- `outputs/phase-7/coverage.md`
- `outputs/phase-8/before-after.md`
- `outputs/phase-9/quality-gate.md`
- `CLAUDE.md`（solo 運用ポリシー）

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/go-no-go.md`

## 統合テスト連携

最終レビューは仕様 / 静的検査 / dry-run 結果の総合判定に専念する。VISUAL evidence の取得自体は Phase 11 が責務。後続タスク（UT-GOV-002-EVAL/SEC/OBS）への委譲は Phase 12 が記録の正本。

## 完了条件

- [ ] go-no-go.md に AC × 証跡 × 判定の 3 列表が記述されている。
- [ ] GO 条件 / NO-GO 条件が独立表で明示されている。
- [ ] MAJOR 0 件・AC 9/9 PASS が記録されている。
- [ ] ステークホルダー提示物（5 種）が列挙されている。
- [ ] 後続委譲先（UT-GOV-002-EVAL/SEC/OBS / secrets rotate）が明記されている。
- [ ] ロールバック設計と required status checks drift 検知コマンドが再確認されている。
- [ ] レビュアー指定方針（solo 0 名 + CI gate）が再確認されている。
- [ ] Go / No-Go 判定が明示的に記録されている。
- [ ] artifacts.json の Phase 10 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
