# Phase 11: 手動検証（NON_VISUAL / dry-run + redaction + Slack test post）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動検証（NON_VISUAL / shell + workflow_dispatch dry-run + redaction audit + Slack test post） |
| 作成日 | 2026-05-07 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created → completed（実行時 / `CONTRACT_READY_RUNTIME_PENDING` 同時併記） |
| 実装区分 | **実装仕様書（CONST_004）** |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| user_approval_required | false |
| GitHub Issue | #517（CLOSED 維持 / reopen 禁止） |
| 変更対象ファイル | `.github/workflows/post-release-30day-auto-summary.yml` / `scripts/post-release-dashboard/30day-summary.sh` / `scripts/post-release-dashboard/lib/aggregate.sh` / `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` |
| GitHub Secrets | `SLACK_WEBHOOK_URL`（Phase 11 preflight で登録済み確認。未登録なら `CONTRACT_READY_SECRET_PENDING` として Slack test post は未 PASS） |

---

## VISUAL / NON_VISUAL 判定

- mode: **NON_VISUAL**（UI 追加なし / 一次証跡は CLI ログ + workflow run log + Slack 受信時刻メモに閉じる）
- screenshot は **不要**（`outputs/phase-11/screenshots/` ディレクトリは作成しない / false green 防止）
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`（NON_VISUAL の 5 点必須セット相当 / 本タスク向けに 9 点拡張）+ `phase-11-guide.md`

---

## 目的

`.github/workflows/post-release-30day-auto-summary.yml` と `scripts/post-release-dashboard/30day-summary.sh` を **起動可能な状態にする** 受入確認を行う。

具体検証対象:

1. shell script が shellcheck warning 0 件で構文健全
2. workflow YAML が actionlint warning 0 件で構文健全
3. `--dry-run` 実行で stdout に集計 markdown が出力され、副作用（PR 起票 / Slack POST）が起きない
4. dry-run stdout を grep 検査し、`token` / `bearer` / `secret` / `Authorization` 等が混入していない（redaction PASS）
5. fixture（30 日未満 / 同月内既存 PR）入力で silent skip（exit 0）が機能する
6. `gh workflow run -f dry_run=true` で workflow_dispatch が成功する
7. Slack channel `w1618436027-ek2505248` の channel / Incoming Webhook / 1Password / GitHub Secret preflight が完了している
8. Slack channel `w1618436027-ek2505248` への test webhook post が成功する（実 secret 利用 / 受信確認は Slack 側 timestamp メモで代替）

---

## runtime gate（30 日 gate）の取扱

| 区分 | 内容 |
| --- | --- |
| 本タスクの責務 | workflow を **起動可能な状態にする** こと（spec + 実装 + dry-run 検証）|
| 本 Phase で確認すること | shell + workflow 構文 / dry-run / redaction / fixture silent skip / workflow_dispatch / Slack test post |
| 本 Phase で確認**しない**こと | 実 30 日 gate 成立時の本番 PR 起票（親 issue-497 完了後 30 日経過時点で初発火するため時間依存） |
| 状態語彙 | **`CONTRACT_READY_RUNTIME_PENDING`**（spec / 実装 / dry-run PASS / scheduled runtime PASS は時間依存で pending） |
| artifacts.json への記録 | Phase 11 実行完了時、`phases[10].status = "completed"` に更新し、`phases[10].runtime_state = "CONTRACT_READY_RUNTIME_PENDING"` を併記 |

> 本 Phase の PASS は dry-run / fixture / Slack test post の 3 軸で完了し、scheduled cron の本番初発火は **post-merge 後 30 日経過時点で別途確認** する（Phase 13 post-merge アクション項に記載）。

---

## Slack channel bootstrap preflight

Phase 11 の最初に実施する。これは外部操作を伴うため user approval が必要であり、workflow / shell script へ channel 作成ロジックを入れない。

| 順 | 確認項目 | evidence |
| --- | --- | --- |
| P-1 | Slack channel `w1618436027-ek2505248` が存在し、運用者が閲覧 / 投稿確認できる | `outputs/phase-11/evidence/slack-test-post.log` |
| P-2 | Incoming Webhook の投稿先が当該 channel に bind されている | `outputs/phase-11/evidence/slack-test-post.log`（URL は記録しない） |
| P-3 | Webhook URL が 1Password 正本に保存されている | `outputs/phase-11/evidence/slack-test-post.log`（item 名のみ、値は記録しない） |
| P-4 | GitHub Secret `SLACK_WEBHOOK_URL` が登録済み | `gh secret list` の secret 名のみを記録 |
| P-5 | `[TEST FROM ISSUE-517 PHASE-11]` prefix の test post が HTTP 200 で届き、確認後に削除される | HTTP status / 受信時刻 / 削除確認メモ |

P-1〜P-4 が未完了の場合、Phase 11 は `CONTRACT_READY_SECRET_PENDING` とし、Slack test post を PASS にしない。

---

## 実行タスク

| 順 | タスク | 出力 evidence |
| --- | --- | --- |
| 1 | shellcheck 実行 | `outputs/phase-11/evidence/shellcheck.log` |
| 2 | actionlint 実行 | `outputs/phase-11/evidence/actionlint.log` |
| 3 | TC-01〜TC-07 実行（既存 `__tests__/run-all.sh` 経由） | `outputs/phase-11/evidence/test.log` |
| 4 | local `--dry-run` 実行 | `outputs/phase-11/evidence/dry-run-stdout.log` |
| 5 | dry-run 出力に対する redaction grep | `outputs/phase-11/evidence/redaction-grep-audit.log` |
| 6 | fixture（30 日未満）入力時の silent skip 確認 | `outputs/phase-11/evidence/silent-skip-exit0.log` |
| 7 | fixture（同月内既存 PR）入力時の skip 確認 | `outputs/phase-11/evidence/duplicate-pr-skip.log` |
| 8 | `gh workflow run -f dry_run=true` で workflow_dispatch 実行 | `outputs/phase-11/evidence/workflow-dispatch-dry-run.log` |
| 9 | Slack channel bootstrap + test webhook post | `outputs/phase-11/evidence/slack-test-post.log` |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 緩和策 |
| --- | --- | --- |
| 1 | shellcheck / actionlint がローカル未インストール | `brew install shellcheck actionlint` で導入。CI 側の lint job でも検出されるが本 Phase は local PASS を 1 次基準とする |
| 2 | dry-run 出力に実 PR URL や DB id が紛れ込む | dry-run mode では `gh pr create` を skip するだけでなく、`gh run list` の `databaseId` を `[REDACTED-DBID]` に伏せる旨を script 側で対応済かを Phase 11 で再確認 |
| 3 | fixture と本物 `gh run list` の混在 | `--fixture` フラグ or `POST_RELEASE_FIXTURE_JSON` 環境変数で fixture mode を明示。実行時に fixture path を evidence に記録 |
| 4 | Slack webhook の test post で本番チャンネルに乱投稿 | test post 文面冒頭に `[TEST FROM ISSUE-517 PHASE-11]` prefix を入れる / 直後に Slack 側で削除可能であることを README に記載 |
| 5 | workflow_dispatch dry-run で repo が一時的に branch を作ってしまう | dry-run mode では `git push` / `gh pr create` も skip する仕様を Phase 2 で確定済 → Phase 11 で実 log で再確認 |
| 6 | runtime 30 日 gate の本番初発火が遅延 / 沈黙 | post-merge 後 30 日経過時点での scheduled run 監視を Phase 13 post-merge アクションに明記 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | dry-run + Slack test post で「起動可能性」を証跡化し、scheduled runtime PASS まで責任を切り分け |
| 実現性 | PASS | shellcheck / actionlint / `gh workflow run` / curl webhook はすべて local + GHA で実行可能 |
| 整合性 | PASS | AC-1（silent skip）/ AC-3（Slack）/ AC-4（重複検出）/ AC-5（redaction）/ AC-7（workflow_dispatch）/ AC-8（local dry-run）と直接対応 |
| 運用性 | PASS | evidence 9 点が canonical path に固定 / `CONTRACT_READY_RUNTIME_PENDING` で運用責任境界を明示 |

---

## evidence 一覧 / AC 紐付け

| AC | path | 内容 | 取得コマンド |
| --- | --- | --- | --- |
| AC-1 / AC-7 | `outputs/phase-11/evidence/silent-skip-exit0.log` | fixture（最古 run < 30 日）入力で exit 0 / 副作用なし | `POST_RELEASE_FIXTURE_JSON=fixtures/under-30d.json bash scripts/post-release-dashboard/30day-summary.sh --dry-run; echo "exit=$?"` |
| AC-2 / AC-6 | `outputs/phase-11/evidence/dry-run-stdout.log` | conclusion 分布 / 連続 failure / 原因分類 / failure 比率 / `>=10%` 時の retry/alert 検討節 | `POST_RELEASE_FIXTURE_JSON=fixtures/over-30d-with-failures.json bash scripts/post-release-dashboard/30day-summary.sh --dry-run` |
| AC-3 | `outputs/phase-11/evidence/slack-test-post.log` | Slack channel `w1618436027-ek2505248` への 5 行以内 test payload POST 結果（HTTP 200 + 受信時刻） | `curl -sS -X POST -H 'Content-type: application/json' --data '{"text":"[TEST FROM ISSUE-517 PHASE-11] dry-run notification"}' "$SLACK_WEBHOOK_URL"` |
| AC-4 | `outputs/phase-11/evidence/duplicate-pr-skip.log` | 同月内既存 draft PR fixture 投入時に exit 0 / Slack 通知なし | `POST_RELEASE_FIXTURE_PR_LIST=fixtures/existing-pr.json bash scripts/post-release-dashboard/30day-summary.sh --dry-run` |
| AC-5 | `outputs/phase-11/evidence/redaction-grep-audit.log` | dry-run 出力 0 件 hit 期待 | `grep -E 'token\|bearer\|secret\|Authorization' outputs/phase-11/evidence/dry-run-stdout.log \|\| echo CLEAN` |
| AC-7 | `outputs/phase-11/evidence/workflow-dispatch-dry-run.log` | `gh workflow run` HTTP 204 + `gh run watch` で完走確認 | `gh workflow run post-release-30day-auto-summary.yml -f dry_run=true && gh run list --workflow=post-release-30day-auto-summary.yml --limit=1` |
| AC-8 | `outputs/phase-11/evidence/dry-run-stdout.log` | local `--dry-run` で stdout に markdown 集計 / PR 起票・Slack 送信なし | `bash scripts/post-release-dashboard/30day-summary.sh --dry-run` |
| 構文 | `outputs/phase-11/evidence/shellcheck.log` | warning 0 件 | `shellcheck scripts/post-release-dashboard/30day-summary.sh scripts/post-release-dashboard/lib/aggregate.sh scripts/post-release-dashboard/__tests__/30day-summary.test.sh` |
| 構文 | `outputs/phase-11/evidence/actionlint.log` | warning 0 件 | `actionlint .github/workflows/post-release-30day-auto-summary.yml` |
| TC | `outputs/phase-11/evidence/test.log` | TC-01〜TC-07 全 PASS | `bash scripts/post-release-dashboard/__tests__/run-all.sh` |

---

## runtime evidence 状態語彙

| 語彙 | 適用条件 |
| --- | --- |
| **PASS** | shellcheck / actionlint / TC-01〜TC-07 / dry-run / redaction / silent skip / duplicate PR skip / workflow_dispatch / Slack test post の 9 evidence が全て揃った状態 |
| **CONTRACT_READY_RUNTIME_PENDING** | 上記 PASS 後、scheduled cron による本番初発火（issue-497 main merge 後 30 日経過時点）が時間依存で pending |
| **CONTRACT_READY_SECRET_PENDING** | workflow / script / dry-run は準備済みだが、Slack channel bootstrap または `SLACK_WEBHOOK_URL` 登録が user approval 待ち |
| **FAIL** | shellcheck / actionlint warning > 0、または dry-run で副作用検出、または Slack POST が HTTP 200 以外 |
| **DEFER** | （本 Phase では使用しない / runtime 30 日 gate は別軸として扱う） |

---

## 実行手順（要約）

```bash
# 0. 前提: pnpm sync:check で worktree が main 同期済みであること
mise exec -- pnpm sync:check

