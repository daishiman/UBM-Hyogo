# Phase 5: 仕様 runbook 作成（実行可能 step sequence / gh / jq / rg / skill references 追記）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 (issue-497) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成 |
| 作成日 | 2026-05-06 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | docs-only（runbook 中核） |
| taskType | docs-only（CONST_004 例外） |
| visualEvidence | NON_VISUAL |
| 実装区分 | ドキュメントのみ |

## 目的

本 Phase は issue-497 の **runbook 中核** として、後続実行者が**そのまま実行可能な step sequence** を確定する。CONST_005 必須項目のうちコード関連は **N/A（コード変更なし）** とし、代わりに「変更対象ファイル（references / changelog）」「ローカル実行コマンド（gh / jq / rg）」「DoD」を実装仕様書同等の粒度で正本化する。

成果物は (1) `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` への 30 日 feedback 追記、(2) `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`）への 1 行追加、の 2 点に閉じる。

## 完了条件チェックリスト

- [ ] step 1〜9 が実行可能なコマンド付きで列挙されている
- [ ] 「変更対象ファイル」が表で確定している（references + changelog）
- [ ] 「関数シグネチャ / unit / integration / e2e tests」は **N/A（コード変更なし）** と明記されている
- [ ] 30 日 gate 不成立時の据え置き経路が記述されている
- [ ] failure 比率判定（`< 10%` / `>= 10%`）の分岐が記述されている
- [ ] redaction grep が「マッチあり時は要約のみ」のルールで固定されている
- [ ] DoD（AC-1〜AC-11 全 PASS / `outputs/phase-11/` 揃い / skill references diff 記録 / Issue #497 CLOSED 据え置き）が記述されている
- [ ] 不変条件への影響が「なし」と明記されている

## 1. 変更対象ファイル一覧

| パス | 区分 | 役割 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | post-release-dashboard 章配下に `### 30 日実測 feedback (since YYYY-MM-DD)` 節を新規追記 |
| `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`） | 編集 | 30 日 feedback 反映行を 1 行追加 |
| `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/` | 新規 | raw JSON / aggregation / redaction-grep log を保存 |
| `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-12/skill-references-diff.md` | 新規 | references 差分記録 |

> 関数シグネチャ / 型定義 / unit tests / integration tests / e2e tests: **N/A（コード変更なし）**

## 2. 実行 step sequence

### step 1: 30 日 gate 確認

```bash
# 取得範囲内の最古 run の createdAt を取得し、着手日 - 30 日と比較
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq 'min_by(.createdAt) | .createdAt' \
  | tee docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/30day-gate-check.log

# 30 日経過判定（macOS / GNU 共通）
TODAY=$(date -u +%Y-%m-%d)
THRESHOLD=$(date -u -v-30d +%Y-%m-%d 2>/dev/null || date -u -d '30 days ago' +%Y-%m-%d)
echo "today=${TODAY} threshold=${THRESHOLD}"
```

- 最古 run `createdAt` ≦ 着手日 - 30 日 → **gate 成立**、step 2 へ進む
- 最古 run `createdAt` > 着手日 - 30 日 → **gate 不成立**、仕様書を spec_created で据え置き、`30day-gate-check.log` に未達理由を記録して終了

### step 2: raw JSON 取得（schedule run 限定）

```bash
mkdir -p docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11
cd docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion

gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,event,updatedAt,url \
  --jq '[.[] | select(.event=="schedule")]' \
  > outputs/phase-11/post-release-dashboard-30d.json

# 件数 / 期間確認
jq 'length' outputs/phase-11/post-release-dashboard-30d.json
jq -r 'min_by(.createdAt) | .createdAt' outputs/phase-11/post-release-dashboard-30d.json
jq -r 'max_by(.createdAt) | .createdAt' outputs/phase-11/post-release-dashboard-30d.json
```

期待: schedule run 件数 ≧ 30 / 最古 createdAt ≦ 着手日 - 30 日。

### step 2-1: schedule 日次 gap 検出

```bash
jq -r 'sort_by(.createdAt) | .[].createdAt[0:10]' \
  outputs/phase-11/post-release-dashboard-30d.json \
  > outputs/phase-11/schedule-dates.txt

node - outputs/phase-11/schedule-dates.txt > outputs/phase-11/schedule-gap-check.md <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const dates = fs.readFileSync(path, "utf8").trim().split(/\n+/).filter(Boolean).sort();
let gaps = [];
for (let i = 1; i < dates.length; i++) {
  const prev = new Date(`${dates[i - 1]}T00:00:00Z`);
  const cur = new Date(`${dates[i]}T00:00:00Z`);
  const deltaDays = Math.round((cur - prev) / 86400000);
  if (deltaDays !== 1) gaps.push(`${dates[i - 1]} -> ${dates[i]} (${deltaDays} days)`);
}
console.log(`# Schedule Gap Check\n\nrun_dates: ${dates.length}\ngaps: ${gaps.length}`);
for (const gap of gaps) console.log(`- ${gap}`);
NODE
```

日次 gap がある場合は `aggregation.md` に欠損日を明記し、AC-1 は PASS にしない。manual `workflow_dispatch` run は 30 日連続 schedule 判定に含めない。

### step 3: conclusion 分布集計

```bash
jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  outputs/phase-11/post-release-dashboard-30d.json \
  | tee outputs/phase-11/conclusion-distribution.json
