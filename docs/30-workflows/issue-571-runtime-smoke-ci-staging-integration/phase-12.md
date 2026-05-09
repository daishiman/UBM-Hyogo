# Phase 12: ドキュメント更新 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 / 13 |
| 入力 | Phase 11 evidence 一式 |
| 出力 | `outputs/phase-12/` 配下 7 ファイル（task-specification-creator skill 必須セット） |

## 目的

task-specification-creator skill `references/phase-12-spec.md` 必須 6 タスク + コンプライアンスチェック（計 7 ファイル）を作成し、システム正本仕様（aiworkflow-requirements skill）と整合させる。現サイクルは `implemented-local` とし、G3 / G4 実測完了後に `PASS_RUNTIME_VERIFIED` へ昇格する。

## 必須出力 7 ファイル

### Task 12-1: `implementation-guide.md` — Part 1（中学生レベル）+ Part 2（技術者レベル）

#### Part 1: 中学生レベル概念説明
- 「CI（GitHub Actions）」とは PR や branch push のたびにロボットが自動でテストや確認をしてくれる仕組み
- 「smoke test」とは「本当にちゃんと動くか、最低限の入口だけ叩いて確かめる」テスト
- 「staging」は本番（production）にそっくりだけど、お客さんが見ない練習用の環境
- 「secret」はパスワードのように人に見せちゃいけない情報。GitHub の Environment という箱に入れて、必要な job だけが取り出せるようにする
- 今回やること: 「練習環境にデプロイされたら、ロボットが自動で `/admin/members` と `/me` を叩いて 200 が返るか確認する」「失敗したら Slack で教えてくれる」「成功した記録は 30 日保存」

#### Part 2: 技術者レベル
- trigger: `backend-ci.yml` の API staging deploy 後に reusable `workflow_call` 経由で `runtime-smoke-staging.yml` を起動
- secret 注入: GitHub Environment `staging-runtime-smoke` から `STAGING_*` 5 件を job env に bind。`::add-mask::` を最初の `run:` step で宣言（`set -x` 全削除で leak 事故を構造防止）
- runner: 既存 `scripts/smoke/runtime-attendance-provider.sh` を `--out-dir <ci-evidence>` で起動。出力は summary-only（status / jq contract / count / summary.json）
- redaction: `scripts/smoke/redact.sh` で `Cookie: / authorization: / cf-*` をマスク。base64 cookie 偽陰性は `redact.test.sh` F-4 fixture で常時保証
- artifact: `actions/upload-artifact@v4` で 30 日保持
- failure post: `scripts/smoke/ci-summary-post.sh` が `if: failure()` step で 1 通だけ Slack incident webhook に post（success 時 0 通）
- ADR: `secret-injection`（GH Environments / 1Password connect / OIDC short-lived 比較、本サイクルは Environments 採用）/ `required-status-check`（30 日連続 PASS で昇格判断、本サイクルは optional 維持）

### Task 12-2: `system-spec-update-summary.md`

aiworkflow-requirements skill 配下の以下を更新（Step 1-A〜1-D）:

- `references/observability-monitoring.md` — runtime smoke CI 自動化経路を追記（workflow_call / Environment / failure post）
- `references/deployment-secrets-management.md` — Environment-scoped secret 配置パターン追記（`staging-runtime-smoke` を例として）
- `indexes/keywords.json` — `runtime-smoke-ci`, `staging-runtime-smoke environment`, `workflow_call`, `redact base64 cookie` を追加
- `indexes/topic-map.md` — runtime smoke CI 統合の topic を新設
- `LOGS/_legacy.md` — 2026-05-08 issue-571 implemented-local エントリを 1 行追加（この mirror には `LOGS.md` が存在しないため）

> 各更新は **canonical absolute path** で `documentation-changelog.md` に列挙すること。

### Task 12-3: `documentation-changelog.md`

