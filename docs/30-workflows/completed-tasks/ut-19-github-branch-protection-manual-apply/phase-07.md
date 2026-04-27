# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |

## 目的

AC-1〜AC-7 の全受入条件に対して検証項目が完全にトレースされていることを確認し、漏れがある場合は補完する。docs-only タスクとして `gh api` レスポンスおよび GitHub UI 確認結果が証跡として記録される構造を担保する。個人開発方針（`enforce_admins=false` / Required Reviewers 0 / CI ゲートのみ）が AC を通じて全 Phase に反映されているかを点検する。

## 実行タスク

- AC matrix を作成し AC-1〜AC-7 を全トレースする
- 各 AC に対応する検証項目と証跡（`gh api` JSON / UI スクリーン記録 / runbook 章）の所在を明確化する
- 設定項目 × 確認手段（`gh api` / GitHub UI）の線カバレッジ的マトリクスを作成する
- 未確認項目を洗い出し、対応 Phase（5 / 6 / 11）を割り当てる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | AC 定義の正本 |
| 必須 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 適用コマンド・確認手段の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本（dev / main） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 全体方針 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: AC matrix の作成

- index.md の AC-1〜AC-7 を再読する
- 各 AC に対応する検証項目（API 項目 / UI 項目 / grep 結果）を列挙する
- 各検証項目の証跡パスと担当 Phase を特定する

### ステップ 2: 設定項目 × 確認手段マトリクスの作成

- branch protection / Environments の各設定項目に対し、`gh api` で確認可能か / UI でしか確認できないかを区別する
- 二重確認（API + UI）が必要な項目を特定する
- 確認手段が一意でない項目を未確認候補として洗い出す

### ステップ 3: 整合性の確認と handoff

- ランブック（`repository-settings-runbook.md`）の各手順が AC のどれを充足するかを対応付ける
- Phase 10 の GO/NO-GO 判定で使用する AC トレース結果を outputs に保存する
- 次 Phase (Phase 8) に渡す open question（DRY 化対象の差分箇所）を記録する

## AC matrix（AC-1〜AC-7 全トレース）【必須】

| AC | 内容 | 検証項目 | 証跡パス | 担当 Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | main branch protection 適用（contexts=ci/Validate Build, reviews=0, force_pushes=false, deletions=false） | `gh api .../branches/main/protection` の各キー値検証 | outputs/phase-05/gh-api-after-main.json | Phase 5 | pending |
| AC-2 | dev branch protection 適用（main と同等） | `gh api .../branches/dev/protection` の各キー値検証 | outputs/phase-05/gh-api-after-dev.json | Phase 5 | pending |
| AC-3 | production environment のブランチポリシー main のみ / Required Reviewers 0 | GitHub UI（Settings > Environments > production）目視 + smoke test | outputs/phase-11/manual-smoke-log.md | Phase 11 | pending |
| AC-4 | staging environment のブランチポリシー dev のみ | GitHub UI（Settings > Environments > staging）目視 | outputs/phase-11/manual-smoke-log.md | Phase 11 | pending |
| AC-5 | 適用前/後の `gh api` レスポンスが outputs/phase-05/ に保存 | 4 ファイル（before/after × main/dev）の存在確認 | outputs/phase-05/gh-api-*.json | Phase 5 | pending |
| AC-6 | runbook 手順と実適用結果に乖離なし | runbook の各コマンドが実行ログ（apply-execution-log.md）と一致 | outputs/phase-08/runbook-dry-diff.md | Phase 7 / Phase 8 | pending |
| AC-7 | `develop` 旧名がドキュメントに残存していない | `grep -rn "develop" docs/ .github/` の空一致確認 | outputs/phase-06/abnormal-cases-report.md | Phase 6 | pending |

## 設定項目 × 確認手段マトリクス【必須】