```

`success / failure / cancelled / startup_failure / timed_out / action_required` の件数表を生成。`outputs/phase-11/aggregation.md` に markdown 表として転記する。

### step 4: failure run の log 取得 + artifact downloadability 確認

```bash
for id in $(jq -r '.[] | select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out") | .databaseId' \
              outputs/phase-11/post-release-dashboard-30d.json); do
  gh run view "$id" --log-failed > "outputs/phase-11/log-failed-${id}.log" || true
done

mkdir -p outputs/phase-11/artifacts
for id in $(jq -r '.[].databaseId' outputs/phase-11/post-release-dashboard-30d.json); do
  mkdir -p "outputs/phase-11/artifacts/${id}"
  if gh run download "$id" --dir "outputs/phase-11/artifacts/${id}" >/tmp/issue497-artifact-download.log 2>&1; then
    echo "${id},downloadable" >> outputs/phase-11/artifact-downloadability.csv
  else
    echo "${id},not_downloadable" >> outputs/phase-11/artifact-downloadability.csv
    cat /tmp/issue497-artifact-download.log >> outputs/phase-11/artifact-download-errors.log
  fi
done
```

> GitHub Actions retention（90 日）超過 run は `--log-failed` / artifact download が取得不可。エラー時は skip し、欠損 id を Phase 6 異常系の「retention 失効」記録対象とする。

### step 5: redaction grep（必須）

```bash
rg -i "(token|bearer|secret|Authorization)" outputs/phase-11/log-failed-*.log \
  > outputs/phase-11/redaction-grep.log || true

# マッチ件数を確認
wc -l outputs/phase-11/redaction-grep.log
```

- マッチ **あり** → 該当原文を skill references に **転記しない**。要約（例: 「OAuth token 失効による GraphQL 401」）のみを記録。
- マッチ **なし** → `redaction-grep.log` を空ファイルとして保存し、AC-8 の証跡とする。

### step 6: 連続 failure 区間算出

```bash
# createdAt 昇順で並べて conclusion 列を抽出
jq -r 'sort_by(.createdAt) | .[] | "\(.createdAt) \(.conclusion)"' \
  outputs/phase-11/post-release-dashboard-30d.json \
  > outputs/phase-11/timeline.txt

# 連続 failure 区間（擬似コード）:
# - timeline.txt を上から走査
# - conclusion=='failure' が連続するブロックの最大長を記録
# - 0 日でも明記（AC-4）
awk '
  ($2=="failure"||$2=="startup_failure"||$2=="timed_out") { run++; if (run > max) max=run; next }
  { run=0 }
  END { print "max_consecutive_failure_days=" (max ? max : 0) }
' outputs/phase-11/timeline.txt \
  | tee -a outputs/phase-11/aggregation.md
```

### step 6-1: run 所要時間集計

```bash
jq -r '
  .[]
  | select(.createdAt and .updatedAt)
  | [.databaseId, .createdAt, .updatedAt] | @tsv
' outputs/phase-11/post-release-dashboard-30d.json \
  > outputs/phase-11/run-duration.tsv
```

`createdAt`〜`updatedAt` の差分を集計し、最小 / 中央 / 最大を `aggregation.md` に記録する。`updatedAt` が欠ける run は `duration_unknown` として別行にする。

### step 7: failure 根本原因分類

step 4 で取得した `log-failed-<id>.log` を redaction 後に閲覧し、以下のカテゴリで分類:

| カテゴリ | 検出パターン例（要約） |
| --- | --- |
| token 失効 | 401 / `Bad credentials` / `expired` |
| GraphQL 5xx | `502` / `503` / `Something went wrong while executing your query` |
| cron schedule drift | run が想定 UTC 00:00 から大きくずれる |
| schema drift | `Field 'X' doesn't exist on type 'Y'` |
| artifact retention | upload-artifact / download-artifact 関連エラー |
| その他 | 上記に該当しない |

分類結果を `outputs/phase-11/aggregation.md` の **failure 根本原因分類表** として markdown 化する。

### step 8: skill references 追記

追記先: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
追記位置: post-release-dashboard 章配下
セクション構造:

```markdown
### 30 日実測 feedback (since YYYY-MM-DD)

#### conclusion 分布

| conclusion | count | ratio |
| --- | --- | --- |
| success | N | NN% |
| failure | N | NN% |
| cancelled | N | NN% |
| startup_failure | N | NN% |
| timed_out | N | NN% |
| action_required | N | NN% |

#### failure 根本原因分類

| カテゴリ | 件数 | 備考（要約のみ / 原文転記禁止） |
| --- | --- | --- |
| token 失効 | … | … |
| GraphQL 5xx | … | … |
| cron schedule drift | … | … |
| schema drift | … | … |
| artifact retention | … | … |
| その他 | … | … |

#### 連続 failure 区間

- 最大連続 failure 日数: N 日（0 日の場合も明記）
- 該当期間: YYYY-MM-DD 〜 YYYY-MM-DD（あれば）

#### 次アクション判断

- failure 比率: NN%
- 判定: `< 10%` → 現状維持 / `>= 10%` → 別 unassigned task 起票（issue #NNN）
- 根拠: …

#### artifact / duration

- artifact downloadability: downloadable N / not_downloadable N
- retention 欠損: N 件
- duration: min / median / max（`createdAt`〜`updatedAt`）
```

### step 9: failure 比率判定 + changelog 反映

```bash
# failure 比率算出
TOTAL=$(jq 'length' outputs/phase-11/post-release-dashboard-30d.json)
FAILURE=$(jq '[.[] | select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out")] | length' outputs/phase-11/post-release-dashboard-30d.json)
RATIO=$(awk "BEGIN { printf \"%.2f\", ($FAILURE/$TOTAL)*100 }")
echo "failure_ratio=${RATIO}%"
```

- `< 10%` → skill references に「現状維持」を明記、step 9-1 へ。
- `>= 10%` → 別 unassigned task を起票（下記）し、issue 番号を skill references に追記、step 9-1 へ。

```bash
# >= 10% の場合のみ
gh issue create \
  --title "post-release-dashboard 30 日 feedback: failure 比率 ${RATIO}% で retry/alert 追加検討" \
  --body "issue-497 の 30 日 feedback で failure 比率が 10% を超えたため別 unassigned task として起票。詳細は docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/outputs/phase-11/aggregation.md 参照。" \
  --label "unassigned-task,operations"
```

#### step 9-1: changelog 1 行追加

`.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`）に以下形式で 1 行追加:

```
| v2026.MM.DD-issue497-30day-feedback | 2026-MM-DD | post-release-dashboard 30 日連続 schedule の conclusion 分布 / failure 根本原因 / 次アクション判断を deployment-gha.md に正本化 |
```

#### step 9-2: indexes 再生成（必要時のみ）

```bash
mise exec -- pnpm indexes:rebuild
git diff .claude/skills/aiworkflow-requirements/indexes
```

drift があれば commit、無ければ skip。

## 3. 入出力 / 副作用

| step | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| 1 | なし | `30day-gate-check.log` | read-only |
| 2 | `gh run list` | `post-release-dashboard-30d.json` | read-only |
| 3 | step 2 出力 | `conclusion-distribution.json` / `aggregation.md` 更新 | read-only |
| 4 | step 2 出力 | `log-failed-<id>.log` 群 | read-only |
| 5 | step 4 出力 | `redaction-grep.log` | read-only |
| 6 | step 2 出力 | `timeline.txt` / `aggregation.md` 更新 | read-only |
| 7 | step 4 + 5 出力 | `aggregation.md` 更新 | read-only |
| 8 | step 3 / 6 / 7 出力 | `deployment-gha.md` 編集 | skill references 追記 |
| 9 | step 3 出力 | changelog 1 行追加 / 必要時 issue 起票 | changelog 編集（+ 必要時 GitHub Issue 起票） |

## 4. ローカル実行コマンド（一括）

```bash
# 前提: gh auth status で OK / cwd = リポジトリ root
TASK_DIR=docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion
mkdir -p ${TASK_DIR}/outputs/phase-11 ${TASK_DIR}/outputs/phase-12

# step 1〜2
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt --jq 'min_by(.createdAt) | .createdAt' \
  > ${TASK_DIR}/outputs/phase-11/30day-gate-check.log
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json conclusion,createdAt,databaseId,status,event,updatedAt,url \
  --jq '[.[] | select(.event=="schedule")]' \
  > ${TASK_DIR}/outputs/phase-11/post-release-dashboard-30d.json

# step 3
jq 'group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  ${TASK_DIR}/outputs/phase-11/post-release-dashboard-30d.json \
  > ${TASK_DIR}/outputs/phase-11/conclusion-distribution.json

# step 4〜5
for id in $(jq -r '.[] | select(.conclusion=="failure" or .conclusion=="startup_failure" or .conclusion=="timed_out") | .databaseId' \
              ${TASK_DIR}/outputs/phase-11/post-release-dashboard-30d.json); do
  gh run view "$id" --log-failed > "${TASK_DIR}/outputs/phase-11/log-failed-${id}.log" || true
done
rg -i "(token|bearer|secret|Authorization)" ${TASK_DIR}/outputs/phase-11/log-failed-*.log \
  > ${TASK_DIR}/outputs/phase-11/redaction-grep.log || true

# step 8〜9 は手作業（markdown 編集）+ 任意 issue 起票
# step 9-2 (任意)
mise exec -- pnpm indexes:rebuild
```

