# Phase 12: ドキュメント更新 / skill 反映 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 12 では `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への Slack secret 名追記、`.claude/skills/aiworkflow-requirements/LOGS.md` への entry 追記、aiworkflow indexes 再生成、09c Phase 11 share-evidence 参照差し替え、Phase 12 strict outputs 7 ファイル生成を扱う。複数正本ファイルへの編集と repo へコミットされる成果物生成を伴うため、CONST_004 により docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 12 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |
| 想定実行者 | Claude Code（編集 owner）+ SubAgent（read-only 監査、任意） |

## 目的

Phase 11 で取得した runtime evidence を、正本仕様 / workflow ledger / 親タスク（09c production deploy execution） / aiworkflow-requirements skill / unassigned-task に漏れなく反映し、`workflow_state` を `spec_created` から `runtime_evidence_completed` へ遷移可能にする。Phase 12 strict 7 ファイルを `outputs/phase-12/` に揃え、phase-12-spec.md / phase-12-pitfalls.md の必須要素を全て満たす。

## Phase 12 outputs/ 必須成果物（7 ファイル）

artifacts.json `phases[12].outputs` で宣言された以下 7 ファイルを `outputs/phase-12/` 配下に**実体配置**する。1 つでも欠落すれば `phase12-task-spec-compliance-check.md` の総合判定は `FAIL`。

| # | ファイル | 由来 Task | 欠落時の扱い |
| - | -------- | --------- | ----------- |
| 1 | `main.md` | Phase 12 本体サマリ | FAIL |
| 2 | `implementation-guide.md` | Task 1（Part 1 中学生レベル + Part 2 技術者レベル） | FAIL |
| 3 | `system-spec-update-summary.md` | Task 2（システム仕様書更新サマリ） | FAIL |
| 4 | `documentation-changelog.md` | Task 3（ドキュメント更新履歴） | FAIL |
| 5 | `unassigned-task-detection.md` | Task 4（0 件でも必須） | FAIL |
| 6 | `skill-feedback-report.md` | Task 5（改善点なしでも必須。3 観点固定: テンプレ改善 / ワークフロー改善 / ドキュメント改善） | FAIL |
| 7 | `phase12-task-spec-compliance-check.md` | Task 6（最終確認 root evidence） | FAIL |

> **命名規則の整合**: 本タスクは `phase-12-spec.md` の strict 7 ファイル名をそのまま採用する。`document-update-history.md` / `skill-feedback.md` の別名は使わず、artifacts.json と実ファイル名を一致させる。

## 必須 6 タスク

### Task 1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

#### Part 1: 中学生レベル（日常の例え話）

以下のドラフトを Part 1 として採用する（phase-12-spec.md「Part 1 ドラフト採用ルール」に従い、AI が技術用語へ書き直すことを禁止）:

```markdown
## なぜ必要なの？

学校で大事なお知らせがあったとき、先生が黒板に書くだけだと、見ていない人に届かない。
だから先生は「みんなのスマホに自動でメッセージを送る仕組み」を用意して、
「いつ、誰に、どんな内容で送ったか」を記録に残しておく。

UBM 兵庫支部会のサイトでも、本番の更新が終わった直後に「もし何か壊れたときに
読むべき手順書（ランブック）」のリンクを、Slack の決まった部屋に自動で投げ込む。
そして「いつ投げたか・どの部屋に投げたか・どのリンクなのか」をファイルに残す。

## 何をするの？

1. 練習部屋（dry-run channel）に先に test 投稿してみる
2. 内容が大丈夫だと人が確認する（approval gate）
3. 本番部屋（production channel）に投稿する
4. 投稿の結果（投稿時刻・部屋名・後から開けるリンク）をファイルに保存する

## なぜ二段階にするの？

本番部屋にいきなり投稿すると、間違えて関係ない内容を流してしまったときに取り返しがつかない。
だから「練習 → 人の OK → 本番」の三段で進める。
これが approval gate（許可ゲート）の考え方。

## なぜ秘密の値（token）をファイルに書いてはいけないの？

Slack に投稿するための「合言葉」が token。
これがファイルに残ると GitHub のリポジトリを見ただけで誰でも投稿できてしまう。
だから token は 1Password という金庫に入れておいて、
動かす瞬間だけ取り出して使う。記録には絶対に残さない。
```

