# Phase 12: ドキュメント更新（implementation-guide / deployment-gha.md / changelog / 6 必須成果物）

> **本仕様書は implementation タスクであるが、Phase 12 の 6 必須タスク + skill 同期 + LOGS / README / artifacts.json 更新の構成が意味的に分割不可能なため、行数 250〜350 行を許容する**
> （`.claude/skills/task-specification-creator/references/phase-12-spec.md` / `phase-12-documentation-guide.md` / `phase-template-phase12.md` の例外条項に準拠）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新（implementation-guide / system-spec / changelog） |
| 作成日 | 2026-05-07 |
| 前 Phase | 11（手動検証 / NON_VISUAL） |
| 次 Phase | 13（PR 作成 / **user_approval_required = true**） |
| 状態 | spec_created → completed_pending_pr |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| docsOnly | false |
| user_approval_required | true |
| GitHub Issue | #517（CLOSED 維持 / reopen 禁止） |
| 変更対象ファイル | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` / `.claude/skills/aiworkflow-requirements/SKILL.md` / `scripts/post-release-dashboard/README.md` / 本仕様書 outputs / `artifacts.json`（root） / `LOGS/_legacy.md`（2 skill） |

---

## 目的

Phase 11 で取得した 9 evidence と Phase 1〜10 で確定した workflow / script 仕様を、(1) 中学生レベル + 技術者レベル 2 部構成の implementation-guide、(2) `aiworkflow-requirements` skill の `deployment-gha.md` への新章追加、(3) skill changelog 新規ファイル + SKILL.md changelog 表更新、(4) skill indexes 再生成、(5) 6 必須成果物、(6) 2 skill の LOGS 更新、(7) `scripts/post-release-dashboard/README.md` 更新、(8) `artifacts.json` の status / runtime_state 更新、として正本化する。

GitHub Issue #517 は **CLOSED のまま据え置き**。`gh issue reopen` 実行禁止。PR merge 後に `gh issue comment 517` で PR / 仕様書リンクを残す。

---

## Phase 12 必須 6 タスク（task-specification-creator skill phase-12-spec.md 準拠）

| # | Task ID | 成果物 | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | Task 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | FAIL |
| 2 | Task 12-2 | システム仕様書更新（aiworkflow-requirements skill 同期 / Step 1-A〜1-D） | FAIL |
| 3 | Task 12-3 | `outputs/phase-12/documentation-changelog.md` | FAIL |
| 4 | Task 12-4 | `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**） | FAIL |
| 5 | Task 12-5 | `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須 / 3 観点固定**） | FAIL |
| 6 | Task 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | FAIL |

加えて集約用 `outputs/phase-12/main.md` を含め `outputs/phase-12/` 配下に **最低 7 ファイル** を実体配置する。

---

## Task 12-1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

### Part 1（中学生レベル / 例え話 + 専門用語回避）必須要件

- **タイトル例**: 「N 日経過後にやることを GitHub Actions が代わりに思い出してくれる仕組み」
- 例え話固定パターン:
  - 「GitHub Actions」=「決まった時間に自動で動いてくれる学校の用務員さん」
  - 「cron」=「毎日朝 10 時（UTC 01:00 / 日本時間 10:00）にチャイムが鳴って用務員さんが動く」
  - 「30 日 gate」=「『30 日経ってないなら今日は何もしないでね』のルール」
  - 「draft PR」=「先生に提出する前の下書きノート」
  - 「Slack 通知」=「『下書きノート作ったよ』とクラス LINE に投稿する」
  - 「dry-run」=「本番じゃなくて頭の中でリハーサルだけする」
  - 「冪等（idempotent）」=「同じ日に何回叩いても、ノートは 1 冊しか作らない」
- 専門用語セルフチェック: 「workflow」「PR」「Webhook」「Secrets」「redaction」を使う場合は括弧書きで日常語を補う。

### Part 2（技術者レベル）必須要件

- **タイトル例**: 「workflow + shell script + Slack Webhook + 冪等 PR の構成」
- 必須セクション:
  - 構成図（mermaid or ascii）: `schedule (cron 0 1 * * *)` → `gh run list --limit=80` → `30day gate` → `silent skip` or `aggregate.sh` → `redaction` → `duplicate PR check` → `branch push` + `gh pr create --draft` → `Slack POST`
  - 主要ファイルと責務の対応表（workflow YAML / 30day-summary.sh / lib/aggregate.sh / __tests__/30day-summary.test.sh / README.md）
  - 入出力契約（`gh run list` JSON → 集計 JSON → markdown）
  - failure 比率分岐（`< 10%`: PR body のみ / `>= 10%`: retry/alert 検討節を自動追記）
  - dry-run の副作用 skip 規約（`gh pr create` skip / `git push` skip / Slack POST skip / stdout 出力のみ）
  - 冪等規約（同月内 `[auto-summary] post-release-dashboard 30d` prefix の draft PR 検出時 silent skip）
  - redaction patterns（`token` / `bearer` / `secret` / `Authorization`）
  - Slack channel bootstrap（channel 作成 / Incoming Webhook bind / 1Password 正本 / GitHub Secret 登録 / test post 削除）
  - Phase 11 evidence 9 点の path 一覧（再現方法 + PASS 基準）
  - runtime 状態語彙: `CONTRACT_READY_RUNTIME_PENDING` の意味と Phase 13 post-merge での `PASS` 昇格条件
- Phase 11 数値の転記: `dry-run-stdout.log` の出力サンプル（fixture 由来）と `slack-test-post.log` の受信時刻

---

## Task 12-2: システム仕様書更新（`aiworkflow-requirements` skill 同期 / 4 Step）

### Step 1-A: `references/deployment-gha.md` への章追加

**追加対象ファイル**: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`

