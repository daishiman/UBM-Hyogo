# Phase 9: 品質保証 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: 本 Phase は runbook (.md) / 実施記録テンプレ (.md) / `.github/workflows/cf-token-rotation-reminder.yml` (.yml) の 3 成果物に対し、(a) markdown / yaml / actionlint / lint、(b) secret 漏洩 grep、(c) workflow dry-run 動作、(d) aiworkflow-requirements 整合 を機械検証する品質ゲートを定義する。本ゲートは Phase 11 evidence 取得の前段で blocking 判定に用いる。docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 9 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11 で取得する NON_VISUAL evidence（actionlint / yamllint / markdownlint / dry-run / 経過日数シミュレーション / 重複起票シミュレーション / secret hygiene grep）に対して、(a) 形式整合性 / (b) secret 漏洩ゼロ / (c) workflow dry-run の機能性 / (d) aiworkflow-requirements 整合 / (e) governance を機械的に検証する品質ゲートマトリクスを確定する。

## 品質ゲートマトリクス

| # | ゲート名 | 検証コマンド（mise exec 経由） | 期待結果 | blocker 種別 | Phase 11 evidence path |
| --- | --- | --- | --- | --- | --- |
| Q1 | markdown lint | `mise exec -- pnpm dlx markdownlint-cli2 'docs/30-workflows/operations/cf-token-rotation-runbook.md' 'docs/30-workflows/operations/cf-token-rotation-log.md'` | exit 0（既存設定の rule に違反 0 件） | hard | `outputs/phase-11/qa-markdownlint.log` |
| Q2 | markdown link check | `mise exec -- pnpm dlx markdown-link-check docs/30-workflows/operations/cf-token-rotation-runbook.md` | dead link 0 件 | hard | `outputs/phase-11/qa-link-check.log` |
| Q3 | yamllint | `mise exec -- pnpm dlx yaml-lint .github/workflows/cf-token-rotation-reminder.yml` | exit 0 | hard | `outputs/phase-11/qa-yamllint.log` |
| Q4 | actionlint | `mise exec -- bash -c 'curl -fsSL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash \| bash && ./actionlint .github/workflows/cf-token-rotation-reminder.yml'` または事前インストール済 actionlint | exit 0 | hard | `outputs/phase-11/qa-actionlint.log` |
| Q5 | secret hygiene grep（Token 値 / ID / scope 値非掲載） | `grep -rEn 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}\|Bearer [A-Za-z0-9_.-]{20,}\|"id":\s*"[a-f0-9]{32}"\|com\.cloudflare\.api\.account\.zone\.[a-z]+' docs/30-workflows/operations/ .github/workflows/cf-token-rotation-reminder.yml` | 0 hit | hard | `outputs/phase-11/qa-secret-leak.log`（grep 出力 0 行） |
| Q6 | placeholder 不在 | `grep -rn 'NOT_EXECUTED\|TBD\|FIXME' docs/30-workflows/operations/ .github/workflows/cf-token-rotation-reminder.yml` | 0 hit | hard | `outputs/phase-11/qa-placeholder.log` |
| Q7 | runbook 章立て完備 | `grep -E '^## [1-9]\.' docs/30-workflows/operations/cf-token-rotation-runbook.md \| wc -l` | 9（§1〜§9） | hard | `outputs/phase-11/qa-runbook-headings.log` |
| Q8 | 実施記録テンプレ項目数 | `grep -E '^\| .+ \|' docs/30-workflows/operations/cf-token-rotation-log.md \| wc -l` | ≥ 13（テンプレ表のフィールド行数） | hard | `outputs/phase-11/qa-log-template.log` |
| Q9 | yaml `permissions:` 最小権限 | `mise exec -- bash -c 'yq ".permissions" .github/workflows/cf-token-rotation-reminder.yml'` | `issues: write` / `contents: read` のみ。`secrets`/`actions`/`packages` 不在 | hard | `outputs/phase-11/qa-permissions.log` |
| Q10 | yaml `secrets:` 不参照 | `grep -nE '\$\{\{\s*secrets\.' .github/workflows/cf-token-rotation-reminder.yml` | 0 hit（最小権限・通知のみ方針） | hard | `outputs/phase-11/qa-no-secrets.log` |
| Q11 | dry-run 動作（`workflow_dispatch` 経由 / `dry_run=true`） | `gh workflow run cf-token-rotation-reminder.yml -f dry_run=true` → `gh run view <run-id> --log` | step summary に「dry-run preview」テキストが出力 / Issue が起票されない（`gh issue list --search "in:title cf-token-rotation" --state open` で count 増加なし） | hard | `outputs/phase-11/qa-dryrun.log` |
| Q12 | 85 日経過判定（`simulated_days_elapsed`） | yaml の経過日数算出を local bash で再現: `ISSUED_AT=$(date -u -d '86 days ago' +%Y-%m-%d); bash -c '...elapsed_days 計算...'` | `should_remind=true` を出力 | hard | `outputs/phase-11/qa-elapsed-86d.log` |
| Q13 | 84 日経過判定（境界 -1） | 同上で `ISSUED_AT=$(date -u -d '84 days ago' +%Y-%m-%d)` | `should_remind=false` を出力 | hard | `outputs/phase-11/qa-elapsed-84d.log` |
| Q14 | 重複起票防止シミュレーション | 既存 open Issue が 1 件ある状態で dry-run を実行（テスト用 Issue を一時起票し、検証後 close） | `existing.count >= 1` で create step が skip される | hard | `outputs/phase-11/qa-dup-detect.log` |
| Q15 | aiworkflow-requirements 整合 | `references/deployment-secrets-management.md` に rotation runbook 相対リンクが追記され `pnpm indexes:rebuild` 後に drift がない | `mise exec -- pnpm sync:check` 相当または `verify-indexes-up-to-date` workflow が green | hard | `outputs/phase-11/qa-aiworkflow-sync.log` |
| Q16 | governance（CODEOWNERS） | `.github/workflows/cf-token-rotation-reminder.yml` が既存 CODEOWNERS の `.github/workflows/**` ルールに継承されること: `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` | `{"errors":[]}` | hard | `outputs/phase-11/qa-codeowners.log` |
| Q17 | branch protection drift なし | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq '{required_pull_request_reviews, lock_branch, enforce_admins}'` | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | hard | `outputs/phase-11/qa-branch-protection.json` |
| Q18 | typecheck（影響なし宣言） | n/a（実装コード変更なし） | スキップ宣言を `outputs/phase-11/qa-typecheck.log` に記録 | n/a | 同 |

> hard: 失敗時に Phase 13 PR 作成を停止 / soft: 該当なし（本タスクは soft pass を持たない）/ n/a: 適用外（スキップ宣言のみ記録）

## 実行順序と blocking 区分

```
[order]                                      [blocking?]
Q1  markdown lint                            blocking
Q2  link check                               blocking
Q3  yamllint                                 blocking
Q4  actionlint                               blocking
Q5  secret hygiene grep                      blocking
Q6  placeholder 不在                         blocking
Q7  runbook 章立て完備                       blocking
Q8  実施記録テンプレ項目数                   blocking
Q9  permissions 最小権限                     blocking
Q10 secrets 不参照                           blocking
   --- Phase 11 evidence 取得（dry-run / シミュレーション）---
