# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 (UT-19) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (適用実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |

## 目的

`gh api PUT .../protection` 適用時の主要な failure cases（status check context 未登録の 422 / 権限不足の 403 / ブランチ名揺れ / Environments 誤設定 / `enforce_admins=true` による admin lock / rollback 動作）を網羅的に検証し、各ケースの再現条件・症状・mitigation・防止策を記録する。AC-1〜AC-5 と整合する形で異常系の証跡を残す。

## 実行タスク

- status check context 未登録時の 422 エラーを再現または条件特定する
- 権限不足時の 403 エラーを再現または条件特定する
- ブランチ名揺れ（`develop` 残存）による誤適用ケースを検証する
- Environments の Required Reviewers 誤設定（個人開発で 1 名以上設定）の影響を検証する
- `enforce_admins=true` 設定時の admin lock を検証する
- rollback コマンド（`gh api DELETE`）の動作を検証する
- 各 failure case の mitigation 手順を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-05.md | 実行済み設定・after snapshot |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/phase-01.md | AC・4 条件評価 |
| 必須 | docs/30-workflows/ut-19-github-branch-protection-manual-apply/index.md | 苦戦箇所・知見 |
| 参考 | docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | runbook の trouble shooting セクション |

## 実行手順

### ステップ 1: failure cases のリストアップ

- index.md の苦戦箇所（status check context 未登録 / Required Reviewers 設定 / ブランチ名揺れ / Environments / enforce_admins）を起点に列挙する
- runbook の trouble shooting セクションと突き合わせ、未網羅ケースを補う

### ステップ 2: 各 failure case の検証

- 再現可能なケース（FC-01 / FC-03 / FC-06）はテストブランチで実際に再現し応答コードを記録する
- 再現不可（破壊的）なケース（FC-05 admin lock）は条件特定と回避策の机上検証に留める
- すべて `outputs/phase-06/abnormal-cases-report.md` に整理する

### ステップ 3: rollback 動作確認 と AC 整合最終確認

- 隔離用テストブランチ `test/protection-rollback` で `gh api PUT` → `gh api DELETE` のサイクルを実行
- AC-1〜AC-5 が Phase 5 の after snapshot で達成済みであることを最終確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | after snapshot を異常系検証の比較対象として使用 |
| Phase 1 | AC-1〜AC-5 の最終確認に Phase 1 の AC 定義を使用 |
| Phase 7 | 異常系検証結果を coverage matrix に反映 |

## 多角的チェック観点（AIが判断）

- 価値性: failure cases の mitigation が実運用で使える粒度で記録されているか
- 実現性: 各 failure case の発生条件が `gh api` 応答コードレベルで特定されているか
- 整合性: ブランチ名揺れ・Environments 誤設定が AC-3 / AC-4 / AC-7 と整合しているか
- 運用性: rollback コマンドが abnormal-cases-report.md 内で即時実行可能な形で示されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases リストアップ | 6 | pending | index.md 苦戦箇所参照 |
| 2 | status check context 未登録 422 検証 | 6 | pending | FC-01 |
| 3 | 権限不足 403 検証 | 6 | pending | FC-02 |
| 4 | ブランチ名揺れ誤適用検証 | 6 | pending | FC-03 |
| 5 | Environments Required Reviewers 誤設定検証 | 6 | pending | FC-04 |
| 6 | `enforce_admins=true` admin lock 検証 | 6 | pending | FC-05 机上 |
| 7 | rollback コマンド検証 | 6 | pending | FC-06 |
| 8 | AC 最終確認 | 6 | pending | AC-1〜AC-5 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/abnormal-cases-report.md | failure cases と mitigation 手順 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 全 failure cases (FC-01〜FC-06) がリストアップされている
- 各 failure case に発生条件・症状・mitigation・防止策が記載されている
- rollback コマンドの動作確認が記録されている
- AC-1〜AC-5 の最終確認が完了している
- 未解決の failure case がある場合は申し送り事項に記録されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- AC-1〜AC-5 が全て PASS であることを確認
- 未解決事項がある場合は申し送り先（次 Phase / 次タスク）を明記
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 7 (検証項目網羅性)
- 引き継ぎ事項: abnormal-cases-report.md・rollback 動作ログを Phase 7 の coverage matrix に渡す
- ブロック条件: AC-1〜AC-5 のいずれかが FAIL の場合は次 Phase に進まない

## failure cases

### FC-01: status check context 未登録による 422 エラー

| 項目 | 内容 |
| --- | --- |
| ケース名 | `required_status_checks.contexts` 未登録時の `gh api PUT` 失敗 |
| 発生条件 | `ci` / `Validate Build` ワークフローが GitHub Actions で 1 度も実行されておらず、context 名が GitHub 内部 DB に未登録 |
| 症状 | `gh api PUT .../protection` が `422 Unprocessable Entity` を返し `"Invalid status check context"` メッセージが表示される |
| 再現方法 | テスト用ブランチで CI 未実行のまま protection payload に存在しない context 名を含めて PUT する |
| mitigation | UT-05 の CI ワークフローを `workflow_dispatch` で 1 回手動実行し context を登録 → `gh api PUT` を再実行 |
| 防止策 | Phase 4 verify suite チェック 3-5 で context 登録を事前確認する |

