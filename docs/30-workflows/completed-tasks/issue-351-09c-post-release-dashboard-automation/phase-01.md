# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |

## 目的

09c の 24h post-release verification を **手動転記から GitHub Actions schedule + manual workflow による自動収集 + artifact 化に置き換える**ための要件を確定する。本 Phase の出力は Phase 02 設計の入力となる。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-01.md`
- `outputs/phase-01/` 配下の宣言済み成果物

## 入力

- `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/post-release-summary.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- 既存 `.github/workflows/*.yml`（特に `web-cd.yml` / `backend-ci.yml` / `d1-migration-verify.yml`）

## artifacts.json metadata 確定

| key | value | 根拠 |
| --- | --- | --- |
| `taskType` | `implementation` | `.github/workflows/*.yml` 新規追加 / `scripts/post-release-dashboard/*` 新規追加 / read-only token secret 新規 / aiworkflow references 追記 を伴う |
| `visualEvidence` | `NON_VISUAL` | UI 変更なし。CLI / GitHub Actions log / artifact JSON が evidence。screenshot 不要 |
| `destructiveOperation` | `false` | 削除や revert 不可操作なし。analytics は read-only |

## functional requirements（FR）

| ID | 要件 | 根拠 |
| --- | --- | --- |
| FR-1 | post-release dashboard を `schedule`（cron）と `workflow_dispatch` の両方で起動できる | Issue #351 「workflow inputs / schedule / artifact path を設計」 |
| FR-2 | Workers requests / Workers errors / D1 reads / D1 writes / cron status を 1 回の workflow run で取得する | 09c `post-release-summary.md` の 24h Metrics 表 |
| FR-3 | 各 metric について `value / threshold / judgment(PASS\|WARN\|FAIL\|UNKNOWN) / unit / source_endpoint / collected_at_utc` を artifact JSON に記録する | 比較可能性・自動判定の最小要件 |
| FR-4 | metric 名は 09c `post-release-summary.md` の表記と完全一致させる | naming drift 防止（Issue #351 完了条件） |
| FR-5 | 同 workflow run で `dashboard.json` と人間可読 `dashboard.md` の両方を生成する | 機械再利用 + 障害調査時の即読性 |
| FR-6 | artifact path を `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` に固定 | Issue #351 完了条件「dashboard artifact path が固定」 |
| FR-7 | `actions/upload-artifact@v4` で同 path を retention 90 日でアップロードする | GitHub Actions free-tier の標準 retention |
| FR-8 | redaction grep（token / Bearer / Authorization）が 0 件であることを workflow run 内で検証し、検出時は job を fail させる | Lessons Learned L-CF-TOKEN-002 |

## non-functional requirements（NFR）

| ID | 要件 | 根拠 |
| --- | --- | --- |
| NFR-1 | Cloudflare API token は read-only scope (`Account.Account Analytics:Read` + `Workers Scripts:Read` + `D1:Read`) のみを保有 | Issue #351 完了条件「read-only に限定」 / L-CF-TOKEN-002 |
| NFR-2 | 既存 `secrets.CLOUDFLARE_API_TOKEN`（write scope 含む）を本 workflow で**参照しない** | 権限分離 |
| NFR-3 | schedule は `0 0 * * *` UTC（1 日 1 回）に固定する。それ以上の頻度は禁止 | Issue #351 完了条件「無料枠を圧迫しない」 |
| NFR-4 | GitHub Actions free-tier 月間枠（2,000 min/month）を圧迫しない（1 run < 2 min を目標） | private repo の標準制約 |
| NFR-5 | artifact 1 ファイルのサイズは 256 KB 以下に収める | ledger 軽量化（90 日 retention 前提） |
| NFR-6 | `bash scripts/cf.sh` ラッパーがある操作は wrapper 経由のみで実行（CLAUDE.md 必読ルール） | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 |
| NFR-7 | secret 値を `echo` / `cat` / log 出力しない（Cloudflare 系 CLI 実行ルールの禁止事項に従う） | CLAUDE.md「禁止事項」 |

## acceptance criteria（AC; index.md と同期）

| ID | 内容 |
| --- | --- |
| AC-1 | workflow が `schedule` (`0 0 * * *`) と `workflow_dispatch` で起動可能 |
| AC-2 | secrets は `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` のみ参照（既存 `CLOUDFLARE_API_TOKEN` 不参照） |
| AC-3 | artifact path が `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` |
| AC-4 | metric 名が 09c `post-release-summary.md` と一致 |
| AC-5 | redaction grep が 0 件 |
| AC-6 | aiworkflow-requirements references に章追記の diff plan あり |
| AC-7 | schedule 頻度 1 日 1 回以下 |
| AC-8 | dashboard.json schema-conformant（Phase 02 で確定） |

## 制約・前提

- Cloudflare GraphQL Analytics API は account-scoped で `httpRequestsAdaptiveGroups` / `workersInvocationsAdaptive` 等の dataset を提供する。本仕様では Workers / D1 の集計 dataset を利用する（具体的 dataset 名は Phase 02 で確定）。
- D1 metrics は GraphQL `d1AnalyticsAdaptiveGroups` で `readQueries` / `writeQueries` が取得可能（dataset 名は Cloudflare API 側変更の可能性があるため、Phase 02 で `bash scripts/cf.sh api-get` 経由で discover する手順を仕様化）。
- cron status は GitHub Actions `gh workflow view` の最新 run 結果を `gh run list --json` で取得する（Cloudflare 側 cron は Workers Cron Trigger を使っていない場合 N/A）。

## 完了条件

- [x] taskType / visualEvidence / destructiveOperation が確定
- [x] FR / NFR / AC が列挙され、Phase 02 設計の入力となるレベルで具体化
- [x] 制約・前提が明記
- [x] index.md と AC が同期


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## outputs

- `outputs/phase-01/requirements.md`（本 Phase 内容のサマリ。実装フェーズで実体化）
