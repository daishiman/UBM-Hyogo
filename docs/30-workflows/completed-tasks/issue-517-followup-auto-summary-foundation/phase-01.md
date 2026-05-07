# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-517 N 日後 follow-up auto-summary 基盤 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（機能 / 非機能 / 変更対象ファイル / 制約） |
| 作成日 | 2026-05-07 |
| Wave | 3（issue-497 main merge 後） |
| 実行種別 | sequential |
| 前 Phase | なし |
| 次 Phase | 2（設計） |
| 状態 | spec_created |
| 実装区分 | **実装仕様書（CONST_004 / コード変更を伴う）** |
| タスク分類 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #517（CLOSED 維持・再 OPEN しない / PR 文面は `Refs #517, Refs #497, Refs #351`） |
| 親タスク | issue-497-post-release-dashboard-30day-conclusion |

---

## 目的

issue-517 が解決すべき真の論点を「issue-497 で人手運用となっていた 30 日 follow-up 集計 / draft PR 起票 / Slack 通知を、GitHub Actions cron で **冪等かつ silent-skip 安全** に自動化する」と定義し、Phase 2 が一意に設計を絞り込める粒度で機能要件 / 非機能要件 / 変更対象ファイル / 制約を固定する。

Phase 1 では決定そのものを行わず、以下 5 点を入力として整える:

1. 機能要件（cron + dispatch / 30 日 gate / 集計 / redaction / 冪等 / draft PR / Slack / dry-run）
2. 非機能要件（idempotency / observability / security / failure isolation / portability）
3. 変更対象ファイル一覧（新規 / 編集の区別、fallback 方針付き）
4. 制約・前提・想定ステークホルダー
5. AC-1〜AC-10（`index.md` と完全一致）

---

## 真の論点 (true issue)

「Slack App 化するか Webhook で済ますか」「retry を実装に入れるか」は表層の選択肢である。本タスクの真の論点は次の 1 点。

### 論点: issue-497 で人手運用となっていた 30 日 follow-up を、cron 駆動 + 冪等 + silent-skip 安全 で完全自動化する

issue-497 は docs-only の正本化タスクであり、運用者が 30 日経過後に手動で `gh run list` を叩き、jq で集計し、references に追記する手順だった。これを **毎日 1 時間遅延（UTC 01:00）で cron 起動** し、30 日 gate 不成立なら silent skip、成立時は draft PR + Slack 通知まで自動化する。本タスクの責務は次の通り:

- **コード変更を伴う**（GHA workflow / bash script / GitHub Secrets / README）
- **alert / retry / Slack App 化は本タスクスコープ外**（issue body 明示）
- **GitHub Issue #517 は CLOSED のまま据え置き**（PR 文面は `Refs #517, Refs #497, Refs #351`）

---

## 機能要件（FR）