### FC-02: 権限不足による 403 エラー

| 項目 | 内容 |
| --- | --- |
| ケース名 | `gh` CLI 認証スコープ不足による branch protection 適用拒否 |
| 発生条件 | `gh auth login` で `repo` スコープのみ付与され、`admin:repo_hook` 等の管理権限が欠落している、または collaborator が admin でない |
| 症状 | `gh api PUT .../protection` が `403 Forbidden` を返し `"Resource not accessible by integration"` または `"Must have admin rights"` が表示される |
| 再現方法 | `gh auth refresh -s repo` のみで再認証し PUT を実行する |
| mitigation | `gh auth refresh -s repo,admin:repo_hook,workflow` でスコープを再付与する |
| 防止策 | Phase 4 verify suite チェック 1-2 で admin 権限を事前確認する |

### FC-03: ブランチ名揺れ（`develop` 残存）による誤適用

| 項目 | 内容 |
| --- | --- |
| ケース名 | runbook 内に `develop` 旧ブランチ名が残存し意図しないブランチに protection を適用 |
| 発生条件 | `deployment-cloudflare.md` 等で過去に使用された `develop` がドキュメントに残り、payload 生成時に参照される |
| 症状 | `gh api PUT .../branches/develop/protection` が 404 を返す（ブランチ非存在）、または存在する場合は誤適用される |
| 再現方法 | テスト用に `develop` ブランチを作成して payload を流し込む |
| mitigation | 残存箇所を `dev` に置換、リモート上の `develop` が存在する場合は `gh api -X DELETE` で削除 |
| 防止策 | Phase 4 verify suite チェック 6-7 で `develop` 残存を事前 grep する |

### FC-04: Environments Required Reviewers 誤設定

| 項目 | 内容 |
| --- | --- |
| ケース名 | production environment に Required Reviewers を 1 名以上設定して自分自身がデプロイブロック |
| 発生条件 | UI 操作で `Required reviewers` チェックボックスを誤って ON にし、自分自身を reviewer に追加 |
| 症状 | production デプロイ時に `Waiting for review` 状態になり、自分が承認しない限りデプロイが進まない（個人開発でデッドロック） |
| 再現方法 | Settings > Environments > production で Required reviewers を 1 名以上に設定し、PR から production deploy をトリガー |
| mitigation | Settings > Environments > production の Required reviewers を 0 名に戻す |
| 防止策 | Phase 5 ステップ 3 で Required Reviewers は 0 名のまま保つことを runbook に明記 |

### FC-05: `enforce_admins=true` による admin lock

| 項目 | 内容 |
| --- | --- |
| ケース名 | `enforce_admins=true` を誤設定し、admin である自分自身が緊急修正を push できなくなる |
| 発生条件 | payload で `enforce_admins=true` を設定し、status check 失敗時に admin override が利かない状態になる |
| 症状 | admin であっても force push / direct push が拒否され、CI 失敗時の hotfix がマージできない |
| 再現方法 | テストリポジトリで `enforce_admins=true` 設定後、CI を意図的に失敗させて main に push を試みる（破壊的なため机上検証） |
| mitigation | `gh api -X PATCH .../protection/enforce_admins -F enabled=false` で即座に解除する |
| 防止策 | Phase 2 設計で `enforce_admins=false` を確定、Phase 4 verify suite で方針確認 |

### FC-06: rollback コマンドの動作不全

| 項目 | 内容 |
| --- | --- |
| ケース名 | `gh api DELETE .../protection` で rollback できない・部分的にしか削除されない |
| 発生条件 | DELETE 対象パスの誤り（`/protection/required_status_checks` のみを叩く等）、または認証スコープ不足 |
| 症状 | `404 Not Found` または `403 Forbidden`、あるいは protection の一部のみが残存する |
| 再現方法 | テストブランチで `gh api PUT` 適用後 `gh api -X DELETE .../protection` を実行し after snapshot で消失を確認 |
| mitigation | フル削除エンドポイント `/branches/{branch}/protection` を叩く。スコープ不足時は再認証 |
| 防止策 | Phase 5 runbook の rollback 手順に正しいエンドポイントを明記、Phase 4 verify suite チェック 10 で構文確認 |

## AC 最終確認

| AC | 内容 | 確認状態 | 確認方法 |
| --- | --- | --- | --- |
| AC-1 | main branch protection が適用され `ci` / `Validate Build` が登録、`required_approving_review_count = 0`、force push / deletion 禁止 | 実行時記入 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` の after snapshot 確認 |
| AC-2 | dev branch protection が main と同等に適用 | 実行時記入 | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` の after snapshot 確認 |
| AC-3 | production environment が `main` のみ・Required Reviewers 0 名 | 実行時記入 | UI: Settings > Environments > production を確認 |
| AC-4 | staging environment が `dev` のみ | 実行時記入 | UI: Settings > Environments > staging を確認 |
| AC-5 | 適用前 / 適用後の `gh api` レスポンス JSON が `outputs/phase-05/` に存在 | 実行時記入 | `ls outputs/phase-05/gh-api-{before,after}-{main,dev}.json` |
