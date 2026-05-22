# Phase 8: DRY 化 / 仕様間整合

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| GitHub Issue | #517（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #517, Refs #497, Refs #351`） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-07 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |

---

## 目的

issue-517 は **新規 GHA workflow + bash script + Slack Webhook 連携** を伴う implementation タスクであり、既存 `scripts/post-release-dashboard/` 配下のヘルパ群 / 親 workflow `.github/workflows/post-release-dashboard.yml` / 親タスク issue-497 の集計仕様 / 兄弟タスク issue-351 の自動化基盤との重複・矛盾を排除する責務を持つ。

本 Phase は次の 4 軸で DRY と仕様間整合を確定する:

1. 既存スクリプト / lib との重複排除設計（source 経由の再利用 / 重複実装禁止）
2. 親 workflow path existence gate と cron 整合（`0 0 * * *` UTC vs `0 1 * * *` UTC）
3. 関連仕様書（issue-497 / issue-351）との独立性 / 入出力契約整合
4. aiworkflow-requirements skill (`references/deployment-gha.md`) との単一追記章方針 / secret 管理規約

これにより Phase 9（品質保証）が、機械的 grep / shellcheck / actionlint で「DRY 違反 0」を検証可能な状態にする。

---

## 軸 1: 既存スクリプト / lib との DRY 設計

### 1-1. 再利用対象（source 経由 / 重複実装禁止）

| 既存資産 | 再利用方式 | 30day-summary.sh での参照位置 | 理由 |
| --- | --- | --- | --- |
| `scripts/post-release-dashboard/lib/redaction-check.sh` | `source` で読み込み、`redact_log()` 同等関数を呼出（Phase 2 軸 5-2 で確定した DRY 制約） | エントリポイント先頭で `source "$(dirname "$0")/lib/redaction-check.sh"` | パターン (`token` / `bearer` / `secret` / `Authorization`) を 1 箇所に集約 |
| `scripts/post-release-dashboard/collect.sh` | **再利用しない**（責務分離 / collect.sh は artifact directory 収集、本タスクは run 履歴集計） | N/A | 入力スコープが異なるため、共通化はオーバーフィット |
| `scripts/post-release-dashboard/__tests__/run-all.sh` | テストランナーとして再利用、新規 `30day-summary.test.sh` を呼出に追加 | `__tests__/run-all.sh` の最終行付近に `bash "$(dirname "$0")/30day-summary.test.sh"` 追加 | テスト実行口を単一化 |

### 1-2. 重複実装禁止ファクト

- redaction patterns の **再列挙禁止**（D-6 で固定）。`30day-summary.sh` 内に `token|bearer|secret|Authorization` を直書きしない。
- `gh run list` 呼出は **`fetch_runs()` 関数 1 箇所のみ**に集約（Phase 2 軸 2-3 step 4 が唯一の呼出点）。`render_pr_body()` / `render_slack_payload()` 内で再呼出しない（集計 JSON 経由のみ）。
- 集計ロジック（jq filter）は `lib/aggregate.sh` のみに記述し、`30day-summary.sh` 本体および test fixture 内に再実装しない。

### 1-3. 30day-summary.sh と既存ヘルパの責務境界

| 責務 | 担当 | 重複検査ポイント |
| --- | --- | --- |
| run 履歴 fetch | `30day-summary.sh::fetch_runs()` | collect.sh と引数 / output 形式が衝突しないこと（collect.sh は artifact 系、本関数は run JSON 系） |
| 集計（conclusion 分布 / failure streak / failure rate） | `lib/aggregate.sh::aggregate_runs()` | 既存スクリプトに同名関数が存在しないこと（grep 確認） |
| redaction | `lib/redaction-check.sh::redact_log()` 再利用 | 重複実装ゼロ |
| PR / Slack 起票 | `30day-summary.sh::render_pr_body()` / `render_slack_payload()` / `post_slack()` | 既存スクリプトには存在しない（新規責務） |

### 1-4. DRY 違反検出 grep（Phase 9 で機械検証）

```bash
# パターン重複（redaction patterns が複数箇所に直書きされていないか）
rg -n "token|bearer|secret|Authorization" \
  scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh

# gh run list 呼出の重複（fetch_runs 以外で呼んでいないか）
rg -n "gh run list" scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/

# 関数名衝突
rg -n "^(aggregate_runs|redact_log|is_30day_gate_satisfied|find_existing_pr|render_pr_body|render_slack_payload|post_slack)\\s*\\(\\s*\\)" \
  scripts/post-release-dashboard/
```