**Part 1 専門用語セルフチェック表**（必須 5 用語以上）:

| 専門用語 | 日常語への言い換え |
| --- | --- |
| Slack bot | 自動でメッセージを書き込んでくれるロボット |
| channel | Slack の中の部屋 |
| approval gate | 「やっていい？」を人が OK する関門 |
| token | Slack に話しかけるための合言葉 |
| dry-run | 本番に投稿する前の練習投稿 |
| permalink | あとから何度でも開ける固定リンク |
| evidence | 「ちゃんと届いた」という証拠ファイル |

#### Part 2: 技術者レベル

| 項目 | 内容 |
| --- | --- |
| 配信方式 | GitHub Actions `workflow_dispatch` + `workflow_run`（trigger from 09c production deploy completion） |
| Slack API | `chat.postMessage`（必要に応じ `chat.getPermalink` を fallback で呼ぶ） |
| 認証 | bot token (`xox[b]-...`)、scope: `chat:write` / `chat:write.public` / `channels:read` |
| message format | Slack Block Kit（header / context / actions / divider） |
| message 必須要素 | release version (semver) / deployed_at (ISO8601) / runbook permalink (commit-pinned blob URL) / oncall handle / 配信モード (dryrun \| production) |
| 二段配信 | dryrun channel → user approval (G-PROD) → production channel |
| evidence schema | `{ ok: boolean, ts: string, channel: string, message: { permalink: string } }` |
| evidence 保存先 | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-{dryrun,production}.json` |
| token 取扱 | 1Password 正本 → GitHub Secrets `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` 派生のみ。ローカルは `op run --env-file=.env` 経由 |
| channel id | GitHub Variables `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` / `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` |
| permalink 安定化 | `git rev-parse HEAD` の commit SHA で blob URL を pin（main moving tip 不採用） |

**TypeScript 契約（Part 2 抜粋）**:

```ts
// scripts/notify/slack-incident-runbook.ts
export interface SlackPostMessageInput {
  mode: 'dryrun' | 'production';
  releaseVersion: string;       // semver
  deployedAt: string;           // ISO8601
  runbookCommitSha: string;     // git rev-parse HEAD
}

export interface SlackEvidence {
  ok: boolean;
  ts: string;
  channel: string;
  message: { permalink: string };
}
```

**エラーハンドリング**:

| 事象 | 挙動 | exit code |
| --- | --- | --- |
| `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` 未設定 | fail-fast、token 値は出力しない | 2 |
| Slack API 4xx/5xx | error code を redacted で stderr に出力、evidence は ok=false で保存しない（部分保存禁止） | 1 |
| Rate limit (429) | 1 分待機 → 最大 3 リトライ → 失敗時 exit 1 | 1 |
| dryrun と production の channel id が同値 | unit test で fail（runtime 到達不能化） | N/A (CI) |

**runtime path × evidence 表**:

| 環境 | path | evidence |
| --- | --- | --- |
| local dev | `bash scripts/notify/slack-incident-runbook.sh` (op run wrap) | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/dryrun-smoke.log` |
| GitHub Actions (dryrun) | `.github/workflows/incident-runbook-slack-delivery.yml` `mode=dryrun` | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json` |
| GitHub Actions (production) | 同上 `mode=production` + environment `production-slack-delivery` | `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json` |
| unit test | `scripts/notify/__tests__/slack-incident-runbook.test.ts` | vitest の coverage report |

### Task 2: システム仕様書更新

#### Step 1-A: タスク完了記録

- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` に以下のフォーマットで 1 行追記（canonical absolute path 表記）:

