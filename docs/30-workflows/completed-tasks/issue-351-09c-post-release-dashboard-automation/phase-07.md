# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |


## 目的

AC-1 から AC-8 を検証コマンドと evidence に対応付ける。


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

- `phase-07.md`
- `outputs/phase-07/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. AC ↔ 仕様書 / コード / 検証手段マトリクス

| AC | 内容 | 仕様書参照 | 実装ファイル | 検証手段 / コマンド | ステータス |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `schedule`（`0 0 * * *`）と `workflow_dispatch` で起動可能 | phase-02 §2 | `.github/workflows/post-release-dashboard.yml` | `gh workflow list` / `actionlint` / `rg "cron: '0 0"` | gate defined / pending follow-up execution |
| AC-2 | `secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` のみ参照（既存 `secrets.CLOUDFLARE_API_TOKEN` 不参照） | phase-02 §2.2 / §6 | `.github/workflows/post-release-dashboard.yml` | `rg -c "secrets\\.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" .github/workflows/post-release-dashboard.yml` かつ `! rg "secrets\\.CLOUDFLARE_API_TOKEN(\\W|$)" .github/workflows/post-release-dashboard.yml` | gate defined / pending follow-up execution |
| AC-3 | artifact path が `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}` に固定 | phase-02 §2.2 / §4 | `.github/workflows/post-release-dashboard.yml`（`actions/upload-artifact` の `path:`） | `rg "outputs/post-release-dashboard/" .github/workflows/post-release-dashboard.yml` | gate defined / pending follow-up execution |
| AC-4 | metric 名が 09c `post-release-summary.md` と一致 | phase-02 §4.2 | `scripts/post-release-dashboard/lib/format-dashboard.sh` | `rg "Workers requests\|D1 reads\|D1 writes" scripts/post-release-dashboard/lib/format-dashboard.sh docs/30-workflows/completed-tasks/09c-*/outputs/phase-12/post-release-summary.md` | gate defined / pending follow-up execution |
| AC-5 | redaction grep（token / Bearer / Authorization）0 件 | phase-02 §3.2 / phase-05 §2.5 | `scripts/post-release-dashboard/lib/redaction-check.sh` | dry-run 後 `bash scripts/post-release-dashboard/lib/redaction-check.sh outputs/post-release-dashboard/<date>` | gate defined / pending follow-up execution |
| AC-6 | aiworkflow-requirements references に章追記 diff plan あり | phase-12 Step 1-A | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` / `deployment-cloudflare-opennext-workers.md` | phase-12 の diff 計画 + Phase 11 後の grep 確認 | implemented-local |
| AC-7 | schedule 頻度 1 日 1 回以下 | phase-02 §2.1 | `.github/workflows/post-release-dashboard.yml` | `rg "cron: '0 0 \\* \\* \\*'"` 1 件 / 他 cron 値なし | gate defined / pending follow-up execution |
| AC-8 | dashboard.json schema-conformant（`metrics[].metric_id` 等） | phase-02 §4 | `scripts/post-release-dashboard/lib/format-dashboard.sh` + `__tests__/format-dashboard.test.sh` | dry-run 出力を `jq -e '.schema_version=="1" and (.metrics|length)==5'` で検証 | gate defined / pending follow-up execution |

## 2. AC 個別詳細

### AC-1

- **証跡**: workflow file に `on.schedule[0].cron == "0 0 * * *"` および `on.workflow_dispatch` が両方存在。`gh workflow list` で `post-release-dashboard` が `active` 表示。
- **失敗パターン**: cron 値が異なる / `workflow_dispatch` 欠落 / `on:` 句なし。

### AC-2

- **証跡**: `rg -c "secrets\\.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY" .github/workflows/post-release-dashboard.yml` が 1 以上、かつ `! rg "secrets\\.CLOUDFLARE_API_TOKEN(\\W|$)" .github/workflows/post-release-dashboard.yml` が exit 0（hit 0 件）。
- **正解の参照行**: `${{ secrets.CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY }}` のみ。

### AC-3

- **証跡**: `path: outputs/post-release-dashboard/${{ steps.date.outputs.target_date }}/`。step id = `date`、output `target_date` が UTC `yyyy-mm-dd`。
- **artifact name**: `post-release-dashboard-<date>`（GitHub Actions UI 上の表示名）。

### AC-4

- **正解 mapping**:

| 09c 表記 | 仕様書 metric_id | 検出 grep |
| --- | --- | --- |
| `Workers requests` | `workers_requests` | `rg "Workers requests" scripts/.../format-dashboard.sh docs/30-workflows/completed-tasks/09c-*/outputs/phase-12/post-release-summary.md` |
| `D1 reads` | `d1_reads` | `rg "D1 reads" ...` |
| `D1 writes` | `d1_writes` | `rg "D1 writes" ...` |

- **新規 metric**（09c 未掲載）: `Workers errors` / `Latest schedule run`。phase-12 で aiworkflow に追記し出典を明記。

### AC-5

- **証跡**: dry-run 後の `redaction-check.md` に `EXIT_CODE=0` と grep 0 件。

### AC-6

- **証跡**: phase-12 の Step 1-A diff plan に下記を含む:
  - `deployment-gha.md` に「Post-release dashboard workflow」章を追加（schedule / workflow_dispatch / artifact path / token scope）
  - `deployment-cloudflare-opennext-workers.md` に「analytics token 分離」段落を追加

### AC-7

- **証跡**: `.github/workflows/post-release-dashboard.yml` 内 `cron:` の値が 1 つで、それが `0 0 * * *`。それ以上の頻度（`*/n * * * *` 等）が存在しない。

### AC-8

- **証跡**: dry-run の `dashboard.json` を `jq -e '
    .schema_version=="1" and
    (.target_date_utc | test("^\\d{4}-\\d{2}-\\d{2}$")) and
    (.metrics | length) == 5 and
    ([.metrics[].metric_id] == ["workers_requests","workers_errors","d1_reads","d1_writes","cron_status"]) and
    ([.metrics[].judgment] | all(. as $j | ["PASS","WARN","FAIL","UNKNOWN"] | index($j))) 
  '` が exit 0。

## 3. ステータス記号の意味（NON_VISUAL governance パターン）

| ステータス | 意味 |
| --- | --- |
| `gate defined / pending follow-up execution` | 仕様書サイクルでは検証コマンドの定義のみ。実 runtime evidence は実装サイクル / Phase 11 dry-run で取得 |
| `implemented-local-runtime-gated` | code/aiworkflow は反映済み。real workflow evidence のみ user approval / runtime に依存 |

## 4. 完了条件

- [x] 全 AC が仕様書 / 実装ファイル / 検証コマンドに紐付く
- [x] 09c naming 一致表が確定
- [x] 新規 metric の出典追記計画が phase-12 にある

## outputs

- `outputs/phase-07/ac-matrix.md`
