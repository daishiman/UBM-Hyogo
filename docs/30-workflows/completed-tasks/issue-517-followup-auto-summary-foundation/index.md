# issue-517-followup-auto-summary-foundation - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | N 日後 follow-up auto-summary 基盤（GitHub Actions cron + Slack 通知 + draft PR 自動起票） |
| GitHub Issue | #517（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #517, Refs #497, Refs #351`） |
| 親タスク | issue-497-post-release-dashboard-30day-conclusion / issue-351-09c-post-release-dashboard-automation |
| 起票元 | issue-497 close-out レビューで検出された follow-up 自動化 gap |
| 作成日 | 2026-05-07 |
| ステータス | spec_created |
| 総 Phase 数 | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| docsOnly | false |
| Wave | 3（issue-497 main merge 後） |
| 優先度 | MEDIUM |
| 見積もり規模 | 中規模（GHA workflow 1 本 + bash script 群 + Slack Webhook + GitHub Secrets 1 件） |

---

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠（CONST_004）:

- 本タスクの成果物は **新規 GHA workflow / bash script / Slack Webhook 連携 / GitHub Secrets 登録** を伴うコード変更タスクである。
- 親タスク issue-497 は docs-only（gh run list 集計の skill references 追記）だったが、本タスクはその **集計・PR 起票・Slack 通知の自動化** を responsibility とし、コード変更が必須。
- スコープ単一性（CONST_007）: 「30 日 gate 集計 + draft PR + Slack 通知 + dry-run」の単一責務に閉じる。alert / retry / Slack App 化は **本タスクスコープ外**（issue body 明示）。

CONST_005 必須項目の所在:

| 必須項目 | 所在 |
| --- | --- |
| 変更対象ファイル一覧 | phase-01.md「変更対象ファイル」セクション |
| 関数 / スクリプト構造 | phase-02.md「shell script 設計」 |
| 入出力契約 | phase-02.md「入出力契約」「workflow YAML 構造」 |
| テスト方針 | phase-01.md「非機能要件」+ phase-02.md「テスト戦略」（深掘りは Phase 4 / 9） |
| ローカル実行コマンド | phase-01.md / phase-02.md（`bash scripts/post-release-dashboard/30day-summary.sh --dry-run`） |
| DoD | 各 phase 末尾の DoD セクション |

---

## 目的

issue-497（post-release-dashboard 30 日 conclusion 集計）の運用を自動化し、**人間が `gh run list` を手で叩くことなく** 30 日 baseline を skill references / changelog に正本化する仕組みを GitHub Actions cron として実装する。

具体的には次を達成する:

1. 日次 cron で `gh run list --workflow=post-release-dashboard.yml --limit=80` を取得し、30 日 gate 不成立なら silent skip する。
2. gate 成立時、conclusion 分布 / 連続 failure / 原因分類 / failure 比率を集計し、redaction 適用後 markdown を生成する。
3. 集計 markdown を `auto/post-release-30day-summary-YYYYMM` ブランチに push し、`[auto-summary] post-release-dashboard 30d` prefix で **draft PR** を起票する。
4. Slack Incoming Webhook (`SLACK_WEBHOOK_URL`) に 5 行以内のサマリと PR URL を POST する。
5. 同月内の重複 PR を検出した場合は silent skip し Slack 通知も送らない（idempotency）。
6. ローカルで `--dry-run` 実行可能（PR 起票 / Slack 送信なし、stdout 集計）。

---

## スコープ

### 含む

- 新規 GHA workflow `.github/workflows/post-release-30day-auto-summary.yml`
  - trigger: `schedule (cron: '0 1 * * *')` UTC 01:00 + `workflow_dispatch`（`dry_run` input boolean）
  - permissions: `contents: write`, `pull-requests: write`, `actions: read`
  - 30 日 gate / 集計 / redaction / 重複 PR 検査 / branch push / `gh pr create --draft` / Slack POST を直列に実行
- 新規集計 script `scripts/post-release-dashboard/30day-summary.sh`
  - `--dry-run` で PR 起票 / Slack 送信なし、集計結果 stdout
  - `gh run list` JSON → 集計 JSON → markdown レンダリング
- 新規ヘルパ `scripts/post-release-dashboard/lib/aggregate.sh`（jq ロジック集約）
- 新規 test `scripts/post-release-dashboard/__tests__/30day-summary.test.sh`（plain shell test / 既存 `run-all.sh` から呼出）
- 既存編集: `scripts/post-release-dashboard/README.md`（実行手順 + Slack secret 登録手順追記）。**当該 README が未存在の場合は新規作成扱いとし、Phase 1 の変更対象ファイル表で「新規/編集 fallback」を明示**
- 既存編集: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`（`30day auto-summary` 章追加）
- 新規 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md`
- GitHub Secrets `SLACK_WEBHOOK_URL` 登録手順の README 追記（**実値はリポジトリにコミットしない**）
- Slack channel bootstrap 手順の README 追記（channel 作成 / Incoming Webhook 紐付け / 1Password 保存 / GitHub Secret 登録 / test post 削除）
- Slack channel: `w1618436027-ek2505248`（運用情報として README に明記。実 channel / Webhook URL の作成は user-gated 外部操作）

### 含まない