```
- 2026-05-06 09c-incident-runbook-slack-delivery / wave 9c-fu / serial / Phase 1-13 spec drafted; runtime evidence pending
  spec_path: /docs/30-workflows/09c-incident-runbook-slack-delivery/index.md
  related: Issue #349 (CLOSED, Refs only); 09c production deploy Phase 11 share-evidence replacement scheduled
```

- `.claude/skills/task-specification-creator/LOGS/_legacy.md` にも同等エントリを 1 行追記（spec creation の観点で）。

#### Step 1-B: 実装状況テーブル更新

`workflow_state` を artifacts.json と index.md の双方で同期:

| ledger | 値 |
| --- | --- |
| root `artifacts.json` `metadata.workflow_state` | `spec_created`（dry-run + production runtime evidence 取得後に `runtime_evidence_completed` へ昇格） |
| `index.md` Status 行 | 同上 |

#### Step 1-C: 関連タスクテーブル更新

- 親 (09c production deploy execution) の `task-09c-production-deploy-execution-001.md` または完了済 path の関連タスク表に「Slack delivery runtime evidence: pending until production approval」を追記
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（昇格元）の Canonical Status を `consumed by docs/30-workflows/09c-incident-runbook-slack-delivery/index.md` に更新（legacy stub 化）

#### Step 1-H: skill-feedback routing

`outputs/phase-12/skill-feedback-report.md` の各 item を以下に routing:

| owning skill | 反映先 reference / lesson | promotion target | no-op reason | evidence path |
| --- | --- | --- | --- | --- |
| aiworkflow-requirements | `references/deployment-secrets-management.md` Slack secret セクション | promote | n/a | 本 Phase 12 編集差分 |
| task-specification-creator | n/a | no-op | strict 7 filename drift は本仕様書側を正本名へ寄せて解消したため、skill テンプレ変更は不要 | `phase12-task-spec-compliance-check.md` |

#### Step 2: システム仕様更新（条件付き、本タスクは **発火する**）

**判定: 必要**

理由: 新規 secret 名 (`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` / `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID`) と Slack delivery interface (`chat.postMessage` 経路 / Block Kit template) を追加する。phase-12-spec.md「Step 2 更新が必要な場合」の「新規定数/設定値の追加」「API 仕様の変更」に該当。

**編集対象**: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

**追記内容（テンプレ）**:

```markdown
## Slack incident runbook delivery secrets

| 種別 | 名前 | 設置先 | 1Password 正本 | 派生先 |
| --- | --- | --- | --- | --- |
| bot token | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | GitHub Secrets (repo) | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` | GitHub Actions のみ |
| production channel id | `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | GitHub Variables (repo) | n/a（id は機密ではないが workspace bound） | GitHub Actions のみ |
| dry-run channel id | `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | GitHub Variables (repo) | n/a | 同上 |

### rotation 手順

1. 1Password で新 token を発行し `Slack Bot - Incident Runbook` item の `credential` を更新
2. `gh secret set SLACK_BOT_TOKEN_INCIDENT_RUNBOOK < new_value`（標準入力経由。シェル履歴に値を残さない）
3. Slack admin UI で旧 token を revoke
4. dry-run smoke を再実行し evidence を更新

### 取扱原則

- 値そのものをドキュメント・log・PR description に書かない
- ローカル smoke は `op run --env-file=.env -- bash scripts/notify/slack-incident-runbook.sh ...` を経由
- `wrangler login` 由来の OAuth ローカルトークンは使わない（CLAUDE.md 整合）
```

Step 1-D: 上流 runbook 差分追記タイミング判定 → **same-wave 適用**（本 Phase 12 で deployment-secrets-management.md を編集）

### Task 3: ドキュメント更新履歴（`outputs/phase-12/documentation-changelog.md`）

以下のテンプレで作成:

```markdown
# Document Update History — 09c-incident-runbook-slack-delivery / Phase 12

## Step 1-A: タスク完了記録