期待される結果:

- 1 つ目: `lib/redaction-check.sh` 内のみに hits、`30day-summary.sh` / `aggregate.sh` 内には 0 件
- 2 つ目: `30day-summary.sh::fetch_runs()` 1 行のみ
- 3 つ目: 各関数 1 定義のみ

---

## 軸 2: workflow path existence gate と cron 整合

### 2-1. 親 workflow 実在確認

- `.github/workflows/post-release-dashboard.yml` が main 上に存在することを **本仕様書作成時点 (2026-05-07) で確認済**。
- 当該 workflow の `on.schedule` は `cron: '0 0 * * *'` UTC（00:00 起動 / 日次）で稼働中であることを確認済。
- 本タスク新規 workflow は `cron: '0 1 * * *'` UTC（01:00 起動 / 1 時間遅延）で起動するため、親 workflow の run 履歴が確定した状態で fetch 可能。

### 2-2. script 起動時 gate（Phase 2 軸 5-1 から固定）

`30day-summary.sh` の冒頭で次の存在確認を行い、親 workflow が削除・改名された場合に exit 64 で即座に失敗させる:

```bash
if [ ! -f .github/workflows/post-release-dashboard.yml ]; then
  echo "error: post-release-dashboard.yml not found (parent workflow missing)" >&2
  exit 64
fi
```

### 2-3. cron drift 整合

- GHA cron は ±10 分程度の drift があるが、`0 1 * * *` 起動 → 親 `0 0 * * *` 完了の interval が約 60 分あるため、drift 吸収余地が十分。
- 30 日 gate 判定は ISO 8601 文字列比較（NFR-7）であり、drift による日跨ぎリスクは UTC 基準で評価する限り発生しない。

---

## 軸 3: 関連仕様書との独立性 / 入出力契約整合

### 3-1. 親 / 兄弟タスクとの関係表

| 関連タスク | 関係 | 入出力契約 | 本仕様書での扱い |
| --- | --- | --- | --- |
| issue-497 (`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`) | 親 / docs-only / 30 日 gate 集計の人手運用版 | 出力: skill references / changelog（追記方針） | **read-only 参照**。issue-497 出力を「読まない」: 本 workflow は issue-497 完了を依存せず、独立して `gh run list` 経由で集計 |
| issue-351 (`docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/`) | 祖父 / 親 workflow `post-release-dashboard.yml` の output 契約源 | 出力: `createdAt` / `conclusion` / `event` / `databaseId` / `url` JSON フィールド | 親 workflow の output schema **に依存**。schema drift があれば aggregate_runs が exit 2 で失敗する |
| issue-517 (本タスク) | 当該 | 出力: 新規 workflow / 30day-summary.sh / Slack Webhook 連携 / aiworkflow-requirements skill 章追加 | 本仕様書配下のみで完結 |

### 3-2. 独立性の境界（編集禁止）

- `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/**` は不可侵（Phase 1 変更しないファイル節と一致）。
- `.github/workflows/post-release-dashboard.yml` は read-only 利用（permissions `actions: read` のみで参照）。
- issue-497 の `outputs/phase-11/post-release-dashboard-30d.json` を本タスクが読み込まない（並走時に存在しない可能性があるため、独立 fetch する）。

### 3-3. issue-497 出力契約との互換

- 集計 JSON schema (`conclusion_dist` / `longest_failure_streak` / `failure_rate` / `runs_total` / `schedule_runs_total` / `oldest_schedule_created_at`) は issue-497 Phase 2 軸 1 / 軸 3 と互換に保つ。
- failure_rate の閾値判定（>= 10%）も issue-497 と同値（D-7）。

---

## 軸 4: aiworkflow-requirements skill との整合

### 4-1. 単一追記章方針

| 項目 | 値 |
| --- | --- |
| 追記先 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` |
| 追記章タイトル | `## 30day auto-summary` |
| 追記契機 | Phase 12（ドキュメント更新）。本 Phase では **要件確定のみ** |
| 他 references への波及 | 禁止（`api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` 等への追記は不可） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` を新規作成 |

### 4-2. 追記章に含める要素（Phase 12 で執筆）

- workflow file path: `.github/workflows/post-release-30day-auto-summary.yml`
- script entry point: `scripts/post-release-dashboard/30day-summary.sh`
- 関数 7 件の責務早見表（Phase 2 軸 2-2 から転記）
- exit code semantics（0 / 2 / 3 / 64）
- silent skip 経路 3 件（gate 不成立 / 重複 PR / dry-run）
- GitHub Secrets 契約（`SLACK_WEBHOOK_URL`）
- ローカル dry-run 手順

### 4-3. skill references 波及範囲検証 grep

```bash
# 30day auto-summary 関連の追記が deployment-gha.md 以外に混入していないか
rg -n "30day auto-summary|30day-summary\\.sh|post-release-30day-auto-summary" \
  .claude/skills/aiworkflow-requirements/references/