| ID | 要件 | 出典 |
| --- | --- | --- |
| FR-1 | `schedule: '0 1 * * *'` UTC + `workflow_dispatch` で起動可能 | issue body / D-1 |
| FR-2 | `workflow_dispatch.inputs.dry_run`（boolean / default false）対応 | issue body / D-9 |
| FR-3 | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json conclusion,createdAt,event,databaseId,url` で履歴取得 | issue body |
| FR-4 | 30 日 gate 判定: 最古 `event=="schedule"` run の `createdAt` <= today - 30d / 不成立は silent skip (exit 0、副作用なし) | issue body / D-3 |
| FR-5 | conclusion 分布 / 連続 failure 区間 / 原因分類 / failure 比率を jq で集計 | issue body / AC-2 |
| FR-6 | redaction（`token` / `bearer` / `secret` / `Authorization` を grep -v）を集計結果と Slack payload の両方に適用 | issue body / AC-5 / D-6 |
| FR-7 | 冪等チェック: 同月内 (YYYYMM) に title prefix `[auto-summary] post-release-dashboard 30d` の draft PR が存在 → silent skip (Slack 通知もしない) | issue body / AC-4 / D-4 |
| FR-8 | skill references / changelog 用 markdown を生成 → 専用 branch `auto/post-release-30day-summary-YYYYMM` に push | issue body / D-5 |
| FR-9 | `gh pr create --draft --base main --title "[auto-summary] post-release-dashboard 30d YYYY-MM"` で起票 | issue body |
| FR-10 | Slack Incoming Webhook (`SLACK_WEBHOOK_URL`) に **5 行以内** のサマリ + PR URL を POST | issue body / AC-3 / D-8 |
| FR-11 | failure 比率 >= 10% 時、PR body に「retry/alert 追加検討」セクションを自動追記 | issue body / AC-6 / D-7 |
| FR-12 | ローカル `bash scripts/post-release-dashboard/30day-summary.sh --dry-run` で PR 起票 / Slack 送信なし、stdout 集計可能 | issue body / AC-8 / D-9 |

---

## 非機能要件（NFR）

| ID | 要件 | 検証方法 |
| --- | --- | --- |
| NFR-1（idempotency） | 同月内に再実行しても draft PR / Slack 通知が重複しない | FR-7 の冪等チェック / 単体 test |
| NFR-2（observability） | gate 不成立時も「skipped: gate not satisfied」を workflow log に出す（silent skip だが trace は残す） | GHA log 目視 |
| NFR-3（security） | `SLACK_WEBHOOK_URL` は GitHub Secrets 経由のみ。リポジトリ・log・PR body・Slack payload に値が露出しない | redaction grep + secret scanning |
| NFR-4（failure isolation） | jq / gh / curl のいずれが失敗しても、後続 step を pollute しない（`set -euo pipefail` + 明示 exit code） | shell test |
| NFR-5（portability） | 集計 script は GHA ubuntu-latest と macOS BSD date 両方で動作（issue-497 Phase 2 軸 1-1 と同方針） | dry-run をローカル macOS で実行 |
| NFR-6（permissions least-privilege） | workflow `permissions:` は `contents: write` / `pull-requests: write` / `actions: read` のみ | YAML 目視 |
| NFR-7（cron drift tolerance） | UTC 01:00 起動が GHA cron 性質上 ±10 分 drift しても 30 日 gate 判定は ISO 8601 文字列比較で安定 | 設計レビュー |

テストコード方針:

- **plain shell test**（既存 `scripts/post-release-dashboard/__tests__/run-all.sh` 形式と整合）。bats / vitest は導入しない。
- 対象: `aggregate_runs` / `redact_log` / `is_30day_gate_satisfied` / `find_existing_pr` / `render_pr_body` の純粋関数化された unit。
- fixture: `__tests__/fixtures/30day-summary/` に gh run list JSON サンプル（gate 成立 / 不成立 / failure 多発 / redaction trigger の 4 ケース）を配置。

---

## 変更対象ファイル一覧

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| `.github/workflows/post-release-30day-auto-summary.yml` | 新規 | 本タスクの中核 workflow |
| `scripts/post-release-dashboard/30day-summary.sh` | 新規 | エントリポイント。`--dry-run` flag 対応 |
| `scripts/post-release-dashboard/lib/aggregate.sh` | 新規 | jq 集計ロジック（軸 2 で分離）。dry-run / production 共通 |
| `scripts/post-release-dashboard/__tests__/30day-summary.test.sh` | 新規 | plain shell test |
| `scripts/post-release-dashboard/__tests__/fixtures/30day-summary/` | 新規 | テスト fixture（gate 成立 / 不成立 / failure 多発 / redaction trigger） |
| `scripts/post-release-dashboard/__tests__/run-all.sh` | 編集 | 新規 test を呼出に追加 |
| `scripts/post-release-dashboard/README.md` | 編集（未存在時は新規） | 実行手順 + `SLACK_WEBHOOK_URL` 登録手順 + Slack channel 明記。Phase 1 着手時に存在確認し、未存在なら新規作成扱いとする |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | `30day auto-summary` 章追加（workflow / script / Secrets / Slack 仕様の正本化） |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` | 新規 | skill changelog |

**変更しないファイル**:

- `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/**`（親タスク仕様書は不可侵）
- `.github/workflows/post-release-dashboard.yml`（集計対象 workflow は read-only 利用）
- `scripts/post-release-dashboard/collect.sh` / `lib/redaction-check.sh`（既存 redaction lib は **再利用**。30day-summary.sh から source して呼出す。再実装禁止）

---

## 制約・前提

| 種別 | 内容 |
| --- | --- |
| 前提 1 | issue-497 が main merge 済み（`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` 一式が main 上に存在） |
| 前提 2 | `.github/workflows/post-release-dashboard.yml` が稼働中で日次 schedule run が蓄積されつつある |
| 前提 3 | 運用者が Slack channel `w1618436027-ek2505248` を作成 / 確認し、Incoming Webhook を当該 channel に紐付け、`SLACK_WEBHOOK_URL` を 1Password 正本から GitHub Secrets に登録できる（README 手順を Phase 12 で整備） |
| 前提 4 | GHA runner で `gh` CLI / `jq` / `curl` / `git` / `date`（GNU）がデフォルト利用可能 |
| 制約 1 | コミットに実値の Webhook URL を含めない（CLAUDE.md シークレット方針） |
| 制約 2 | `wrangler` 直接実行禁止（本タスクは Cloudflare 非対象だが原則として記載） |
| 制約 3 | 既存 `lib/redaction-check.sh` を再利用し、redaction ロジックを重複実装しない（DRY） |
| 制約 4 | 30 日 gate 不成立時の挙動変更不可（silent skip 固定） |
| 制約 5 | スコープ単一性（CONST_007）: alert / retry / Slack App 化を本仕様書に混入させない |