# Step 1: shellcheck
mkdir -p docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence
shellcheck scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh \
  scripts/post-release-dashboard/__tests__/30day-summary.test.sh \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/shellcheck.log 2>&1

# Step 2: actionlint
actionlint .github/workflows/post-release-30day-auto-summary.yml \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/actionlint.log 2>&1

# Step 3: TC-01〜TC-07
bash scripts/post-release-dashboard/__tests__/run-all.sh \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/test.log 2>&1

# Step 4: local --dry-run（fixture: over-30d-with-failures）
POST_RELEASE_FIXTURE_JSON=scripts/post-release-dashboard/__tests__/fixtures/over-30d-with-failures.json \
  bash scripts/post-release-dashboard/30day-summary.sh --dry-run \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/dry-run-stdout.log 2>&1

# Step 5: redaction audit
grep -E 'token|bearer|secret|Authorization' \
  docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/dry-run-stdout.log \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/redaction-grep-audit.log \
  || echo CLEAN \
     >> docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/redaction-grep-audit.log

# Step 6: silent skip（30 日未満 fixture）
POST_RELEASE_FIXTURE_JSON=scripts/post-release-dashboard/__tests__/fixtures/under-30d.json \
  bash scripts/post-release-dashboard/30day-summary.sh --dry-run; echo "exit=$?" \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/silent-skip-exit0.log 2>&1