**追加章構造**（既存 post-release-dashboard 章の直後に配置）:

```markdown
## post-release-30day-auto-summary

### trigger
- schedule: `cron: '0 1 * * *'` (UTC 01:00)
- workflow_dispatch（input: `dry_run` boolean / default false）

### steps
1. `gh run list --workflow=post-release-dashboard.yml --limit=80 --json ...` で raw JSON 取得
2. 30 日 gate 判定（最古 schedule run.createdAt <= today - 30d）/ 不成立時 silent skip（exit 0）
3. `lib/aggregate.sh` で conclusion 分布 / 連続 failure / 原因分類 / failure 比率を集計
4. redaction フィルタ適用（`token` / `bearer` / `secret` / `Authorization` 行除去）
5. 同月内 `[auto-summary] post-release-dashboard 30d` prefix の draft PR 存在確認 / 存在時 silent skip
6. `auto/post-release-30day-summary-YYYYMM` ブランチ push
7. `gh pr create --draft` で draft PR 起票
8. Slack Webhook（`SLACK_WEBHOOK_URL`）に 5 行以内サマリ + PR URL を POST

### Secrets / permissions
- Slack channel bootstrap: `w1618436027-ek2505248` を作成 / 確認し、Incoming Webhook を当該 channel に bind。Webhook URL は 1Password 正本から GitHub Secret `SLACK_WEBHOOK_URL` へ派生登録する
- GitHub Secrets: `SLACK_WEBHOOK_URL`（必須 / 実値は docs, logs, PR body に残さない）
- workflow permissions: `contents: write` / `pull-requests: write` / `actions: read`

### failure handling
- `gh run list` 失敗時: workflow ステップ FAIL（再試行は次回 cron）
- Slack POST 失敗時: PR は起票済 / Slack のみ retry なし（運用時は手動再投稿）
- failure 比率 `>= 10%` 検出時: PR body に「retry/alert 追加検討」セクションを自動追記

### 冪等規約
- 同月（YYYYMM）粒度で重複 PR を検出し silent skip
- branch 命名 `auto/post-release-30day-summary-YYYYMM` で force-push 不可

### dry-run
- `--dry-run`（local script）/ `dry_run: true`（workflow_dispatch input）で PR 起票・Slack POST を skip
- stdout に集計 markdown のみ出力
```

### Step 1-B: 新規 changelog fragment

**新規ファイル**: `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md`

```markdown
# v2026.05.07-issue517-followup-auto-summary

- `references/deployment-gha.md` に `post-release-30day-auto-summary` 章を追加（trigger / steps / Secrets / failure handling / 冪等規約 / dry-run）。
- 新規 GHA workflow `.github/workflows/post-release-30day-auto-summary.yml` と shell script 群（`scripts/post-release-dashboard/30day-summary.sh` / `lib/aggregate.sh` / `__tests__/30day-summary.test.sh`）を導入。
- GitHub Secrets `SLACK_WEBHOOK_URL` 登録を必須化。Slack channel: `w1618436027-ek2505248`。
- 親タスク issue-497 の 30 日 conclusion 集計を自動化。Refs #517, #497, #351。
- runtime 状態語彙 `CONTRACT_READY_RUNTIME_PENDING` を追加（spec / 実装 PASS かつ scheduled runtime PASS が時間依存で pending）。
```