- issue-497 本体仕様書 (`docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/**`) の編集
- alert / retry / Slack App 化 / Slack Bot OAuth 連携（channel bootstrap は Incoming Webhook の手動準備に限定）
- 他 defer-allowed タスクへの汎用展開（issue-497 専用先行・将来別 issue で扱う禁止 / CONST_007）
- production deploy / Cloudflare 設定変更 / D1 アクセス
- 30 日 gate 不成立時の挙動変更（silent skip 固定）

---

## 受入条件（AC）

- AC-1: 日次 cron (`schedule: '0 1 * * *'` UTC) で起動し、30 日 gate 不成立時は silent skip（exit 0、副作用なし）
- AC-2: 30 日 gate 成立時、conclusion 分布 / 連続 failure 区間 / 原因分類 / failure 比率を draft PR body に埋め込む
- AC-3: Slack channel bootstrap（channel 作成 / Incoming Webhook 紐付け / Secret 登録 / test post）が Phase 11 preflight と README に固定され、Webhook に集計サマリ（5 行以内）と draft PR URL を POST できる
- AC-4: 二重起票防止（同月内に `[auto-summary] post-release-dashboard 30d` prefix の draft PR が存在する場合 silent skip / Slack 通知もしない）
- AC-5: redaction 機能（`token` / `bearer` / `secret` / `Authorization` を含む行が PR body / Slack payload に混入しない）
- AC-6: failure 比率 >= 10% 時、PR body に「retry/alert 追加検討」セクションを自動追記する
- AC-7: `workflow_dispatch` で手動実行可能（`dry_run: true` で PR / Slack 副作用なし）
- AC-8: ローカル `bash scripts/post-release-dashboard/30day-summary.sh --dry-run` が成功（PR 起票・Slack 送信なし、集計結果 stdout）
- AC-9: Phase 12 で strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と aiworkflow-requirements skill 同期が完了
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き

---

## 設計分岐点

| # | 分岐点 | 確定値 | 根拠 |
| --- | --- | --- | --- |
| D-1 | cron 起動時刻 | `0 1 * * *` UTC（01:00） | issue body 指定 / post-release-dashboard が UTC 00:00 起動なので 1 時間後で履歴が確定 |
| D-2 | gh run list limit | 80 | issue-497 と同値で互換確保 |
| D-3 | 30 日 gate 判定 | 最古 schedule run.createdAt <= today - 30d | issue-497 Phase 2 軸 1-1 と同式 |
| D-4 | 重複 PR 検出 | 同月内に title prefix `[auto-summary] post-release-dashboard 30d` の draft PR が存在 | 月次集計のため YYYYMM 粒度 |
| D-5 | branch 命名 | `auto/post-release-30day-summary-YYYYMM` | force-push 不可 / 月次重複なし |
| D-6 | redaction patterns | `token` / `bearer` / `secret` / `Authorization`（base case） | issue-497 Phase 2 軸 2 と同値 |
| D-7 | failure 比率しきい値 | `>= 10%` で retry/alert 検討節を追記 | issue-497 / issue body 一致 |
| D-8 | Slack payload 行数 | 5 行以内 | issue body 明示 |
| D-9 | dry-run スイッチ | `--dry-run`（script）/ `dry_run` input（workflow） | ローカル / GHA 両対応 |
| D-10 | Slack channel bootstrap | `w1618436027-ek2505248` を通知先 channel とし、Incoming Webhook を Phase 11 preflight で作成 / 確認。Secret 登録は user-gated | issue body 指定 / シークレット方針 |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | なし | フォーム非対象 |
| 2 | consent キー（`publicConsent` / `rulesConsent`）統一 | なし | consent 非対象 |
| 3 | `responseEmail` は system field | なし | 非対象 |
| 4 | Google Form schema 外は admin-managed data として分離 | なし | 非対象 |
| 5 | D1 直接アクセスは `apps/api` 限定 | なし | D1 アクセスなし |
| 6 | GAS prototype は本番昇格しない | なし | GAS 非対象 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | なし | 非対象 |

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義（機能 / 非機能 / 変更対象ファイル / 制約） | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計（workflow YAML / shell script / Secrets contract） | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | 検証戦略 | phase-04.md | pending |
| 5 | 実装 runbook | phase-05.md | pending |
| 6 | 異常系 | phase-06.md | pending |
| 7 | AC マトリクス | phase-07.md | pending |
| 8 | DRY 化 / 仕様間整合 | phase-08.md | pending |
| 9 | 品質保証 | phase-09.md | pending |
| 10 | 最終レビューゲート | phase-10.md | pending |
| 11 | 手動検証 | phase-11.md | pending |
| 12 | ドキュメント更新 | phase-12.md | pending |
| 13 | PR 作成 | phase-13.md | pending |

---

## 関連

- 親タスク仕様書: `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`
- 集計対象 workflow: `.github/workflows/post-release-dashboard.yml`
- 既存 collector: `scripts/post-release-dashboard/collect.sh`
- 既存 redaction lib: `scripts/post-release-dashboard/lib/redaction-check.sh`
- 既存 test runner: `scripts/post-release-dashboard/__tests__/run-all.sh`
- 追記先 references: `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- skill: `aiworkflow-requirements`（deployment-gha topic）
