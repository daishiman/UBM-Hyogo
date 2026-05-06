# Phase 4: テスト戦略 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: Phase 2 で確定した runbook (`cf-token-rotation-runbook.md`) / 実施記録 (`cf-token-rotation-log.md`) / GitHub Actions workflow (`cf-token-rotation-reminder.yml`) の 3 成果物を、機械検証可能な粒度で検証する戦略を定義する。yaml は schedule トリガーで副作用（Issue 起票）を持つため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 4 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計の 3 成果物（runbook / 実施記録テンプレ / workflow yaml）を、(a) 静的検証 / (b) 動的検証 / (c) 手順トレース検証 / (d) セキュリティ grep 検証の 4 階層で評価する戦略を定義し、Phase 5 ランブックがそのまま実行可能な粒度に落とす。

## 検証戦略の階層

```
Layer 1  静的検証          markdown lint / yamllint / actionlint / 章立て自動検証
Layer 2  動的検証          workflow_dispatch dry-run / 経過日数算出ロジック単体トレース
Layer 3  手順トレース      runbook §3 事前確認のコマンドだけを副作用なしで実行
Layer 4  セキュリティ      Token 値・ID・scope の grep 0 件 ゲート
```

下層失敗時に上層は実行しない（fail-fast）。各層判定は Phase 7 AC に 1:1 で対応させる。

## coverage 概念の適用と適用外性

本タスクの主成果は markdown 文書 + workflow yaml であり、ユニットテストの statement / branch coverage の概念は workflow yaml の `Compute elapsed days and decide` step の bash ロジックにのみ部分適用する。代替指標として以下を採用。

| 指標 | 値 |
| --- | --- |
| runbook 章数 | 9 / 9（Phase 2 §runbook 章立て設計に対応） |
| 実施記録テンプレフィールド数 | 13 / 13 |
| workflow yaml ブロック数 | 7 / 7（on / permissions / env / Compute / Detect existing / Build body / Dry-run / Create — 厳密には 8 だが「Dry-run と Create」を 1 ブロックと数える運用） |
| 経過日数算出 branch coverage | 4 ケース（85 日未満 / =85 / =89 / >=90）すべて分岐を踏む |
| Token 値 grep ヒット | 0（runbook / log / yaml / step ログ全体） |
| `NOT_EXECUTED` / `TODO_EVIDENCE` placeholder grep | 0（Phase 11 完了時点） |