---

## 想定ステークホルダー

| 役割 | 期待 |
| --- | --- |
| 運用者（solo dev） | Slack channel / Incoming Webhook / `SLACK_WEBHOOK_URL` Secret を 1 回だけ準備し、以降は Slack 通知 + draft PR レビュー → merge のみ |
| AI 後続実行者 | Phase 2 設計通りに workflow / script を実装し、Phase 11 で dry-run 検証 |
| Phase 12 ドキュメント担当 | references / changelog / unassigned-task-detection の 7 成果物を強制生成 |

---

## ローカル実行コマンド（Phase 1 で固定する想定実行例）

```bash
# dry-run（PR 起票 / Slack 送信なし、集計結果 stdout）
bash scripts/post-release-dashboard/30day-summary.sh --dry-run

# テスト実行
bash scripts/post-release-dashboard/__tests__/run-all.sh

# 30 日 gate 単体確認
gh run list --workflow=post-release-dashboard.yml --limit=80 \
  --json createdAt,event \
  --jq '[.[] | select(.event=="schedule") | .createdAt] | min'
```

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 人手運用 (issue-497) を cron 自動化することで、30 日 baseline の正本化頻度と即時性が確立。silent skip により未到達期間も無コストで運用可能 |
| 実現性 | PASS | gh / jq / curl / git のみで完結。GHA permissions / Secrets / branch push / `gh pr create --draft` は標準仕様。既存 redaction lib を再利用し新規実装範囲を最小化 |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし（D1 / フォーム / consent / GAS 非対象）。issue-497 仕様書を改変せず、references 追記のみで正本一貫性維持 |
| 運用性 | PASS | dry-run / silent skip / 冪等 / redaction を要件に組込済。Slack 通知で運用者が draft PR レビューに即気付ける |

---

## 受入条件（AC）

`index.md` AC-1〜AC-10 と完全一致（再掲）:

- [ ] AC-1: 日次 cron (UTC 01:00) で起動・30 日 gate 不成立時 silent skip
- [ ] AC-2: 30 日 gate 成立時、conclusion 分布 / 連続 failure / 原因分類 / failure 比率を draft PR body に埋込
- [ ] AC-3: Slack Webhook に集計サマリ（5 行以内）+ draft PR URL 通知
- [ ] AC-4: 二重起票防止（同月内既存 PR ならスキップ・Slack 通知もしない）
- [ ] AC-5: redaction（`token` / `bearer` / `secret` / `Authorization` 含む行が出力に混入しない）
- [ ] AC-6: failure 比率 >= 10% 時、PR body に retry/alert 検討セクションを自動追記
- [ ] AC-7: `workflow_dispatch` で手動実行可（dry_run input 対応）
- [ ] AC-8: ローカル `--dry-run` 成功（PR 起票・Slack 送信なし）
- [ ] AC-9: Phase 12 で 7 必須成果物 + skill references 同期完了
- [ ] AC-10: 4 条件評価が全 PASS

---

## DoD（Phase 1）

- [ ] 真の論点が「人手運用 (issue-497) の cron 自動化 + 冪等 + silent-skip 安全」に確定
- [ ] FR-1〜FR-12 / NFR-1〜NFR-7 が一覧化されている
- [ ] 変更対象ファイル一覧が新規 / 編集の区別 + 不可侵ファイルとともに固定
- [ ] AC-1〜AC-10 が `index.md` と完全一致
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 不変条件 1〜7 への影響が「すべてなし」と確定
- [ ] Issue #517 を再 OPEN しない方針が明示されている
- [ ] Slack channel bootstrap が Incoming Webhook の手動 preflight として定義され、Slack App / Bot OAuth 化と混同されていない
- [ ] `artifacts.json.phases[0].status` = `spec_created`

---

## 次 Phase への引き渡し

- 次 Phase: 2（設計）
- 引き継ぎ事項:
  - FR-1〜FR-12 / NFR-1〜NFR-7
  - 変更対象ファイル 9 件（新規 7 / 編集 2 / 不可侵 3）
  - 既存 `lib/redaction-check.sh` を source 経由で再利用する DRY 制約
  - 関数候補（Phase 2 で確定）: `aggregate_runs` / `redact_log` / `is_30day_gate_satisfied` / `find_existing_pr` / `render_pr_body` / `post_slack`
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-10 が `index.md` と乖離
  - 既存 redaction lib の再利用方針が崩れている
