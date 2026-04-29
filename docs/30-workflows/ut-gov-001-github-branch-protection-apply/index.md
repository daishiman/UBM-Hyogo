# ut-gov-001-github-branch-protection-apply - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-gov-001-github-branch-protection-apply |
| タスク名 | GitHub branch protection apply / rollback payload 正規化（dev / main 実適用） |
| ディレクトリ | docs/30-workflows/ut-gov-001-github-branch-protection-apply |
| Wave | 0（governance / branch protection 強制化） |
| 実行種別 | serial（UT-GOV-004 完了 or 同時完了後の単独 PR） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL（governance 適用 + payload 正規化 adapter） |
| visualEvidence | NON_VISUAL |
| scope | github_governance |
| 親タスク | task-github-governance-branch-protection |
| 発見元 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md U-1 |
| 親仕様 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md |
| GitHub Issue | #144 |

## 目的

`task-github-governance-branch-protection` Phase 2 / Phase 12 で策定された branch protection JSON 草案（dev / main）を、GitHub REST API `PUT /repos/{owner}/{repo}/branches/{branch}/protection` に適合する正規化 payload へ adapter で変換し、適用前 snapshot 取得 → dry-run → apply → rollback リハーサル → 再適用の手順で「強制されている governance」状態へ移行する。MVP では `gh api` 直叩き + payload を Git 管理する方式（親仕様 §7 備考）を採用し、Terraform / Octokit script は将来 IaC 化フェーズで再評価する。本ワークフローは Phase 1〜13 のタスク仕様書と Phase outputs 骨格を範囲とし、破壊的な実適用 PUT は Phase 13 ユーザー承認後の別オペレーションで実行する。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase outputs 骨格（Phase 1〜13 の `outputs/phase-NN/main.md` と NON_VISUAL / Phase 12 必須補助成果物）作成
- `index.md`（本ファイル）と `artifacts.json` の作成
- UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）完了を必須前提とする依存順序の明文化（Phase 1 / 2 / 3 の 3 箇所で重複明記）
- GET 応答 → PUT payload 正規化 adapter 仕様の固定
- snapshot / rollback payload / applied JSON のファイル分離戦略
- dry-run → apply → rollback リハーサル → 再適用 4 ステップ手順の仕様レベル定義
- `enforce_admins=true` 適用時の rollback 経路と担当者の明記
- dev / main 別ファイル戦略（bulk 化禁止）

### 含まない

- 実 `gh api PUT` の実行（Phase 13 ユーザー承認後の別オペレーション）
- `required_status_checks.contexts` の job 名同期作業（UT-GOV-004 に分離）
- PR target safety gate dry-run（UT-GOV-002）
- CODEOWNERS 内容定義（UT-GOV-003）
- GitHub Actions の action pin 方針（UT-GOV-007）
- Terraform / Octokit / Pulumi 等への移行（将来 IaC 化フェーズ）
- 自動 commit / push / PR 発行（実行者承認後に別タスク化）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期） | 未同期の contexts を投入すると永続的に green にならず PR が一切 merge 不能になる（親仕様 §8.2）。先行 or 同時完了が必須 |
| 上流（必須） | task-github-governance-branch-protection Phase 13 承認 | 草案 JSON の最終承認が完了していること |
| 上流 | task-github-governance-branch-protection Phase 2 design.md | 草案 JSON の正本 |
| 並列 | UT-GOV-002（PR target safety gate dry-run） | 適用後の挙動検証で参照される |
| 関連 | UT-GOV-003（CODEOWNERS） | solo 運用のため必須レビュアー化はしないが、ownership 文書化として参照 |
| 関連 | UT-GOV-007（Actions action pin policy） | required_status_checks に紐づく workflow 信頼性 |
| 下流 | UT-GOV-002 / UT-GOV-005〜007 | 「protected な dev / main」を前提とする全 governance タスク |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 親タスク仕様（unassigned-task 版）。本ワークフローはこの内容を昇格 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | branch protection 草案（§2） |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | 実装ガイド §1 / §2 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md | U-1 検出ログ |
| 必須 | CLAUDE.md（ブランチ戦略セクション） | solo 運用ポリシー（`required_pull_request_reviews=null`） |
| 必須 | https://docs.github.com/en/rest/branches/branch-protection | `PUT /repos/{owner}/{repo}/branches/{branch}/protection` schema |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | scripts/cf.sh | secret injection ラッパー（GH_TOKEN は対象外だが運用ポリシーとして参照） |