| path | change | reason |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | append section "Runtime smoke CI auto-execution" | issue-571 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | append example "staging-runtime-smoke env" | issue-571 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | + 4 keywords | issue-571 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | + topic | issue-571 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | + entry | issue-571 |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue571-runtime-smoke-ci-staging-integration.md` | new changelog fragment | issue-571 |
| `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/**` | new spec set | issue-571 |
| `docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md` | implemented | issue-571 |
| `docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md` | implemented | issue-571 |
| `.github/workflows/runtime-smoke-staging.yml` | implemented | issue-571 |
| `.github/workflows/backend-ci.yml` | reusable workflow call implemented | issue-571 |
| `scripts/smoke/runtime-attendance-provider.sh` | implemented `--out-dir` / `--ci-summary` | issue-571 |
| `scripts/smoke/ci-summary-post.sh` | implemented | issue-571 |
| `scripts/smoke/__tests__/*.test.sh` | implemented ×3 | issue-571 |

### Task 12-4: `unassigned-task-detection.md`

検出された follow-up（**0 件でも出力必須**）:

| ID | 内容 | 引き継ぎ先 | 想定時期 |
| --- | --- | --- | --- |
| FU-001 | production runtime smoke の CI 自動化 | staging 30 日観測後に別 Issue 起票・着手 | 30 日観測後 |
| FU-002 | required status check 昇格判断（30 日連続 PASS gate） | 別サイクル G5 | 30 日後 |
| FU-003 | Environment secret rotation automation | GitHub Environment 作成後に必要なら別 Issue 候補 | 90 日以内 |
| FU-004 | actionlint を CI 必須 step 化 | Issue #526 trajectory / 既存 ci.yml に統合 | PR merge 前 |

> CONST_005 例外条件: FU-001（production 拡張）は staging PASS 経験を 30 日以上収集してから起票・着手する。理由は無料枠枯渇、偽陽性率、incident noise を staging で先に測る必要があるため。本サイクルでは Issue #571 の `blocks` と本 detection report に記録し、即時 backlog / Issue 作成は行わない。

### Task 12-5: `skill-feedback-report.md`

3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）固定:

#### テンプレ改善
- task-specification-creator: CI 統合 follow-up タスク用のテンプレに「dispatch trigger 制約評価」「Environment-scoped secret 設計」「`::add-mask::` × `set -x` 事故再発防止」セクション例を追加検討

#### ワークフロー改善
- 仕様書作成 phase 内で `.github/workflows/*.yml` の **path existence gate** を Phase 2 / 5 / 9 / 12 に明示（既に v2026.05.06 で導入済みパターンの本タスクへの適用例）
- reusable workflow と `repository_dispatch` の選択判断チェックリストを `references/patterns-agent-and-devops.md` 等に追加検討

#### ドキュメント改善
- aiworkflow-requirements `observability-monitoring.md` に「runtime smoke と incident post 経路の分離」セクションを新設
- `deployment-secrets-management.md` に「Environment-scoped secret と repository-scoped secret の使い分け」表を追加

### Task 12-6: `phase12-task-spec-compliance-check.md`

- [ ] phase-01〜13.md 全 13 ファイル存在
- [ ] index.md / artifacts.json 存在
- [ ] outputs/phase-NN/main.md placeholder（または実体）path が artifacts.json と一致
- [ ] 全 phase 仕様書冒頭に `[実装区分: 実装仕様書]` が明記
- [ ] CONST_005 必須項目（変更ファイル / シグネチャ / 入出力 / テスト / 実行コマンド / DoD）が phase-05.md に揃っている
- [ ] 仕様書内に secret 実値が含まれない（grep gate Q-9 PASS）
- [ ] Issue #571 が CLOSED のまま

## workflow_state 遷移条件

- Phase 5 実装完了 + local PASS 5 点取得後: `implemented-local` (`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`)
- G3 staging 自動 smoke PASS + G4 failure injection PASS 後: `completed` (`PASS_RUNTIME_VERIFIED`)

## 完了条件（DoD）

- [ ] 7 ファイル全て作成（実体）
- [ ] system spec 更新 path が canonical absolute で列挙
- [ ] FU-001〜FU-004 が unassigned-task に明示
- [ ] CONST_005 例外（FU-001 production 拡張）の理由が明示
- [ ] phase12 compliance check 全項目 ✅
