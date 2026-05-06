# Phase 11: 手動 smoke / 実測 evidence (NON_VISUAL) — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: 本 Phase は (a) 新規 yaml workflow に対する actionlint / yamllint / markdownlint 実測、(b) `gh workflow run` を通じた dry-run 実行（GitHub Actions 上の副作用を伴う）、(c) 経過日数境界 / 重複起票防止のシミュレーションログ取得、(d) secret hygiene grep を行う。実 GitHub Actions ランをトリガーするため CONST_004 により docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 11 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（spec contract 完了 + 実 production rotation runtime pending） |
| 想定実行者 | 人間オペレーター + Claude Code（user approval gate 併用） |

## 目的

Phase 5 で実装される runbook / 実施記録テンプレ / `cf-token-rotation-reminder.yml` に対し、視覚 evidence を伴わない代替 evidence（actionlint / yamllint / markdownlint / dry-run / 経過日数シミュレーション / 重複起票防止 / secret hygiene grep）を取得し、`outputs/phase-11/` 配下に保存する。

実 production rotation の実施は本 Phase に含まない（初回 rotation 期日は本タスク完了後に到来）。runtime evidence は **「初回 rotation 実施時に `cf-token-rotation-log.md` の実施記録テンプレを埋める」** ことで完了とし、本 Phase 終了時点では `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を最終状態とする。

## NON_VISUAL Evidence の正当化（visualEvidence=NON_VISUAL の根拠）

| 観点 | 説明 |
| --- | --- |
| なぜ視覚 evidence が不要か | 本タスクの成果物は (a) markdown 文書 2 件、(b) yaml workflow 1 件で、UI 表示を伴わない。Issue 自動起票の本文はテキストであり screenshot 化しても情報量が増えない |
| 代替 evidence の網羅性 | actionlint / yamllint / markdownlint で構文・spec 整合 / dry-run で実 GitHub Actions 上の動作 / 経過日数シミュレーションでロジック分岐 / 重複起票検知でガード動作 / grep で secret hygiene を機械検証する |
| ランタイム evidence の扱い | 実 production rotation は初回期日（U-FIX-CF-ACCT-01 完了から 90 日後）に runbook §4 / §5 を実施した時点で `cf-token-rotation-log.md` に記録される。本 Phase ではその雛形が機能することを dry-run で確認するに留め、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 状態で完了させる |

## 事前準備チェックリスト

- [x] `git branch --show-current` が `docs/issue-407-cf-token-rotation-90day-runbook-task-spec` であること
- [ ] `mise exec -- node -v` が `v24.15.0` であること
- [ ] Phase 5 で runbook (`docs/30-workflows/operations/cf-token-rotation-runbook.md`) / 実施記録 (`docs/30-workflows/operations/cf-token-rotation-log.md`) / `.github/workflows/cf-token-rotation-reminder.yml` が作成済み
- [ ] `gh auth status` で GitHub Actions / Issue 操作権限を保持していること
- [ ] `gh label list` で `ops` / `cloudflare` / `token-rotation` の 3 label が事前作成済（未作成の場合は `gh label create ops --color BFD4F2` 等で作成）
- [ ] GitHub Variables `CF_TOKEN_ISSUED_AT` がテスト用値（後述シミュレーション用）に設定可能であること
- [ ] evidence 保存ディレクトリを作成: `mkdir -p docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/outputs/phase-11`

> 以下では evidence ルートを `EVID=docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/outputs/phase-11` と表記する。

## Approval Gate プロンプト

本タスクの Phase 10 で定義した G-FR-1（spec contract 完了）が事前に取得済であること。本 Phase 内の追加承認は以下 1 件のみ。

### G-WD: workflow_dispatch 経由 dry-run 実行承認

```
[G-WD: WORKFLOW_DISPATCH DRY-RUN APPROVAL]
予定コマンド:
  gh workflow run cf-token-rotation-reminder.yml -f dry_run=true
影響範囲:
  - GitHub Actions ランナー 1 回起動（< 1 分、free-tier 内）
  - dry_run=true のため Issue 起票は発生しない
  - $GITHUB_STEP_SUMMARY にプレビュー出力のみ
失敗時の対応:
  - actionlint / yamllint で再検査 → Phase 9 Q4 / Q3 に差し戻し