| ファイル | 変更種別 | path |
| --- | --- | --- |
| aiworkflow-requirements LOGS | 1 行 append | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` |
| task-specification-creator LOGS | 1 行 append | `.claude/skills/task-specification-creator/LOGS/_legacy.md` |

## Step 1-B: 実装状況テーブル更新

- root `artifacts.json` `metadata.workflow_state`: `spec_created` 据置（runtime 取得後に昇格）
- `index.md` Status: 同上

## Step 1-C: 関連タスクテーブル更新

- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`: Canonical Status を `consumed` に更新

## Step 2: システム仕様更新

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`: Slack secret 3 件 + rotation 手順を追記

## aiworkflow indexes 再生成

- 実行コマンド: `mise exec -- pnpm indexes:rebuild`
- 期待結果: drift 0 / `verify-indexes-up-to-date` CI gate green

## 09c Phase 11 share-evidence 置換

- 編集対象: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`
- 置換内容: share-evidence placeholder → 本タスク evidence への相対参照
- 適用後 grep: `rg -F "NOT_EXECUTED" docs/30-workflows/completed-tasks/09c-...` 0 hit

## drift チェック

- `git diff --stat` で `apps/` / `packages/` への混入なし（spec PR + Step 2 編集のみ。実装コードは別ブランチで PR）
```

### Task 4: 未タスク検出レポート（`outputs/phase-12/unassigned-task-detection.md`、0 件でも必須）

検出元:

| ソース | 検出項目 |
| --- | --- |
| 元タスク仕様書 scope out | PagerDuty 連携 / 別 Slack channel への失敗通知 / runbook 本文の再設計 |
| Phase 10 monitoring | GitHub Actions failure 時の Slack 通知（M1〜M4 で email のみ。Slack 通知化は scope 外）|
| Phase 11 失敗時 | Slack rate limit のリトライ戦略を Cloudflare Workers Cron 経由に切替えるか？（GitHub Actions では retry が荒い） |
| コードコメント | n/a（spec のみのため未存在） |

**起票候補: 0 件**

理由: PagerDuty 連携、runbook 本文再設計、別 Slack channel への失敗通知は本タスクの AC ではなく Scope Out に明示済みである。今回 cycle では Slack delivery、dry-run / production 分離、timestamp evidence、secret 正本同期を同一 wave で閉じる。`new unassigned task` と書いたまま実ファイルを作らない状態は残さない。

### Task 5: スキルフィードバックレポート（`outputs/phase-12/skill-feedback-report.md`、改善点なしでも必須）

3 観点固定で以下を記載:

```markdown
# Skill Feedback Report — 09c-incident-runbook-slack-delivery / Phase 12

## 1. テンプレート改善

- 観察: 初期ドラフトでは strict 7 filenames と artifacts.json 宣言名がずれていた。
- 解決: 本 wave で artifacts.json / phase-12.md / outputs 実体を `phase-12-spec.md` の strict 名へ統一した。
- promotion: no-op（skill 側ではなく本仕様書側の drift）
- routing: task-specification-creator → no-op

## 2. ワークフロー改善

- 観察: NON_VISUAL implementation で screenshot ディレクトリ作成抑止のチェック項目が、
  phase-12-pitfalls.md の Tips セクションに分散している。
- 提案: phase-template-phase11.md に NON_VISUAL チェックリストを 1 ブロック化して
  集約すれば再発防止が容易。
- promotion: no-op
- routing: task-specification-creator → no-op

## 3. ドキュメント改善

- 観察: deployment-secrets-management.md は Cloudflare 系を主軸に書かれており、
  Slack 等の SaaS bot token 追加時のテンプレが薄い。
- 提案: Step 2 で追記する Slack セクションをそのまま「SaaS bot token rotation
  共通テンプレ」として `references/secrets-management/saas-bot-template.md`
  などに昇格させる。
- promotion: 本 Phase 12 の Step 2 で deployment-secrets-management.md に追記済 → promote 半完了
- routing: aiworkflow-requirements → `references/deployment-secrets-management.md`

## promotion gate 判定