Q11 dry-run 動作                             blocking
Q12 85 日経過 → should_remind=true            blocking
Q13 84 日経過 → should_remind=false           blocking
Q14 重複起票防止シミュレーション             blocking
Q15 aiworkflow-requirements 整合             blocking
Q16 governance                               blocking
Q17 branch protection drift                  blocking
Q18 typecheck（n/a 宣言のみ）                skip
```

`Q1〜Q10` は Phase 11 evidence 取得の前段で実施し、static check として yaml / md の整合を担保する。`Q11〜Q14` は workflow dry-run / 経過日数ロジックの実測。`Q15〜Q17` は governance / aiworkflow 整合の最終確認。

## 失敗時の自動修復可否

| ゲート | 自動修復可否 | 失敗時の分岐 |
| --- | --- | --- |
| Q1 markdown lint | ◯（`mise exec -- pnpm dlx markdownlint-cli2 --fix` を 1 回試行） | 再失敗時は手修正、CONST_007 で先送り禁止 |
| Q2 link check | × | 死リンクを修正コミットで解消（最大 3 回） |
| Q3 yamllint | △ | インデント / 末尾空白の単純違反は手修正可。構造違反は Phase 6 へ戻す |
| Q4 actionlint | × | step 構造の論理エラー。Phase 2 / 6 へ戻す |
| Q5 secret hygiene | × | 該当ファイルを redact 編集。`git reflog` で履歴清掃が必要な規模なら新ブランチで再構築 |
| Q6 placeholder | × | 残存箇所を実値に置換（または明示の TODO 表記でなく文章化） |
| Q7 / Q8 章立て・テンプレ項目数 | × | runbook / log を Phase 2 設計まで戻して章立て補完 |
| Q9 permissions | × | yaml を最小権限に再編集 |
| Q10 secrets 不参照 | × | secrets 参照を削除（通知のみ方針に整合） |
| Q11 dry-run 動作 | × | yaml の `if:` 式を再検証。Phase 3 設計盲点（dry-run 既定値 / choice 型）を再レビュー |
| Q12 / Q13 経過日数判定 | × | `THRESHOLD_DAYS` / `date -u -d` 計算を yaml で再修正 |
| Q14 重複起票防止 | × | `gh issue list --search` の title prefix を再固定 |
| Q15 aiworkflow-requirements 整合 | △ | `pnpm indexes:rebuild` で再生成。drift が残る場合は Phase 12 へ戻す |
| Q16 / Q17 governance | × | CODEOWNERS / branch protection 側の drift を `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` に従い手動修正 |

> 自動修復は基本不可。`Q1` のみ `--fix` 1 回試行。それ以外は Phase 6 異常系シナリオへ分岐させるか、Phase 2/3 へ差し戻す。

## evidence の整合性検証手順

Phase 11 evidence 取得後、以下の順で機械チェックを行う。

### Step A: ファイル数検証

```bash
EVIDENCE_DIR=docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/outputs/phase-11
EXPECTED=14   # qa-{markdownlint,link-check,yamllint,actionlint,secret-leak,placeholder,runbook-headings,log-template,permissions,no-secrets,dryrun,elapsed-86d,elapsed-84d,dup-detect}.log + others
ACTUAL=$(find "$EVIDENCE_DIR" -maxdepth 2 -type f \( -name 'qa-*.log' -o -name 'qa-*.json' \) | wc -l)
test "$ACTUAL" -ge "$EXPECTED" || echo "EVIDENCE_COUNT_BELOW:$ACTUAL/$EXPECTED"
```

### Step B: size > 0 検証

```bash
for f in $(find "$EVIDENCE_DIR" -type f); do
  test -s "$f" || echo "EMPTY:$f"