### Step 1-C: `SKILL.md` changelog 表に最新行追加

**対象ファイル**: `.claude/skills/aiworkflow-requirements/SKILL.md`

`changelog` 表の最上段に以下行を追加:

```markdown
| v2026.05.07-issue517-followup-auto-summary | 2026-05-07 | post-release-30day-auto-summary 章追加 / Slack Webhook 連携 / 冪等 draft PR 起票 |
```

### Step 1-D: aiworkflow-requirements indexes 再生成

content / keywords が増えた（`post-release-30day-auto-summary` / `slack-webhook` / `idempotent-pr` / `30day-gate`）ため **必須実行**:

```bash
mise exec -- pnpm indexes:rebuild
```

実行結果を `outputs/phase-12/documentation-changelog.md` の「indexes 再生成」欄に記録（出力ファイル一覧 + ID）。CI の `verify-indexes-up-to-date` gate が drift しないことを確認する。

### Step 1-E: workflow path existence gate 再確認

```bash
test -f .github/workflows/post-release-30day-auto-summary.yml || echo "MISSING"
test -f scripts/post-release-dashboard/30day-summary.sh || echo "MISSING"
test -f scripts/post-release-dashboard/lib/aggregate.sh || echo "MISSING"
test -f scripts/post-release-dashboard/__tests__/30day-summary.test.sh || echo "MISSING"
```

3 ファイルすべて存在することを `outputs/phase-12/documentation-changelog.md` に記録。

---

## Task 12-3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

記録項目:

- 追加ファイル一覧（新規 4 ファイル: workflow YAML / 30day-summary.sh / aggregate.sh / 30day-summary.test.sh）
- 編集ファイル一覧（5 ファイル: deployment-gha.md / SKILL.md / README.md / artifacts.json / LOGS/_legacy.md × 2 skill）
- aiworkflow-requirements indexes 再生成結果（出力ファイル + ID 一覧）
- Phase 11 evidence 9 点の取得時刻 / Slack 受信時刻
- workflow path existence gate 結果

`scripts/post-release-dashboard/README.md` 編集確認（追記項目）:

- `30day-summary.sh --dry-run` 実行手順
- GitHub Secrets `SLACK_WEBHOOK_URL` 登録手順（実値はリポジトリにコミットしない / op 参照のみ）
- Slack channel `w1618436027-ek2505248` bootstrap 手順（channel 作成 / Incoming Webhook bind / 1Password 正本 / GitHub Secret 登録 / test post 削除）
- 失敗時のリカバリ（webhook 失効時の secret 再登録 / dry-run での切り分け）

---

## Task 12-4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`）

**0 件でも出力必須**。本タスクで明示的にスコープ外とする項目を未タスク化基準と共に記録:

| 候補 | スコープ外理由 | 未タスク化基準 |
| --- | --- | --- |
| failure 比率 `>= 10%` 検出時の retry / alert 自動再投入 | 本タスクは「検討節を PR body に追記」までを責務とし、retry / alert の実装は別 issue | 本 workflow の本番初発火後、3 連続で `>= 10%` を観測した時点で別 issue 起票 |
| 汎用化（他 workflow 集計への適用） | issue-497 専用先行（CONST_007 単一責務） | 60 日 / 90 日 follow-up 必要時に別 issue で議論 |
| Slack App 化（Bot OAuth + interactive） | Webhook で MVP 完結 / OAuth は要件外 | UBM-Hyogo Slack で interactive 操作要件が顕在化した時点で別 issue 起票 |

加えて 4 パターン照合表（型定義→実装 / 契約→テスト / UI→component / 仕様間差異→設計決定）を 0 件でも明記し、本タスクが implementation だが「上記 3 候補以外に新規未タスクなし」である根拠を残す。

---

## Task 12-5: スキルフィードバック（`outputs/phase-12/skill-feedback-report.md` / 3 観点固定）

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善（task-specification-creator） | NON_VISUAL implementation で **dry-run + Slack test post + workflow_dispatch dry-run** の 3 軸を持つケースの evidence 一覧雛形が `phase-11-non-visual-alternative-evidence.md` に未収録 | 本タスクの 9 evidence をテンプレ化し参照に追加 |
| ワークフロー改善 | runtime 30 日 gate 型タスクで `CONTRACT_READY_RUNTIME_PENDING` 状態語彙の使い分け基準が phase-12-spec.md に未明記 | 「scheduled runtime PASS が時間依存で pending」のケースを spec に明記 |
| ドキュメント改善（aiworkflow-requirements） | `deployment-gha.md` で post-release-dashboard 系 workflow が 2 本以上に増え、Slack channel bootstrap の置き場所が曖昧になりやすい | post-release-* prefix の章を共通プレフィックスでまとめ、Incoming Webhook は manual preflight として記録する構造を提案 |

