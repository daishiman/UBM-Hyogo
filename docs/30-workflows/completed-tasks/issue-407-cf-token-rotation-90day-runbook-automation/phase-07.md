# Phase 7: AC マトリクス — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: index.md の AC（Wave 1 / Wave 2 / 共通）と Phase 4 テスト項目 T01-T20 / Phase 6 異常系 S1-S10 を 1 つのマトリクスに統合し、Phase 5 / 6 / 11 のどの工程で何が機械検証可能となるかを完結させる。実装成果物に対する DoD を兼ねるため CONST_004 / CONST_005 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 7 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

index.md の AC を Phase 4 / 5 / 6 / 11 と紐付け、各 AC が「検証方法 / evidence 保存先 / 実行 Phase」で漏れなく追跡できる単一マトリクスに整理する。本 Phase 完了後の CONST_005 DoD 定義もここに完結する。

## AC マトリクス（Wave 1: runbook）

| AC ID | 受入基準 | 検証方法 | evidence 保存先 | 実行 Phase | 関連 T / S |
| --- | --- | --- | --- | --- | --- |
| AC-W1-01 | runbook が staging-first / 24h 並行 / rollback を含む | runbook §4 §5 §6 の章順序と必須行を grep | `outputs/phase-11/evidence/lint/runbook-sections.log` | 5 (作成) / 11 (検証) | T03 / S5 |
| AC-W1-02 | runbook §1 概要 / §1.1 90 日選定根拠 / §1.2 24h 並行運用根拠 が記述 | T03 サブコマンド `--check-runbook-sections` | 同上 | 5 / 11 | T03 |
| AC-W1-03 | runbook §3 事前確認チェックリストが存在し `bash scripts/cf.sh whoami` を含む | T03 + grep `scripts/cf.sh whoami` | `evidence/lint/runbook-sections.log` | 5 / 11 | T03 / T17 |
| AC-W1-04 | runbook §4 staging rotation 手順が「新 Token 発行 → `gh secret set --env staging` → smoke → 24h 観察 → 旧 Token 無効化 → 24h 後に削除」の 6 段で構成 | runbook 構造を grep（行順検証） | `evidence/lint/runbook-sections.log` | 5 / 11 | T03 / S5 |
| AC-W1-05 | runbook §5 production rotation が §4 全 PASS を G2 で承認後にのみ進む構造 | runbook §5 冒頭注記の grep | 同上 | 5 / 11 | T03 / S5 |
| AC-W1-06 | runbook §6 rollback で旧 Token 再有効化 → `gh secret set` 再注入 → 新 Token 失効の 3 段が記述 | grep | 同上 | 5 / 11 | T03 / S6 / S7 |
| AC-W1-07 | runbook §7 で 1Password expiry reminder 設定方法が明記 | grep `1Password` / `expiry` | 同上 | 5 / 11 | T03 / S8 |
| AC-W1-08 | runbook §8 で実施記録 (`cf-token-rotation-log.md`) への追記手順が明記 | grep `cf-token-rotation-log.md` | 同上 | 5 / 11 | T03 |
| AC-W1-09 | runbook §9 で OIDC 化（DERIV-01）後は本 runbook が改訂対象である旨を明記 | grep `OIDC` / `DERIV-01` | 同上 | 5 / 11 | T03 |
| AC-W1-10 | runbook に Cloudflare API Token 値 / Token ID / scope 値が含まれない | T18 + T19 grep | `evidence/security/grep-no-secret.log` / `grep-no-token-id.log` | 5 / 11 | T18 / T19 / R1 |
| AC-W1-11 | 実施記録テンプレ (`cf-token-rotation-log.md`) に Phase 2 §実施記録テンプレ設計の 13 フィールドが揃う | T04 サブコマンド `--check-log-fields` | `evidence/lint/log-fields.log` | 5 / 11 | T04 |
| AC-W1-12 | 実施記録テンプレに Token 値項目が存在しない（フィールド名・本文ともに） | T18 + T19 grep（log ファイル対象） | `evidence/security/grep-no-secret.log` | 5 / 11 | T18 / T19 / R1 |
| AC-W1-13 | 実施記録テンプレが「無効化時刻」と「削除時刻」を別フィールドとして持つ（誤失効防止） | T04 + grep | `evidence/lint/log-fields.log` | 5 / 11 | T04 / S6 |
| AC-W1-14 | runbook / log の markdown lint が PASS | T01 + T02 markdownlint | `evidence/lint/markdownlint-runbook.log` / `markdownlint-log.log` | 5 / 11 | T01 / T02 |
| AC-W1-15 | runbook 内リンクが dead link 0（外部 URL は warn 許容） | T08 markdown-link-check | `evidence/lint/runbook-links.log` | 5 / 11 | T08 |

