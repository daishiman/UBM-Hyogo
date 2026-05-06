# 実装ガイド — Issue #350

## Part 1 — 中学生レベル説明

なぜ必要かというと、ホームページは公開した直後だけ元気に見えても、1週間後や1か月後に少しずつ調子が悪くなることがあるからです。たとえば、学校の花だんも水をあげた翌日は元気でも、次の週に見に行かないとしおれていることがあります。何をするかは、その見に行く日を忘れないためのメモを自動で作ることです。

### 今回作ったもの

ホームページを公開した日から **1週間後** と **1か月後** に、「ちゃんと動いてるかな？」を見るためのチェックリストを **GitHub のロボット** が自動で作ってくれる仕組みを足します。

- ロボット = GitHub Actions（毎日 1 回起動して、今日が「公開から 7 日後」か「30 日後」かをチェック）
- そのどちらかなら、GitHub Issue（メモ帳みたいなもの）を 1 枚自動で作る
- 中身には「アクセス数は何件だった？」「データベースは何回読み書きした？」みたいなチェック項目が並んでいる
- 担当者がそれを埋めて、おかしかったら「巻き戻し（rollback）」の手順書を見る

これだけ。**新しいデータを書き込んだり、料金がかかったりはしない**。ただ「期日を忘れない」ためのアラームを GitHub に置くだけです。

## Part 2 — 技術者レベル説明

### 全体像

```
GitHub Actions (cron daily 09:00 UTC)
      → scripts/observation/create-reminder-issue.sh --resolve-only
         （release_date を gh api releases/latest / dispatch input から取得）
         （today - release_date が 7 か 30 のとき should_remind=true）
      → --create で gh issue create（同タイトル open があれば skip）
```

### 構成要素

- `.github/workflows/post-release-observation-reminder.yml`
  - schedule + workflow_dispatch / `permissions: issues:write` / `concurrency` 指定
- `scripts/observation/create-reminder-issue.sh`
  - POSIX bash / `set -euo pipefail` / 3 サブコマンド `--resolve-only` `--create` `--dry-run`
  - `today_iso()` を `TODAY_OVERRIDE` で hermetic にテスト
- `scripts/observation/reminder-issue-template.md`
  - placeholder: `{{RELEASE_DATE}}` `{{OFFSET}}` `{{TARGET_DATE}}`（`sed` で展開）
- `docs/runbooks/post-release-long-term-observation.md`
  - 観測指標 / 閾値 / 取得手順 / 異常時分岐 / rollback 連携 / postmortem / 履歴
- `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md`
  - SSOT mirror（runbook 正本へリンク）
- aiworkflow `indexes/` 更新（`resource-map.md` / `quick-reference.md` 手編集、`topic-map.md` / `keywords.json` 生成）+ `pnpm indexes:rebuild`

### 型定義（TypeScript 表現）

```ts
type ObservationOffset = 7 | 30;

interface ObservationReminderInputs {
  releaseDate?: `${number}-${number}-${number}`;
  offsetDays?: ObservationOffset;
  todayOverride?: `${number}-${number}-${number}`;
}

interface ObservationReminderResolution {
  shouldRemind: boolean;
  releaseDate?: string;
  offset?: ObservationOffset;
  targetDate?: string;
}
```

実装は bash だが、入出力契約は上記の shape に固定する。`offsetDays` は 7 / 30 以外を `shouldRemind=false` として扱い、GitHub Issue 作成には進めない。

### CLIシグネチャ

```bash
bash scripts/observation/create-reminder-issue.sh --resolve-only
bash scripts/observation/create-reminder-issue.sh --create
RELEASE_DATE=2026-05-01 OFFSET=7 TARGET_DATE=2026-05-08 \
  bash scripts/observation/create-reminder-issue.sh --dry-run
```