| 設定項目 | 期待値 | gh api | GitHub UI | 担当 Phase |
| --- | --- | --- | --- | --- |
| main: required_status_checks.contexts | `["ci","Validate Build"]` | ○ | ○ | Phase 5 |
| main: required_status_checks.strict | `true` | ○ | ○ | Phase 5 |
| main: required_pull_request_reviews.required_approving_review_count | `0` | ○ | ○ | Phase 5 |
| main: enforce_admins | `false` | ○ | ○ | Phase 5 |
| main: allow_force_pushes | `false` | ○ | ○ | Phase 5 |
| main: allow_deletions | `false` | ○ | ○ | Phase 5 |
| dev: 上記同等 | main と同一 | ○ | ○ | Phase 5 |
| production env: ブランチポリシー | `main` のみ | △（部分） | ○ | Phase 11 |
| production env: Required Reviewers | 0 名 | △（部分） | ○ | Phase 11 |
| staging env: ブランチポリシー | `dev` のみ | △（部分） | ○ | Phase 11 |
| `develop` 旧名残存 | 0 件 | × | × (grep) | Phase 6 |

> 凡例: ○=確認可能 / △=部分的に可能 / ×=対象外。Environments の細部は `gh api` だけでは取り切れないため UI 併用とする。

## 未確認項目の洗い出し

| 項目 | 想定リスク | 対応 Phase | 解消方法 |
| --- | --- | --- | --- |
| Environments の Required Reviewers が UI で 0 名となっているか | 個人開発方針違反（自分自身がブロック） | Phase 11 | UI スクリーン目視 + smoke test |
| `dev` ブランチが未作成のまま protection 適用試行 | 422 エラー | Phase 6 | 事前に `git push origin dev` |
| status context 大文字小文字の揺れ（`Validate Build` vs `validate build`） | 適用後も CI ゲートが効かない | Phase 5 / Phase 6 | 実際の Actions 実行ログから context 名を写経 |
| `enforce_admins=true` への誤設定 | 緊急修正がブロックされる | Phase 5 | 適用後 JSON で `false` 確認 |

## 個人開発方針との整合確認

| 不変条件 | 該当 AC | 検証手段 | 状態 |
| --- | --- | --- | --- |
| Required Reviewers 0 名 | AC-1 / AC-2 / AC-3 | gh api + UI | pending |
| enforce_admins=false | AC-1 / AC-2 | gh api | pending |
| CI ゲートのみ必須 | AC-1 / AC-2 | gh api（contexts のみ非空） | pending |
| `develop` 旧名排除 | AC-7 | grep | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 適用結果 JSON が AC-1 / AC-2 / AC-5 の証跡として機能しているか確認 |
| Phase 6 | 異常系検証（422 / 403 / branch名揺れ）が AC-7 の証跡として機能しているか確認 |
| Phase 8 | runbook と実適用の差分（AC-6）を DRY 化観点で詳細化 |
| Phase 10 | AC matrix を GO/NO-GO 判定の根拠として使用 |
| Phase 11 | Environments の UI 確認（AC-3 / AC-4）を smoke test として実施 |

## 多角的チェック観点（AIが判断）

- 価値性: 全 AC に検証項目・証跡パス・担当 Phase が割り当てられ、漏れが Phase 10 GO/NO-GO 判定前にゼロになるか。
- 実現性: docs-only タスクとして API レスポンス JSON と UI 目視ログのみで AC を充足できる構造か。
- 整合性: 個人開発方針（reviews=0, enforce_admins=false）が全 AC を通じて貫徹されているか。
- 運用性: 後続タスク（UT-05 / UT-06）が AC matrix を見るだけで現状を把握できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | pending | outputs/phase-07/coverage-matrix.md |
| 2 | 設定項目×確認手段マトリクス作成 | 7 | pending | gh api / UI の二軸 |
| 3 | 未確認項目の洗い出し | 7 | pending | 後続 Phase に割り当て |
| 4 | 個人開発方針整合確認 | 7 | pending | reviews=0 / enforce_admins=false |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/coverage-matrix.md | AC × Phase トレース表 + 設定項目 × 確認手段マトリクス |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- AC-1〜AC-7 の全行に検証項目・証跡パス・担当 Phase が記載されている
- 設定項目 × 確認手段マトリクスが gh api / UI の二軸で完成している
- 未確認項目が後続 Phase（5 / 6 / 11）に割り当て済みである
- 個人開発方針との整合（reviews=0, enforce_admins=false, CI ゲートのみ）が確認されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（422 / 403 / branch名揺れ）も AC-7 経由で検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: AC matrix の完成状態と「runbook と実適用の差分（AC-6）」を Phase 8 に引き継ぐ。
- ブロック条件: AC matrix が未作成、または個人開発方針の整合確認が未完なら次 Phase に進まない。