> 改善点なしの観点があれば「観察事項のみ / なし」を 3 観点で必ず明記する。

---

## Task 12-6: コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

Phase 1-13 各仕様書が CONST_005 / CONST_007 を満たすかの自己監査表:

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている（main + Task 12-1〜12-6） | `outputs/phase-12/` 配下に実体配置 | PASS |
| implementation-guide が Part 1 / Part 2 構成 | Part 1 中学生 + Part 2 技術者 / 専門用語セルフチェック | PASS |
| `deployment-gha.md` 追記章 | trigger / steps / Secrets / failure handling / 冪等規約 / dry-run の 6 セクション | PASS |
| changelog fragment | `20260507-issue517-followup-auto-summary.md` 新規作成 | PASS |
| SKILL.md changelog 表更新 | 最新行 1 行追加 | PASS |
| indexes 再生成 | `mise exec -- pnpm indexes:rebuild` 実行 / 出力 ID 記録 | PASS |
| workflow path existence | 4 ファイル全実在 | PASS |
| README 更新 | dry-run 手順 / Secrets 登録 / Slack channel 記載 | PASS |
| LOGS 更新（2 skill） | `.claude/skills/*/LOGS/_legacy.md`（現行実体）に task-specification-creator + aiworkflow-requirements の履歴を追記 | PASS |
| artifacts.json status | `phases[10].status = "completed"` + `runtime_state = "CONTRACT_READY_RUNTIME_PENDING"` 併記 | PASS |
| CONST_005 必須項目所在 | Phase 1-13 各仕様書で所在表が整合 | PASS |
| CONST_007 単一責務 | retry/alert / 汎用化 / Slack App 化が明示的にスコープ外 | PASS |
| Phase 13 連動 | PR title `feat(workflows): add post-release 30-day auto-summary foundation (Refs #517, #497, #351)` | PASS |
| Issue #517 reopen 禁止 | `gh issue reopen 517` 不実行 / `Closes #517` 未使用 | PASS |
| 不変条件 #1〜#7 | 影響なし | PASS |

---

## Task 12-7: LOGS/_legacy.md 更新（2 skill）

### `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

末尾追記行例:

```markdown
| 2026-05-07 | issue-517-followup-auto-summary-foundation | references/deployment-gha.md に post-release-30day-auto-summary 章追加 / changelog fragment 新規 / indexes rebuild 実施 |
```

### `.claude/skills/task-specification-creator/LOGS/_legacy.md`

末尾追記行例:

```markdown
| 2026-05-07 | issue-517-followup-auto-summary-foundation | NON_VISUAL implementation + runtime 30 日 gate 型の Phase 11/12/13 仕様書テンプレを実証。CONTRACT_READY_RUNTIME_PENDING を採用 |
```

絶対パスは canonical 表記:

- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-120314-wt-3/.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260507-120314-wt-3/.claude/skills/task-specification-creator/LOGS/_legacy.md`

---

## artifacts.json 更新手順（Phase 12 で実行）

```bash
# Phase 11 / 12 完了後に実行
# 注: 本仕様書（Phase 12）では artifacts.json を編集しない。Phase 12 実装フェーズで以下を実施する。
```

更新内容:

- `workflow_state`: `spec_created` → `completed_pending_pr`
- `phases[3].status` 〜 `phases[11].status`: `pending` → `completed`
- `phases[10].runtime_state`: `"CONTRACT_READY_RUNTIME_PENDING"` を新規付与
- `phases[11].status`: `pending` → `completed`
- `metadata.docsOnly`: `false` 維持
- `metadata.github_issue_state`: `"CLOSED"` 維持
- `metadata.indexes_rebuild_required`: `true`（実行済 evidence へのリンク付き）

---

## aiworkflow-requirements skill 同期チェックリスト

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| references 章追加 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | YES |
| changelog 新規 | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` | YES |
| SKILL.md changelog 表 | `.claude/skills/aiworkflow-requirements/SKILL.md` | YES |
| indexes 再生成 | `.claude/skills/aiworkflow-requirements/indexes/` | YES（新キー追加のため） |
| LOGS（aiworkflow） | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | YES |
| LOGS（task-spec-creator） | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | YES |
| README | `scripts/post-release-dashboard/README.md` | YES |