## 5. DoD（Definition of Done）

- [ ] AC-1〜AC-11 全件 PASS（Phase 7 AC マトリクスで判定）
- [ ] `outputs/phase-11/` に raw JSON / aggregation.md / redaction-grep.log / 30day-gate-check.log が揃う
- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に `### 30 日実測 feedback (since YYYY-MM-DD)` 節が追記
- [ ] `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`（または `workflow-local close-out`）に 1 行追加
- [ ] `outputs/phase-12/skill-references-diff.md` に追記 diff が記録
- [ ] failure 比率 `>= 10%` の場合のみ別 unassigned task issue が起票され、issue 番号が skill references に追記
- [ ] GitHub Issue #497 は CLOSED 据え置き（再 OPEN しない）
- [ ] 必要時のみ `pnpm indexes:rebuild` で drift 0

## 6. 注意事項

- 本 Phase は **runbook の手順書化のみ**。実 `gh run list` 実行 / 実 markdown 追記 / 実 changelog 反映は Phase 11〜12 で行う。
- 30 日 gate 不成立の場合、step 2 以降は実施せず仕様書を spec_created のまま据え置き、30 日経過時点で再起動する。
- redaction grep のマッチ原文は **どのドキュメントにも転記禁止**。要約のみ skill references に記録する。
- `wrangler` 直接実行は本タスクでは使用しない（Cloudflare 操作なし）。Cloudflare 操作が必要になった時点で `scripts/cf.sh` 経由に切り替え、本タスクのスコープ外として別 issue 化する。

## 7. 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | CLAUDE.md 全項目 | **影響なし** | コード / D1 / Cloudflare / Forms 操作なし。markdown 追記と read-only シェル操作のみ |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | step 1〜9 で AC-1〜AC-11 を一意に達成。後続実行者が runbook をそのまま実行すれば evidence が揃う |
| 実現性 | PASS | `gh` / `jq` / `rg` のみで完結し、外部ネットワーク副作用は GitHub API read-only と任意 issue 起票のみ |
| 整合性 | PASS | 起票元仕様（task-issue-351-post-release-dashboard-30day-conclusion-001.md）の実行手順 4-1〜4-6 と完全整合 |
| 運用性 | PASS | Issue CLOSED 据え置き / 必要時のみ別 issue 起票で workflow 状態を汚さない |

## 受入条件（AC）

本 Phase は **AC-1〜AC-9** の達成手順を確定する責務を担う。AC-10 / AC-11 は Phase 7 / 12 で確定。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC 正本 |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-04.md` | 検証戦略連結 |
| 必須 | `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` | 起票元仕様 / 実行手順 |
| 必須 | `.github/workflows/post-release-dashboard.yml` | 対象 workflow |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先 |
| 必須 | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | changelog 反映先 |

## 苦戦箇所【記入必須】

- `gh run view --log-failed` の出力に機微情報（token / bearer 等）が混入する可能性があり、無条件で skill references に転記すると AI 学習混入事故になる。本 Phase では step 5 で必ず redaction grep を挟み、マッチ原文は要約のみ記録するルールを step 8 セクション構造に固定した。
- failure 比率判定（`>= 10%`）で別 issue 起票する場合、本タスク Issue #497 を再 OPEN するのではなく **新規 unassigned task** として起票するルールを step 9 で明記した。これにより issue-497 の close 状態を維持しつつ後続アクションが追跡可能になる。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/runbook.md` | step 1〜9 / 変更対象 / DoD / 入出力表 |
| メタ | `artifacts.json` | Phase 5 状態の更新 |

## 次 Phase への引き渡し

- 次 Phase: 6（異常系）
- 引き継ぎ事項:
  - step 1〜9 の sequence
  - 30 日 gate 不成立時の据え置き経路
  - redaction grep 必須ルール
  - failure 比率判定の `< 10%` / `>= 10%` 分岐
  - DoD 8 項目
- ブロック条件:
  - step のいずれかに実行不可コマンドが含まれる
  - redaction grep のマッチ原文転記禁止ルールが欠落
  - 30 日 gate 不成立時の据え置き経路が欠落

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
