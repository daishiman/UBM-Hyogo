# Phase 1 成果物 — 要件定義

## 1. 背景

`task-github-governance-branch-protection` Phase 2 / Phase 12 で、dev / main の branch protection JSON 草案（`required_status_checks` / `enforce_admins` / `required_pull_request_reviews=null`（solo 運用） / `required_linear_history` / `required_conversation_resolution` / `allow_force_pushes=false` / `allow_deletions=false`）が策定され、Phase 13 で承認された。CLAUDE.md ブランチ戦略（`feature/* → dev → main` / solo 運用のため必須レビュアー不要）と整合する草案だが、現時点で GitHub repository settings に未適用であり、main / dev に直 push 可能・force push 可能・branch 削除可能な無防備な状態が続いている。本ワークフローは、その草案を REST API `PUT /repos/{owner}/{repo}/branches/{branch}/protection` schema に正規化された adapter 出力として実適用する PR の **タスク仕様書整備**のみに閉じる（実 PUT は Phase 13 ユーザー承認後の別オペレーション）。

## 2. 課題（why this task）

| # | 課題 | 影響 |
| --- | --- | --- |
| C-1 | 草案 JSON は出力済みだが GitHub 側の真の状態は未強制で main / dev に直 push 可能 | governance 草案が事実上強制されない / Phase 13 承認の意義が失われる |
| C-2 | `required_status_checks.contexts` の実 job 名は UT-GOV-004 で同期するため、未同期で投入すると永続的に green にならず PR 全 block（merge 不能事故） | 緊急 hotfix を含む全 PR が止まる（親仕様 §8.2） |
| C-3 | 適用前の現行 protection を保全しないと、誤適用時の rollback 経路が無い | rollback リハーサル不能 |
| C-4 | `enforce_admins=true` を盲目的に投入すると admin 自身（solo 運用では自分自身）が即時 block され、CI 失敗時に main hotfix 不能（親仕様 §8.4） | production incident 時に対応経路詰み |
| C-5 | GET 応答の field 構造（ネスト型 `enabled` / `users` / `teams` / `apps`）と PUT payload の構造（flatten `restrictions: { users: [], teams: [], apps: [] }` 等）の差異により、GET 結果をそのまま PUT すると 422（親仕様 §8.1） | 適用作業が本番で常時 422 になる |
| C-6 | dev / main 払い出しを bulk 化すると片側適用ミスが起きやすい（親仕様 §8.5） | 片方の branch のみ governance 強制という非対称状態 |

## 3. AC（受入条件）

AC-1〜AC-14 は `index.md` §受入条件と同期。本 Phase で blocker は検出されず、Phase 2（設計）へ進行可能。要点を再掲：

- **AC-1〜AC-2**: snapshot 保全 + adapter 正規化済み payload を Git 管理ファイルとして固定
- **AC-3 + AC-12**: UT-GOV-004 完了必須（3 重明記）。未完了時は contexts 空配列の 2 段階適用にフォールバック
- **AC-4**: dry-run（差分プレビュー）承認 → 本適用 PUT の手順厳守
- **AC-5〜AC-6**: 適用結果の applied JSON 保存 + snapshot からの rollback リハーサル double-apply
- **AC-7**: `enforce_admins=true` rollback 経路と担当者の明記、rollback 用 payload 事前生成
- **AC-8**: CLAUDE.md と GitHub 実値の grep 確認（二重正本 drift 防止）
- **AC-9**: dev / main 別ファイル戦略（bulk 化禁止）
- **AC-10**: `lock_branch=false` 明示
- **AC-11**: GET/PUT field 差異の adapter 正規化（最低限リスト）
- **AC-13〜AC-14**: 4 条件 PASS / Phase 1〜13 状態整合

## 4. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dev / main の direct push / force push / 削除 / 必須 check 未通過 merge を構造的に block。Phase 13 承認の意義が確定し、後続 UT-GOV-002〜007 の前提「protected な dev / main」が成立 |
| 実現性 | PASS | `gh api` + jq + payload の Git 管理は既存技術範囲。UT-GOV-004 同時完了でも `contexts` 空配列で 2 段階適用に逃せる |
| 整合性 | PASS | 不変条件 #5 を侵害しない（D1 不関与）。CLAUDE.md ブランチ戦略 / solo 運用ポリシー（`required_pull_request_reviews=null`）と整合 |
| 運用性 | PASS | snapshot / rollback payload 事前生成 + `enforce_admins` 単独 false 化手順により詰まないロールバック経路を確保。1 オペレーションで dev / main 独立 PUT |