# Step 7: duplicate PR skip（同月内既存 PR fixture）
POST_RELEASE_FIXTURE_JSON=scripts/post-release-dashboard/__tests__/fixtures/over-30d-with-failures.json \
POST_RELEASE_FIXTURE_PR_LIST=scripts/post-release-dashboard/__tests__/fixtures/existing-pr.json \
  bash scripts/post-release-dashboard/30day-summary.sh --dry-run; echo "exit=$?" \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/duplicate-pr-skip.log 2>&1

# Step 8: workflow_dispatch dry-run
gh workflow run post-release-30day-auto-summary.yml -f dry_run=true \
  > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/workflow-dispatch-dry-run.log 2>&1
sleep 5
gh run list --workflow=post-release-30day-auto-summary.yml --limit=1 \
  >> docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/workflow-dispatch-dry-run.log 2>&1

# Step 9: Slack channel bootstrap + test post（実 SLACK_WEBHOOK_URL 利用）
gh secret list --repo daishiman/UBM-Hyogo \
  | grep '^SLACK_WEBHOOK_URL' \
  >> docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/slack-test-post.log 2>&1

op run --env-file=.env -- bash -c '
  curl -sS -X POST -H "Content-type: application/json" \
    --data "{\"text\":\"[TEST FROM ISSUE-517 PHASE-11] dry-run notification at $(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    "$SLACK_WEBHOOK_URL"
' > docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/slack-test-post.log 2>&1
echo "Slack received at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  >> docs/30-workflows/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/slack-test-post.log
```

> Step 9 は Slack 側で受信時刻メモを取り、test post を **手動削除** する。本番チャンネル `w1618436027-ek2505248` を使うため、文面冒頭に `[TEST FROM ISSUE-517 PHASE-11]` prefix を必須化する。Webhook URL 実値は evidence に残さない。

---

## PASS 判定条件 / FAIL 時のリカバリ

| 条件 | PASS 基準 | FAIL 時のリカバリ |
| --- | --- | --- |
| shellcheck.log | warning 0 件 | 該当 SC コードを修正し再実行 |
| actionlint.log | warning 0 件 | YAML 構文 / `permissions` / `concurrency` を修正し再実行 |
| test.log | TC-01〜TC-07 全 PASS | 失敗 TC ごとに `__tests__/30day-summary.test.sh` の該当 case をデバッグ |
| dry-run-stdout.log | exit 0 + markdown 集計 + 副作用なし | script の `--dry-run` 分岐を再確認 |
| redaction-grep-audit.log | `CLEAN` 出力 / 0 件 hit | redaction フィルタを `lib/aggregate.sh` で強化 |
| silent-skip-exit0.log | exit 0 / stdout が「30 日未満につき skip」 | gate 判定 jq 式を再検証 |
| duplicate-pr-skip.log | exit 0 / stdout が「同月内既存 PR につき skip」 | `gh pr list` 検索条件と month 抽出ロジックを再確認 |
| workflow-dispatch-dry-run.log | run が `completed` / `success` で終了 | actions tab で run log を確認し失敗 step を修正 |
| slack-test-post.log | HTTP 200 + Slack 側受信確認 | Webhook URL 失効時は再生成し GitHub Secrets を更新 |

---

## 完了条件チェックリスト

- [ ] `outputs/phase-11/evidence/shellcheck.log` warning 0 件
- [ ] `outputs/phase-11/evidence/actionlint.log` warning 0 件
- [ ] `outputs/phase-11/evidence/test.log` TC-01〜TC-07 全 PASS
- [ ] `outputs/phase-11/evidence/dry-run-stdout.log` 集計 markdown が出力 / PR 起票・Slack 送信なし
- [ ] `outputs/phase-11/evidence/redaction-grep-audit.log` `CLEAN` 表記
- [ ] `outputs/phase-11/evidence/silent-skip-exit0.log` exit 0 / silent skip 表記
- [ ] `outputs/phase-11/evidence/duplicate-pr-skip.log` exit 0 / duplicate skip 表記
- [ ] `outputs/phase-11/evidence/workflow-dispatch-dry-run.log` run success
- [ ] `outputs/phase-11/evidence/slack-test-post.log` channel bootstrap / Secret 名確認 / HTTP 200 + 受信時刻 / test post 削除確認を記録
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [ ] `pnpm sync:check` で worktree が main 同期済み
- [ ] artifacts.json `phases[10].status = "completed"` + `runtime_state = "CONTRACT_READY_RUNTIME_PENDING"` 併記（Phase 12 で実反映）

---

## 不変条件への影響

| # 1〜7 | 影響 |
| --- | --- |
| #5（D1 直接アクセスは `apps/api` に閉じる） | **影響なし**（本 Phase は GHA + Shell + Slack Webhook のみ / D1 アクセスなし） |
| #1〜#4, #6, #7 | 影響なし |

---

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ:
  - `outputs/phase-11/evidence/` 9 点を Phase 12 `implementation-guide.md` Part 2 の検証セクションに転記
  - `dry-run-stdout.log` の集計フォーマットサンプルを `system-spec-update-summary.md` の deployment-gha.md 追記章で参照
  - `slack-test-post.log` の受信時刻を `documentation-changelog.md` の運用記録欄に記載
  - artifacts.json への `CONTRACT_READY_RUNTIME_PENDING` 併記は **Phase 12 で実施**
- ブロック条件:
  - 9 evidence のいずれかが FAIL
  - `outputs/phase-11/screenshots/` を誤って作成
  - Issue #517 を誤 reopen
  - Slack 本番チャンネルに `[TEST FROM ISSUE-517 PHASE-11]` prefix を欠いた投稿が残存

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| index | `outputs/phase-11/main.md` | NON_VISUAL evidence index（9 点へのナビ） |
| smoke | `outputs/phase-11/manual-smoke-log.md` | 9 step 実行ログの記録先 |
| evidence | `outputs/phase-11/evidence/*.log` | 9 点（前述一覧） |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/index.md` | AC / scope 正本 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-02.md` | workflow YAML / shell script 設計 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | NON_VISUAL evidence 規約 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-guide.md` | Phase 11 実行手順テンプレ |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-11.md` | 親タスク Phase 11（runtime 集計型）対比 |

---

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証を実行する。
- runtime 30 日 gate の本番初発火検証は本 Phase では行わず、Phase 13 post-merge アクションに委譲する。
