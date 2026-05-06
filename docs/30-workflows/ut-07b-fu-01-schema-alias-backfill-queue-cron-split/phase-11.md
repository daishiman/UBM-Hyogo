# Phase 11: 手動検証（NON_VISUAL 縮約 + staging 10,000+ rows 着手 gate evidence）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動検証（NON_VISUAL 縮約 + staging 10,000+ rows 着手 gate evidence） |
| 作成日 | 2026-05-05 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| タスク分類 | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| 実装区分 | 実装仕様書 |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| user_approval_required | false（Phase 13 で true） |
| GitHub Issue | #361（CLOSED のまま据え置き / 再 OPEN しない） |

---

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 対象は admin API + D1 + Cloudflare Queue / Cron binding 系で、UI 追加なし。
  - 一次証跡は CLI 実行ログ（`scripts/cf.sh d1` / `wrangler tail` 経由 Workers ログ / `curl` HTTP レスポンス / D1 SELECT 結果）に閉じる。
  - 検証対象は「`backfill_cpu_budget_exhausted` 持続再現の数値特性」「API response の `confirmed` / `backfill.status` 分離」「queue/cron consumer の `backfill.status: completed` 収束」という **観測可能な数値・JSON ログ** に閉じる。
- screenshot は不要（`outputs/phase-11/screenshots/` ディレクトリは作成しない / false green 防止）。
- 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「API smoke evidence / NON_VISUAL 縮約テンプレ」。

---

## 目的

本 Phase は **本タスクの着手 gate 判定 Phase**（最重要）。staging 10,000+ rows fixture 投入後の既存 API（dryRun/apply/retry）実測で、`backfill_cpu_budget_exhausted` が **持続的に再現するか** を判定し、以下のいずれかに分岐する。

1. **gate GO**: 持続再現を確認 → Phase 5 以降の queue/cron 実装を着手し、deploy 後 after evidence を採取して `backfill.status: completed` 収束を確認する。
2. **gate NO-GO**: 既存 retry で収束 → 「実装不要」evidence を Phase 12 に記録し、本仕様書を `spec_created` のまま据え置く（Phase 13 は no-op で skip）。
3. **staging-deferred**: staging credentials 未取得 → credentials 取得後に再実行する手順を残し、`spec_created` のまま据え置く。

着手 gate 数値基準:

> 同条件（10,000 行 fixture / 同一 alias / 同一 batch size）で 10 回試行し、**3 回以上** で `backfill_cpu_budget_exhausted` retryable response を持続的に受領（=既存 retry を 5 回繰り返しても完了しない / または 60 秒以上完了しない）した場合 → **GO**。それ以外 → **NO-GO**。

---

## 実行タスク