## 5. スコープ

### 含む（spec scope）

- Phase 1〜13 のタスク仕様書整備
- Phase 1〜3 成果物本体の作成
- UT-GOV-004 完了必須前提の 3 重明記（Phase 1 / 2 / 3）
- GET → PUT 正規化 adapter 仕様の確定（親仕様 §8.1 field 最低限リスト）
- payload / snapshot / rollback / applied の `{branch}` 別ファイル戦略
- dry-run → apply → rollback リハーサル → 再適用 4 ステップ手順の仕様レベル定義
- `enforce_admins=true` 適用時の rollback 経路と担当者明記、rollback 用 payload 事前生成
- `lock_branch=false` の明示
- CLAUDE.md と GitHub 実値の grep 確認手順

### 含まない

- 実 `gh api PUT` の実行（Phase 13 ユーザー承認後の別オペレーション）
- `required_status_checks.contexts` job 名同期（UT-GOV-004）
- PR target safety gate dry-run（UT-GOV-002）
- CODEOWNERS 内容定義（UT-GOV-003）
- Actions action pin policy（UT-GOV-007）
- Terraform / Octokit / Pulumi 移行（将来 IaC 化フェーズ）
- 自動 commit / push / PR 発行

## 6. タスク種別の固定

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| scope | github_governance |
| apply_method | gh-api-direct + payload-in-git (MVP) |

`artifacts.json.metadata` と完全一致。

## 7. 苦戦箇所サマリ（親仕様 §8 写経）

1. **GET 応答 / PUT payload field 差異（§8.1）**: GET の `enabled` ネスト構造を PUT の flatten 配列に正規化する adapter を最初から作る。snapshot は監査用、rollback は PUT 用と用途分離。
   - 確認 field（最低限）: `required_status_checks.{strict,contexts}` / `enforce_admins.enabled→bool` / `required_pull_request_reviews=null` / `restrictions.users[].login→names 配列` / `required_linear_history` / `allow_force_pushes` / `allow_deletions` / `required_conversation_resolution` / `lock_branch` / `allow_fork_syncing`
2. **`required_status_checks.contexts` 未出現値による merge 不能事故（§8.2）**: UT-GOV-004 の積集合のみ採用。未完了時は 2 段階適用にフォールバック。**最重要苦戦箇所として 3 重明記**。
3. **`lock_branch=true` 運用条件未定義（§8.3）**: 本タスクでは `lock_branch=false` 固定。有効化は freeze runbook 別タスク。
4. **`enforce_admins=true` admin 自身 block（§8.4）**: rollback 経路（`enforce_admins` のみ一時 false 化）を `apply-runbook.md` に明記、rollback 用 payload を事前生成。
5. **dev/main bulk PUT で片側適用ミス（§8.5）**: 全ファイルを `{branch}` サフィックス分離、PUT も独立実行。
6. **CLAUDE.md 二重正本 drift（§8.6）**: 「正本は GitHub 側実値、CLAUDE.md は参照」と明記。適用後に grep 確認手順を runbook に含む。

## 8. 命名規則チェックリスト

- payload ファイル: `outputs/phase-13/branch-protection-{payload,snapshot,rollback,applied}-{dev,main}.json`
- runbook: `outputs/phase-11/apply-runbook.md` / `outputs/phase-13/apply-runbook.md`
- コミットメッセージ（Phase 13 承認後）: `chore(governance): apply branch protection (dev/main) [UT-GOV-001]`
- API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection` / accept: `application/vnd.github+json`
- CLI: `gh api repos/{owner}/{repo}/branches/{branch}/protection -X PUT --input <payload>.json`
- solo 運用ポリシー: `required_pull_request_reviews=null`

## 9. 引き渡し

Phase 2（設計）へ：
- 真の論点 = (a) UT-GOV-004 順序 / (b) GET/PUT 422 / (c) `enforce_admins` 詰み / (d) bulk 片側ミス を 4 同時封じ
- adapter 正規化対象 field 最低限リスト
- `{branch}` サフィックス別ファイル戦略 + 独立 PUT 義務化
- 4 ステップ手順（dry-run → apply → rollback リハーサル → 再適用）
- `enforce_admins=true` rollback 経路設計（事前生成 payload + 一時 false 化手順）
- 4 条件 PASS の根拠
- スコープ境界（仕様書整備に閉じる / 実 PUT は Phase 13 後）