## テスト種別マトリクス

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド契約 | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | L1 | runbook 文書 lint | markdown lint | 自動 | `pnpm dlx markdownlint-cli2 docs/30-workflows/operations/cf-token-rotation-runbook.md` | `outputs/phase-11/evidence/lint/markdownlint-runbook.log` | exit 0 |
| T02 | L1 | 実施記録テンプレ lint | markdown lint | 自動 | 同上 `cf-token-rotation-log.md` | `evidence/lint/markdownlint-log.log` | exit 0 |
| T03 | L1 | runbook 章立て自動検証 | section presence check | 自動 | `bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections` | `evidence/lint/runbook-sections.log` | 9 章すべて grep ヒット（`## 1.`〜`## 9.`） |
| T04 | L1 | 実施記録 13 フィールド検証 | field presence check | 自動 | `bash scripts/check-cf-rotation-reminder.sh --check-log-fields` | `evidence/lint/log-fields.log` | Phase 2 §実施記録テンプレ設計の 13 行すべて存在 |
| T05 | L1 | yaml 構文 lint | yamllint | 自動 | `pnpm dlx yaml-lint .github/workflows/cf-token-rotation-reminder.yml` または `yamllint -s` | `evidence/lint/yamllint.log` | exit 0、warning は許容、error 0 |
| T06 | L1 | GitHub Actions 構文 lint | actionlint | 自動 | `actionlint -color .github/workflows/cf-token-rotation-reminder.yml` | `evidence/lint/actionlint.log` | exit 0 |
| T07 | L1 | yaml 内リンク検証 | linkcheck | 自動 | `bash scripts/check-cf-rotation-reminder.sh --check-yaml-links` | `evidence/lint/yaml-links.log` | runbook / log path が repo に存在する |
| T08 | L1 | runbook 内リンク検証 | linkcheck | 自動 | `pnpm dlx markdown-link-check docs/30-workflows/operations/cf-token-rotation-runbook.md` | `evidence/lint/runbook-links.log` | dead link 0 件（外部 Cloudflare docs URL は warn 許容） |
| T09 | L2 | 経過日数算出（85 日未満 = 84 日） | bash unit | 自動 | `ISSUED_AT=$(date -u -d '84 days ago' +%Y-%m-%d) bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed` | `evidence/dryrun/elapsed-84.log` | `should_remind=false`、`elapsed_days=84` |
| T10 | L2 | 経過日数算出（境界 = 85 日） | bash unit | 自動 | 同上 `85 days ago` | `evidence/dryrun/elapsed-85.log` | `should_remind=true`、`elapsed_days=85` |
| T11 | L2 | 経過日数算出（= 89 日） | bash unit | 自動 | 同上 `89 days ago` | `evidence/dryrun/elapsed-89.log` | `should_remind=true`、`due_at` が今日 +1 日 |
| T12 | L2 | 経過日数算出（= 90 / 91 日） | bash unit | 自動 | 同上 `90 days ago` / `91 days ago` | `evidence/dryrun/elapsed-90.log` / `elapsed-91.log` | `should_remind=true`、`due_at` が今日 / 今日 -1 日 |
| T13 | L2 | `vars.CF_TOKEN_ISSUED_AT` 未設定 guard | bash unit | 自動 | `ISSUED_AT='' bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed` | `evidence/dryrun/elapsed-empty.log` | `::error::` を出力、exit != 0 |
| T14 | L2 | workflow_dispatch dry-run（手動） | dry-run | 手動 | `gh workflow run cf-token-rotation-reminder.yml -f dry_run=true` → `gh run view --log` | `evidence/dryrun/workflow-dispatch-dryrun.log` | step `Dry-run preview` が `$GITHUB_STEP_SUMMARY` に Issue 本文プレビューを出力、`Create issue` step は skip |
| T15 | L2 | workflow_dispatch 本番起票（テスト Issue） | dry-run | 手動（後始末必須） | `gh workflow run cf-token-rotation-reminder.yml -f dry_run=false` をテスト用 `CF_TOKEN_ISSUED_AT` で実施し、起票後即 `gh issue close` | `evidence/dryrun/workflow-dispatch-real.log` | Issue が起票され、本文に runbook / log link / 経過日数 / 期日が含まれる |
| T16 | L2 | 重複起票抑止 | dry-run | 手動 | T15 直後に同条件で再実行 | `evidence/dryrun/workflow-dispatch-dup.log` | `existing.count >= 1` で `Create issue` が skip される |
| T17 | L3 | runbook §3 事前確認手順トレース | walkthrough | 手動 | `bash scripts/cf.sh whoami` のみ実行（Token 発行なし） | `evidence/walkthrough/whoami.log` | exit 0、scope 行が含まれる（値そのものは redact 済みで保存） |
| T18 | L4 | Token 値 grep（runbook / log / yaml） | security grep | 自動 | `bash scripts/check-cf-rotation-reminder.sh --check-no-secret` | `evidence/security/grep-no-secret.log` | `Bearer [A-Za-z0-9]{20,}` / `CLOUDFLARE_API_TOKEN=[^$]` / `[A-Za-z0-9_-]{40,}` の hit 0 |
| T19 | L4 | Token ID / scope 値 grep | security grep | 自動 | `bash scripts/check-cf-rotation-reminder.sh --check-no-token-id` | `evidence/security/grep-no-token-id.log` | UUID / `Account.[A-Z][a-z]+:[A-Z][a-z]+` のような scope 文字列の hit 0 |
| T20 | L4 | workflow `permissions:` 最小確認 | static audit | 自動 | `yq '.permissions' .github/workflows/cf-token-rotation-reminder.yml` | `evidence/security/permissions.log` | `issues: write` と `contents: read` のみ。`secrets:` / `actions:` / `packages:` 不在 |