1. staging credentials / staging D1（`ubm-hyogo-db-staging`） / staging Workers の前提状態確認。
2. 10,000+ rows fixture（`response_fields`）の投入手順を `staging-fixture-setup.md` に記録。
3. 既存 API（`POST /admin/schema/aliases` dryRun / apply / retry）を 10 回試行し、`backfill_cpu_budget_exhausted` 発生回数 / batch 数 / CPU 時間 / retry 回数 / 完了/未完了状態を採取（`before-evidence.md`）。
4. 着手 gate 判定（GO / NO-GO / PARTIAL）を `gate-decision.md` に根拠付きで記録。
5. **gate GO のみ**: queue/cron 実装 deploy 後、同条件で実測して `backfill.status: completed` 収束を確認（`after-evidence.md`）。
6. 関連リンクの健全性を `link-checklist.md` に記録。
7. 手動 smoke 結果ログを `manual-smoke-log.md` に記録。
8. 機密情報非混入 grep を `redaction-check.md` に記録。
9. Phase 12 への引き渡し条件（gate 判定結果 / next action）を `main.md` に集約。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` | 本 workflow 目次 |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/artifacts.json` | workflow_state / phase status |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/main.md` | NON_VISUAL evidence template（親タスク） |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-evidence.md` | staging deferred evidence 形式 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-smoke-log.md` | smoke log フォーマット |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | 現行 alias 確定 / back-fill / CPU budget 処理 |
| 必須 | `apps/api/src/routes/admin/schema.ts` | dryRun / apply / retry 境界 |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（D1 / Workers tail 実行） |
| 参考 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL 縮約テンプレ（API smoke evidence） |

---

## 苦戦箇所【記入必須】

| # | 苦戦箇所 | 想定影響 | 緩和策 |
| --- | --- | --- | --- |
| 1 | staging credentials（`STAGING_API_BASE` / `STAGING_ADMIN_TOKEN` / D1 binding 認可）が現時点で未取得である可能性 | gate 判定 Phase が `staging-deferred` 状態で停止 | `staging-deferred` 明記 → credentials 取得後に再実行する手順を `staging-fixture-setup.md` に残す |
| 2 | 10,000 行 fixture 投入順序（`schema_questions` → `response_fields` → alias 適用）の前後関係エラー | fixture 投入失敗で gate 判定まで到達しない | 投入 SQL を `apps/api/test/fixtures/ut-07b-fu-01-stage-10k.sql` として固定し idempotent に再投入可能化 |
| 3 | CPU budget 計測 noise（staging Workers の他 request 同時実行で `cpuTime` が変動） | 持続再現判定で偽陽性 / 偽陰性 | 10 回試行を **同一時間帯 / 直列実行 / 他 admin API 停止条件下** で行い、`cpuTime` の平均 ± 標準偏差を `before-evidence.md` に記録 |
| 4 | gate NO-GO 時に Phase 12 / 13 を実行しないが、artifacts.json / workflow_state を誤って `completed` に書き換える誤操作 | 仕様書の据え置きが破られ再起動できなくなる | NO-GO 確定時の artifacts.json 更新ルールを `gate-decision.md` に明記（`spec_created` 据え置き、`phase-11.status = completed-not-needed`） |
| 5 | retry 上限到達と CPU budget 超過を取り違える誤判定 | gate 判定根拠が崩れる | retryable response の `error` フィールドを `backfill_cpu_budget_exhausted` か他か（例: `transaction_failure`）で分類し、後者は別事象として除外 |

---

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 着手 gate 判定により、不要実装を未然に防ぎ、必要時は確実な evidence を残す（CONST_007 同一サイクル内 conditional execution） |
| 実現性 | PASS（条件付き） | staging credentials 取得時に限る。未取得時は `staging-deferred` で残置可能 |
| 整合性 | PASS | AC-1（before evidence）/ AC-8（after evidence）と直接対応。親タスク Phase 11 の NON_VISUAL 縮約形式と整合 |
| 運用性 | PASS | `scripts/cf.sh` 経由 / op 注入 / 機密情報非混入 grep を含む。CPU budget exhaustion 再発時に再起動できる仕様 |

---

## 受入条件

- AC-1: staging 10,000+ rows fixture 投入後の既存 API 実測 evidence が `before-evidence.md` に記録され、`backfill_cpu_budget_exhausted` 発生回数 / batch 数 / CPU 時間 / retry 回数 / 完了状態が表形式で採取されている
- AC-8（gate GO 時のみ）: queue/cron 実装 deploy 後の同条件実測 evidence が `after-evidence.md` に記録され、`backfill.status: completed` 収束が確認されている
- 着手 gate 判定（GO / NO-GO / PARTIAL）が `gate-decision.md` に数値根拠付きで記録されている
- screenshot ディレクトリを作成していない（NON_VISUAL 整合）
- 機密情報非混入 grep が 0 件（`redaction-check.md`）

---

## 完了条件チェックリスト

- [ ] `outputs/phase-11/main.md` に gate 判定（GO / NO-GO / PARTIAL）と PASS / PASS_WITH_BLOCKER / DOC_PASS が明記されている
- [ ] `outputs/phase-11/before-evidence.md` に 10 回試行の数値表が揃っている
- [ ] `outputs/phase-11/gate-decision.md` に GO / NO-GO 判定根拠と次アクションが記載
- [ ] `outputs/phase-11/after-evidence.md` が gate GO 時のみ存在（NO-GO / staging-deferred 時は不要）
- [ ] `outputs/phase-11/staging-fixture-setup.md` に 10,000 行 fixture 投入手順（D1 SQL / Workers binding / 認証）
- [ ] `outputs/phase-11/link-checklist.md` に index / artifacts / 親タスク phase-11 / api-endpoints / database-schema へのリンク状態
- [ ] `outputs/phase-11/manual-smoke-log.md` に手動 smoke 結果（実行コマンド / 期待 / 実測 / PASS or FAIL）
- [ ] `outputs/phase-11/redaction-check.md` で実 token / database_id / 実会員 PII の混入 0 件確認
- [ ] `outputs/phase-11/screenshots/` ディレクトリを作成していない（NON_VISUAL 整合）
- [ ] GitHub Issue #361 を再 OPEN していない

---

## 実行手順

### ステップ 1: staging 前提状態の確認

```bash
# staging credentials が op://Vault に存在することを確認（実値は表示しない）
bash scripts/cf.sh whoami