| 項目 | 判定 |
| --- | --- |
| 1. テンプレート改善 | No-op（本仕様書を strict 名に修正済） |
| 2. ワークフロー改善 | No-op（現行 Phase 11 境界語彙で充足） |
| 3. ドキュメント改善 | Promote（本 Phase 12 で実施） |
```

### Task 6: タスク仕様書コンプライアンスチェック（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

```markdown
# Phase 12 Compliance Check — 09c-incident-runbook-slack-delivery

## 総合判定

- 仕様書 close-out 時点: `spec_created` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- runtime evidence 完了時点: `runtime_evidence_completed`（Phase 11 で dry-run + production 双方 PASS が前提）

> CONST_002 / `spec_created` 段階では `verified` / `implementation_complete_pending_pr` を主張しない。
> Phase 11 runtime evidence completed wave で初めて昇格判定を行う。

## strict 7 ファイル parity

artifacts.json の `phases[12].outputs` で宣言された 7 ファイルの実体配置を確認:

| # | 宣言 path | 実体 | 結果 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | (Phase 12 実行で生成) | pending |
| 2 | `outputs/phase-12/implementation-guide.md` | 同上 | pending |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 同上 | pending |
| 4 | `outputs/phase-12/documentation-changelog.md` | 同上 | pending |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 同上 | pending |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 同上 | pending |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 同上（本ファイル） | pending |

> 命名差吸収は行わない。phase-12-spec.md の strict 名と artifacts.json 宣言名を一致させる。

## artifacts.json parity

- `outputs/artifacts.json` 不在ケース → root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

## same-wave sync 確認

| 項目 | 状態 |
| --- | --- |
| aiworkflow-requirements LOGS append | completed（`LOGS/_legacy.md`） |
| task-specification-creator LOGS append | completed（`LOGS/_legacy.md`） |
| `references/deployment-secrets-management.md` 編集 | completed |
| aiworkflow indexes 再生成 (`pnpm indexes:rebuild`) | completed |
| 09c Phase 11 share-evidence 置換 | completed |
| `unassigned-task/task-09c-incident-runbook-slack-delivery-001.md` consumed 化 | completed |

## token leak 0-hit 再確認

```bash
rg -n -e 'xox[abp]-[A-Za-z0-9-]{20,}|Bearer [A-Za-z0-9._-]{20,}' docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/  # 期待: 0 hit
```

## 4 conditions PASS 判定の前提

- [ ] 7 outputs 実体配置
- [ ] system spec Step 2 差分が `git diff --stat` で観測可能
- [ ] aiworkflow indexes drift 0
- [ ] token leak 0
- [ ] 09c Phase 11 share-evidence 置換 diff 適用済
- [ ] CLOSED Issue #349 に対し `Refs #349` のみ使用、`Closes #349` を使わない（UBM-029）

> 1 つでも未達なら `PASS_WITH_OPEN_SYNC` または `FAIL` を選び、blocker を列挙。
```

## aiworkflow indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/  # drift があれば commit に含める
```

`verify-indexes-up-to-date` CI gate（`.github/workflows/verify-indexes.yml`）が green であることを Phase 13 の PR 作成前に確認する。

## 09c Phase 11 share-evidence 参照差し替え diff

**編集対象**: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`

**置換テンプレ**（before → after の例。実 path は適用時に確認）:

```diff
-### share-evidence
-
-runbook URL: <NOT_EXECUTED placeholder>
-recipients email: <NOT_EXECUTED placeholder>
-shared at: <NOT_EXECUTED placeholder>
+### share-evidence
+
+09c production deploy 完了後、incident response runbook を Slack bot 経由で配信する。配信 evidence は以下を参照:
+
+- dry-run: `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json`
+- production: `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json`
+
+各 JSON は `ok=true` / `ts` / `channel` / `message.permalink` を含む。配信 workflow:
+`.github/workflows/incident-runbook-slack-delivery.yml`
```

適用後の検証:

```bash
rg -F "NOT_EXECUTED" docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md  # 0 hit 期待
```

## close-out 状態遷移条件

| 起点 | 終点 | 条件 |
| --- | --- | --- |
| `spec_created` | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | Phase 12 strict 7 outputs 配置 + Step 2 編集 + indexes drift 0 |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | `runtime_evidence_completed` | Phase 11 dry-run + production 双方 PASS、09c share-evidence 置換適用、token leak 0 |

本仕様書 close-out 時点では `spec_created` を維持し、`runtime_evidence_completed` への昇格は Phase 11 実行 wave で行う。

## CLOSED Issue #349 の取扱い (UBM-029 遵守)

- Issue #349 は CLOSED のまま
- PR description / Phase 12 / Phase 13 evidence では `Refs #349` のみを使用し `Closes #349` を**書かない**
- `system-spec-update-summary` 相当（Step 2 編集差分）に `Issue: #349 remains CLOSED and is referenced with Refs #349` を明記
- Issue 側へは PR / 仕様書リンクを comment で残す（双方向リンク維持）