## AC マトリクス（Wave 2: 自動化）

| AC ID | 受入基準 | 検証方法 | evidence 保存先 | 実行 Phase | 関連 T / S |
| --- | --- | --- | --- | --- | --- |
| AC-W2-01 | `.github/workflows/cf-token-rotation-reminder.yml` が `schedule: cron`（日次）と `workflow_dispatch` 両方をサポート | T05 yamllint + T06 actionlint + `yq '.on'` で検証 | `evidence/lint/yamllint.log` / `actionlint.log` / `evidence/security/permissions.log` | 5 / 11 | T05 / T06 |
| AC-W2-02 | yaml の `on.workflow_dispatch.inputs` に `dry_run` と `simulated_issued_at` の 2 入力がある | `yq '.on.workflow_dispatch.inputs \| keys'` | `evidence/lint/yaml-inputs.log` | 5 / 11 | T05 / T06 |
| AC-W2-03 | yaml `permissions:` が `issues: write` / `contents: read` のみ | T20 `yq '.permissions'` | `evidence/security/permissions.log` | 5 / 11 | T20 / R1 |
| AC-W2-04 | yaml に `secrets:` 参照が存在しない（最小権限） | T05 + grep `secrets\.` | `evidence/lint/yamllint.log` | 5 / 11 | T05 |
| AC-W2-05 | 発行日メタ取得元が `vars.CF_TOKEN_ISSUED_AT`（GitHub Variables）に決定 | grep `vars.CF_TOKEN_ISSUED_AT` in yaml | `evidence/lint/actionlint.log` | 5 / 11 | T06 |
| AC-W2-06 | 経過日数算出ロジックが yaml に定義され、`THRESHOLD_DAYS=85` で判定 | grep `THRESHOLD_DAYS` / `should_remind` in yaml | 同上 | 5 / 11 | T06 |
| AC-W2-07 | 85 日経過時点で `gh issue create` 相当の step が Issue を自動起票（時刻シミュレーション） | T10 `simulated_issued_at=$(date -u -d '85 days ago')` + `dry_run=false` で 1 件起票確認 | `evidence/dryrun/workflow-dispatch-real.log` | 11 | T10 / T15 |
| AC-W2-08 | 84 日経過時点では起票されない（境界値下限） | T09 `simulated_issued_at=$(date -u -d '84 days ago')` で `should_remind=false` | `evidence/dryrun/elapsed-84.log` | 5 / 11 | T09 / S4 |
| AC-W2-09 | 89 日 / 90 日 / 91 日経過の境界値で `should_remind=true` かつ `due_at` が連続的に変化 | T11 / T12 evidence | `evidence/dryrun/elapsed-89.log` / `elapsed-90.log` / `elapsed-91.log` | 5 / 11 | T11 / T12 / S4 |
| AC-W2-10 | Issue 本文に runbook と前回実施記録へのリンクを含む | T15 起票 Issue 本文確認 | `evidence/dryrun/workflow-dispatch-real.log` | 11 | T15 |
| AC-W2-11 | Issue 本文に経過日数 / 推奨期日 / 着手手順 4 項目が含まれる | T15 起票 Issue 本文 grep | 同上 | 11 | T15 |
| AC-W2-12 | `workflow_dispatch` 経由で dry-run 実行が可能（実 Issue を起票せず本文プレビューを step summary に出力） | T14 `dry_run=true` で `Create issue` step が skip され `Dry-run preview` のみ実行 | `evidence/dryrun/workflow-dispatch-dryrun.log` | 11 | T14 |
| AC-W2-13 | 重複起票が抑止される（既存 open Issue がある場合に新規起票 step が skip） | T16 連続実行で 2 件目 skip | `evidence/dryrun/workflow-dispatch-dup.log` | 11 | T16 / S3 |
| AC-W2-14 | assignee が CODEOWNERS（`@daishiman`）に設定される | T15 起票 Issue assignee 確認 | `evidence/dryrun/workflow-dispatch-real.log` | 11 | T15 / S9 |
| AC-W2-15 | `vars.CF_TOKEN_ISSUED_AT` 未設定で workflow が `::error::` を出して fail（無音 fail を回避） | T13 `ISSUED_AT='' --simulate-elapsed` で exit != 0 | `evidence/dryrun/elapsed-empty.log` | 5 / 11 | T13 / S8 派生 |
| AC-W2-16 | label 3 種（`ops` / `cloudflare` / `token-rotation`）の事前作成手順が runbook §3 に明記 | runbook §3 grep `gh label create` | `evidence/lint/runbook-sections.log` | 5 / 11 | T03 |
| AC-W2-17 | yaml `RUNBOOK_PATH` / `LOG_PATH` の値が repo 上の path として実在 | T07 `--check-yaml-links` | `evidence/lint/yaml-links.log` | 5 / 11 | T07 |

## AC マトリクス（共通 / セキュリティ / 仕様書品質）

| AC ID | 受入基準 | 検証方法 | evidence 保存先 | 実行 Phase | 関連 T / S |
| --- | --- | --- | --- | --- | --- |
| AC-C-01 | 各仕様書 13 phase 冒頭に `[実装区分: 実装仕様書]` が明記 | grep `[実装区分:` を 13 ファイルに対して | `evidence/lint/spec-tag.log`（Phase 12 で取得） | 5 / 12 | NA |
| AC-C-02 | CONST_005 必須項目（変更対象ファイル / yaml 構造 / 入出力 / テスト方針 / ローカル実行 / DoD）が Phase 02 / 03 / 04 / 05 / 07 に分散配置されて完結 | 各 Phase の対応セクション目視 + Phase 7 のここで紐付け確認 | 本 Phase 7 / 各 Phase | 5 / 12 | NA |
| AC-C-03 | CONST_007 に従い Wave 1 / Wave 2 を本タスクで完結（先送り禁止） | Phase 11 完了時点で W1 全 AC + W2 全 AC が PASS | 本 Phase 7 集計 | 11 / 12 | NA |
| AC-C-04 | 仕様書 13 phase / runbook / log / yaml / 検証スクリプト 全体に Cloudflare API Token 値・Token ID・scope 値が grep ヒット 0 | T18 + T19 を仕様書全体に拡張 | `evidence/security/grep-no-secret.log` / `grep-no-token-id.log` | 5 / 11 | T18 / T19 / R1 |
| AC-C-05 | `mise exec -- pnpm typecheck` / `pnpm lint` の回帰なし | Phase 5 Step 6 / Phase 9 で実行 | `evidence/lint/typecheck.log` / `lint.log` | 5 / 9 / 11 | NA |
| AC-C-06 | actionlint / yamllint / markdownlint がすべて exit 0 | T01 / T02 / T05 / T06 evidence | `evidence/lint/*.log` | 5 / 11 | T01 / T02 / T05 / T06 |
| AC-C-07 | `mise exec -- pnpm sync:check` で main / dev / 全 worktree の遅れが 0 | Phase 5 Step 6 で実行 | `evidence/lint/sync-check.log` | 5 / 11 | NA |
| AC-C-08 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に rotation runbook へのリンクが追記（最大 3 行） | grep `cf-token-rotation-runbook.md` in skill reference | `evidence/lint/skill-ref-link.log` | 5 / 12 | NA |
| AC-C-09 | テスト用 Issue が Phase 11 終了までに `gh issue close --reason "not planned"` で後始末される | `gh issue list --state closed --search '[cf-token-rotation]' --limit 5` | `evidence/dryrun/test-issue-cleanup.log` | 11 | T15 |
| AC-C-10 | Phase 6 異常系 S1-S10 のうち実測対象 S3 / S4 / S9 が evidence で確認できる | T15 / T16 / T09-T12 evidence の存在確認 | `evidence/dryrun/*` | 11 | S3 / S4 / S9 |

## AC 集計（Phase 11 完了時点の DoD）

| カテゴリ | AC 数 | 検証 Phase 内訳 |
| --- | --- | --- |
| Wave 1（runbook） | 15 | 5 (作成) / 11 (実測) |
| Wave 2（自動化） | 17 | 5 (作成) / 11 (実測) |
| 共通 / セキュリティ | 10 | 5 / 9 / 11 / 12 |
| 合計 | 42 | — |