> 物理 evidence ファイル数: 20。論理 AC 数は Phase 7 マトリクスで再表化する。

## scripts/check-cf-rotation-reminder.sh の責務（Phase 5 で実装）

| サブコマンド | 役割 |
| --- | --- |
| `--check-runbook-sections` | T03。`## 1.` 〜 `## 9.` の見出しが順に存在することを grep |
| `--check-log-fields` | T04。13 フィールド名（実施日 / operator / 関連 reminder Issue ...）の文字列が存在することを grep |
| `--check-yaml-links` | T07。yaml 内 `RUNBOOK_PATH` / `LOG_PATH` の値が repo 上の path として存在することを stat |
| `--simulate-elapsed` | T09-T13。yaml `Compute elapsed days and decide` step の bash と同等のロジックをローカル再現。環境変数 `ISSUED_AT` / `THRESHOLD_DAYS` を入力に取り、stdout に `elapsed_days` / `should_remind` / `due_at` を出力 |
| `--check-no-secret` | T18。Phase 2 §セキュリティの grep パターンを runbook / log / yaml / 仕様書 13 phase に対して実行 |
| `--check-no-token-id` | T19。Token ID / scope 文字列の grep |

GNU date 依存（macOS では `gdate` 案内）は Phase 5 で `command -v gdate >/dev/null && DATE=gdate || DATE=date` のフォールバック実装に落とす。

## 90 日経過判定ロジックのテスト容易化設計

yaml 本体の `Compute elapsed days and decide` step は `ISSUED_AT` を **環境変数として上書き可能** にする（既に Phase 2 設計で `env.ISSUED_AT: ${{ vars.CF_TOKEN_ISSUED_AT }}` の形）。Phase 5 では **`workflow_dispatch.inputs.simulated_issued_at`** を追加し、手動実行時のみ本変数を上書きできる経路を追加する（既定値 = 空、空なら `vars.CF_TOKEN_ISSUED_AT` を使用）。これにより T09-T13 を yaml 本体で直接実行することも可能になる。

| input | 用途 |
| --- | --- |
| `dry_run` | 既存設計（Phase 2）。`true` で起票せず preview |
| `simulated_issued_at`（追加） | 任意の ISO 8601 日付。空なら `vars.CF_TOKEN_ISSUED_AT` を使用。テスト用 |

## Issue 起票 step の `--dry-run` 切替

Phase 2 設計を踏襲し、**`gh issue create` 自体に `--dry-run` フラグは存在しない**ため、本タスクでは「`Dry-run preview` step（`$GITHUB_STEP_SUMMARY` に echo）」と「`Create issue` step（実起票）」の **2 step を `if:` で排他切替** する設計とする。`gh issue create` を `echo gh issue create ...` に差し替える方式は採用しない（実コマンドと挙動乖離が出るため）。

## runbook 手順そのもののテスト

実 Token を発行する staging dry-run は **Phase 11 の手動 smoke 範囲**とし、本 Phase では「副作用なし手順トレース（T17）」のみを範囲に含める。実 rotation は Phase 11 の G2 ゲート以降で扱う。

## 失敗時の判定基準