## 多角的チェック観点

- 親 (09c) / 後続 (なし) / 正本仕様 (`deployment-secrets-management.md`) / aiworkflow indexes の 4 階層すべてに反映漏れがない
- skill feedback / unassigned-task 起票が「先送り」になっていない（CONST_007）
- secret / PII / token 値を含む文字列を新規ドキュメントに書いていない
- 中学生レベル概念説明 (Slack bot / channel / approval gate / token / dry-run / permalink / evidence の 7 用語) が含まれている
- `outputs/phase-11/screenshots/` を作っていない（NON_VISUAL）
- artifacts.json と phase-12-spec.md の命名差を compliance check で吸収している

## サブタスク管理

- [ ] Task 1: implementation-guide.md（Part 1 + Part 2）作成
- [ ] Task 2: deployment-secrets-management.md 編集 + LOGS x2 append + Step 1-A/B/C 実施
- [ ] Task 3: documentation-changelog.md 作成
- [ ] Task 4: unassigned-task-detection.md 作成（0 件でも記載）+ 候補 1 件以上を実ファイル化
- [ ] Task 5: skill-feedback-report.md 作成（3 観点固定）
- [ ] Task 6: phase12-task-spec-compliance-check.md 作成
- [ ] aiworkflow indexes 再生成 (`pnpm indexes:rebuild`) drift 0
- [ ] 09c Phase 11 share-evidence 置換 diff 適用
- [ ] token leak 0 hit 確認

## 統合テスト連携

- 上流: Phase 11 runtime evidence (dry-run / production)
- 下流: Phase 13 PR 作成

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 上記更新対象正本仕様の diff（`deployment-secrets-management.md` / LOGS x 2 / 09c Phase 11 / unassigned-task stub）

## 完了条件 (DoD)

- [ ] 7 outputs ファイルがすべて実体配置されている
- [ ] Step 2 編集が `git diff --stat` で観測可能
- [ ] aiworkflow indexes drift 0
- [ ] 09c Phase 11 share-evidence の `NOT_EXECUTED` が 0 hit
- [x] real token leak grep 0 hit（テスト用 fake marker は対象外）
- [ ] CLOSED Issue #349 に対し `Refs` のみ使用、`Closes` 不使用
- [ ] 本 Phase で commit / push / PR を実行していない（CONST_002）
- [ ] 中学生レベル概念説明が implementation-guide.md Part 1 に含まれる

## タスク100%実行確認

- [ ] 必須 6 タスクすべて実行済
- [ ] strict 7 ファイル実体配置済
- [ ] CONST_007 違反（先送り）が無い
- [ ] NON_VISUAL のため screenshot を作成していない

## 次 Phase への引き渡し

Phase 13 へ:

- 7 outputs ファイル一覧（PR 含有確認用）
- Step 2 編集差分の path
- aiworkflow indexes 再生成済の commit
- 09c Phase 11 置換 diff 適用済の commit
- CLOSED Issue #349 への `Refs` 限定方針

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/index.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/artifacts.json`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-11.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`（share-evidence 置換対象）
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（昇格元）
- `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「ローカル `.env` の運用ルール」