# 期待: deployment-gha.md のみ hits、他 references 0 件
```

---

## 軸 5: secret 管理規約 / ローカル dry-run 手順

### 5-1. GitHub Secrets

| 種別 | 名前 | 登録先 | 用途 | 露出禁止経路 |
| --- | --- | --- | --- | --- |
| Secret | `SLACK_WEBHOOK_URL` | GitHub repo Settings > Secrets and variables > Actions | Slack Incoming Webhook POST | log / PR body / Slack payload / README / commit |
| Secret | `GITHUB_TOKEN` | GHA 自動 | gh CLI 認証 / branch push / PR 作成 | 既存実装通り |

### 5-2. 1Password との関係（CLAUDE.md「ローカル `.env` の運用ルール」整合）

- `SLACK_WEBHOOK_URL` は **GitHub Actions 内のみで利用** する secret であり、1Password 環境変数の流用は行わない。
- ローカル dry-run 時は **PR 起票 / Slack POST いずれも実行しない**ため、`SLACK_WEBHOOK_URL` 未設定でも dry-run は成功する（Phase 2 軸 2-6 で固定）。
- どうしてもローカルで Slack POST を確認したい場合は、運用者が一時的に環境変数として渡す（`.env` への実値書込み禁止 / op 参照経路を使うか、シェル内で揮発的に渡す）:

```bash
# ローカル dry-run（Slack 送信なし / SLACK_WEBHOOK_URL 不要）
bash scripts/post-release-dashboard/30day-summary.sh --dry-run

# ローカルで実 POST を確認したい例外的ケース（実値はシェル変数で揮発的に渡す。.env への書込み禁止）
SLACK_WEBHOOK_URL='<webhook url>' bash scripts/post-release-dashboard/30day-summary.sh
```

### 5-3. README 追記方針

- `scripts/post-release-dashboard/README.md` に Phase 12 で次を追記する:
  - GitHub Secrets `SLACK_WEBHOOK_URL` 登録手順
  - Slack channel: `w1618436027-ek2505248`（運用情報）
  - ローカル dry-run コマンド例
  - 実値 Webhook URL を README に書かない原則（CLAUDE.md シークレット方針）

---

## 仕様間整合確認チェックリスト

- [ ] `artifacts.json` の `phases[*]` と `index.md` の Phase 一覧表が Phase 番号 / 名称 / spec ファイル名で完全一致
- [ ] `artifacts.json` の `ac` と `index.md` の AC 一覧（AC-1〜AC-10）が件数・内容で完全一致
- [ ] FR-1〜FR-12（Phase 1）と関数 7 件（Phase 2 軸 2-2）の対応が 1:1
- [ ] redaction patterns が `lib/redaction-check.sh` のみに固定され、本タスク新規ファイルに再列挙されていない
- [ ] `gh run list` 呼出が `fetch_runs()` 1 箇所に集約されている
- [ ] aiworkflow-requirements 追記が `references/deployment-gha.md` のみに留まる方針
- [ ] GitHub Issue 番号 #517 と Refs 表記 `Refs #517, Refs #497, Refs #351` が全 phase で統一
- [ ] `Closes #517` / `Fixes #517` / `gh issue reopen` が本仕様書配下に 0 件
- [ ] `SLACK_WEBHOOK_URL` 実値が本仕様書配下 / コード / README に記載されていない
- [ ] 親 workflow `post-release-dashboard.yml` の cron `0 0 * * *` と本タスク cron `0 1 * * *` の 1 時間遅延整合が文書化済

---

## DRY 違反検出コマンド（Phase 9 連携）

