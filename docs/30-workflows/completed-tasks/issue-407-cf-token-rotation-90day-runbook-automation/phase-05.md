# Phase 5: 実装ランブック — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: Phase 2 / 3 / 4 で確定した設計とテスト戦略に基づき、3 つの新規ファイル（runbook / 実施記録テンプレ / workflow yaml）と 2 つの追記更新（skill reference / 検証スクリプト）を、誰が実行しても同じ結果になる実行手順に落とす。実装そのものを伴うため CONST_004 に従い実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 5 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 4 テスト戦略の 20 テスト項目を pass する成果物（runbook / 実施記録テンプレ / workflow yaml / 検証スクリプト）を、6 ステップの実装手順で確定的に作成する。

## 変更ファイル一覧（再掲）

| パス | 種別 | 役割 | 変更モード |
| --- | --- | --- | --- |
| `docs/30-workflows/operations/cf-token-rotation-runbook.md` | markdown | rotation 手順正本 | 新規 |
| `docs/30-workflows/operations/cf-token-rotation-log.md` | markdown | 実施記録 append-only | 新規 |
| `.github/workflows/cf-token-rotation-reminder.yml` | yaml | schedule + workflow_dispatch Issue 起票 | 新規 |
| `scripts/check-cf-rotation-reminder.sh` | shell | Phase 4 検証サブコマンド | 新規 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | markdown | rotation runbook へのリンク追記 | 追記（1〜3 行） |

## 実装ステップ

### Step 1: `docs/30-workflows/operations/cf-token-rotation-runbook.md` 新規作成

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `docs/30-workflows/operations/cf-token-rotation-runbook.md` |
| 内容 | Phase 2 §runbook 章立て設計の 9 節をそのまま markdown に展開。各節の本文は 5-15 行程度。Token 値・Token ID・scope 値は記載禁止 |
| blast radius | runbook 文書のみ。コード副作用なし |
| rollback | `git revert` または `git checkout -- <path>` |
| 検証コマンド | `pnpm dlx markdownlint-cli2 docs/30-workflows/operations/cf-token-rotation-runbook.md` (T01)、`pnpm dlx markdown-link-check docs/30-workflows/operations/cf-token-rotation-runbook.md` (T08)、`bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections` (T03) |

実装上の注意:
- §1.1 90 日選定根拠 / §1.2 24h 並行運用根拠 は経験則として 3-5 行で明記
- §3 事前確認の CLI 列は `bash scripts/cf.sh whoami` のみを記述（実 Token 発行は §4 以降）
- §4.5 / §5.5 smoke 列は wrangler 直接呼び出し禁止。`bash scripts/cf.sh deploy` 経由で記述
- §9 末尾に「OIDC 化（U-FIX-CF-ACCT-01-DERIV-01）後は本 runbook を改訂対象とする」と明記

### Step 2: `docs/30-workflows/operations/cf-token-rotation-log.md` 実施記録テンプレ作成

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `docs/30-workflows/operations/cf-token-rotation-log.md` |
| 内容 | Phase 2 §実施記録テンプレ設計の 13 フィールド表をそのまま markdown 化。冒頭に「Token 値・Token ID・scope 値は記録しない」の警告 blockquote。append-only 規約を冒頭に明記し、`### YYYY-MM-DD rotation #N` 形式の 1 entry 例を template として配置（実値は placeholder） |
| blast radius | log 文書のみ |
| rollback | `git revert` |
| 検証コマンド | T02 markdownlint、T04 `--check-log-fields` |

### Step 3: `.github/workflows/cf-token-rotation-reminder.yml` 新規作成

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `.github/workflows/cf-token-rotation-reminder.yml` |
| 内容 | Phase 2 §workflow yaml 構造設計の 7 ブロックをそのまま yaml 化。Phase 4 §90 日経過判定ロジックのテスト容易化設計に従い、`workflow_dispatch.inputs.simulated_issued_at`（任意 ISO 8601）を追加 |
| blast radius | schedule cron 日次起動。`vars.CF_TOKEN_ISSUED_AT` 未設定時は workflow が fail（無音 fail を避ける Phase 2 設計）。dry-run input 既定 `true` で `workflow_dispatch` は無害 |
| rollback | `gh workflow disable cf-token-rotation-reminder.yml` または yaml を git revert |
| 検証コマンド | T05 `yamllint -s .github/workflows/cf-token-rotation-reminder.yml`、T06 `actionlint -color .github/workflows/cf-token-rotation-reminder.yml`、T07 `--check-yaml-links`、T20 `yq '.permissions' .github/workflows/cf-token-rotation-reminder.yml` |

#### `simulated_issued_at` 追加実装の指針

```yaml
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'true なら起票せず step summary にプレビューのみ出す'
        required: false
        default: 'true'
        type: choice
        options: ['true', 'false']
      simulated_issued_at:
        description: 'テスト用に ISO 8601 日付で issued_at を上書き。空なら vars.CF_TOKEN_ISSUED_AT を使用'
        required: false
        default: ''
        type: string

# Compute step 内
ISSUED_AT="${{ github.event.inputs.simulated_issued_at }}"
if [[ -z "${ISSUED_AT}" ]]; then
  ISSUED_AT="${{ vars.CF_TOKEN_ISSUED_AT }}"
fi
if [[ -z "${ISSUED_AT}" ]]; then
  echo "::error::vars.CF_TOKEN_ISSUED_AT が未設定で simulated_issued_at も空です"
  exit 1
fi
```

label 事前作成（Phase 3 設計盲点指摘）: `gh label create ops --color BFDADC --force; gh label create cloudflare --color 1D76DB --force; gh label create token-rotation --color D93F0B --force` を Phase 11 実 dry-run の前段で 1 回だけ実行する旨を runbook §3 と本 Phase に明記。

### Step 4: `scripts/check-cf-rotation-reminder.sh` 新規作成

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `scripts/check-cf-rotation-reminder.sh` |
| 内容 | Phase 4 §scripts/check-cf-rotation-reminder.sh の責務に列挙した 6 サブコマンドを実装。GNU date 依存は `command -v gdate >/dev/null && DATE=gdate \|\| DATE=date` でフォールバック |
| blast radius | read-only。`--check-no-secret` / `--check-no-token-id` は grep のみ、副作用なし |
| rollback | `git revert` |
| 検証コマンド | `bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed`（T09-T13）、`--check-runbook-sections`（T03）、`--check-log-fields`（T04）、`--check-no-secret`（T18）、`--check-no-token-id`（T19）、`--check-yaml-links`（T07） |

サブコマンドの I/O 規約（再掲）:
- 入力: 環境変数 `ISSUED_AT` / `THRESHOLD_DAYS`（既定 85）/ `RUNBOOK_PATH` / `LOG_PATH`
- 出力: stdout に `key=value` 行（`elapsed_days=` / `should_remind=` / `due_at=`）。エラーは `::error::` で stderr
- exit code: 検証 PASS = 0、guard 失敗 = 1、検証 FAIL = 2

### Step 5: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 追記

| 項目 | 内容 |
| --- | --- |
| 変更ファイル | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| 内容 | 「Cloudflare API Token rotation」セクションに以下 1〜3 行追記: <br>`- 90 日 rotation runbook: [docs/30-workflows/operations/cf-token-rotation-runbook.md](../../../../docs/30-workflows/operations/cf-token-rotation-runbook.md)` <br>`- 自動 reminder workflow: .github/workflows/cf-token-rotation-reminder.yml` <br>`- 実施記録: docs/30-workflows/operations/cf-token-rotation-log.md` |
| blast radius | skill reference のみ |
| rollback | `git revert` |
| 検証コマンド | `pnpm indexes:rebuild` 後に CI gate `verify-indexes-up-to-date` で drift 確認 |

セクションが未存在の場合は追加せず、Phase 12 でセクション新設の必要性を再判定する（最小差分原則）。

### Step 6: ローカル検証（pre-commit / pre-push 相当）

| コマンド | 検証対象 |
| --- | --- |
| `mise exec -- pnpm install` | 依存解決・lefthook install |
| `mise exec -- pnpm typecheck` | 既存 TS の回帰なし |
| `mise exec -- pnpm lint` | 既存リントの回帰なし |
| `pnpm dlx markdownlint-cli2 docs/30-workflows/operations/*.md` | T01/T02 |
| `actionlint -color .github/workflows/cf-token-rotation-reminder.yml` | T06 |
| `yamllint -s .github/workflows/cf-token-rotation-reminder.yml` | T05 |
| `bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections` | T03 |
| `bash scripts/check-cf-rotation-reminder.sh --check-log-fields` | T04 |
| `bash scripts/check-cf-rotation-reminder.sh --check-yaml-links` | T07 |
| `bash scripts/check-cf-rotation-reminder.sh --check-no-secret` | T18 |
| `bash scripts/check-cf-rotation-reminder.sh --check-no-token-id` | T19 |
| `for d in 84 85 89 90 91; do ISSUED_AT=$(gdate -u -d "${d} days ago" +%Y-%m-%d) bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed; done` | T09-T12（境界値網羅） |
| `mise exec -- pnpm sync:check` | origin/main / origin/dev / 全 worktree の遅れ確認 |

ローカル検証ブロック全体が PASS した時点で初めて Phase 11 dry-run（T14-T16）に進む。Phase 5 範囲では T14-T16 は実行しない。

## 各ステップの blast radius / rollback サマリ

| Step | blast radius | rollback 経路 |
| --- | --- | --- |
| 1 | runbook 文書のみ。読者にのみ影響 | `git revert` |
| 2 | log 文書のみ | `git revert` |
| 3 | schedule 日次起動 / Issue 起票（dry-run 既定） | `gh workflow disable` → `git revert` |
| 4 | read-only スクリプト | `git revert` |
| 5 | skill reference 1〜3 行 | `git revert` |
| 6 | ローカル検証のみ | 副作用なし |

## 自走禁止操作（approval gate）

| gate | 対象 | 停止位置 |
| --- | --- | --- |
| G0 | Phase 5 着手 | Step 1 開始前に Phase 4 検証戦略を read-only 確認 |
| G1 | テスト Issue 起票（T15） | `gh workflow run -f dry_run=false` 直前。後始末 `gh issue close` 含めユーザー承認 |
| G2 | runbook 実 rotation | 本 Phase 範囲外。Phase 11 で扱う |

## PR 前 self-review チェックリスト

- [ ] 5 ファイルすべてが新規 / 追記の 2 種に整理されている
- [ ] runbook / log / yaml / 仕様書 13 phase に Cloudflare API Token 値 / Token ID / scope 値が grep ヒットしない（T18/T19 evidence 添付）
- [ ] `permissions:` が `issues: write` / `contents: read` のみ（T20 evidence 添付）
- [ ] yaml 内 `RUNBOOK_PATH` / `LOG_PATH` が repo 上の path として存在する（T07 evidence 添付）
- [ ] `simulated_issued_at` input が追加され、空時のフォールバックが実装されている
- [ ] label 3 種（`ops` / `cloudflare` / `token-rotation`）の事前作成手順が runbook §3 に追記されている
- [ ] markdown lint / actionlint / yamllint がすべて exit 0
- [ ] `mise exec -- pnpm typecheck` / `lint` の回帰なし
- [ ] `mise exec -- pnpm sync:check` で main / dev / 他 worktree の drift なし

## ローカル実行コマンド集（Phase 5 用）

```bash
# 依存と既存回帰
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 文書 lint
pnpm dlx markdownlint-cli2 docs/30-workflows/operations/cf-token-rotation-runbook.md
pnpm dlx markdownlint-cli2 docs/30-workflows/operations/cf-token-rotation-log.md
pnpm dlx markdown-link-check docs/30-workflows/operations/cf-token-rotation-runbook.md

# yaml lint
yamllint -s .github/workflows/cf-token-rotation-reminder.yml
actionlint -color .github/workflows/cf-token-rotation-reminder.yml
yq '.permissions' .github/workflows/cf-token-rotation-reminder.yml

# 検証スクリプト
bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections
bash scripts/check-cf-rotation-reminder.sh --check-log-fields
bash scripts/check-cf-rotation-reminder.sh --check-yaml-links
bash scripts/check-cf-rotation-reminder.sh --check-no-secret
bash scripts/check-cf-rotation-reminder.sh --check-no-token-id

# 経過日数算出 境界値網羅（macOS は gdate）
for d in 84 85 89 90 91; do
  ISSUED_AT=$(gdate -u -d "${d} days ago" +%Y-%m-%d 2>/dev/null || date -u -v-${d}d +%Y-%m-%d) \
    bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed
done

# sync 確認
mise exec -- pnpm sync:check
```

## 参照資料

- `phase-01.md` 〜 `phase-04.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-05.md`（フォーマット参考）
- `CLAUDE.md`（Cloudflare CLI ルール / シークレット管理 / branch 戦略）
- `scripts/cf.sh`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 完了（最小 scope Token 投入済み） / 1Password Item 整備
- 下流: Phase 6 異常系検証 / Phase 7 AC マトリクス / Phase 11 実 dry-run

## 多角的チェック観点

- 各 Step が「変更ファイル / 内容 / blast radius / rollback / 検証コマンド」の 5 要素で揃っている
- Token 値混入リスクを Step 1/2/3 すべてで grep ゲート（Step 6）に集約
- workflow yaml の最小権限を Step 3 / Step 6 / Phase 7 AC の 3 段で機械検証
- GNU date 依存の macOS フォールバックを Step 4 と Step 6 で明記

## サブタスク管理

- [ ] Step 1 runbook 章立て 9 節を本文込みで作成
- [ ] Step 2 実施記録テンプレ 13 フィールドを作成
- [ ] Step 3 yaml + `simulated_issued_at` input 追加
- [ ] Step 4 検証スクリプト 6 サブコマンド実装
- [ ] Step 5 skill reference 追記
- [ ] Step 6 ローカル検証 PASS
- [ ] `outputs/phase-05/main.md` を作成

## 成果物

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 6 ステップすべての変更ファイル / 検証コマンドが PASS
- [ ] PR 前 self-review チェックリスト 9 項目が満たされている
- [ ] T14-T16 の実 GitHub Actions 起動を伴うテストは Phase 11 へ引き渡されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR / Token 発行 / secret 投入 / 実 GitHub Actions 起動を実行していない
- [ ] CONST_007 に従い実 dry-run（T14-T16）を Phase 11 に正しく引き渡している

## 次 Phase への引き渡し

Phase 6（異常系検証）へ:

- 各 Step の blast radius と rollback 経路
- workflow yaml 起動失敗 / 重複起票 / rate-limit / 境界値の各シナリオ前提条件

Phase 11 へ:

- T14-T16 の実 GitHub Actions 起動手順
- label 事前作成コマンド
- テスト Issue 後始末（`gh issue close`）

## 実行タスク

- [ ] phase-05 の既存セクションに記載した手順・検証・成果物作成を実行する。
