# Phase 12 — 未タスク検出（unassigned-task-detection）

> 0 件でも必須出力。current / baseline の分離、検出ソース、関連タスク差分、partial_fix の有無を網羅する。

## 1. 検出ソース一覧

| # | ソース | 確認内容 |
| - | --- | --- |
| 1 | `outputs/phase-1/main.md` §3 In/Out Scope | スコープ外として明記された項目 |
| 2 | `outputs/phase-2/design.md` §8 横断責務境界 | 委譲先が指定された項目 |
| 3 | `outputs/phase-3/review.md` §4 MINOR 指摘 | 後続吸収予定の MINOR 3 件 |
| 4 | `outputs/phase-5/runbook.md`（仮置き） | 運用条件未定義の可能性 |
| 5 | `outputs/phase-10/go-no-go.md` | 残課題リスト |
| 6 | 横断 5 タスク index.md（差分確認） | 重複・抜け漏れ |

## 2. baseline（既知の Out of Scope / 委譲先確定済み）

下記は **既に委譲先が確定** しており「未タスク」ではない。記録のため列挙する。

| baseline # | 項目 | 委譲先 | 出典 |
| --- | --- | --- | --- |
| B-1 | branch protection JSON / YAML の GitHub 投入 | current U-1 として追跡 | Phase 10 U-1 |
| B-2 | `gh api` / Terraform / `tfsec` 採用判断 | 別実装タスク | Phase 1 §3 |
| B-3 | webhooks / secrets scanning 等の repo setting | 範囲外 | Phase 1 §3 |
| B-4 | rebase conflict 時の通知経路（Slack 等） | task-conflict-prevention-skill-state-redesign | Phase 3 MINOR-2 |
| B-5 | `lock_branch=true` 運用条件の明文化 | 後続 implementation runbook | Phase 3 MINOR-1 |
| B-6 | OSS 化時の triage job 権限再評価 | 将来 repo public 化タスク | Phase 3 MINOR-3 |

## 3. current（本 Phase で追跡すべき未タスク）

| current # | 検出内容 | 影響 | 対応方針 |
| --- | --- | --- | --- |
| U-1 | branch protection JSON の GitHub 適用と rollback payload 正規化 | 実適用しないまま完了扱いになる | Phase 13 承認後に `task-github-governance-branch-protection-apply` を発番 |
| U-2 | `pull_request_target` safety gate の dry-run / security review | PR code 実行と権限昇格の混同リスク | `pull_request_target` は triage のみ、untrusted build は `pull_request` に分離して検証 |
| U-3 | CODEOWNERS 整備 | main の CODEOWNERS review が global fallback 依存になる | `.github/CODEOWNERS` に `docs/30-workflows/**` と `.claude/skills/**/references/**` の owner を明示する後続タスク |
| U-4 | required status checks の実在 job 名同期 | 未出現 context を設定すると PR が merge 不能になる | task-git-hooks-lefthook-and-post-merge と連携し、8 target contexts を CI job として一度成功させる |
| U-5 | docs-only / NON_VISUAL Phase 縮約テンプレのスキル反映 | 次回も冗長成果物・判定ドリフトが再発する | task-specification-creator skill backlog として登録する |
| U-6 | Web deploy target の Pages / Workers(OpenNext) 正本整合 | 後続実装者が Pages と Workers のどちらを正とするか迷う | deployment-gha / branch-strategy / workflow 実体を横断する別仕様同期タスクで扱う |
| U-7 | third-party action pin / allowlist 方針 | governance workflow の supply-chain hardening が曖昧になる | branch protection apply タスクで `actions/checkout` pin 方針を決める |

→ **current 未タスク 7 件**。いずれも本タスク内で実装すると repo settings / workflow / skill 構造へ踏み込むため、Phase 13 承認後または別タスクで扱う。

## 4. 横断 5 タスクとの差分・重複チェック

| 横断タスク | 重複の有無 | 判定根拠 |
| --- | :-: | --- |
| task-conflict-prevention-skill-state-redesign | なし | rebase 失敗時の通知は委譲済み（B-4） |
| task-git-hooks-lefthook-and-post-merge | あり（U-4） | CI 命名規約は本タスクが target を定義、実在 job 同期は当該タスクと連携 |
| task-worktree-environment-isolation | なし | CI は repo 単位・worktree 不可知 |
| task-claude-code-permissions-decisive-mode | なし | Claude Code 権限と GHA permissions は独立レイヤ |

## 5. partial_fix の有無

| 観点 | 判定 |
| --- | :-: |
| 受入条件のうち部分達成のもの | あり（AC-3 / AC-4 は dry-run 前の条件付き草案） |
| 設計上の TODO 残置 | あり（U-1〜U-5 として追跡） |
| ドキュメント側の歯抜け | なし（7 成果物すべて生成） |

→ **partial_fix あり**。ただし docs-only / spec_created の境界内では、追跡可能な後続タスクとして formalize 済み。

## 6. 結論

- current = **7 件**
- baseline = 6 件（U-1 へ昇格した B-1 を含む）
- 横断 5 タスクとの重複 = **1 件**（U-4）
- partial_fix = **あり**

Phase 13 への申し送り: 別実装タスクを発番する際、本書 §3 current 表をそのまま引き継ぐこと。