# staging D1 接続確認 / 既存 migration 状態取得
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# baseline 件数取得
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS n FROM schema_questions; \
             SELECT COUNT(*) AS n FROM response_fields; \
             SELECT COUNT(*) AS n FROM schema_diff_queue;"
```

- credentials 未取得時: `staging-fixture-setup.md` に `staging-deferred` と判定し、credentials 取得後の再実行手順を残してステップ 8 へ skip。

### ステップ 2: 10,000 行 fixture 投入

```bash
# fixture 投入（idempotent / revisionId = 'ut-07b-fu-01-stage-10k'）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file apps/api/test/fixtures/ut-07b-fu-01-stage-10k.sql

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) FROM response_fields WHERE revision_id = 'ut-07b-fu-01-stage-10k';"
```

- 期待: `response_fields` で 10,000 ± 0 行投入完了。
- 結果は `staging-fixture-setup.md` に投入 SQL / 件数確認 / 実行日時を記録。

### ステップ 3: 既存 API 10 回試行（before evidence）

```bash
# Workers tail を別タブで起動
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging

# 10 回試行（直列 / 同一時間帯）
for i in $(seq 1 10); do
  curl -sS -X POST "$STAGING_API_BASE/admin/schema/aliases" \
    -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"revisionId":"ut-07b-fu-01-stage-10k","aliases":[{"questionId":"q-...","stableKey":"member_status"}]}' \
    -o "/tmp/ut-07b-fu-01-trial-${i}.json" -w "HTTP=%{http_code} TIME=%{time_total}\n"
done
```

- 採取項目（`before-evidence.md` に表として記録）:

  | 試行 | HTTP status | error | processedOffset | retry 回数 | cpuTime(ms) | 完了到達 |
  | --- | --- | --- | --- | --- | --- | --- |
  | 1 | 202 / 200 | backfill_cpu_budget_exhausted / null | 採取値 | 採取値 | tail から | Y/N |
  | … | … | … | … | … | … | … |
  | 10 | … | … | … | … | … | … |

- 着手 gate 数値基準:
  - `backfill_cpu_budget_exhausted` 持続（既存 retry 5 回以上で未完了 or 60 秒以上未完了）が **3 回以上 / 10 回** → **GO**
  - 上記未満 → **NO-GO**

### ステップ 4: 着手 gate 判定（gate-decision.md）

`gate-decision.md` に以下を記録:

- 集計結果（持続再現回数 / 平均 cpuTime / 平均 retry 回数）
- 判定（GO / NO-GO / PARTIAL）
- 判定根拠（数値基準への当てはめ）
- 次アクション:
  - GO → Phase 5 以降の実装着手 / Phase 11 ステップ 5 で after evidence 採取
  - NO-GO → Phase 12 で「実装不要」evidence と判断理由を記録、workflow_state は `spec_created` 据え置き、Phase 13 は no-op で skip
  - PARTIAL → 追加観測 / staging 環境差分の調査を Phase 12 で記録

### ステップ 5: queue/cron 実装 deploy 後の after evidence（gate GO 時のみ）

```bash
# Phase 5-9 で実装した queue/cron を staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 同条件で再実測
for i in $(seq 1 10); do
  curl -sS -X POST "$STAGING_API_BASE/admin/schema/aliases" \
    -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"revisionId":"ut-07b-fu-01-stage-10k","aliases":[...]}' \
    -o "/tmp/ut-07b-fu-01-after-${i}.json" -w "HTTP=%{http_code}\n"