done
```

### Step C: secret leak grep（Q5 と同じ）

```bash
grep -rEn 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|Bearer [A-Za-z0-9_.-]{20,}|"id":\s*"[a-f0-9]{32}"' \
  "$EVIDENCE_DIR" docs/30-workflows/operations/ .github/workflows/cf-token-rotation-reminder.yml \
  > "$EVIDENCE_DIR/qa-secret-leak.log" || true
test ! -s "$EVIDENCE_DIR/qa-secret-leak.log"
```

### Step D: dry-run 出力に Issue 起票が混入していないか

```bash
grep -E 'gh issue create' "$EVIDENCE_DIR/qa-dryrun.log" \
  && echo "ERROR: dry-run で issue create が実行されている" \
  || echo "OK: dry-run で issue create は実行されていない"
```

### Step E: hash 記録

```bash
( cd "$EVIDENCE_DIR" && find . -type f -print0 | xargs -0 shasum -a 256 ) \
  > "$EVIDENCE_DIR/qa-hash.txt"
```

## 参照資料

- `phase-01.md` 〜 `phase-08.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `scripts/cf.sh`
- `CLAUDE.md`（branch protection / Cloudflare CLI / Governance）

## 統合テスト連携

- 上流: Phase 8（共通化判定 / invariant 共通化）
- 下流: Phase 10（最終レビュー） / Phase 11（NON_VISUAL evidence 取得）

## 多角的チェック観点

- 不変条件（Token 値 / ID / scope 値非掲載）が Q5 / Step C で二重 grep 検証されている
- workflow `permissions:` 最小権限が Q9 / Q10 で二重に検証されている
- dry-run と本番起票の混乱が Q11 / Q14 / Step D で機械検証されている
- 経過日数境界（85/84 日）が Q12 / Q13 で両側検証されている
- governance（CODEOWNERS / branch protection）が Q16 / Q17 で個別確認されている
- coverage 概念は本タスクで適用外（実装コード変更なし。Q18 でスキップ宣言）

## サブタスク管理

- [ ] Q1〜Q17 を Phase 5 ランブックの step 番号と対応付ける
- [ ] Step A〜E の検証コマンドを Phase 11 ランブックの最終 step に組み込む
- [ ] 失敗時の分岐（Phase 2/3 差し戻し / Phase 6 異常系 / unassigned-task 起票）を確定
- [ ] `outputs/phase-09/main.md` を作成

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- [ ] 品質ゲートマトリクス Q1〜Q17 が evidence path と blocker 種別とともに確定している
- blocking 区分と実行順序が定義されている
- 失敗時の自動修復可否と分岐先が確定している
- evidence 整合性検証 Step A〜E が機械実行可能なコマンドとして揃っている
- coverage 概念の適用外宣言（Q18）が記録されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実装、commit、push、PR を実行していない
- [ ] coverage 概念が誤用されていない（Q18 でスキップ宣言）
- [ ] CONST_007 違反（「Phase XX で QA」型の先送り）が無い

## 次 Phase への引き渡し

Phase 10 へ:
- 品質ゲートマトリクス Q1〜Q17
- evidence 整合性検証 Step A〜E のコマンド契約
- 失敗時に Phase 2/3 へ戻すか unassigned-task 起票するかの判定基準
- typecheck 適用外宣言（Q18）

## 実行タスク

- [ ] phase-09 の既存セクションに記載した手順・検証・成果物作成を実行する
