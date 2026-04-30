# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 6 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

実 workflow 編集と dry-run 実走で防がねばならない **境界条件・失敗ケース**を `outputs/phase-6/failure-cases.md` に FC-1〜FC-8 として固定する。各失敗ケースに検出手段（静的 / 動的 / レビュー）と是正手順、Severity を必ず付与し、Phase 7 coverage と Phase 9 quality-gate がそのまま参照できる形にする。

## 実行タスク

- `outputs/phase-6/failure-cases.md` に失敗ケース 8 件を列挙する：

  | ID | 失敗ケース | Severity | 検出（静的） | 検出（動的） | 検出（レビュー） | 是正 |
  | --- | --- | --- | --- | --- | --- | --- |
  | FC-1 | `pull_request_target` workflow が PR head を checkout（`ref: ${{ github.event.pull_request.head.sha }}`） | MAJOR | `grep -RnE 'github\.event\.pull_request\.head\.(ref\|sha)' .github/workflows/pr-target-safety-gate.yml` で hit | dry-run T-3 で `gh run view --log` に PR head SHA が現れる | PR diff で triage workflow の `actions/checkout` step を red flag | safety gate workflow から checkout step を削除 |
  | FC-2 | secrets が triage job に流れる（`${{ secrets.* }}` を `pull_request_target` で参照） | MAJOR | `grep -RnE 'secrets\.' .github/workflows/pr-target-safety-gate.yml` | run log に secret 名が echo される | reviewer チェックリスト「triage で secrets 参照禁止」 | secrets を build/test side のみに限定、triage は `GITHUB_TOKEN` のみ |
  | FC-3 | `actions/checkout` の `persist-credentials: false` 未指定 | MAJOR | `grep -L 'persist-credentials: false' .github/workflows/*.yml` で空であること | run log の Setup git step で credential 保存挙動を確認 | PR diff で全 checkout に明示確認 | 全 checkout step に `persist-credentials: false` を付与 |
  | FC-4 | トップレベル `permissions:` が広範（write-all / 個別 write の濫用） | MAJOR | `yq '.permissions' .github/workflows/*.yml` で `{}` 以外 | run summary の Job permissions で広範権限を確認 | PR diff で permissions 増加に red flag | デフォルト `permissions: {}`、job 単位最小昇格に修正 |
  | FC-5 | `workflow_run` 経由で fork PR build に secrets を橋渡し | MAJOR | `grep -RnE 'workflow_run' .github/workflows/` で hit、design.md の禁止事項と照合 | dry-run で `workflow_run` triggered job に secrets が渡るか観察 | PR diff で `workflow_run` 追加を red flag | 当該 trigger を削除し、triage と build/test を分離維持 |
  | FC-6 | fork PR で build/test に secrets が流れる（`pull_request` workflow に secrets 参照が紛れ込む） | MAJOR | `grep -RnE 'secrets\.' .github/workflows/pr-build-test.yml` | dry-run T-2（fork PR）で `gh run view --log` に secret 値出現 | reviewer チェックリスト「pull_request workflow は contents:read のみ」 | secrets 参照を build/test から除去し、trusted context が必要な処理は別 workflow へ分離 |
  | FC-7 | labeled trigger の権限境界違反（`authorize` ラベルを誰でも付けられる） | MINOR | 静的では検知不可、運用ルールとして README / CODEOWNERS に明記 | dry-run T-3 で external user が label 付与可能か確認 | reviewer / maintainer 操作のみで label を許可する運用 | branch protection / repository settings で label 操作を制限 |
  | FC-8 | required status checks 名 drift（job rename 後に branch protection 未更新） | MAJOR | `gh api repos/:owner/:repo/branches/{main,dev}/protection` の `required_status_checks.contexts` と新 job 名を diff | merge できない / 旧 job 名で待機する事象 | PR diff で job 名変更時に UT-GOV-004 連携 | branch protection の contexts を新 job 名に同期、Phase 12 で UT-GOV-004 追従起票 |

- 各 FC の Severity は MAJOR=6 / MINOR=2 とする。MAJOR は Phase 9 quality-gate の「MAJOR 0 件」要件に直結。
- 回帰防止チェックリスト（PR reviewer 用）を 5 項目記述：① triage workflow に checkout が無いか / ② 全 checkout に `persist-credentials: false` / ③ デフォルト permissions が `{}` / ④ `workflow_run` の追加が無いか / ⑤ job 名変更時に branch protection contexts を同期。
- レポート規約：失敗ケース検出時は GitHub Issue を `security` ラベル付きで起票し、Phase 12 unassigned-task-detection.md にも記録する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-6/failure-cases.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-3/review.md`
- https://securitylab.github.com/research/github-actions-preventing-pwn-requests/

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 統合テスト連携

FC-1〜FC-8 は Phase 5 Step 4（静的検査）と Step 5（dry-run 実走）でアクティブに検査される。Phase 7 coverage で T-1〜T-5 とのクロス表に、Phase 9 quality-gate で MAJOR 0 件判定に使用される。

## 完了条件

- [ ] failure-cases.md に FC-1〜FC-8 が表形式で列挙されている。
- [ ] 各 FC に静的 / 動的 / レビューの 3 検出手段と是正手順が記述されている。
- [ ] MAJOR 7 件 / MINOR 1 件の Severity 分類が固定されている。
- [ ] 回帰防止チェックリスト 5 項目が記述されている。
- [ ] レポート規約（GitHub Issue + security label + Phase 12 連携）が記述されている。
- [ ] artifacts.json の Phase 6 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