"approve G-WD" と返信してください。
```

## NON_VISUAL evidence 一覧（保存先 / 命名規則 / 取得コマンド / 期待 size / 検証 grep）

| # | 種別 | 保存先 (filename) | 取得コマンド | 期待 size | 検証 grep |
| --- | --- | --- | --- | --- | --- |
| 1 | markdownlint runbook | `$EVID/qa-markdownlint.log` | `mise exec -- pnpm dlx markdownlint-cli2 'docs/30-workflows/operations/cf-token-rotation-runbook.md' 'docs/30-workflows/operations/cf-token-rotation-log.md' \| tee $EVID/qa-markdownlint.log` | <10 KB | `Summary: 0 error(s)` |
| 2 | markdown link check | `$EVID/qa-link-check.log` | `mise exec -- pnpm dlx markdown-link-check docs/30-workflows/operations/cf-token-rotation-runbook.md \| tee $EVID/qa-link-check.log` | <10 KB | `0 dead links found` |
| 3 | yamllint | `$EVID/qa-yamllint.log` | `mise exec -- pnpm dlx yaml-lint .github/workflows/cf-token-rotation-reminder.yml \| tee $EVID/qa-yamllint.log` | <5 KB | exit 0（または `valid YAML`） |
| 4 | actionlint | `$EVID/qa-actionlint.log` | `actionlint .github/workflows/cf-token-rotation-reminder.yml \| tee $EVID/qa-actionlint.log` | <5 KB | exit 0（無出力で OK） |
| 5 | runbook 章立て検査 | `$EVID/qa-runbook-headings.log` | `grep -E '^## [1-9]\.' docs/30-workflows/operations/cf-token-rotation-runbook.md \| tee $EVID/qa-runbook-headings.log` | <2 KB | 9 行 |
| 6 | 実施記録テンプレ項目数 | `$EVID/qa-log-template.log` | `grep -E '^\| .+ \|' docs/30-workflows/operations/cf-token-rotation-log.md \| tee $EVID/qa-log-template.log` | <5 KB | ≥ 13 行 |
| 7 | yaml permissions | `$EVID/qa-permissions.log` | `mise exec -- bash -c 'yq ".permissions" .github/workflows/cf-token-rotation-reminder.yml' \| tee $EVID/qa-permissions.log` | <1 KB | `issues: write` / `contents: read` のみ |
| 8 | yaml secrets 不参照 | `$EVID/qa-no-secrets.log` | `grep -nE '\$\{\{\s*secrets\.' .github/workflows/cf-token-rotation-reminder.yml \| tee $EVID/qa-no-secrets.log \|\| true` | 0 行 | （空ファイル） |
| 9 | secret hygiene grep | `$EVID/qa-secret-leak.log` | `grep -rEn 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}\|Bearer [A-Za-z0-9_.-]{20,}\|"id":\s*"[a-f0-9]{32}"' docs/30-workflows/operations/ .github/workflows/cf-token-rotation-reminder.yml \| tee $EVID/qa-secret-leak.log \|\| true` | 0 行 | （空ファイル） |
| 10 | placeholder 不在 | `$EVID/qa-placeholder.log` | `grep -rn 'NOT_EXECUTED\|TBD\|FIXME' docs/30-workflows/operations/ .github/workflows/cf-token-rotation-reminder.yml \| tee $EVID/qa-placeholder.log \|\| true` | 0 行 | （空ファイル） |
| 11 | dry-run 実行ログ | `$EVID/qa-dryrun.log` | 後述「dry-run 実行手順」 | 1-30 KB | `dry-run preview` 文字列が含まれる / `gh issue create` が含まれない |
| 12 | 86 日経過 → should_remind=true | `$EVID/qa-elapsed-86d.log` | 後述「経過日数シミュレーション」 | <2 KB | `should_remind=true` |
| 13 | 84 日経過 → should_remind=false | `$EVID/qa-elapsed-84d.log` | 同上 | <2 KB | `should_remind=false` |
| 14 | 重複起票防止シミュレーション | `$EVID/qa-dup-detect.log` | 後述「重複起票防止シミュレーション」 | <5 KB | `existing.count >= 1` で create skip |
| 15 | aiworkflow-requirements 整合 | `$EVID/qa-aiworkflow-sync.log` | `mise exec -- pnpm sync:check 2>&1 \| tee $EVID/qa-aiworkflow-sync.log` および `pnpm indexes:rebuild` の差分確認 | <10 KB | `behind: 0` / `ahead: 0` / drift なし |
| 16 | CODEOWNERS 構文 | `$EVID/qa-codeowners.log` | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors \| tee $EVID/qa-codeowners.log` | <1 KB | `{"errors":[]}` |
| 17 | branch protection drift | `$EVID/qa-branch-protection.json` | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq '{required_pull_request_reviews, lock_branch, enforce_admins}' \| tee $EVID/qa-branch-protection.json` | <2 KB | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` |

## dry-run 実行手順（evidence #11）

1. G-WD approval を取得。
2. workflow ファイルを feature ブランチに push 済であること（`gh workflow list` で `cf-token-rotation-reminder` が見えること）。
3. dry-run 起動:

   ```bash
   gh workflow run cf-token-rotation-reminder.yml -f dry_run=true --ref "$(git branch --show-current)"
   sleep 10
   RUN_ID=$(gh run list --workflow=cf-token-rotation-reminder.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   gh run watch "$RUN_ID"
   gh run view "$RUN_ID" --log | tee "$EVID/qa-dryrun.log"
   ```

4. 検証:
   - `qa-dryrun.log` に `dry-run preview` を含む行が 1 件以上ある
   - `qa-dryrun.log` に `gh issue create ` を含む行が **存在しない**
   - dry-run 実行直後の `gh issue list --search "in:title \"[cf-token-rotation]\"" --state open` が dry-run 実行前と同件数（増加なし）

## 経過日数シミュレーション手順（evidence #12 / #13）

yaml の `Compute elapsed days and decide` step ロジックをローカル bash で再現する:

```bash
simulate_elapsed() {
  local days_ago=$1
  local threshold=85
  local issued_at
  issued_at=$(date -u -d "${days_ago} days ago" +%Y-%m-%d)
  local issued_epoch now_epoch elapsed_days
  issued_epoch=$(date -u -d "${issued_at}" +%s)
  now_epoch=$(date -u +%s)
  elapsed_days=$(( (now_epoch - issued_epoch) / 86400 ))
  local should_remind=false
  if (( elapsed_days >= threshold )); then should_remind=true; fi
  echo "ISSUED_AT=${issued_at}"
  echo "ELAPSED_DAYS=${elapsed_days}"
  echo "should_remind=${should_remind}"
}

simulate_elapsed 86 | tee "$EVID/qa-elapsed-86d.log"  # → should_remind=true
simulate_elapsed 84 | tee "$EVID/qa-elapsed-84d.log"  # → should_remind=false
```

> macOS BSD `date` 環境では `gdate` を使うこと（`brew install coreutils` 後 `alias date=gdate`）。GitHub Actions ubuntu-latest では GNU `date` 前提なので yaml 側はそのまま動作する。

## 重複起票防止シミュレーション手順（evidence #14）

1. テスト用に title prefix を完全一致させた Issue を 1 件手動起票:

   ```bash
   gh issue create \
     --title "[cf-token-rotation] 90日rotation期日が接近 (シミュレーション用)" \
     --body "Phase 11 重複検知シミュレーション。検証後 close する。" \
     --label "ops,cloudflare,token-rotation"
   TEST_ISSUE=$(gh issue list --search "in:title \"[cf-token-rotation]\"" --state open --json number --jq '.[0].number')
   ```

2. dry-run を再実行（既存 open Issue が 1 件ある状態で）:

   ```bash
   gh workflow run cf-token-rotation-reminder.yml -f dry_run=false --ref "$(git branch --show-current)"
   # ※注意: dry_run=false でも 86 日未経過なら create step に到達しない
   #   経過日数 ≥ 85 を擬似する場合は GitHub Variables CF_TOKEN_ISSUED_AT を 86 日前に一時設定
   ```

3. workflow ログから「`steps.existing.outputs.count` が 1 以上で create step が skip された」ことを確認:

   ```bash
   RUN_ID=$(gh run list --workflow=cf-token-rotation-reminder.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   gh run view "$RUN_ID" --log | tee "$EVID/qa-dup-detect.log"
   grep -E 'existing.outputs.count=[1-9]|skipped: existing reminder' "$EVID/qa-dup-detect.log"
   ```

4. 検証完了後、テスト用 Issue を close:

   ```bash
   gh issue close "$TEST_ISSUE" --comment "Phase 11 重複検知シミュレーション完了。close。"
   ```

5. GitHub Variables を元の値に戻す（一時変更した場合のみ）。

## 取得不能時のフォールバック手順

| 事象 | 対応 | 記録先 |
| --- | --- | --- |
| `gh workflow run` が permission エラー | feature ブランチが push 済か確認 / `gh auth refresh -s workflow` で scope 拡張 / 失敗時は理由を `qa-dryrun.log` 1 行目に記録 | `qa-dryrun.log` 自体 |
| GitHub Actions free-tier 超過 | 月間使用量を確認し、超過時は本 Phase を翌月に再試行する旨を `outputs/phase-11/main.md` に記録 | `outputs/phase-11/main.md` notes 欄 |
| `actionlint` / `yamllint` / `markdownlint` パッケージ取得不能 | mise exec 経由でも失敗する場合、CI 上の `verify-indexes-up-to-date` 相当 workflow が green なら soft pass として記録（理由を明記） | 該当 `qa-*.log` 1 行目 |
| シミュレーション用テスト Issue が close 漏れ | 翌日の自動起票で重複検知が暴発する可能性。Phase 12 documentation 更新で「テスト Issue は必ず close」を運用ノートに追記 | `outputs/phase-12/main.md` |
| `gh label create` がレート制限 | 1 分待機して再試行。3 回失敗時は手動で GitHub UI から作成 | `qa-label.log`（任意） |

## evidence サマリ表（`outputs/phase-11/main.md` の最終構成）

`outputs/phase-11/main.md` には次の 4 セクションを必ず置く:

1. status: `pending → executed (PASS_BOUNDARY_SYNCED_RUNTIME_PENDING)`
2. evidence 一覧表（17 行 × `path` / `hash`(shasum -a 256) / `size_bytes`(wc -c) / `acquired_at_utc` / `result(PASS|FAIL|N/A)` / `notes`）
3. approval gate 取得記録表（G-FR-1 / G-WD × `approved_at` / `approved_by` / `command_executed`）
4. runtime pending 明示（実 production rotation は初回期日に runbook §4 / §5 を実施し `cf-token-rotation-log.md` に記録することで完了する旨）

## 統合テスト連携

- 上流: Phase 9 品質ゲート / Phase 10 G-FR-1 取得済
- 下流: Phase 12 ドキュメント更新 / Phase 13 PR 作成（G-FR-2 取得後）

## 多角的チェック観点

- 不変条件（Token 値非掲載）が evidence #9 で grep ベース確認されている
- workflow `permissions:` 最小権限が evidence #7 / #8 で二重確認
- dry-run と本番起票の混乱が evidence #11 / #14 で機械検証
- 経過日数境界（85/84）が両側 evidence #12 / #13 で確認
- 17 evidence すべてに hash / size / 取得時刻が埋まっている
- secret / Token 値が evidence へ混入していない（evidence #9 / Step C）
- approval gate G-FR-1 / G-WD が CLI 出力に明示記録されている
- runtime pending（実 production rotation 未実施）が状態語彙で明示されている

## サブタスク管理

- [ ] 事前準備チェックリスト 7 項目を完了
- [ ] G-WD approval を取得
- [ ] 17 evidence をすべて保存
- [ ] dry-run 実行 + 重複検知シミュレーションでテスト用 Issue を close 済
- [ ] `outputs/phase-11/main.md` の 4 セクションを更新
- [ ] `grep -R NOT_EXECUTED` 0 件確認
- [ ] secret 混入の最終 grep 確認
- [ ] 状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を `outputs/phase-11/main.md` に明記

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/qa-*.log` 16 件 + `qa-branch-protection.json` 1 件 = 17 件

## 完了条件

- [ ] 全 17 evidence が定義パスに存在し、`outputs/phase-11/main.md` の表が完全に埋まっている
- [ ] approval gate G-FR-1 / G-WD の取得記録が残っている
- [ ] dry-run ログに `gh issue create ` 行が含まれない
- [ ] 86 日 / 84 日経過シミュレーションが両 PASS
- [ ] 重複検知シミュレーション後にテスト用 Issue が close されている
- [ ] 状態 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR / Token 発行 / 実 production rotation を実行していない
- [ ] CONST_007 違反（先送り）が発生していない（runtime pending は意図的明示で先送りに該当しない）

## 次 Phase への引き渡し

Phase 12 へ:
- 17 evidence の hash / size / 結果サマリ
- runtime pending 説明（初回 rotation 期日に runbook を実行することで完了）
- documentation 更新で参照すべき evidence path 一覧

## 実行タスク

- [ ] phase-11 の既存セクションに記載した手順・検証・成果物作成を実行する

## 参照資料

- `phase-09.md`（品質ゲートマトリクス）
- `phase-10.md`（G-FR-1 / G-FR-2 設計）
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `CLAUDE.md`（branch protection / Cloudflare CLI / Governance）