done

# queue/cron 完了確認（最終状態）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT status, COUNT(*) FROM schema_diff_queue \
             WHERE revision_id = 'ut-07b-fu-01-stage-10k' GROUP BY status;"
```

- 期待 API response:

  ```json
  {
    "confirmed": true,
    "backfill": {
      "status": "pending"
    }
  }
  ```

- 期待最終状態（cron / queue consumer 完了後）: `backfill.status: completed` が `schema_diff_queue` で観測される。
- 結果は `after-evidence.md` に記録。

### ステップ 6: 関連リンク健全性

`link-checklist.md` に以下のリンク状態（OK / Broken）を表で記録:

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| index.md | artifacts.json | 採取時 |
| index.md | 親タスク phase-11 | 採取時 |
| outputs/phase-11/main.md | outputs/phase-12 への引き渡し | 採取時 |
| api-endpoints.md | `POST /admin/schema/aliases` 該当行 | 採取時 |
| database-schema.md | `schema_diff_queue` 該当行 | 採取時 |

### ステップ 7: 手動 smoke 結果ログ

`manual-smoke-log.md` に「実行コマンド / 期待結果 / 実測 / PASS or FAIL」を表形式で記録。証跡の主ソース（自動テスト名 / 件数、または curl trial ID）と screenshot を作らない理由（NON_VISUAL）を冒頭メタに明記する。

### ステップ 8: 機密情報非混入 grep

```bash
rg -n -E "ya29\.|-----BEGIN PRIVATE|sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" \
  docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/ \
  || echo "OK: no secrets"