42 AC 全 PASS = 本タスクの DoD（Definition of Done）。

## evidence 保存先サマリ

| カテゴリ | path |
| --- | --- |
| markdown lint / link / sections | `outputs/phase-11/evidence/lint/` |
| yaml lint / actionlint / inputs / sync | `outputs/phase-11/evidence/lint/` |
| security grep | `outputs/phase-11/evidence/security/` |
| dry-run / 経過日数 / 重複 / 実 Issue / cleanup | `outputs/phase-11/evidence/dryrun/` |
| 副作用なし手順トレース（whoami） | `outputs/phase-11/evidence/walkthrough/` |
| 異常系 S3 / S4 / S9 | `outputs/phase-11/evidence/abnormal/` または上記 dryrun と共有 |

## CONST_005 DoD 完結性確認

| CONST_005 必須項目 | 配置 Phase |
| --- | --- |
| 変更対象ファイル一覧 | Phase 2 §変更対象ファイル一覧 / Phase 5 §変更ファイル一覧 |
| yaml 構造 / runbook 章立て / log フィールド | Phase 2 §workflow yaml 構造設計 / §runbook 章立て設計 / §実施記録テンプレ設計 |
| 入出力 | Phase 2 §入出力データ構造 |
| エラーハンドリング | Phase 2 §エラーハンドリング / Phase 6 異常系 S1-S10 |
| セキュリティ | Phase 2 §セキュリティ / Phase 4 T18-T20 / Phase 7 AC-C-04 |
| テスト方針 | Phase 4 全体 |
| ローカル実行コマンド | Phase 2 §ローカル実行コマンド / Phase 5 §ローカル実行コマンド集 |
| Rollback | Phase 2 §Rollback 手順 / Phase 6 S5-S7 |
| DoD | 本 Phase 7 §AC 集計 |

すべての必須項目が Phase 2 / 4 / 5 / 6 / 7 に分散配置されて完結している。

## 参照資料

- `phase-01.md` 〜 `phase-06.md`
- `index.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-07.md`（フォーマット参考）

## 統合テスト連携

- 上流: Phase 4 T01-T20 / Phase 6 S1-S10
- 下流: Phase 11 実測（W2 系の dry-run / 重複起票 / 境界値）/ Phase 12 ドキュメント更新

## 多角的チェック観点

- index.md の AC（Wave 1 / Wave 2 / 共通）が漏れなく Phase 7 マトリクスに展開されている
- 各 AC が検証方法と evidence path で機械検証可能
- staging-first / 24h 並行 / rollback / 機密値非掲載 の 4 ガードが AC に組み込まれている
- 重複起票抑止 / dry-run / 最小権限 が yaml AC に組み込まれている
- 境界値（84 / 85 / 89 / 90 / 91）が独立 AC として分離されている

## サブタスク管理

- [ ] AC-W1-01 〜 AC-W1-15 を確定
- [ ] AC-W2-01 〜 AC-W2-17 を確定
- [ ] AC-C-01 〜 AC-C-10 を確定
- [ ] CONST_005 必須項目の配置 Phase を整理
- [ ] `outputs/phase-07/main.md` を作成

## 成果物

- `outputs/phase-07/main.md`

## 完了条件

- [ ] 42 AC が ID / 受入基準 / 検証方法 / evidence / 実行 Phase / 関連 T-S で揃っている
- [ ] index.md の Wave 1 / Wave 2 / 共通 AC が Phase 7 マトリクスに 1:1 以上で展開されている
- [ ] CONST_005 DoD 9 項目が Phase に紐付いて完結している
- [ ] 機密値非掲載が独立 AC として複数箇所（AC-W1-10 / AC-W1-12 / AC-C-04）で覆われている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR / 実 GitHub Actions 起動を実行していない
- [ ] CONST_007 に従い Wave 1 / Wave 2 / 共通の 3 カテゴリが本サイクル内で完結する AC 構成

## 次 Phase への引き渡し

Phase 8（DRY 化）以降へ:

- 42 AC マトリクス
- evidence 保存先 6 カテゴリ
- CONST_005 DoD 完結性表

Phase 11 へ:

- 実測対象 AC 一覧（W1 全 / W2 全 / C-04 / C-05 / C-06 / C-09 / C-10）
- 後始末手順（テスト Issue close）

## 実行タスク

- [ ] phase-07 の既存セクションに記載した手順・検証・成果物作成を実行する。