`--resolve-only` は `GITHUB_OUTPUT` に `should_remind` / `release_date` / `offset` / `target_date` を出力する。`--create` は同じ title の open Issue があれば skip し、なければ `gh issue create` を実行する。
`workflow_dispatch` で `offset_days` を明示した場合の `target_date` は実行日ではなく `release_date + offset_days` に固定する。これにより、後日手動で D+7 / D+30 reminder を再発火しても観測対象日がずれない。

### 使用例

```bash
TODAY_OVERRIDE=2026-05-08 INPUT_RELEASE_DATE=2026-05-01 \
  bash scripts/observation/create-reminder-issue.sh --resolve-only

RELEASE_DATE=2026-05-01 OFFSET=7 TARGET_DATE=2026-05-08 \
  bash scripts/observation/create-reminder-issue.sh --dry-run
```

### エラーハンドリング

| ケース | 扱い |
| --- | --- |
| `INPUT_RELEASE_DATE` が空 | `gh api repos/$OBSERVATION_REPO/releases/latest` の JSON から `published_at` を取得 |
| GitHub release が未作成 | `should_remind=false` として Issue 作成に進まない |
| 日付形式が不正 | exit 1 |
| `gh issue create` 失敗 | script を fail させ、Actions run を red にする |

### エッジケース

| ケース | 扱い |
| --- | --- |
| `INPUT_OFFSET_DAYS` が 7 / 30 以外 | `should_remind=false` |
| `INPUT_OFFSET_DAYS` が 7 / 30 | `target_date = release_date + offset_days` |
| D+7 / D+30 以外の日 | `should_remind=false` |
| 同名 open Issue が存在 | duplicate を作らず skip |

### 設定項目と定数一覧

| 名前 | 用途 | default |
| --- | --- | --- |
| `OBSERVATION_REPO` | target repository override | `daishiman/UBM-Hyogo` |
| `INPUT_RELEASE_DATE` | workflow_dispatch release date | empty |
| `INPUT_OFFSET_DAYS` | workflow_dispatch offset | empty |
| `TODAY_OVERRIDE` | hermetic local test 用 date | empty |
| `RELEASE_DATE` / `OFFSET` / `TARGET_DATE` | Issue body rendering | required for `--create` / `--dry-run` |

### テスト構成

| layer | command | purpose |
| --- | --- | --- |
| syntax | `bash -n scripts/observation/create-reminder-issue.sh` | shell syntax |
| unit | `bash scripts/observation/test/test-create-reminder-issue.sh` | D+7 / D+30 / invalid offset / dry-run |
| indexes | `pnpm indexes:rebuild` | aiworkflow generated index sync |

### なぜ Cloudflare cron を使わないか

free plan の cron は 3 本上限で既に `03:00 JST schema sync` / `15min Forms sync` / `5min retry tick` で埋まっている（CLAUDE.md 参照）。1 本でも追加すると free plan 超過 → 課金トリガになる。GitHub Actions schedule は無料枠で十分。

### テスト

- YAML parse / Prettier / bash syntax / bash unit test（local）
- `actionlint` / `shellcheck` は local 未導入のため UT-350-FU-01 で CI gate 化
- bash テストランナで 13 assertions → 主要分岐を網羅
- runtime evidence は PR merge 後 user が `gh workflow run` で取得（PENDING_RUNTIME_EVIDENCE）

### 主要 DoD

- workflow YAML が YAML parse / Prettier PASS
- shell が bash syntax / unit test 全通過
- runbook H2 セクション 7 個揃う
- aiworkflow indexes に entry 追加済 / `pnpm indexes:rebuild` 成功
- 09c Phase 12 unassigned 行末尾と source unassigned task に `consumed by issue-350-...` trace 追記済

### スコープ外（明示）

- 実 metric の auto fetch（Cloudflare API token 認証必要 — 別タスク）
- actionlint / shellcheck の CI 統合（governance 別タスクで吸収予定）
- D+7/D+30 を超える長期（D+90 等）— 必要時に同テンプレを再利用