```

- 期待: 0 件。検出時は即時停止し outputs を是正。
- 実 database_id / 実 token / 実会員 PII / responseEmail が混入していないことも目視確認。
- 結果は `redaction-check.md` に記録。

### ステップ 9: 結果集約（main.md）

`main.md` 冒頭メタに以下を必ず明記:

- 実行日時（UTC + JST）
- branch 名 / worktree
- staging 環境名（`ubm-hyogo-db-staging` / staging Workers URL マスク済）
- screenshot を作成しない理由（NON_VISUAL / API smoke evidence）
- gate 判定（GO / NO-GO / PARTIAL）と PASS / PASS_WITH_BLOCKER / DOC_PASS

---

## 多角的チェック観点

- 価値性: 着手 gate 判定が数値根拠（10 回試行 / 3 回以上 / 60 秒未完了）で行われ、定性判断に流れていないか。
- 実現性: staging credentials なし状態でも `staging-deferred` で残置でき、credentials 取得後に再実行可能か。
- 整合性: gate GO 時の after evidence が API contract（`confirmed` / `backfill.status`）を観測しているか。
- 運用性: gate NO-GO 時の据え置き手順（artifacts.json 触らない / Phase 13 skip）が誤操作を防ぐか。
- 認可境界: D1 直アクセスは `apps/api` 経由のみ（不変条件 #5）、Workers binding を `apps/web` から呼ばない。
- Secret hygiene: ステップ 8 grep が 0 件であること、実値が outputs に残らないこと。
- Issue ライフサイクル: GitHub Issue #361 が CLOSED のまま、本 Phase で再 OPEN しない。
- NON_VISUAL 整合: `screenshots/` ディレクトリを誤って作成していないこと。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | staging credentials / 前提状態確認 | 11 | spec_created | `staging-deferred` 判定含む |
| 2 | 10,000 行 fixture 投入手順記録 | 11 | spec_created | `staging-fixture-setup.md` |
| 3 | 既存 API 10 回試行（before） | 11 | spec_created | `before-evidence.md` |
| 4 | 着手 gate 判定 | 11 | spec_created | `gate-decision.md` |
| 5 | queue/cron deploy 後実測（after） | 11 | spec_created | gate GO 時のみ / `after-evidence.md` |
| 6 | リンク健全性 | 11 | spec_created | `link-checklist.md` |
| 7 | 手動 smoke ログ | 11 | spec_created | `manual-smoke-log.md` |
| 8 | 機密情報非混入 grep | 11 | spec_created | `redaction-check.md` |
| 9 | 集約 | 11 | spec_created | `main.md` |

---

## 成果物（NON_VISUAL 縮約 / API smoke evidence）

| 種別 | パス | 説明 |
| --- | --- | --- |
| サマリ | `outputs/phase-11/main.md` | gate 判定 / PASS / PASS_WITH_BLOCKER / DOC_PASS / 必須 outputs リンク |
| before evidence | `outputs/phase-11/before-evidence.md` | 既存 API 10 回試行の数値表 |
| gate 判定 | `outputs/phase-11/gate-decision.md` | GO / NO-GO / PARTIAL と次アクション |
| after evidence | `outputs/phase-11/after-evidence.md` | gate GO 時のみ / queue/cron 完了収束 |
| 投入手順 | `outputs/phase-11/staging-fixture-setup.md` | 10,000 行 fixture 投入手順 |
| リンク | `outputs/phase-11/link-checklist.md` | 関連リンク健全性 |
| smoke | `outputs/phase-11/manual-smoke-log.md` | 手動 smoke ログ |
| redaction | `outputs/phase-11/redaction-check.md` | 機密情報非混入確認 |
| メタ | `artifacts.json` | Phase 11 状態の更新（`phases[10].status = completed` または `completed-not-needed` / `staging-deferred`） |

> `outputs/phase-11/screenshots/` は作成しない。

---

## タスク 100% 実行確認【必須】

- 全実行タスク（9 件）が `spec_created`
- 成果物が `outputs/phase-11/` 配下に配置される設計
- gate GO / NO-GO / staging-deferred の 3 分岐手順が明記
- artifacts.json の Phase 11 entry の遷移パターンが定義済（`completed` / `completed-not-needed` / `staging-deferred`）
- 親タスク（ut-07b-schema-alias-hardening）Phase 11 の NON_VISUAL 縮約形式と整合

---

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - **gate GO 時**: before/after evidence の数値（持続再現回数 / 平均 cpuTime / `backfill.status: completed` 収束時間）を `implementation-guide.md` Part 2 に転記。queue/cron どちらを採用したかと根拠を `system-spec-update-summary.md` Step 1-A に同期。
  - **gate NO-GO 時**: 「実装不要」判定根拠（before evidence の数値が gate 基準を下回った）を `implementation-guide.md` の冒頭に記録し、aiworkflow-requirements 更新は最小限（不要記載のみ）。`workflow_state` は `spec_created` 据え置き。Phase 13 は no-op で skip。
  - **staging-deferred 時**: credentials 取得後の再実行手順を `unassigned-task-detection.md` に follow-up 候補として記録。
  - 既知制限（CPU budget 計測 noise / 試行時間帯依存）を `skill-feedback-report.md` に記録。
- ブロック条件:
  - before evidence で 10 回試行の数値が揃っていない
  - `gate-decision.md` の判定根拠が定性記述のみで数値基準への当てはめが欠落
  - `screenshots/` ディレクトリが誤って作成されている
  - 機密情報 grep で 1 件以上検出
  - GitHub Issue #361 が誤って reopen されている

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC-1 / AC-8 の evidence 列に本 Phase の証跡パスを記入 |
| Phase 9 | route / workflow / repository test 結果と本 Phase 実測結果を相互参照 |
| Phase 10 | GO 判定の前提として本 Phase の gate 判定を確認 |
| Phase 12 | gate 判定結果（GO / NO-GO / staging-deferred）を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |
| Phase 13 | gate GO 時のみ PR 作成 / NO-GO 時は skip / staging-deferred 時は据え置き |