| カテゴリ | 失敗条件 | 切り分け |
| --- | --- | --- |
| markdown lint | T01/T02 で error | rule ID と行番号を確認、Phase 5 で文書修正 |
| actionlint | T06 で error | yaml 構文 / step expression / shell 内 unquoted を疑う |
| yamllint | T05 で error | indent / line-length（120 を上限に設定）違反 |
| 経過日数算出 | T09-T12 で `should_remind` 期待と不一致 | `date -u -d` の解釈差を疑う。GNU date 環境（ubuntu-latest）でのみ判定 |
| guard | T13 で exit 0 が返る | `set -u` 未指定を疑う |
| dry-run | T14 で Issue が起票される | step `if:` 条件のミスマッチ。`github.event.inputs.dry_run` の文字列比較を再確認 |
| 重複起票 | T16 で 2 件目 Issue が作成される | `gh issue list --search` の title プレフィックス文字列を確認 |
| Token 値 grep | T18/T19 で hit > 0 | 実値ではないか確認、Phase 5 / 11 で該当箇所を redact 修正 |
| permissions | T20 で `issues: write` 以外の write 権限 | yaml `permissions:` を最小に絞り直す |

## 自走禁止操作（approval gate 再掲）

| gate | 対象テスト | 停止位置 |
| --- | --- | --- |
| G1 | T15 / T16 | テスト用 `CF_TOKEN_ISSUED_AT` 設定後、`gh workflow run -f dry_run=false` 実行直前 |
| G2 | runbook 実 rotation（Phase 11 範囲） | `bash scripts/cf.sh` での新 Token 投入直前 |

## カバレッジ観点とエビデンス保存先

- 全 evidence は `outputs/phase-11/evidence/<category>/` 配下に保存。本 Phase では path 設計のみ確定し物理ファイル作成は Phase 11 で実施。
- evidence size > 0、`NOT_EXECUTED` / `TODO_EVIDENCE` 含まない、を Phase 7 AC で 2 段ゲート化。
- T15 で起票したテスト Issue は **必ず `gh issue close --reason "not planned"` で後始末**し、close evidence を `evidence/dryrun/test-issue-cleanup.log` に追加保存。

## 参照資料

- `phase-01.md` / `phase-02.md` / `phase-03.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-04.md`（フォーマット参考）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `CLAUDE.md`（Cloudflare CLI ルール / シークレット管理）

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 scope Token） / 1Password Item
- 下流: U-FIX-CF-ACCT-01-DERIV-01（OIDC 化）

## 多角的チェック観点

- 不変条件（CLAUDE.md「シークレット管理」）: T18/T19 grep ゲートで機械検証
- 副作用最小: T17 は read-only、T15/T16 のみ Issue を作成し即 close
- 90 日判定の境界値網羅: T09-T12 で 84 / 85 / 89 / 90 / 91 をカバー
- 重複起票抑止: T16 で実測
- workflow 最小権限: T20 で yaml `permissions:` を機械検証

## サブタスク管理

- [ ] T01〜T20 のテスト項目と evidence path の対応を確定
- [ ] `scripts/check-cf-rotation-reminder.sh` のサブコマンド 6 種を Phase 5 へ引き渡し
- [ ] coverage 適用外の代替指標（9/9 章 + 13/13 フィールド + 7/7 yaml ブロック + Token 値 grep 0）を Phase 7 AC に反映
- [ ] `outputs/phase-04/main.md` を作成

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] 4 階層 × 20 テスト項目が pass 条件で一意に定義されている
- [ ] 経過日数算出の境界値（84/85/89/90/91）が網羅されている
- [ ] Token 値 / ID / scope の grep ゲートが定義されている
- [ ] dry-run と本番起票の切替手段が yaml 設計に組み込まれている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で yaml / runbook 本文の実装、commit、push、PR を実行していない
- [ ] CONST_007 に従い未確定事項は Phase 5 / 11 への引き渡し条件として明示

## 次 Phase への引き渡し

Phase 5 へ:

- T01〜T20 のコマンド契約と pass 条件
- `scripts/check-cf-rotation-reminder.sh` サブコマンド 6 種の実装
- workflow yaml への `simulated_issued_at` input 追加
- evidence path 設計（`outputs/phase-11/evidence/<category>/`）

## 実行タスク

- [ ] phase-04 の既存セクションに記載した手順・検証・成果物作成を実行する。