```bash
# (1) redaction pattern 重複
rg -n "token|bearer|secret|Authorization" \
  scripts/post-release-dashboard/30day-summary.sh \
  scripts/post-release-dashboard/lib/aggregate.sh \
  scripts/post-release-dashboard/__tests__/30day-summary.test.sh

# (2) gh run list 呼出の集約
rg -n "gh run list" scripts/post-release-dashboard/

# (3) Refs 表記の統一
rg -n "#517|#497|#351|Closes #517|Fixes #517" \
  docs/30-workflows/issue-517-followup-auto-summary-foundation/

# (4) skill references 波及範囲
rg -n "30day auto-summary|30day-summary\\.sh|post-release-30day-auto-summary" \
  .claude/skills/aiworkflow-requirements/references/

# (5) SLACK_WEBHOOK_URL 実値漏洩検査
rg -n "hooks\\.slack\\.com" docs/30-workflows/issue-517-followup-auto-summary-foundation/ \
  scripts/post-release-dashboard/ \
  .claude/skills/aiworkflow-requirements/
```

期待される結果:

- (1): `lib/redaction-check.sh` 内のみに hits、新規 3 ファイルに 0 件（test fixture 用 redaction trigger を除く）
- (2): `30day-summary.sh::fetch_runs()` 1 行のみ
- (3): `Closes #517` / `Fixes #517` 0 件
- (4): `deployment-gha.md` のみ hits（Phase 12 適用後）
- (5): 0 件

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （`index.md` 記載の不変条件すべて） | 影響なし | フォーム / consent / D1 / GAS 非対象。本タスクは GHA workflow + bash script + Slack Webhook のみで完結 |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 既存 redaction lib / テストランナーを最大限再利用し、新規実装範囲を最小化。skill references 単一追記章で参照経路を一意化 |
| 実現性 | PASS | grep / source / shellcheck で DRY 違反を機械検出可能。新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 影響なし。issue-497 仕様書を不可侵、親 workflow 出力契約に依存しつつ独立 fetch で並走耐性あり |
| 運用性 | PASS | DRY 違反検出 grep が Phase 9 機械検証として再利用可能。secret 管理規約が CLAUDE.md と整合 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（再利用 / 重複禁止 / 関連仕様書独立性 / skill references 単一追記章 / 違反検出 grep 結果） |
| メタ | artifacts.json | Phase 8 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] 軸 1 の再利用対象表（3 件）+ 重複実装禁止ファクト（3 件）+ 責務境界表（4 件）が記述済
- [ ] 軸 2 の親 workflow 実在確認 + cron 整合（`0 0 * * *` vs `0 1 * * *`）が記述済
- [ ] 軸 3 の関連タスク表（issue-497 / issue-351 / 本タスク）が独立性 + 入出力契約付きで記述済
- [ ] 軸 4 の skill references 単一追記章方針 + 波及範囲検証 grep が記述済
- [ ] 軸 5 の secret 管理規約 + ローカル dry-run 手順が CLAUDE.md と整合
- [ ] DRY 違反検出 grep 5 件と期待結果が記述済
- [ ] 仕様間整合確認チェックリスト 10 項目すべて確認可能な状態
- [ ] 4 条件評価が全 PASS

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

本 Phase は **DRY 設計 / 仕様間整合の文書化** に閉じる（コード変更は Phase 5 実装 runbook で行う）。Phase 1 / Phase 2 で確定した変更対象ファイル一覧および関数 7 件の契約に対する変更はない。

---

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項:
  - DRY 違反検出 grep 5 件（Phase 9 機械検証として再実行）
  - 既存 lib 再利用方針（source 経由 / 重複実装禁止）
  - 親 workflow path existence gate コード片
  - skill references 単一追記章方針（Phase 12 適用予定）
  - secret 管理規約（GitHub Secrets のみ / 1Password 流用なし）
- ブロック条件:
  - DRY 違反検出 grep のいずれかが期待結果と乖離
  - skill references 追記が `deployment-gha.md` 以外に波及している
  - `SLACK_WEBHOOK_URL` 実値の記載が検出される
  - Refs 表記が `Refs #517, Refs #497, Refs #351` で統一されていない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/index.md` | AC / scope 正本 |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-01.md` | FR / NFR / 変更対象ファイル |
| 必須 | `docs/30-workflows/issue-517-followup-auto-summary-foundation/phase-02.md` | 関数 7 件契約 / 制御フロー |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 追記先 references（実在確認済 / 2026-05-07） |
| 参照 | `scripts/post-release-dashboard/lib/redaction-check.sh` | source 再利用元 |
| 参照 | `.github/workflows/post-release-dashboard.yml` | 親 workflow（read-only） |
| 参照 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/phase-08.md` | テンプレ参照 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] CONST_004（実装仕様書）/ CONST_007（スコープ単一性）/ Issue #517 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている
