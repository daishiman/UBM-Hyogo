# Phase 12: ドキュメント更新（aiworkflow-requirements 反映 / unassigned 検出 / skill feedback）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | implemented-local / runtime-gated |


## 目的

Phase 12 の 6 必須タスク、aiworkflow 正本同期、unassigned 検出、skill feedback を実体化する。


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

- `phase-12.md`
- `outputs/phase-12/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない

## 0. Phase 12 の 6 必須タスク

| Task | 出力 | 仕様書サイクル時点 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル） | 計画のみ。本ファイルにテンプレ章立てを記述 |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md`（Step 1-A/B/C） | 計画のみ。aiworkflow diff plan を記述 |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | 反映行最小セットを下記に列挙 |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力必須） | 1 件あり。CONST_007 例外条件で先送り承認可 |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力必須） | 3 観点で記述 |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | チェック結果テンプレを記述 |

## 1. Task 12-1: implementation-guide.md（中学生レベル + 技術者レベル）

### 1.1 Part 1（中学生レベル）

> このタスクで何ができるようになるか
>
> リリースした後、Cloudflare のサーバーがどれくらい動いたか、エラーが何件出たか、データベースが何回読まれたかを、毎日朝 9 時（日本時間）に GitHub のサーバーが自動で集めて、表にして保存してくれるようになる。前は、人がダッシュボードを開いて手で書き写していた。これからは GitHub Actions の画面に行けば、その日の数字が表になっていて、しきい値を超えていないか色つきの判定（PASS / WARN / FAIL）でわかる。
>
> どうやって作るか
>
> 1. Cloudflare に「読むだけ」のパスワード（API トークン）を新しく作る
> 2. そのパスワードを GitHub の鍵置き場（Secrets）に置く
> 3. 「毎日 1 回動く小さなロボット」を `.github/workflows/post-release-dashboard.yml` として書く
> 4. ロボットが Cloudflare に質問して数字を集めるスクリプトを `scripts/post-release-dashboard/` に置く
> 5. 集めた数字を表にして GitHub に保存する
> 6. 「パスワードや秘密の文字が混ざっていないか」の検査もする

### 1.2 Part 2（技術者レベル）

> 概要
>
> Issue #351 に対し、09c post-release verification の 24h metrics を GitHub Actions で自動収集する仕組みを実装する。read-only Cloudflare API token を新規 secret として分離し、`schedule: '0 0 * * *'` UTC + `workflow_dispatch` で起動する `.github/workflows/post-release-dashboard.yml` と、`scripts/post-release-dashboard/` 配下の bash collector を新設する。artifact path は `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` に固定し、metrics 名は 09c `post-release-summary.md` と一致させる。
>
> 変更ファイル
>
> - `.github/workflows/post-release-dashboard.yml` (new)
> - `scripts/post-release-dashboard/{collect.sh,lib/cf-graphql.sh,lib/d1-metrics.sh,lib/cron-status.sh,lib/format-dashboard.sh,lib/redaction-check.sh}` (new)
> - `scripts/post-release-dashboard/__tests__/{run-all.sh,format-dashboard.test.sh,judgment.test.sh,redaction-check.test.sh,fixtures/*.json}` (new)
> - `package.json` (`scripts.post-release-dashboard:test` 追加)
> - `.gitignore`（`outputs/post-release-dashboard/**` を追加）
> - `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（章追記）
> - `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`（章追記）
> - `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md`（反映行追記。現構造では root `LOGS.md` は存在しない）
>
> 検証コマンド
>
> phase-09 §1 を参照。
>
> DoD
>
> phase-05 §7 + phase-13 §3 を参照。

## 2. Task 12-2: system-spec-update-summary.md（aiworkflow diff plan）

### 2.1 Step 1-A: `deployment-gha.md` への追記章

```diff
+ ## Post-release dashboard automation (Issue #351)
+
+ - workflow file: `.github/workflows/post-release-dashboard.yml`
+ - 起動: `schedule: '0 0 * * *'` (UTC) + `workflow_dispatch`
+ - secret: `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`（read-only。`CLOUDFLARE_API_TOKEN` とは別 token）
+ - account variable: `vars.CLOUDFLARE_ACCOUNT_ID`（既存再利用）
+ - artifact path: `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}`
+ - retention: 90 days
+ - metrics: workers_requests / workers_errors / d1_reads / d1_writes / cron_status
+ - threshold: 09c post-release-summary.md と一致（< 5000 req/24h, <= 50000 reads/24h, <= 10000 writes/24h）
+ - redaction grep gate: `scripts/post-release-dashboard/lib/redaction-check.sh`
```

### 2.2 Step 1-B: `deployment-cloudflare-opennext-workers.md` への追記段落

```diff
+ ### Analytics token 分離
+
+ production deploy 用の `CLOUDFLARE_API_TOKEN`（Workers Scripts:Edit / D1:Edit を含む）と、
+ post-release dashboard 等の analytics 取得用 read-only token は GitHub secrets レベルで完全に分離する。
+ analytics 用は接尾辞 `_READONLY` を必ず付け（例: `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`）、
+ scope は `Account.Account Analytics:Read` + `Workers Scripts:Read` + `D1:Read` のみとする。
+ 1Password Item には `scope` field を必須化する。
```

### 2.3 Step 1-C: 既存記述の更新

なし（新規追加のみ）。

### 2.4 Step 2（条件付き）: domain sync

09c post-release-verification の `post-release-summary.md` に「24h metrics は本仕様書 (`issue-351`) で自動取得される」旨を追記する。仕様書サイクル時点では既存ファイルの編集を行わず、phase-12 計画として記載する。

## 3. Task 12-3: documentation-changelog.md（反映行最小セット）

実装サイクルで以下のエントリを `outputs/phase-12/documentation-changelog.md` に書き起こす:

| 種別 | 絶対 path | 反映内容 |
| --- | --- | --- |
| skill 正本 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/aiworkflow-requirements/SKILL.md` | （top-level 追記が無ければ touch のみ。要否は実装時に判定） |
| skill 履歴 | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | issue-351 反映行を追記 |
| reference | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 「Post-release dashboard automation」章追加 |
| reference | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | 「Analytics token 分離」段落追加 |
| workflow artifacts | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.github/workflows/post-release-dashboard.yml` | 新規 |
| workflow artifacts | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/scripts/post-release-dashboard/` 配下 | 新規 |
| outputs | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/*.md` | dry-run evidence |
| outputs | 同上 `outputs/phase-12/*.md` | Phase 12 6 ファイル |
| Phase 9 static evidence | phase-09 §1 で定義した grep / lint 結果 | 実行ログを `outputs/phase-09/qa-checklist.md` に保存 |
| Phase 11 blocker | schedule 実 run conclusion 取得は first scheduled trigger 以降に取得 | unassigned-task-detection.md の 1 件として記録 |

> Phase 12 必須エントリ最小セット（skill 正本 / skill 履歴 / reference / workflow artifacts / outputs / Phase 9 static evidence / Phase 11 blocker）をすべて canonical absolute path で列挙する（task-specification-creator skill の要求事項）。

## 4. Task 12-4: unassigned-task-detection.md

### 4.1 検出された未タスク

| # | 内容 | スコア | 起票要否 |
| --- | --- | --- | --- |
| U-1 | post-release-dashboard schedule の **30 日連続実行 conclusion 集計** と review skill feedback 化 | priority:low / scale:small | unassigned 候補（先送り承認）|

#### U-1 詳細

- **why**: schedule 安定性 / 実 metric 取得成功率は、本仕様書サイクルでは取得不可能（artifact が 30 日蓄積されてから初めて評価可能）。CONST_007 例外条件 1 に該当（artifact 蓄積待ち）。
- **what**: 30 日経過後、`gh run list --workflow=post-release-dashboard.yml --limit=40 --json conclusion` を集計し、success 率と中央値処理時間を skill feedback に反映する。
- **how**: 1 件の小タスクとして分離。Issue 起票は本仕様書承認後にユーザー判断。
- **実施場所**: 単独 issue として起票推奨（Issue #351 とは別）。
- **実施時期**: 本実装が main にマージされて以降 30 日後。

### 4.2 0 件ではない理由

`implemented-local` 状態だが、30 日連続 schedule conclusion は artifact 蓄積依存のため runtime gate として残る。これは外部時間依存であり、実測値を捏造しないため Phase 11 の gated evidence として扱う。

## 5. Task 12-5: skill-feedback-report.md（3 観点固定）

### 5.1 テンプレ改善

- 観点: NON_VISUAL implementation / 新規 GitHub Actions workflow を伴う仕様書では、phase-02 §2 のような **`yaml` skeleton 完全形** を仕様書本文に直書きする方針を skill `phase-template-phase11.md` の例として追加すると、実装サイクルで誤訳が起きにくい。
- 提案: `references/phase-template-phase11.md` に「workflow yaml skeleton を仕様書 body に inline する」サブセクションを 1 つ追加（実装サイクルでテストして OK だったら反映）。

### 5.2 ワークフロー改善

- 観点: read-only token を別 secret に切り出す運用は他タスクでも横展開可能。`patterns-troubleshooting-worktree-cloudflare.md` に「analytics 用 token を `_READONLY` 接尾辞で分離する規約」を追加。
- 提案: `references/patterns-troubleshooting-worktree-cloudflare.md` に「analytics token 分離規約」を 1 段落追加。

### 5.3 ドキュメント改善

- 観点: dataset discover step を仕様書に組み込むと、Cloudflare GraphQL API のスキーマドリフトに対応しやすい。`unassigned-task-required-sections.md` の例として「外部 API スキーマ discover を Phase 11 必須要素にする」一行を追加。
- 提案: 上記 1 行追加。

## 6. Task 12-6: phase12-task-spec-compliance-check.md

| check | 期待 | 仕様書サイクル状態 |
| --- | --- | --- |
| Part 1 中学生レベル / Part 2 技術者レベルの 2 段構成 | 必須 | OK（§1） |
| Step 1-A / 1-B / 1-C / Step 2 | 該当 step あり | OK（§2） |
| documentation-changelog.md に absolute path 列挙 | 必須 | OK（§3） |
| unassigned-task-detection.md（0 件でも出力） | 必須 | OK（§4） |
| skill-feedback-report.md（改善点なしでも出力） | 必須 | OK（§5） |
| Phase 12 6 必須タスクすべて出力 | 必須 | OK（本ファイル + outputs/phase-12/ への計画記述） |
| implemented-local close-out（runtime schedule gate を completed と混同しない） | 必須 | OK（artifacts.json で `workflow_state: implemented-local`、real schedule は gated） |

## 7. close-out 判定（implemented-local）

仕様書サイクル時点では:
- `metadata.workflow_state = implemented-local` に更新し、real workflow_dispatch / schedule evidence は runtime gate として分離
- 各 phase の `phases[].status` は local 実装完了と runtime gate を分離して使い分け

実装サイクル完了後（artifact 蓄積待ち U-1 を除く）に `workflow_state = completed` への昇格を判定する。

## 8. 完了条件

- [x] Task 12-1 〜 12-6 の章立てが本ファイルに揃う
- [x] aiworkflow diff plan が Step 1-A / 1-B 単位で記述
- [x] documentation-changelog の最小セットが canonical absolute path で列挙
- [x] unassigned-task が 1 件記録（CONST_007 例外承認待ち）
- [x] skill-feedback の 3 観点が記述
- [x] compliance check が pass

## outputs（仕様書サイクルは計画のみ。実装サイクルで body を書く）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