## 受入条件 (AC)

- AC-1: 適用前の dev / main 現行 protection が `gh api` で取得され、`outputs/phase-13/branch-protection-snapshot-{dev,main}.json` として保全される（仕様レベルで定義済み）。
- AC-2: 草案 JSON が `PUT /repos/{owner}/{repo}/branches/{branch}/protection` schema へ正規化された adapter 出力として `outputs/phase-13/branch-protection-payload-{dev,main}.json` に保存される。
- AC-3: `required_status_checks.contexts` には UT-GOV-004 で実在 job 名同期済みのものだけが含まれる（未出現 context は含めない）。UT-GOV-004 未完了の場合は contexts を空配列で 2 段階適用に切り替える分岐が仕様化されている（親仕様 §8.2）。
- AC-4: dry-run（差分プレビュー）で intended diff がレビュー承認されてから本適用 PUT が走る手順になっている。
- AC-5: dev / main それぞれに PUT が成功し、応答 JSON が `outputs/phase-13/branch-protection-applied-{dev,main}.json` として保存される。
- AC-6: rollback リハーサルとして snapshot から PUT を 1 回戻し、再度本適用 PUT を行う double-apply が完了している。
- AC-7: `enforce_admins=true` 適用時の rollback 担当者・経路が `apply-runbook.md` に明記され、rollback 用 payload が事前生成されている。
- AC-8: CLAUDE.md ブランチ戦略（solo 運用 / `required_pull_request_reviews=null`）が GitHub 側の実値と一致することが grep 確認手順として記述されている。
- AC-9: payload / snapshot / rollback / applied のすべてのファイルが `{branch}` サフィックスで分離され、bulk 化されない（親仕様 §8.5）。
- AC-10: `lock_branch=false` が明示され、有効化が必要な場合は別タスクで freeze runbook とセット導入する旨が記載されている（親仕様 §8.3）。
- AC-11: GET 応答と PUT payload の field 名差異（`enforce_admins.enabled` → bool / `restrictions.users[].login` → 配列 / `required_pull_request_reviews=null` 等）が adapter 仕様で正規化されている（親仕様 §8.1）。
- AC-12: UT-GOV-004 完了が Phase 1（前提）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている。
- AC-13: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている。
- AC-14: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed`、Phase 4〜13 = `pending`。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック（adapter / payload 生成） | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke test（dry-run / apply / rollback リハーサル） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md |
| 13 | PR 作成 / ユーザー承認後 PUT 実行 | phase-13.md | pending | outputs/phase-13/main.md / branch-protection-payload-{dev,main}.json / branch-protection-snapshot-{dev,main}.json / branch-protection-rollback-{dev,main}.json / branch-protection-applied-{dev,main}.json / apply-runbook.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所） |
| 設計 | outputs/phase-02/main.md | トポロジ / state ownership / payload 正規化 adapter / snapshot vs rollback 分離 / 4 ステップ手順 / dev/main 別ファイル戦略 / `enforce_admins=true` rollback 経路 |
| レビュー | outputs/phase-03/main.md | 代替案比較（gh api 直叩き / Terraform / Octokit / 2 段階適用）と PASS/MINOR/MAJOR 判定 / 着手可否ゲート |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| GitHub REST API | branch protection PUT / GET | 無料枠 |
| `gh` CLI | API 呼び出し（MVP の正規経路） | 無料 |
| GitHub Issue #144 | 本タスクの追跡 | 無料 |
| jq | JSON adapter（GET → PUT 変換） | 無料 |

## Secrets 一覧

| 種別 | 名前 | 用途 | 管理場所 |
| --- | --- | --- | --- |
| GitHub Token | `GH_TOKEN`（または `gh auth login` の OAuth トークン） | branch protection PUT に必要な `administration:write` スコープ | 実行者ローカル（`gh auth login`）。リポジトリには記録しない |

> 本タスクは新規 secret を導入せず、既存の `gh` CLI 認証を流用する。token 値は payload / runbook に転記しない。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | D1 を触らない。違反なし |
| - | branch 戦略 `feature/* → dev → main`（CLAUDE.md） | 本タスクは GitHub 側に強制適用することで戦略を実体化する |
| - | solo 運用ポリシー（`required_pull_request_reviews=null`） | payload で `required_pull_request_reviews=null` を明示し、CLAUDE.md の参照と一致させる |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）
- AC-1〜AC-14 が Phase 1〜3 で全件カバー
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- UT-GOV-004 完了が必須前提として 3 箇所（Phase 1 / 2 / 3）で重複明記
- 本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実 PUT は Phase 13 ユーザー承認後の別オペレーションで実施する旨を明文化

## 苦戦箇所・知見（親仕様 §8 写経）

**1. GET 応答と PUT payload の field 名差異（§8.1）**
GET 応答は `enabled` / `users` / `teams` / `apps` のネスト構造、PUT は `restrictions: { users: [], teams: [], apps: [] }` のような flatten された配列を要求する。GET 結果をそのまま PUT に流すと 422。adapter 正規化レイヤを最初から作る。

**2. `required_status_checks.contexts` 未出現値投入による merge 不能事故（§8.2）**
typo / 将来予定 job 名を入れると永遠に green にならず PR 全 block。緊急 hotfix も止まる。UT-GOV-004 結果の積集合のみ採用。未完了時は contexts 空配列で 2 段階適用。

**3. `lock_branch=true` の運用条件未定義（§8.3）**
全 push 完全停止の強力フラグ。解除手順 / 権限者 / トリガ未定義で有効化すると incident 時詰む。本タスクでは `lock_branch=false` を明示。

**4. `enforce_admins=true` での admin 自身 block（§8.4）**
solo 運用では approver が自分自身しかいないため、CI 失敗時 main に hotfix できない状態が発生し得る。`enforce_admins` のみ一時 false に戻す `gh api` 手順と rollback 用 payload を事前生成。

**5. dev / main の差分管理ミス（§8.5）**
payload 1 つに丸めると片側適用ミスが起きやすい。payload / snapshot / rollback / applied を `{branch}` サフィックスで分離し branch ごとに独立 PUT。bulk 化禁止。

**6. CLAUDE.md 表記との二重正本リスク（§8.6）**
CLAUDE.md と GitHub 設定値が drift すると正本不明になる。「正本は GitHub 側の実値、CLAUDE.md はその参照」と明記し、適用後 grep 確認手順を runbook に含める。

## 関連リンク

- 上位 README: ../README.md
- 親タスク仕様: ../completed-tasks/UT-GOV-001-github-branch-protection-apply.md
- 親タスクワークフロー: ../completed-tasks/task-github-governance-branch-protection/
- 草案 design.md: ../completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/144
- 連携タスク仕様（completed-tasks 配下）:
  - ../completed-tasks/UT-GOV-002-pr-target-safety-gate-dry-run.md（仮）
  - ../completed-tasks/UT-GOV-003-codeowners-governance-paths.md（仮）
  - ../completed-tasks/UT-GOV-004-required-status-checks-context-sync.md（仮）
  - ../completed-tasks/UT-GOV-007-github-actions-action-pin.md（仮）