---

## GitHub Issue #517 への comment（reopen 禁止）

```bash
# Phase 13 PR merge 後に実行（Phase 12 では実行しない）
gh issue comment 517 --body "PR <PR URL> でマージ済み。仕様書: docs/30-workflows/issue-517-followup-auto-summary-foundation/"
```

- Issue #517 は **CLOSED 据え置き**。`gh issue reopen 517` 不実行 / `gh issue close 517`（再 close）も不実行。

---

## 完了条件チェックリスト

- [ ] 必須 7 ファイル（main + Task 12-1〜12-6）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1（中学生）+ Part 2（技術者）構成 / 専門用語セルフチェック済
- [ ] `deployment-gha.md` に `post-release-30day-auto-summary` 章を追加（6 セクション）
- [ ] `changelog/20260507-issue517-followup-auto-summary.md` 新規作成
- [ ] `SKILL.md` changelog 表に最新行 1 行追加
- [ ] `mise exec -- pnpm indexes:rebuild` 実行 / 出力 ID 記録
- [ ] `scripts/post-release-dashboard/README.md` 更新（dry-run / Secrets / Slack channel）
- [ ] LOGS/_legacy.md 2 skill 末尾追記済（canonical absolute path）
- [ ] artifacts.json `workflow_state = completed_pending_pr` / `phases[10].runtime_state = "CONTRACT_READY_RUNTIME_PENDING"` 併記
- [ ] workflow path existence gate 4 ファイル全 PASS
- [ ] Issue #517 を reopen していない
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS
- [ ] 不変条件 #1〜#7 影響なし（D1 アクセスなし）

---

## 不変条件への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| 1〜7 | 全項目 | **影響なし**（GHA + Shell + Slack Webhook のみ / D1 アクセスなし / Form schema 非対象） |

---

## 成果物（必須 7 ファイル + skill 同期）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 集約 | `outputs/phase-12/main.md` | Phase 12 index / 7 成果物ナビ |
| ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生）+ Part 2（技術者） |
| 履歴 | `outputs/phase-12/documentation-changelog.md` | 追加・編集ファイル一覧 + indexes ID + Slack 受信時刻 |
| 検出 | `outputs/phase-12/unassigned-task-detection.md` | 0 件出力 + 3 スコープ外候補の trace |
| FB | `outputs/phase-12/skill-feedback-report.md` | 3 観点固定 |
| 検証 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 全項目 PASS 期待 |
| skill 同期 | `.claude/skills/aiworkflow-requirements/{references/deployment-gha.md, changelog/20260507-issue517-followup-auto-summary.md, SKILL.md, indexes/, LOGS/_legacy.md}` | aiworkflow skill 同期 |
| LOGS | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | task-spec-creator skill ログ |
| README | `scripts/post-release-dashboard/README.md` | dry-run + Secrets + Slack channel 追記 |
| メタ | `artifacts.json`（root） | `completed_pending_pr` + `CONTRACT_READY_RUNTIME_PENDING` |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 親 issue-497 の手動運用が自動化され、30 日後 follow-up の起動可能性が正本化される |
| 実現性 | PASS | references 追記 + changelog + indexes rebuild + 6 必須成果物で完結 |
| 整合性 | PASS | AC-9（Phase 12 必須成果物）/ AC-10（4 条件評価）と直接対応 |
| 運用性 | PASS | LOGS / README / artifacts.json の 3 軸で運用責任境界を明示 / Issue #517 reopen 禁止維持 |

---

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required = true**）
- 引き継ぎ:
  - documentation-changelog の変更ファイル一覧 → PR description 草案
  - phase12-compliance-check 全 PASS → Phase 13 承認ゲート前提条件
  - Slack 受信時刻メモ → PR body の検証エビデンス link
  - `CONTRACT_READY_RUNTIME_PENDING` → Phase 13 post-merge アクション項に転記
- ブロック条件:
  - 必須 7 ファイル欠落 / aiworkflow skill 同期未完了 / indexes rebuild drift / Issue #517 reopen / `Closes #517` 採用

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 構造定義（6 必須タスク） |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | 実装ガイド執筆要領 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先（Step 1-A 同期先） |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | changelog 表更新先 |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-12.md` | 親タスク Phase 12 対比 |

## 実行タスク

- 本 Phase の本文に定義済みの 6 必須タスク + skill 同期 + LOGS / README / artifacts.json 更新を実行する。
- runtime 30 日 gate の本番初発火検証は Phase 13 post-merge アクションに委譲する。
